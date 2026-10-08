import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/services/authService';
import { prisma } from '@/lib/db';
import { normalizeRoleToUi } from '@/lib/auth';
import { getProfileFromSupabase } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get('vidyasutra_session')?.value;
  if (!sessionCookie) {
    return NextResponse.json({ user: null });
  }

  try {
    const session = JSON.parse(decodeURIComponent(sessionCookie));
    if (session?.id || session?.email) {
      // Re-verify against database
      const dbUser = await prisma.user.findFirst({
        where: session.id ? { id: session.id } : { email: session.email?.trim().toLowerCase() },
        include: {
          student: {
            include: {
              courses: true,
            },
          },
        },
      });

      if (!dbUser) {
        const response = NextResponse.json({ user: null });
        response.cookies.delete('vidyasutra_session');
        return response;
      }

      const cohort = dbUser.student
        ? `Batch of ${dbUser.student.admission_year} • Sem ${dbUser.student.semester} (${dbUser.student.section})`
        : undefined;

      const supaProfile = await getProfileFromSupabase({ email: dbUser.email, id: dbUser.id });
      const effectiveRole = supaProfile?.role ? (supaProfile.role.trim().toLowerCase() as any) : normalizeRoleToUi(dbUser.role);

      // Return current synced database values
      const syncedUser = {
        ...session,
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        role: effectiveRole,
        rollNo: dbUser.student?.roll_no ?? session.rollNo,
        course: dbUser.student?.course ?? dbUser.student?.department ?? session.course,
        department: dbUser.student?.department ?? session.department,
        semester: dbUser.student?.semester ?? session.semester,
        section: dbUser.student?.section ?? session.section,
        admissionYear: dbUser.student?.admission_year ?? session.admissionYear,
        cohort,
        lastLoginAt: dbUser.last_login_at?.toISOString(),
        courses: dbUser.student?.courses?.map((c) => ({
          id: c.id,
          subjectCode: c.subject_code,
          subjectName: c.subject_name,
          status: c.status,
        })),
      };
      return NextResponse.json({ user: syncedUser });
    }
    return NextResponse.json({ user: session });
  } catch {
    return NextResponse.json({ user: null });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, password, role, name, rollNo, course, department, semester, section, admissionYear } = body;

    if (action === 'logout') {
      const response = NextResponse.json({ success: true, message: 'Signed out successfully' });
      response.cookies.delete('vidyasutra_session');
      return response;
    }

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Institutional email and password are required.' },
        { status: 400 }
      );
    }

    let resultUser;

    if (action === 'register' || action === 'signup') {
      if (!name) {
        return NextResponse.json(
          { success: false, error: 'Full name is required for registration.' },
          { status: 400 }
        );
      }

      const res = await AuthService.register({
        email,
        password,
        name,
        role,
        rollNo,
        course,
        department,
        semester: semester ? Number(semester) : 1,
        section: section || 'A',
        admissionYear: admissionYear ? Number(admissionYear) : 2024,
      });
      resultUser = res.user;
    } else {
      // Login flow
      const res = await AuthService.login({
        email,
        password,
        role,
      });
      resultUser = res.user;
    }

    const response = NextResponse.json({
      success: true,
      user: resultUser,
      message: `Authenticated as ${resultUser.name} (${resultUser.role})`,
    });

    // Set persistent session cookie (7 days expiry)
    response.cookies.set('vidyasutra_session', encodeURIComponent(JSON.stringify(resultUser)), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err: any) {
    const isNotFound = err.message?.includes('not found') || err.message?.includes('Account not found');
    const isInvalidCreds = err.message?.includes('Invalid credentials') || err.message?.includes('verify your password');
    const isAccessDenied = err.message?.includes('Access denied');
    const status = isNotFound ? 404 : isAccessDenied ? 403 : isInvalidCreds ? 401 : err.message?.includes('already exists') ? 409 : 400;
    return NextResponse.json(
      { success: false, error: err.message || 'Authentication failed' },
      { status }
    );
  }
}
