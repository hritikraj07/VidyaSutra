import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/serverAuth';

// In-memory alert log for faculty & coordinator interventions during active runtime
const activeAlerts: Array<{
  id: string;
  studentId: string;
  rollNo: string;
  studentName: string;
  facultyName: string;
  reason: string;
  type: string;
  sentAt: string;
}> = [];

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser || (authUser.role !== 'teacher' && authUser.role !== 'admin')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Faculty or Coordinator privileges required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { studentId, rollNo, studentName, reason, type } = body;

    if (!rollNo && !studentId) {
      return NextResponse.json(
        { success: false, error: 'Student identifier or roll number is required.' },
        { status: 400 }
      );
    }

    const alertRecord = {
      id: `alt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      studentId: studentId || rollNo,
      rollNo: rollNo || 'N/A',
      studentName: studentName || 'Student',
      facultyName: authUser.name || 'Faculty Advisor',
      reason: reason || 'Attendance is currently below the mandatory 75% threshold.',
      type: type || 'attendance_warning',
      sentAt: new Date().toISOString(),
    };

    activeAlerts.unshift(alertRecord);

    return NextResponse.json({
      success: true,
      message: `Alert dispatched successfully to ${alertRecord.studentName} (${alertRecord.rollNo}).`,
      alert: alertRecord,
    });
  } catch (err: any) {
    console.error('Alert student error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to dispatch student alert' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      alerts: activeAlerts,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}
