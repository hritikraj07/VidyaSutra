import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/serverAuth';
import { AnalyticsService } from '@/services/analyticsService';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Access denied: Institutional Administrator privileges required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const course = searchParams.get('course') || undefined;
    const section = searchParams.get('section') || undefined;
    const semester = searchParams.get('semester') ? Number(searchParams.get('semester')) : undefined;
    const riskLevel = searchParams.get('riskLevel') || undefined;
    const segment = searchParams.get('segment') || undefined;
    const searchQuery = searchParams.get('q') || undefined;

    const data = await AnalyticsService.getCampusAnalytics({
      course,
      section,
      semester,
      riskLevel,
      segment,
      searchQuery,
    });

    return NextResponse.json({ success: true, ...data });
  } catch (err: any) {
    console.error('Campus analytics API error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to generate campus analytics report' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Access denied: Administrator privileges required to modify analytics data.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { studentProfileId, ...updates } = body;

    if (!studentProfileId) {
      return NextResponse.json(
        { success: false, error: 'Missing required studentProfileId' },
        { status: 400 }
      );
    }

    const updatedProfile = await AnalyticsService.updateStudentAnalytics(studentProfileId, updates);

    return NextResponse.json({
      success: true,
      message: 'Student academic & telemetry record updated successfully',
      data: updatedProfile,
    });
  } catch (err: any) {
    console.error('Update student analytics API error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update student telemetry record' },
      { status: 500 }
    );
  }
}
