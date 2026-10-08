import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/serverAuth';
import { AnalyticsService } from '@/services/analyticsService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser || authUser.role !== 'student') {
      return NextResponse.json(
        { success: false, error: 'Access denied: Authenticated student session required.' },
        { status: 403 }
      );
    }

    // Strictly fetch isolated student analytics for authUser.id
    const data = await AnalyticsService.getStudentPersonalAnalytics({ userId: authUser.id });

    if (!data) {
      // Cleanly handle new users with zero records without breaking or loading mock data
      const zeroStateProfile = AnalyticsService.getZeroStateStudentAnalytics(authUser);
      return NextResponse.json({ success: true, analytics: zeroStateProfile, student: zeroStateProfile });
    }

    return NextResponse.json({ success: true, analytics: data, student: data });
  } catch (err: any) {
    console.error('Student analytics API error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch personal student analytics' },
      { status: 500 }
    );
  }
}
