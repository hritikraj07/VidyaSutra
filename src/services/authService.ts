import { prisma } from '@/lib/db';
import {
  hashPassword,
  verifyPassword,
  isInstitutionalEmail,
  validatePasswordStrength,
  normalizeRoleToDb,
  normalizeRoleToUi,
} from '@/lib/auth';
import { UserProfile } from '@/types';
import { getProfileFromSupabase, upsertProfileInSupabase } from '@/lib/supabaseAdmin';

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  role?: string;
  rollNo?: string;
  course?: string;
  department?: string;
  semester?: number;
  section?: string;
  admissionYear?: number;
}

export interface LoginInput {
  email: string;
  password: string;
  role?: string;
}

export class AuthService {
  /**
   * Authenticate user with persistent database check and strict role validation
   */
  static async login(input: LoginInput): Promise<{ user: UserProfile; token?: string }> {
    const { email, password, role: attemptedRole } = input;

    // 1. Validate institutional domain
    if (!isInstitutionalEmail(email)) {
      throw new Error('Access restricted to official institutional email addresses only (@vidyasutra.edu.in).');
    }

    const cleanEmail = email.trim().toLowerCase();

    // 2. Query user from persistent database (case-insensitive email match)
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: cleanEmail,
        },
      },
      include: {
        student: {
          include: {
            courses: true,
          },
        },
      },
    });

    // Clear error feedback for non-existent account
    if (!user) {
      throw new Error('Account not found. Please verify your email or register with your institutional administrator.');
    }

    // 3. Verify password hash with clear error feedback
    const isValid = verifyPassword(password, user.password_hash);
    if (!isValid) {
      throw new Error('Invalid credentials. Please verify your password.');
    }

    // 4. Fetch the logged-in user's role from Supabase public.profiles table
    const supaProfile = await getProfileFromSupabase({ email: cleanEmail, id: user.id });
    const verifiedRole = supaProfile?.role
      ? (supaProfile.role.trim().toLowerCase() as 'student' | 'teacher' | 'admin')
      : normalizeRoleToUi(user.role);

    // If profile row doesn't exist in Supabase yet, asynchronously sync it
    if (!supaProfile) {
      upsertProfileInSupabase({
        id: user.id,
        email: user.email,
        full_name: user.name,
        role: verifiedRole,
        course: user.student?.course || user.student?.department,
        section: user.student?.section,
        semester: user.student?.semester,
        student_id: user.student?.roll_no,
      }).catch(() => {});
    }

    // 5. Strict Role Enforcement based on role fetched from Supabase
    if (attemptedRole) {
      const normAttempt = attemptedRole.trim().toLowerCase();
      if (normAttempt === 'student') {
        // Student login allows ONLY role = 'student'
        if (verifiedRole !== 'student') {
          throw new Error(
            verifiedRole === 'admin'
              ? 'Access denied: Administrator accounts cannot use Student Login. Please use Teacher / Staff Login.'
              : 'Access denied: Teacher / Staff accounts cannot use Student Login. Please use Teacher / Staff Login.'
          );
        }
      } else if (
        normAttempt === 'teacher' ||
        normAttempt === 'staff' ||
        normAttempt === 'faculty' ||
        normAttempt === 'admin'
      ) {
        // Teacher/Staff login allows role = 'teacher' OR role = 'admin'
        if (verifiedRole === 'student') {
          throw new Error('Access denied: Student accounts cannot be used on Teacher / Staff Login. Please use Student Login.');
        }
      }
    }

    // 6. Update last_login_at timestamp
    const now = new Date();
    await prisma.user.update({
      where: { id: user.id },
      data: { last_login_at: now },
    });

    const uiRole = verifiedRole;
    const cohort = user.student
      ? `Batch of ${user.student.admission_year || 2021} • Sem ${user.student.semester || 6} (${user.student.section || 'A'})`
      : undefined;

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: uiRole,
        rollNo: user.student?.roll_no,
        course: user.student?.course || user.student?.department || (uiRole === 'admin' ? 'Administration' : 'Computer Science & Engineering'),
        department: user.student?.department || (uiRole === 'admin' ? 'Administration' : 'Computer Science & Engineering'),
        semester: user.student?.semester || (uiRole === 'student' ? 6 : undefined),
        section: user.student?.section || (uiRole === 'student' ? 'A' : undefined),
        admissionYear: user.student?.admission_year || (uiRole === 'student' ? 2021 : undefined),
        cohort,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}&backgroundColor=1b263b`,
        title: uiRole === 'admin' ? 'Institutional Administrator' : uiRole === 'teacher' ? 'Course Faculty / Staff' : 'Student',
        courses: user.student?.courses?.map((c) => ({
          id: c.id,
          subjectCode: c.subject_code,
          subjectName: c.subject_name,
          status: c.status,
        })),
      },
    };
  }

  /**
   * Register a new user in the persistent database with mandatory role requirement
   */
  static async register(input: RegisterInput): Promise<{ user: UserProfile }> {
    const { email, password, name, role, rollNo, course, department, semester = 1, section = 'A', admissionYear = 2024 } = input;

    // 1. Mandatory role check: must be ADMIN, TEACHER, or STUDENT
    if (!role || typeof role !== 'string') {
      throw new Error('A valid role (ADMIN, TEACHER, or STUDENT) is required to create a user.');
    }

    const cleanRoleUpper = role.trim().toUpperCase();
    if (!['STUDENT', 'TEACHER', 'FACULTY', 'ADMIN'].includes(cleanRoleUpper)) {
      throw new Error('Invalid role specified. Allowed roles are: ADMIN, TEACHER, STUDENT.');
    }

    // 2. Institutional domain validation
    if (!isInstitutionalEmail(email)) {
      throw new Error('Access restricted to official institutional email addresses only (@vidyasutra.edu.in).');
    }

    // 3. Password strength validation
    const strengthCheck = validatePasswordStrength(password);
    if (!strengthCheck.valid) {
      throw new Error(strengthCheck.error || 'Password does not meet institutional security requirements.');
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      throw new Error('An account with this institutional email already exists. Please log in.');
    }

    const dbRole = normalizeRoleToDb(role);
    const passwordHash = hashPassword(password);
    const now = new Date();

    const cleanCourse = course?.trim() || department?.trim() || 'Computer Science & Engineering';
    const cleanDept = department?.trim() || cleanCourse;

    // Generate roll number if student and not provided
    const cleanRollNo = rollNo?.trim() || (dbRole === 'STUDENT' ? `24BCSE${Math.floor(100 + Math.random() * 900)}` : undefined);

    // Create user and profile in database
    const createdUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        password_hash: passwordHash,
        role: dbRole,
        created_at: now,
        last_login_at: now,
        ...(dbRole === 'STUDENT'
          ? {
              student: {
                create: {
                  roll_no: cleanRollNo!,
                  course: cleanCourse,
                  department: cleanDept,
                  semester: Number(semester) || 1,
                  section: section?.trim() || 'A',
                  admission_year: Number(admissionYear) || 2024,
                },
              },
            }
          : {}),
      },
      include: {
        student: {
          include: {
            courses: true,
          },
        },
      },
    });

    const uiRole = normalizeRoleToUi(createdUser.role);

    // Save/sync into public.profiles in Supabase
    await upsertProfileInSupabase({
      id: createdUser.id,
      email: createdUser.email,
      full_name: createdUser.name,
      role: uiRole,
      course: createdUser.student?.course || (uiRole === 'student' ? cleanCourse : undefined),
      section: createdUser.student?.section || section,
      semester: createdUser.student?.semester || (semester ? Number(semester) : undefined),
      student_id: createdUser.student?.roll_no || cleanRollNo,
    });

    return {
      user: {
        id: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
        role: uiRole,
        rollNo: createdUser.student?.roll_no,
        course: createdUser.student?.course || (uiRole === 'student' ? cleanCourse : undefined),
        department: createdUser.student?.department || (uiRole === 'admin' ? 'Administration' : cleanDept),
        semester: createdUser.student?.semester,
        section: createdUser.student?.section,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(createdUser.name)}&backgroundColor=1b263b`,
        title: uiRole === 'admin' ? 'Institutional Administrator' : uiRole === 'teacher' ? 'Course Faculty / Staff' : 'Student',
      },
    };
  }
}
