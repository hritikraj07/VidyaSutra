import test from 'node:test';
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_BASE = 'http://localhost:3000';

test('Course & Section Timetable Architecture: End-to-End Verification', async (t) => {
  const testCourse = 'Computer Science & Engineering';
  const testSemester = 6;
  const testSection = 'CSE-A';

  await t.test('1. Student User Creation persists Course, Semester, Section and Roll Number via Admin API', async () => {
    const studentEmail = `student_tt_${Date.now()}@vidyasutra.edu.in`;
    const rollNo = `24BCSE${Date.now().toString().slice(-4)}`;

    const createRes = await fetch(`${API_BASE}/api/admin/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Timetable Test Student',
        email: studentEmail,
        password: 'Password@123',
        role: 'STUDENT',
        rollNo,
        course: testCourse,
        department: testCourse,
        semester: testSemester,
        section: testSection,
      }),
    });

    const createData = await createRes.json();
    assert.strictEqual(createRes.status, 200);
    assert.ok(createData.user?.id);
    assert.strictEqual(createData.user.role, 'student');
    assert.strictEqual(createData.user.course, testCourse);
    assert.strictEqual(createData.user.semester, testSemester);
    assert.strictEqual(createData.user.section, testSection);

    // Verify in database directly
    const dbRecord = await prisma.user.findUnique({
      where: { email: studentEmail },
      include: { student: true },
    });
    assert.ok(dbRecord);
    assert.strictEqual(dbRecord.student?.course, testCourse);
    assert.strictEqual(dbRecord.student?.semester, testSemester);
    assert.strictEqual(dbRecord.student?.section, testSection);

    // Clean up
    await prisma.user.delete({ where: { id: dbRecord.id } });
  });

  await t.test('2. Teacher User Creation keeps teacher-specific fields and does not force student fields', async () => {
    const teacherEmail = `teacher_tt_${Date.now()}@vidyasutra.edu.in`;

    const createRes = await fetch(`${API_BASE}/api/admin/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Prof. Timetable Verifier',
        email: teacherEmail,
        password: 'Password@123',
        role: 'TEACHER',
        department: 'Computer Science & Engineering',
      }),
    });

    const createData = await createRes.json();
    assert.strictEqual(createRes.status, 200);
    assert.ok(createData.user?.id);
    assert.strictEqual(createData.user.role, 'teacher');

    // Verify in database that student profile is NOT created
    const dbRecord = await prisma.user.findUnique({
      where: { email: teacherEmail },
      include: { student: true },
    });
    assert.ok(dbRecord);
    assert.ok(dbRecord.role === 'FACULTY' || dbRecord.role === 'TEACHER');
    assert.strictEqual(dbRecord.student, null); // Student fields are not forced

    // Clean up
    await prisma.user.delete({ where: { id: dbRecord.id } });
  });

  await t.test('3. Admin Timetable CRUD: Add, List, Update, Delete for specific cohort via /api/timetable', async () => {
    // A. Add timetable entry via POST
    const createRes = await fetch(`${API_BASE}/api/timetable`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        course: testCourse,
        semester: testSemester,
        section: testSection,
        day: 'Wednesday',
        startTime: '02:00 PM',
        endTime: '03:00 PM',
        subject: 'Cloud Computing & DevOps',
        subjectCode: 'CS605',
        teacherName: 'Dr. Ramesh Verma',
        room: 'Lab 5',
      }),
    });

    const createData = await createRes.json();
    assert.strictEqual(createRes.status, 201);
    assert.ok(createData.entry?.id);
    const createdId = createData.entry.id;
    assert.strictEqual(createData.entry.subject, 'Cloud Computing & DevOps');

    // B. List entries for this cohort via GET
    const listRes = await fetch(
      `${API_BASE}/api/timetable?course=${encodeURIComponent(testCourse)}&semester=${testSemester}&section=${encodeURIComponent(testSection)}`
    );
    const listData = await listRes.json();
    assert.strictEqual(listRes.status, 200);
    assert.ok(Array.isArray(listData.entries));
    const found = listData.entries.find((e) => e.id === createdId);
    assert.ok(found, 'Created entry should be found in cohort list');

    // C. Update timetable entry via PUT
    const updateRes = await fetch(`${API_BASE}/api/timetable`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: createdId,
        room: 'Advanced Cloud Lab 2',
        startTime: '02:15 PM',
      }),
    });
    const updateData = await updateRes.json();
    assert.strictEqual(updateRes.status, 200);
    assert.strictEqual(updateData.entry.room, 'Advanced Cloud Lab 2');
    assert.strictEqual(updateData.entry.startTime, '02:15 PM');

    // D. Delete timetable entry via DELETE
    const deleteRes = await fetch(`${API_BASE}/api/timetable?id=${createdId}`, {
      method: 'DELETE',
    });
    assert.strictEqual(deleteRes.status, 200);

    // Verify deletion
    const verifyRes = await fetch(
      `${API_BASE}/api/timetable?course=${encodeURIComponent(testCourse)}&semester=${testSemester}&section=${encodeURIComponent(testSection)}`
    );
    const verifyData = await verifyRes.json();
    assert.ok(!verifyData.entries.some((e) => e.id === createdId));
  });

  await t.test('4. Student Timetable Query: Only returns cohort matching Course + Semester + Section', async () => {
    // Target cohort entry
    const cseEntry = await prisma.timetableEntry.create({
      data: {
        course: testCourse,
        semester: testSemester,
        section: testSection,
        day: 'Thursday',
        start_time: '10:00 AM',
        end_time: '11:00 AM',
        subject: 'Compiler Design',
        subject_code: 'CS602',
        teacher_name: 'Dr. Ramesh Verma',
        room: 'Hall 301',
      },
    });

    // Different cohort entry (Information Technology, Sem 4, Sec B)
    const itEntry = await prisma.timetableEntry.create({
      data: {
        course: 'Information Technology',
        semester: 4,
        section: 'B',
        day: 'Thursday',
        start_time: '10:00 AM',
        end_time: '11:00 AM',
        subject: 'Web Technologies',
        subject_code: 'IT401',
        teacher_name: 'Prof. Ananya Sen',
        room: 'Block C 201',
      },
    });

    // Student from CSE Sem 6 Sec A queries timetable
    const studentRes = await fetch(
      `${API_BASE}/api/timetable?course=${encodeURIComponent(testCourse)}&semester=${testSemester}&section=${encodeURIComponent(testSection)}`
    );
    const studentData = await studentRes.json();

    assert.ok(studentData.entries.some((s) => s.id === cseEntry.id), 'Student should see their CSE slot');
    assert.ok(!studentData.entries.some((s) => s.id === itEntry.id), 'Student must NOT see IT cohort slot');

    // Clean up
    await prisma.timetableEntry.delete({ where: { id: cseEntry.id } });
    await prisma.timetableEntry.delete({ where: { id: itEntry.id } });
  });

  await t.test('5. Teacher Timetable Query: Returns classes assigned to the teacher across cohorts', async () => {
    const teacherName = 'Prof. Schedule Specialist';
    await prisma.timetableEntry.deleteMany({ where: { teacher_name: teacherName } });

    const class1 = await prisma.timetableEntry.create({
      data: {
        course: 'Computer Science & Engineering',
        semester: 6,
        section: 'CSE-A',
        day: 'Monday',
        start_time: '09:00 AM',
        end_time: '10:00 AM',
        subject: 'AI & Machine Learning',
        subject_code: 'CS603',
        teacher_name: teacherName,
        room: 'Lab 1',
      },
    });

    const class2 = await prisma.timetableEntry.create({
      data: {
        course: 'Information Technology',
        semester: 4,
        section: 'IT-B',
        day: 'Tuesday',
        start_time: '11:00 AM',
        end_time: '12:00 PM',
        subject: 'Neural Networks Lab',
        subject_code: 'IT405',
        teacher_name: teacherName,
        room: 'Lab 3',
      },
    });

    const teacherRes = await fetch(
      `${API_BASE}/api/timetable?teacherName=${encodeURIComponent(teacherName)}`
    );
    const teacherData = await teacherRes.json();

    assert.strictEqual(teacherData.entries.length, 2);
    assert.ok(teacherData.entries.some((s) => s.id === class1.id));
    assert.ok(teacherData.entries.some((s) => s.id === class2.id));

    // Clean up
    await prisma.timetableEntry.delete({ where: { id: class1.id } });
    await prisma.timetableEntry.delete({ where: { id: class2.id } });
  });
});
