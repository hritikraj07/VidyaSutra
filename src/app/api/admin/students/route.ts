import { NextRequest, NextResponse } from 'next/server';
import { StudentService } from '@/services/studentService';
import { AuthService } from '@/services/authService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const students = await StudentService.listStudents(q);
    return NextResponse.json({ success: true, students });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch student records' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, role, rollNo, course, department, semester, section, admissionYear } = body;

    // Validate mandatory role requirement
    if (!role || !['ADMIN', 'TEACHER', 'STUDENT'].includes(String(role).trim().toUpperCase())) {
      return NextResponse.json(
        { success: false, error: 'A valid role (ADMIN, TEACHER, or STUDENT) is required to create a user.' },
        { status: 400 }
      );
    }

    const cleanRole = String(role).trim().toUpperCase();

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Name, institutional email, and password are required.' },
        { status: 400 }
      );
    }

    if (cleanRole === 'STUDENT' && !rollNo) {
      return NextResponse.json(
        { success: false, error: 'Roll number is required for student accounts.' },
        { status: 400 }
      );
    }

    const result = await AuthService.register({
      name,
      email,
      password,
      role: cleanRole,
      rollNo,
      course: course || department,
      department: department || (cleanRole === 'ADMIN' ? 'Administration' : 'Computer Science & Engineering'),
      semester: semester ? Number(semester) : 1,
      section: section || 'A',
      admissionYear: admissionYear ? Number(admissionYear) : 2024,
    });

    return NextResponse.json({ success: true, user: result.user });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to create student' },
      { status: 400 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, rollNo, course, department, semester, section, admissionYear } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Student ID is required' }, { status: 400 });
    }

    const updated = await StudentService.updateStudent(id, {
      name,
      rollNo,
      course,
      department,
      semester,
      section,
      admissionYear,
    });

    return NextResponse.json({ success: true, student: updated });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update student profile' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Student ID is required' }, { status: 400 });
    }

    await StudentService.deleteStudent(id);
    return NextResponse.json({ success: true, message: 'Student record deleted successfully' });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to delete student record' },
      { status: 400 }
    );
  }
}
