import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/serverAuth';
import { AttendanceService } from '@/services/attendanceService';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Only administrators can access attendance settings.' },
        { status: 403 }
      );
    }

    const settings = await AttendanceService.getAttendanceSettings();

    // Fetch attendance statistics & recent audit history
    const totalSessions = await prisma.attendanceSession.count();
    const activeSessions = await prisma.attendanceSession.count({ where: { is_active: true } });
    const totalRecords = await prisma.attendanceRecord.count();
    const qrRecords = await prisma.attendanceRecord.count({ where: { source: 'qr' } });
    const manualRecords = await prisma.attendanceRecord.count({ where: { source: 'manual' } });

    const recentSessions = await prisma.attendanceSession.findMany({
      take: 10,
      orderBy: { started_at: 'desc' },
      include: {
        teacher: { select: { name: true, email: true } },
        _count: { select: { records: true } },
      },
    });

    return NextResponse.json({
      settings,
      stats: {
        totalSessions,
        activeSessions,
        totalRecords,
        qrRecords,
        manualRecords,
      },
      recentSessions: recentSessions.map((s) => ({
        id: s.id,
        courseCode: s.course_code,
        courseName: s.course_name,
        section: s.section,
        semester: s.semester,
        teacherName: s.teacher.name,
        startedAt: s.started_at.toISOString(),
        endedAt: s.ended_at ? s.ended_at.toISOString() : null,
        radiusMeters: s.radius_meters,
        isActive: s.is_active,
        status: s.status,
        attendeesCount: s._count.records,
        hasTeacherGps: Boolean(s.teacher_latitude && s.teacher_longitude),
      })),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: err.message || 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Only administrators can update attendance settings.' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { radius_meters, qr_refresh_seconds, session_duration_mins } = body;

    const updated = await AttendanceService.updateAttendanceSettings({
      radius_meters: typeof radius_meters === 'number' ? radius_meters : undefined,
      qr_refresh_seconds: typeof qr_refresh_seconds === 'number' ? qr_refresh_seconds : undefined,
      session_duration_mins:
        typeof session_duration_mins === 'number' ? session_duration_mins : undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Attendance settings updated successfully.',
      settings: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'BAD_REQUEST', message: err.message || 'Invalid parameters' },
      { status: 400 }
    );
  }
}
