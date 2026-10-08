import test from 'node:test';
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function verifyPassword(password, storedHash) {
  try {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

test('Database has seeded User records with role and password hash', async () => {
  const users = await prisma.user.findMany();
  assert.ok(users.length >= 5, `Expected at least 5 seeded users, got ${users.length}`);

  const student = await prisma.user.findUnique({
    where: { email: 'student@vidyasutra.edu.in' },
    include: { student: { include: { courses: true } } },
  });

  assert.ok(student, 'Expected student@vidyasutra.edu.in to exist in database');
  assert.equal(student.role, 'STUDENT');
  assert.ok(student.student, 'Expected student profile to exist for student');
  assert.equal(student.student.roll_no, '21BCSE101');
  assert.equal(student.student.department, 'Computer Science & Engineering');
  assert.equal(student.student.semester, 6);
  assert.ok(student.student.courses.length > 0, 'Expected student to have allotted courses');

  // Verify password matches
  const isMatch = verifyPassword('Student@123', student.password_hash);
  assert.equal(isMatch, true, 'Student password verification should succeed');
});

test('Unauthorized user is rejected when not present in database', async () => {
  const unauthorized = await prisma.user.findUnique({
    where: { email: 'unknown_hacker@vidyasutra.edu.in' },
  });
  assert.equal(unauthorized, null, 'Unregistered user should not exist in database');
});

test('Student Profile can be updated and queried with courses', async () => {
  const student = await prisma.studentProfile.findFirst({
    where: { roll_no: '21BCSE101' },
    include: { courses: true, user: true },
  });

  assert.ok(student);
  assert.equal(student.courses.some((c) => c.subject_code === 'CS302'), true);

  // Update section test
  const updated = await prisma.studentProfile.update({
    where: { id: student.id },
    data: { section: 'A1' },
  });
  assert.equal(updated.section, 'A1');

  // Revert back
  await prisma.studentProfile.update({
    where: { id: student.id },
    data: { section: 'A' },
  });
});

test('Newly registered student starts with clean empty state (0 courses)', async () => {
  const testEmail = `newstudent_${Date.now()}@vidyasutra.edu.in`;
  const testRoll = `24TEST${Math.floor(100 + Math.random() * 900)}`;

  const newStudent = await prisma.user.create({
    data: {
      name: 'New Campus Student',
      email: testEmail,
      password_hash: 'mock_salt:mock_hash',
      role: 'STUDENT',
      student: {
        create: {
          roll_no: testRoll,
          department: 'Computer Science & Engineering',
          semester: 1,
          section: 'A',
          admission_year: 2024,
        },
      },
    },
    include: {
      student: {
        include: { courses: true },
      },
    },
  });

  assert.ok(newStudent);
  assert.equal(newStudent.student.courses.length, 0, 'New student must start with 0 courses allotted');

  // Clean up
  await prisma.studentProfile.delete({ where: { id: newStudent.student.id } });
  await prisma.user.delete({ where: { id: newStudent.id } });
});

