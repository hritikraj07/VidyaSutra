import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export interface StudentListItem {
  id: string;
  userId: string;
  name: string;
  email: string;
  rollNo: string;
  course: string;
  department: string;
  semester: number;
  section: string;
  admissionYear: number;
  lastLoginAt: string | null;
  createdAt: string;
  coursesCount: number;
  courses: { id: string; subject_code: string; subject_name: string; status: string }[];
}

export class StudentService {
  /**
   * List all student records with optional search filter
   */
  static async listStudents(searchQuery?: string): Promise<StudentListItem[]> {
    const students = await prisma.studentProfile.findMany({
      where: searchQuery
        ? {
            OR: [
              { roll_no: { contains: searchQuery } },
              { course: { contains: searchQuery } },
              { department: { contains: searchQuery } },
              { user: { name: { contains: searchQuery } } },
              { user: { email: { contains: searchQuery } } },
            ],
          }
        : undefined,
      include: {
        user: true,
        courses: true,
      },
      orderBy: {
        roll_no: 'asc',
      },
    });

    return students.map((s) => ({
      id: s.id,
      userId: s.user_id,
      name: s.user.name,
      email: s.user.email,
      rollNo: s.roll_no,
      course: s.course || s.department,
      department: s.department,
      semester: s.semester,
      section: s.section,
      admissionYear: s.admission_year,
      lastLoginAt: s.user.last_login_at ? s.user.last_login_at.toISOString() : null,
      createdAt: s.user.created_at.toISOString(),
      coursesCount: s.courses.length,
      courses: s.courses.map((c) => ({
        id: c.id,
        subject_code: c.subject_code,
        subject_name: c.subject_name,
        status: c.status,
      })),
    }));
  }

  /**
   * Update student profile fields
   */
  static async updateStudent(
    studentProfileId: string,
    data: {
      name?: string;
      course?: string;
      department?: string;
      semester?: number;
      section?: string;
      admissionYear?: number;
      rollNo?: string;
    }
  ) {
    const current = await prisma.studentProfile.findUnique({
      where: { id: studentProfileId },
    });
    if (!current) throw new Error('Student profile not found');

    if (data.name) {
      await prisma.user.update({
        where: { id: current.user_id },
        data: { name: data.name.trim() },
      });
    }

    return await prisma.studentProfile.update({
      where: { id: studentProfileId },
      data: {
        course: data.course?.trim(),
        department: data.department?.trim() || data.course?.trim(),
        semester: data.semester ? Number(data.semester) : undefined,
        section: data.section?.trim(),
        admission_year: data.admissionYear ? Number(data.admissionYear) : undefined,
        roll_no: data.rollNo?.trim(),
      },
      include: {
        user: true,
        courses: true,
      },
    });
  }

  /**
   * Delete student profile and user
   */
  static async deleteStudent(studentProfileId: string) {
    const current = await prisma.studentProfile.findUnique({
      where: { id: studentProfileId },
    });
    if (!current) throw new Error('Student profile not found');

    // Deleting user will cascade delete studentProfile and courseAllotments
    await prisma.user.delete({
      where: { id: current.user_id },
    });

    return { success: true };
  }
}
