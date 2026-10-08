import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/serverAuth';
import {
  getSupabaseServerClient,
  upsertProfileInSupabase,
  deleteProfileFromSupabase,
} from '@/lib/supabaseAdmin';
import { hashPassword, normalizeRoleToDb, normalizeRoleToUi } from '@/lib/auth';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 1. Server-side admin verification
    const authUser = await getAuthenticatedUser(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Administrator privileges required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim().toLowerCase();
    const roleFilter = (searchParams.get('role') || '').trim().toLowerCase();
    const courseFilter = (searchParams.get('course') || '').trim().toLowerCase();
    const sectionFilter = (searchParams.get('section') || '').trim().toLowerCase();
    const semesterFilter = searchParams.get('semester');

    // 2. Fetch users from local DB
    const dbUsers = await prisma.user.findMany({
      include: {
        student: true,
        teacher_assignments: true,
      },
      orderBy: { created_at: 'desc' },
    });

    // 3. Fetch public.profiles from Supabase
    let supaProfilesMap = new Map<string, any>();
    try {
      const supabase = getSupabaseServerClient();
      const { data: supaProfiles } = await supabase.from('profiles').select('*');
      if (Array.isArray(supaProfiles)) {
        for (const p of supaProfiles) {
          if (p.id) supaProfilesMap.set(p.id, p);
          if (p.email) supaProfilesMap.set(p.email.toLowerCase(), p);
        }
      }
    } catch {
      // Graceful fallback
    }

    // 4. Combine and standardize users
    let combinedUsers = dbUsers.map((u) => {
      const supa = supaProfilesMap.get(u.id) || supaProfilesMap.get(u.email.toLowerCase()) || {};
      const uiRole = supa.role ? supa.role.toLowerCase() : normalizeRoleToUi(u.role);
      const studentId = u.student?.roll_no || supa.student_id || null;
      
      const teacherCourse = u.teacher_assignments?.[0]
        ? `${u.teacher_assignments[0].course_code} — ${u.teacher_assignments[0].course_name}`
        : null;
      const teacherSection = u.teacher_assignments?.[0]?.section || null;

      const course = supa.course || (uiRole === 'teacher' ? teacherCourse : u.student?.course || u.student?.department || null);
      const section = supa.section || (uiRole === 'teacher' ? teacherSection : u.student?.section || null);
      const semester = supa.semester != null ? Number(supa.semester) : u.student?.semester || null;

      return {
        id: u.id,
        name: supa.full_name || u.name,
        email: u.email,
        role: uiRole,
        course,
        section,
        semester,
        studentId,
        teacherId: uiRole === 'teacher' ? studentId : null,
        teacherAssignments: u.teacher_assignments || [],
        lastLoginAt: u.last_login_at?.toISOString() || null,
        createdAt: u.created_at.toISOString(),
      };
    });

    // 5. Apply query filters
    if (q) {
      combinedUsers = combinedUsers.filter((u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q) ||
        (u.studentId && u.studentId.toLowerCase().includes(q))
      );
    }

    if (roleFilter && roleFilter !== 'all') {
      combinedUsers = combinedUsers.filter((u) => u.role === roleFilter);
    }

    if (courseFilter && courseFilter !== 'all') {
      combinedUsers = combinedUsers.filter((u) => u.course && u.course.toLowerCase().includes(courseFilter));
    }

    if (sectionFilter && sectionFilter !== 'all') {
      combinedUsers = combinedUsers.filter((u) => u.section && u.section.toLowerCase() === sectionFilter);
    }

    if (semesterFilter && semesterFilter !== 'all') {
      const semNum = Number(semesterFilter);
      combinedUsers = combinedUsers.filter((u) => u.semester === semNum);
    }

    return NextResponse.json({ success: true, users: combinedUsers });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to list users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Server-side admin verification
    const authUser = await getAuthenticatedUser(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Administrator privileges required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      email,
      password,
      role,
      course,
      section,
      semester,
      studentId,
      teacherId,
      rollNo,
    } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { success: false, error: 'Full name, email, password, and role are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanRoleUpper = role.trim().toUpperCase();
    const cleanRoleLower = role.trim().toLowerCase();
    const idToStore = studentId || teacherId || rollNo || '';

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'An account with this institutional email already exists.' },
        { status: 409 }
      );
    }

    // 2. Create authentication account in Supabase Auth if service role client available
    let authUserId: string = crypto.randomUUID();
    const supabase = getSupabaseServerClient();
    try {
      if ((supabase.auth as any).admin) {
        const { data: createdAuth, error: authErr } = await (supabase.auth as any).admin.createUser({
          email: cleanEmail,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: name.trim(),
            role: cleanRoleLower,
          },
        });
        if (createdAuth?.user?.id) {
          authUserId = createdAuth.user.id;
        } else if (authErr) {
          console.warn('Supabase admin.createUser notice:', authErr.message);
        }
      } else {
        // Fallback to client-side signUp attempt
        const { data: supaSignUp } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: name.trim(),
              role: cleanRoleLower,
            },
          },
        });
        if (supaSignUp?.user?.id) {
          authUserId = supaSignUp.user.id;
        }
      }
    } catch (e) {
      console.warn('Supabase auth account notice:', e);
    }

    // 3. Create / Update public.profiles row using the Auth user UUID
    await upsertProfileInSupabase({
      id: authUserId,
      email: cleanEmail,
      full_name: name.trim(),
      role: cleanRoleLower,
      course: course || null,
      section: section || null,
      semester: semester ? Number(semester) : null,
      student_id: idToStore || null,
    });

    // 4. Synchronize with local database (Prisma)
    const passwordHash = hashPassword(password);
    const now = new Date();
    const dbRole = normalizeRoleToDb(cleanRoleUpper);

    const newUser = await prisma.user.create({
      data: {
        id: authUserId,
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
                  roll_no: idToStore || `ROLL_${Date.now().toString().slice(-4)}`,
                  course: course || 'Computer Science & Engineering',
                  department: course || 'Computer Science & Engineering',
                  semester: semester ? Number(semester) : 1,
                  section: section || 'A',
                  admission_year: 2024,
                },
              },
            }
          : {}),
      },
      include: {
        student: true,
      },
    });

    // If role is teacher and course/section assigned, persist in teacher_assignments
    if ((dbRole === 'FACULTY' || cleanRoleLower === 'teacher') && course) {
      try {
        const courseCode = course.includes('—') ? course.split('—')[0].trim() : course.includes('-') ? course.split('-')[0].trim() : course.trim();
        const courseName = course.includes('—') ? course.split('—')[1].trim() : course.includes('-') ? course.split('-')[1].trim() : course.trim();
        await prisma.teacherAssignment.create({
          data: {
            teacher_id: newUser.id,
            course_code: courseCode,
            course_name: courseName || 'Core Curriculum',
            section: section ? section.trim() : 'CSE-A',
            room: 'Hall 301',
          },
        });
      } catch (assignErr) {
        console.warn('TeacherAssignment creation notice:', assignErr);
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: cleanRoleLower,
        course,
        section,
        semester,
        studentId: idToStore,
        teacherId: cleanRoleLower === 'teacher' ? idToStore : null,
      },
      message: `User '${newUser.name}' created with role ${cleanRoleLower}`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to create user' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // 1. Server-side admin verification
    const authUser = await getAuthenticatedUser(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Administrator privileges required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, name, role, course, section, semester, studentId, teacherId } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: { student: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const cleanRoleLower = role ? role.trim().toLowerCase() : normalizeRoleToUi(user.role);
    const cleanRoleUpper = role ? role.trim().toUpperCase() : user.role;
    const cleanId = studentId || teacherId || user.student?.roll_no;

    // 2. Update public.profiles in Supabase
    await upsertProfileInSupabase({
      id: user.id,
      email: user.email,
      full_name: name || user.name,
      role: cleanRoleLower,
      course: course || user.student?.course,
      section: section || user.student?.section,
      semester: semester != null ? Number(semester) : user.student?.semester,
      student_id: cleanId,
    });

    // 3. Update local database
    const dbRole = normalizeRoleToDb(cleanRoleUpper);
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name: name || user.name,
        role: dbRole,
        ...(dbRole === 'STUDENT'
          ? user.student
            ? {
                student: {
                  update: {
                    roll_no: cleanId || user.student.roll_no,
                    course: course || user.student.course,
                    section: section || user.student.section,
                    semester: semester != null ? Number(semester) : user.student.semester,
                  },
                },
              }
            : {
                student: {
                  create: {
                    roll_no: cleanId || `ROLL_${Date.now().toString().slice(-4)}`,
                    course: course || 'Computer Science & Engineering',
                    department: course || 'Computer Science & Engineering',
                    semester: semester != null ? Number(semester) : 1,
                    section: section || 'A',
                    admission_year: 2024,
                  },
                },
              }
          : {}),
      },
      include: { student: true },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: cleanRoleLower,
        course,
        section,
        semester,
        studentId: cleanId,
      },
      message: 'User profile updated successfully',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update user profile' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // 1. Server-side admin verification
    const authUser = await getAuthenticatedUser(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Administrator privileges required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    // Delete from public.profiles
    await deleteProfileFromSupabase(id);

    // Try deleting from Supabase Auth if admin api available
    try {
      const supabase = getSupabaseServerClient();
      if ((supabase.auth as any).admin) {
        await (supabase.auth as any).admin.deleteUser(id);
      }
    } catch {
      // Non-blocking
    }

    // Delete from local DB
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'User record and profile deleted successfully' });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to delete user record' },
      { status: 500 }
    );
  }
}
