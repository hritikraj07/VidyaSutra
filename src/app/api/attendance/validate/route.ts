import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/serverAuth';
import { AttendanceService } from '@/services/attendanceService';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // 1. Strictly extract and verify student identity from server session
    const studentUser = await getAuthenticatedUser(request);

    if (!studentUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'UNAUTHENTICATED',
          message: 'You must be logged in as an institutional student to mark attendance.',
        },
        { status: 401 }
      );
    }

    // Role verification: strictly require student role
    if (studentUser.dbRole !== 'STUDENT' && studentUser.role !== 'student') {
      return NextResponse.json(
        {
          success: false,
          error: 'UNAUTHORIZED_ROLE',
          message: 'Only registered students can mark attendance. Faculty accounts cannot mark attendance.',
        },
        { status: 403 }
      );
    }

    // 2. Parse scanned payload and student geolocation
    const body = await request.json().catch(() => ({}));
    let { sessionId, token, rawScan, latitude, longitude, accuracy } = body;

    // Support scanned JSON string directly from camera QR
    if (rawScan && typeof rawScan === 'string') {
      try {
        const parsed = JSON.parse(rawScan);
        if (parsed.sid) sessionId = parsed.sid;
        if (parsed.tok) token = parsed.tok;
      } catch {
        // If not JSON, it might be the raw token
        if (!token) token = rawScan;
      }
    }

    if (!sessionId || !token) {
      return NextResponse.json(
        {
          success: false,
          error: 'MISSING_PAYLOAD',
          message: 'Scanned QR token and session ID are required.',
        },
        { status: 400 }
      );
    }

    // Location object (if provided by student's browser device)
    const studentLocation =
      typeof latitude === 'number' && typeof longitude === 'number'
        ? { latitude, longitude, accuracy: typeof accuracy === 'number' ? accuracy : undefined }
        : undefined;

    // 3. Server-side validation & atomic marking
    const result = await AttendanceService.validateAndMarkAttendance(
      studentUser,
      sessionId,
      token,
      studentLocation
    );

    if (!result.success) {
      const statusCode = result.duplicate
        ? 409
        : result.error === 'NOT_ENROLLED' || result.error === 'UNAUTHORIZED_ROLE'
        ? 403
        : 400;
      return NextResponse.json(result, { status: statusCode });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('Attendance validation error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'SERVER_ERROR',
        message: err.message || 'Internal server error during attendance verification.',
      },
      { status: 500 }
    );
  }
}
