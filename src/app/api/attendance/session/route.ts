import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/serverAuth';
import { AttendanceService } from '@/services/attendanceService';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId') || undefined;
    const action = searchParams.get('action') || undefined;

    // 1. Cohort management view for teacher ("Manage Students")
    if (action === 'cohort' && sessionId) {
      if (!user || (user.dbRole !== 'FACULTY' && user.role !== 'teacher' && user.role !== 'admin')) {
        return NextResponse.json(
          { error: 'Unauthorized to view class attendance roster' },
          { status: 403 }
        );
      }

      const cohortData = await AttendanceService.getSessionCohortStudents(user, sessionId);
      return NextResponse.json(cohortData);
    }

    // 2. Standard session retrieval
    let assignedCourses: any[] = [];
    if (user && (user.dbRole === 'FACULTY' || user.role === 'teacher' || user.role === 'admin')) {
      assignedCourses = await AttendanceService.getTeacherAssignments(user.id);
    }

    const session = await AttendanceService.getActiveSession(
      sessionId,
      user?.role === 'teacher' ? user.id : undefined
    );

    return NextResponse.json({
      session: session || null,
      assignedCourses,
      user: user
        ? {
            id: user.id,
            name: user.name,
            role: user.role,
          }
        : null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHENTICATED', message: 'You must be logged in.' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const action = body.action || 'refresh';

    // 1. Teacher Start / Create Session
    if (action === 'start' || action === 'create') {
      if (user.dbRole !== 'FACULTY' && user.role !== 'teacher' && user.role !== 'admin') {
        return NextResponse.json(
          {
            success: false,
            error: 'FORBIDDEN',
            message: 'Only verified teachers can start an attendance session.',
          },
          { status: 403 }
        );
      }

      const {
        courseCode,
        section,
        sessionName,
        timetableId,
        course,
        semester,
        period,
        teacherLatitude,
        teacherLongitude,
      } = body;

      if (!courseCode || !section) {
        return NextResponse.json(
          {
            success: false,
            error: 'MISSING_FIELDS',
            message: 'Course code and section are required to start attendance.',
          },
          { status: 400 }
        );
      }

      try {
        const result = await AttendanceService.startSession(user, courseCode, section, {
          sessionName,
          timetableId,
          course,
          semester: semester ? Number(semester) : undefined,
          period,
          teacherLatitude: typeof teacherLatitude === 'number' ? teacherLatitude : undefined,
          teacherLongitude: typeof teacherLongitude === 'number' ? teacherLongitude : undefined,
        });
        return NextResponse.json({ success: true, ...result });
      } catch (err: any) {
        const isUnauthorized = err.message?.startsWith('UNAUTHORIZED');
        return NextResponse.json(
          {
            success: false,
            error: isUnauthorized ? 'FORBIDDEN' : 'BAD_REQUEST',
            message: err.message,
          },
          { status: isUnauthorized ? 403 : 400 }
        );
      }
    }

    // 2. Teacher End / Stop Session
    if (action === 'end' || action === 'stop') {
      if (user.dbRole !== 'FACULTY' && user.role !== 'teacher' && user.role !== 'admin') {
        return NextResponse.json(
          { success: false, error: 'FORBIDDEN', message: 'Only teachers can end attendance.' },
          { status: 403 }
        );
      }

      const result = await AttendanceService.endSession(user, body.sessionId);
      return NextResponse.json(result);
    }

    // 3. Manual Attendance Marking (Teacher overrides/marks student)
    if (action === 'manual-mark') {
      if (user.dbRole !== 'FACULTY' && user.role !== 'teacher' && user.role !== 'admin') {
        return NextResponse.json(
          { success: false, error: 'FORBIDDEN', message: 'Only teachers can manually mark attendance.' },
          { status: 403 }
        );
      }

      const { sessionId, studentId, status } = body;
      if (!sessionId || !studentId || !status) {
        return NextResponse.json(
          {
            success: false,
            error: 'MISSING_FIELDS',
            message: 'Session ID, Student ID, and status (PRESENT/ABSENT) are required.',
          },
          { status: 400 }
        );
      }

      try {
        const result = await AttendanceService.manualMarkAttendance(
          user,
          sessionId,
          studentId,
          status
        );
        return NextResponse.json(result);
      } catch (err: any) {
        return NextResponse.json(
          { success: false, error: 'MANUAL_MARK_FAILED', message: err.message },
          { status: 400 }
        );
      }
    }

    // 4. Fallback / Refresh session
    const session = await AttendanceService.getActiveSession(
      body.sessionId,
      user.role === 'teacher' ? user.id : undefined
    );
    return NextResponse.json({ session });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: err.message || 'Server error' },
      { status: 500 }
    );
  }
}
