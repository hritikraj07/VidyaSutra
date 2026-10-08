import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { normalizeRoleToUi } from '@/lib/auth';
import { getProfileFromSupabase } from '@/lib/supabaseAdmin';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  dbRole: string; // 'STUDENT' | 'FACULTY' | 'ADMIN'
  studentProfile?: {
    id: string;
    roll_no: string;
    department: string;
    semester: number;
    section: string;
    admission_year: number;
    courses: {
      id: string;
      subject_code: string;
      subject_name: string;
      status: string;
    }[];
  } | null;
  teacherAssignments?: {
    id: string;
    course_code: string;
    course_name: string;
    section: string;
    room: string;
  }[];
}

/**
 * Server-side helper that strictly resolves and validates the authenticated user
 * from the session cookie or Supabase Auth.
 * NEVER trusts any client-provided IDs or roles.
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  // 1. Check local secure session cookie
  const sessionCookie = request.cookies.get('vidyasutra_session')?.value;
  let sessionData: any = null;

  if (sessionCookie) {
    try {
      sessionData = JSON.parse(decodeURIComponent(sessionCookie));
    } catch {
      sessionData = null;
    }
  }

  let dbUser = null;

  if (sessionData?.id || sessionData?.email) {
    dbUser = await prisma.user.findFirst({
      where: sessionData.id ? { id: sessionData.id } : { email: sessionData.email.trim().toLowerCase() },
      include: {
        student: {
          include: {
            courses: true,
          },
        },
        teacher_assignments: true,
      },
    });
  }

  // 2. If not found via session cookie, check Supabase SSR Auth token
  if (!dbUser) {
    try {
      const cookieStore = await cookies();
      const supabase = createClient(cookieStore);
      const {
        data: { user: sbUser },
      } = await supabase.auth.getUser();

      if (sbUser?.email) {
        dbUser = await prisma.user.findFirst({
          where: { email: sbUser.email.trim().toLowerCase() },
          include: {
            student: {
              include: {
                courses: true,
              },
            },
            teacher_assignments: true,
          },
        });
      }
    } catch {
      // Supabase not configured or failed to resolve
    }
  }

  if (!dbUser) return null;

  let verifiedRole: 'student' | 'teacher' | 'admin' = normalizeRoleToUi(dbUser.role);
  try {
    const supaProfile = await getProfileFromSupabase({ email: dbUser.email, id: dbUser.id });
    if (supaProfile?.role) {
      verifiedRole = supaProfile.role;
    }
  } catch {
    // Fallback to dbUser.role
  }

  return {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    role: verifiedRole,
    dbRole: dbUser.role,
    studentProfile: dbUser.student
      ? {
          id: dbUser.student.id,
          roll_no: dbUser.student.roll_no,
          department: dbUser.student.department,
          semester: dbUser.student.semester,
          section: dbUser.student.section,
          admission_year: dbUser.student.admission_year,
          courses: dbUser.student.courses.map((c) => ({
            id: c.id,
            subject_code: c.subject_code,
            subject_name: c.subject_name,
            status: c.status,
          })),
        }
      : null,
    teacherAssignments: dbUser.teacher_assignments.map((t) => ({
      id: t.id,
      course_code: t.course_code,
      course_name: t.course_name,
      section: t.section,
      room: t.room,
    })),
  };
}
