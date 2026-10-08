import { prisma } from '@/lib/db';

export interface TimetableFilter {
  course?: string;
  semester?: number;
  section?: string;
  day?: string;
  teacherId?: string;
  teacherName?: string;
}

export interface CreateTimetableInput {
  course: string;
  semester: number;
  section: string;
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  subjectCode?: string;
  teacherName: string;
  teacherId?: string;
  room: string;
}

export interface UpdateTimetableInput extends Partial<CreateTimetableInput> {
  id: string;
}

export class TimetableService {
  /**
   * List timetable entries matching cohort, day, or teacher assignment
   */
  static async listEntries(filter: TimetableFilter = {}) {
    const { course, semester, section, day, teacherId, teacherName } = filter;

    const where: any = {};

    if (course) {
      where.course = {
        equals: course.trim(),
      };
    }

    if (semester !== undefined && !isNaN(Number(semester))) {
      where.semester = Number(semester);
    }

    if (section) {
      where.section = {
        equals: section.trim(),
      };
    }

    if (day) {
      where.day = {
        equals: day.trim(),
      };
    }

    // Teacher filtering (matches teacher_id OR teacher_name)
    if (teacherId || teacherName) {
      where.OR = [
        ...(teacherId ? [{ teacher_id: teacherId }] : []),
        ...(teacherName ? [{ teacher_name: { contains: teacherName.trim() } }] : []),
      ];
    }

    const entries = await prisma.timetableEntry.findMany({
      where,
      orderBy: [
        { day: 'asc' },
        { start_time: 'asc' },
      ],
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return entries.map((e) => ({
      id: e.id,
      course: e.course,
      semester: e.semester,
      section: e.section,
      day: e.day,
      startTime: e.start_time,
      endTime: e.end_time,
      subject: e.subject,
      subjectCode: e.subject_code || undefined,
      teacherName: e.teacher_name,
      teacherId: e.teacher_id || undefined,
      room: e.room,
      createdAt: e.created_at.toISOString(),
      updatedAt: e.updated_at.toISOString(),
    }));
  }

  /**
   * Create a new timetable entry
   */
  static async createEntry(input: CreateTimetableInput) {
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
    } = input;

    if (!course || !semester || !section || !day || !startTime || !endTime || !subject || !teacherName || !room) {
      throw new Error('All timetable fields (Course, Semester, Section, Day, Start Time, End Time, Subject, Teacher, Room) are required.');
    }

    // Resolve teacher_id if not provided by looking up user with matching name or email
    let resolvedTeacherId = teacherId;
    if (!resolvedTeacherId && teacherName) {
      const matchedTeacher = await prisma.user.findFirst({
        where: {
          name: { contains: teacherName.trim() },
          role: { in: ['FACULTY', 'TEACHER', 'STAFF', 'MENTOR'] },
        },
      });
      if (matchedTeacher) {
        resolvedTeacherId = matchedTeacher.id;
      }
    }

    const created = await prisma.timetableEntry.create({
      data: {
        course: course.trim(),
        semester: Number(semester),
        section: section.trim(),
        day: day.trim(),
        start_time: startTime.trim(),
        end_time: endTime.trim(),
        subject: subject.trim(),
        subject_code: subjectCode?.trim() || null,
        teacher_name: teacherName.trim(),
        teacher_id: resolvedTeacherId || null,
        room: room.trim(),
      },
      include: {
        teacher: true,
      },
    });

    return {
      id: created.id,
      course: created.course,
      semester: created.semester,
      section: created.section,
      day: created.day,
      startTime: created.start_time,
      endTime: created.end_time,
      subject: created.subject,
      subjectCode: created.subject_code || undefined,
      teacherName: created.teacher_name,
      teacherId: created.teacher_id || undefined,
      room: created.room,
      createdAt: created.created_at.toISOString(),
      updatedAt: created.updated_at.toISOString(),
    };
  }

  /**
   * Update an existing timetable entry
   */
  static async updateEntry(input: UpdateTimetableInput) {
    const { id, ...data } = input;
    if (!id) throw new Error('Timetable entry ID is required.');

    const existing = await prisma.timetableEntry.findUnique({ where: { id } });
    if (!existing) throw new Error('Timetable entry not found.');

    const updateData: any = {};
    if (data.course) updateData.course = data.course.trim();
    if (data.semester !== undefined) updateData.semester = Number(data.semester);
    if (data.section) updateData.section = data.section.trim();
    if (data.day) updateData.day = data.day.trim();
    if (data.startTime) updateData.start_time = data.startTime.trim();
    if (data.endTime) updateData.end_time = data.endTime.trim();
    if (data.subject) updateData.subject = data.subject.trim();
    if (data.subjectCode !== undefined) updateData.subject_code = data.subjectCode?.trim() || null;
    if (data.teacherName) updateData.teacher_name = data.teacherName.trim();
    if (data.teacherId !== undefined) updateData.teacher_id = data.teacherId || null;
    if (data.room) updateData.room = data.room.trim();

    const updated = await prisma.timetableEntry.update({
      where: { id },
      data: updateData,
      include: { teacher: true },
    });

    return {
      id: updated.id,
      course: updated.course,
      semester: updated.semester,
      section: updated.section,
      day: updated.day,
      startTime: updated.start_time,
      endTime: updated.end_time,
      subject: updated.subject,
      subjectCode: updated.subject_code || undefined,
      teacherName: updated.teacher_name,
      teacherId: updated.teacher_id || undefined,
      room: updated.room,
      createdAt: updated.created_at.toISOString(),
      updatedAt: updated.updated_at.toISOString(),
    };
  }

  /**
   * Delete a timetable entry
   */
  static async deleteEntry(id: string) {
    if (!id) throw new Error('Timetable entry ID is required.');
    await prisma.timetableEntry.delete({ where: { id } });
    return { success: true };
  }

  /**
   * Get distinct cohort combinations (courses, semesters, sections)
   */
  static async getCohorts() {
    const entries = await prisma.timetableEntry.findMany({
      select: {
        course: true,
        semester: true,
        section: true,
      },
      distinct: ['course', 'semester', 'section'],
    });

    return entries;
  }
}
