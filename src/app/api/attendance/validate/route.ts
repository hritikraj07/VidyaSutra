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
          message: 'Please sign in as a student before scanning attendance.',
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
    let { sessionId, token, sessionToken, rawScan, qrPayload, latitude, longitude, accuracy } = body;

    // Support scanned JSON string, sessionToken, or URL directly from camera QR
    const scanInput = sessionToken || rawScan || qrPayload || token;
    if (scanInput && typeof scanInput === 'string') {
      const trimmed = scanInput.trim();
      // Case A: JSON string
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed.sid) sessionId = parsed.sid;
          if (parsed.sessionId) sessionId = parsed.sessionId;
          if (parsed.tok) token = parsed.tok;
          if (parsed.token) token = parsed.token;
          if (parsed.sessionToken) token = parsed.sessionToken;
          if (parsed.session) {
            if (!token) token = parsed.session;
            if (!sessionId) sessionId = parsed.session;
          }
        } catch {}
      }
      // Case B: URL or Query String
      else if (trimmed.includes('?') || trimmed.includes('/attendance/scan') || trimmed.startsWith('http')) {
        try {
          let urlObj: URL | null = null;
          try {
            urlObj = new URL(trimmed);
          } catch {
            urlObj = new URL(`http://localhost${trimmed.startsWith('/') ? '' : '/'}${trimmed}`);
          }
          if (urlObj) {
            const uSid = urlObj.searchParams.get('sid') || urlObj.searchParams.get('session_id') || urlObj.searchParams.get('session');
            const uTok = urlObj.searchParams.get('token') || urlObj.searchParams.get('tok') || urlObj.searchParams.get('sessionToken') || urlObj.searchParams.get('session');
            if (uSid) sessionId = uSid;
            if (uTok) token = uTok;
          }
        } catch {}
      } else {
        if (!token) token = trimmed;
      }
    }

    if (!token && sessionToken) {
      token = sessionToken;
    }

    if (!sessionId && !token) {
      return NextResponse.json(
        {
          success: false,
          error: 'MISSING_PAYLOAD',
          message: 'This is not a valid VidyaSutra attendance QR.',
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
      const statusCode = result.duplicate || result.reason === 'ALREADY_MARKED'
        ? 409
        : result.error === 'WRONG_CLASS' || result.error === 'NOT_ENROLLED' || result.error === 'UNAUTHORIZED_ROLE'
        ? 403
        : result.error === 'UNAUTHENTICATED'
        ? 401
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
