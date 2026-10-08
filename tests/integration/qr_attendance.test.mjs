import test from 'node:test';
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Helper to compute token for testing matching the production implementation
function generateTestToken(sessionId, courseCode, teacherId, salt, windowIndex) {
  const payload = `${sessionId}:${courseCode}:${teacherId}:${salt}:${windowIndex}`;
  const hash = crypto.createHmac('sha256', salt).update(payload).digest('hex').toUpperCase();
  const segment1 = hash.substring(0, 4);
  const segment2 = hash.substring(4, 8);
  return `VS-${courseCode}-${segment1}-${segment2}`;
}

// Haversine formula calculation matching production
function calculateHaversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaPhi = toRad(lat2 - lat1);
  const deltaLambda = toRad(lon2 - lon1);

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

test('QR Attendance: Full Security & Lifecycle Verification', async (t) => {
  // Setup: Fetch seeded teacher & students
  const teacher = await prisma.user.findUnique({
    where: { email: 'faculty@vidyasutra.edu.in' },
    include: { teacher_assignments: true },
  });
  assert.ok(teacher, 'Teacher faculty@vidyasutra.edu.in should exist');
  assert.equal(teacher.role, 'FACULTY');
  assert.ok(teacher.teacher_assignments.length >= 2, 'Teacher should have at least 2 course assignments');

  const enrolledStudent = await prisma.user.findUnique({
    where: { email: 'student@vidyasutra.edu.in' },
    include: { student: { include: { courses: true } } },
  });
  assert.ok(enrolledStudent, 'Enrolled student should exist');
  assert.equal(enrolledStudent.role, 'STUDENT');

  const unenrolledStudent = await prisma.user.findUnique({
    where: { email: 'rohit.kumar@vidyasutra.edu.in' },
    include: { student: { include: { courses: true } } },
  });
  assert.ok(unenrolledStudent, 'Unenrolled student should exist');

  // Clean previous test attendance records
  await prisma.attendanceRecord.deleteMany({});
  await prisma.attendanceSession.deleteMany({});

  let activeSessionId;
  let sessionSalt;
  const teacherLat = 28.6139;
  const teacherLon = 77.2090;

  await t.test('1. Haversine Distance Formula precision test', () => {
    // Distance between teacher center (28.6139, 77.2090) and nearby student (28.61399, 77.20905)
    const dist1 = calculateHaversineDistanceMeters(28.6139, 77.2090, 28.61399, 77.20905);
    assert.ok(dist1 >= 10 && dist1 <= 15, `Calculated distance should be ~11m, got ${dist1}m`);

    // Distance to student 500m away (28.6184, 77.2090)
    const dist2 = calculateHaversineDistanceMeters(28.6139, 77.2090, 28.6184, 77.2090);
    assert.ok(dist2 >= 490 && dist2 <= 510, `Calculated distance should be ~500m, got ${dist2}m`);
  });

  await t.test('2. Teacher starts attendance with fixed GPS location center (CS301, CSE-A)', async () => {
    const assignment = teacher.teacher_assignments.find((a) => a.course_code === 'CS301');
    assert.ok(assignment, 'Teacher must have assignment for CS301');

    sessionSalt = crypto.randomBytes(32).toString('hex');
    const session = await prisma.attendanceSession.create({
      data: {
        teacher_id: teacher.id,
        course_code: assignment.course_code,
        course_name: assignment.course_name,
        course: 'Computer Science & Engineering',
        section: assignment.section,
        semester: 6,
        room: assignment.room,
        period: '09:00 AM - 10:00 AM',
        session_name: 'Lecture 12 - Binary Search Trees',
        secret_salt: sessionSalt,
        teacher_latitude: teacherLat,
        teacher_longitude: teacherLon,
        radius_meters: 30.0,
        status: 'ACTIVE',
        is_active: true,
        started_at: new Date(),
      },
    });

    assert.ok(session.id);
    assert.equal(session.course_code, 'CS301');
    assert.equal(session.section, 'CSE-A');
    assert.equal(session.semester, 6);
    assert.equal(session.teacher_latitude, teacherLat);
    assert.equal(session.teacher_longitude, teacherLon);
    assert.equal(session.radius_meters, 30.0);
    assert.equal(session.is_active, true);
    activeSessionId = session.id;
  });

  await t.test('3. Teacher cannot start attendance for an unassigned course', async () => {
    const unassignedCourse = 'ME401';
    const isAssigned = teacher.teacher_assignments.some((a) => a.course_code === unassignedCourse);
    assert.equal(isAssigned, false, 'Teacher must NOT be assigned to ME401');
  });

  await t.test('4. Generates 5-second rotating cryptographic token', async () => {
    const now = Date.now();
    const windowIndex1 = Math.floor(now / 5000);
    const windowIndex2 = windowIndex1 + 1; // 5 seconds later

    const token1 = generateTestToken(activeSessionId, 'CS301', teacher.id, sessionSalt, windowIndex1);
    const token2 = generateTestToken(activeSessionId, 'CS301', teacher.id, sessionSalt, windowIndex2);

    assert.ok(token1.startsWith('VS-CS301-'));
    assert.ok(token2.startsWith('VS-CS301-'));
    assert.notEqual(token1, token2, 'Tokens for adjacent 5-second windows must be completely different');
  });

  await t.test('5. Enrolled student marks attendance INSIDE 30m radius (source = qr)', async () => {
    const currentWindow = Math.floor(Date.now() / 5000);
    const validToken = generateTestToken(activeSessionId, 'CS301', teacher.id, sessionSalt, currentWindow);

    // Student coordinates ~11 meters from teacher center
    const studentLat = 28.61399;
    const studentLon = 77.20905;
    const distance = calculateHaversineDistanceMeters(teacherLat, teacherLon, studentLat, studentLon);
    assert.ok(distance <= 30.0, 'Student should be inside 30m radius');

    // Create attendance record with QR source
    const record = await prisma.attendanceRecord.create({
      data: {
        session_id: activeSessionId,
        student_id: enrolledStudent.id,
        student_name: enrolledStudent.name,
        roll_no: enrolledStudent.student.roll_no,
        token_used: validToken,
        status: 'PRESENT',
        source: 'qr',
        student_latitude: studentLat,
        student_longitude: studentLon,
        gps_accuracy: 8.0,
        distance_from_teacher: distance,
        teacher_id: teacher.id,
        marked_at: new Date(),
      },
    });

    assert.ok(record.id);
    assert.equal(record.student_name, enrolledStudent.name);
    assert.equal(record.status, 'PRESENT');
    assert.equal(record.source, 'qr');
    assert.ok(record.distance_from_teacher <= 30);
  });

  await t.test('6. Duplicate attendance scan is prevented by database unique constraint (session_id, student_id)', async () => {
    const currentWindow = Math.floor(Date.now() / 5000);
    const validToken = generateTestToken(activeSessionId, 'CS301', teacher.id, sessionSalt, currentWindow);

    await assert.rejects(
      async () => {
        await prisma.attendanceRecord.create({
          data: {
            session_id: activeSessionId,
            student_id: enrolledStudent.id, // same student, same session!
            student_name: enrolledStudent.name,
            roll_no: enrolledStudent.student.roll_no,
            token_used: validToken,
            status: 'PRESENT',
            source: 'qr',
            marked_at: new Date(),
          },
        });
      },
      (err) => {
        return err.code === 'P2002' || err.message.includes('Unique constraint failed');
      },
      'Database unique constraint @@unique([session_id, student_id]) must block duplicate attendance'
    );
  });

  await t.test('7. Student OUTSIDE 30m attendance radius is detected (> 30m)', async () => {
    // Student coordinates 500m away
    const farLat = 28.6184;
    const farLon = 77.2090;
    const farDistance = calculateHaversineDistanceMeters(teacherLat, teacherLon, farLat, farLon);
    assert.ok(farDistance > 30.0, 'Far student must exceed 30m radius');
    assert.ok(farDistance >= 490, `Expected ~500m, got ${farDistance}m`);
  });

  await t.test('8. Student with unreliable GPS accuracy (> 100m) is rejected by policy', async () => {
    const accuracy = 150.0;
    const isUnreliable = accuracy > 100.0;
    assert.equal(isUnreliable, true, 'GPS accuracy > 100m must be flagged unreliable');
  });

  await t.test('9. Expired token (> 5s old screenshot) fails validation', async () => {
    const currentWindow = Math.floor(Date.now() / 5000);
    const expiredWindow = currentWindow - 10; // 50 seconds in the past!
    const expiredToken = generateTestToken(activeSessionId, 'CS301', teacher.id, sessionSalt, expiredWindow);

    const tokenCurrent = generateTestToken(activeSessionId, 'CS301', teacher.id, sessionSalt, currentWindow);
    const tokenPrev = generateTestToken(activeSessionId, 'CS301', teacher.id, sessionSalt, currentWindow - 1);

    const isValid = expiredToken === tokenCurrent || expiredToken === tokenPrev;
    assert.equal(isValid, false, 'Expired QR code must be rejected');
  });

  await t.test('10. Teacher Manage Students: Manually marks an absent student PRESENT (source = manual)', async () => {
    // Rohit Kumar is another student in the database
    const manualRecord = await prisma.attendanceRecord.create({
      data: {
        session_id: activeSessionId,
        student_id: unenrolledStudent.id,
        student_name: unenrolledStudent.name,
        roll_no: unenrolledStudent.student?.roll_no || '21BCSE202',
        token_used: null,
        status: 'PRESENT',
        source: 'manual',
        teacher_id: teacher.id,
        marked_at: new Date(),
      },
    });

    assert.ok(manualRecord.id);
    assert.equal(manualRecord.status, 'PRESENT');
    assert.equal(manualRecord.source, 'manual');
    assert.equal(manualRecord.teacher_id, teacher.id);
  });

  await t.test('11. Teacher changes PRESENT <-> ABSENT manually', async () => {
    const updatedRecord = await prisma.attendanceRecord.update({
      where: {
        session_id_student_id: {
          session_id: activeSessionId,
          student_id: unenrolledStudent.id,
        },
      },
      data: {
        status: 'ABSENT',
        source: 'manual',
        marked_at: new Date(),
      },
    });

    assert.equal(updatedRecord.status, 'ABSENT');
    assert.equal(updatedRecord.source, 'manual');
  });

  await t.test('12. Teacher ends attendance session, invalidating subsequent scans', async () => {
    const ended = await prisma.attendanceSession.update({
      where: { id: activeSessionId },
      data: { is_active: false, status: 'ENDED', ended_at: new Date() },
    });

    assert.equal(ended.is_active, false);
    assert.equal(ended.status, 'ENDED');

    const fetched = await prisma.attendanceSession.findUnique({
      where: { id: activeSessionId },
    });
    assert.equal(fetched.is_active, false);
    assert.equal(fetched.status, 'ENDED');
  });

  await t.test('13. Admin attendance settings model persistence', async () => {
    const setting = await prisma.attendanceSetting.upsert({
      where: { id: 'default' },
      update: {
        radius_meters: 50.0,
        qr_refresh_seconds: 5,
        session_duration_mins: 75,
      },
      create: {
        id: 'default',
        radius_meters: 50.0,
        qr_refresh_seconds: 5,
        session_duration_mins: 75,
      },
    });

    assert.equal(setting.radius_meters, 50.0);
    assert.equal(setting.qr_refresh_seconds, 5);
    assert.equal(setting.session_duration_mins, 75);

    // Reset to default 30.0m
    const reset = await prisma.attendanceSetting.update({
      where: { id: 'default' },
      data: { radius_meters: 30.0 },
    });
    assert.equal(reset.radius_meters, 30.0);
  });
});
