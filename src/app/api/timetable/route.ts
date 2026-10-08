import { NextRequest, NextResponse } from 'next/server';
import { TimetableService } from '@/services/timetableService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const course = searchParams.get('course') || undefined;
    const semesterStr = searchParams.get('semester');
    const semester = semesterStr ? parseInt(semesterStr, 10) : undefined;
    const section = searchParams.get('section') || undefined;
    const day = searchParams.get('day') || undefined;
    const teacherId = searchParams.get('teacherId') || undefined;
    const teacherName = searchParams.get('teacherName') || undefined;
    const getCohorts = searchParams.get('cohorts') === 'true';

    if (getCohorts) {
      const cohorts = await TimetableService.getCohorts();
      return NextResponse.json({ success: true, cohorts });
    }

    const entries = await TimetableService.listEntries({
      course,
      semester,
      section,
      day,
      teacherId,
      teacherName,
    });

    return NextResponse.json({ success: true, entries });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch timetable entries' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      course,
      semester,
      section,
      day,
      startTime,
      endTime,
      subject,
      subjectCode,
      teacherName,
      teacherId,
      room,
    } = body;

    const entry = await TimetableService.createEntry({
      course,
      semester: Number(semester),
      section,
      day,
      startTime,
      endTime,
      subject,
      subjectCode,
      teacherName,
      teacherId,
      room,
    });

    return NextResponse.json({ success: true, entry }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to create timetable entry' },
      { status: 400 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      course,
      semester,
      section,
      day,
      startTime,
      endTime,
      subject,
      subjectCode,
      teacherName,
      teacherId,
      room,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Timetable entry ID is required.' }, { status: 400 });
    }

    const entry = await TimetableService.updateEntry({
      id,
      course,
      semester: semester !== undefined ? Number(semester) : undefined,
      section,
      day,
      startTime,
      endTime,
      subject,
      subjectCode,
      teacherName,
      teacherId,
      room,
    });

    return NextResponse.json({ success: true, entry });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update timetable entry' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Timetable entry ID is required.' }, { status: 400 });
    }

    await TimetableService.deleteEntry(id);
    return NextResponse.json({ success: true, message: 'Timetable entry deleted successfully.' });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to delete timetable entry' },
      { status: 400 }
    );
  }
}
