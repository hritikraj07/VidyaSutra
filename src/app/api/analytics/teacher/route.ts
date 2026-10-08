import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/serverAuth';
import { AnalyticsService } from '@/services/analyticsService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser || (authUser.role !== 'teacher' && authUser.role !== 'admin')) {
      return NextResponse.json(
        { success: false, error: 'Access denied: Faculty or Staff authentication required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section') || undefined;
    const courseCode = searchParams.get('courseCode') || undefined;

    const data = await AnalyticsService.getTeacherAnalytics(authUser.id, {
      section,
      courseCode,
    });

    return NextResponse.json({ success: true, ...data });
  } catch (err: any) {
    console.error('Teacher analytics API error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to generate class analytics report' },
      { status: 500 }
    );
  }
}
