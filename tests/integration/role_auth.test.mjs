import test from 'node:test';
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
import { getProfileFromSupabase } from '../../src/lib/supabaseAdmin.ts';

const prisma = new PrismaClient();
const API_BASE = 'http://localhost:3000';

test('Role-Based Authentication & Authorization Gateway Matrix', async (t) => {
  // Check if local dev server is accessible
  let serverAvailable = false;
  try {
    const ping = await fetch(`${API_BASE}/api/auth`, { method: 'GET' });
    if (ping.ok || ping.status === 200) serverAvailable = true;
  } catch {
    serverAvailable = false;
  }

  assert.ok(serverAvailable, 'Next.js dev server must be running at http://localhost:3000 to execute integration role tests');

  // Case 1: Student credentials → Student login → Student UI
  await t.test('1. Student credentials → Student login → Student UI', async () => {
    const res = await fetch(`${API_BASE}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'login',
        email: 'student@vidyasutra.edu.in',
        password: 'Student@123',
        role: 'student',
      }),
    });

    const data = await res.json();
    assert.equal(res.status, 200, `Expected 200, got ${res.status}: ${JSON.stringify(data)}`);
    assert.equal(data.success, true);
    assert.equal(data.user.role, 'student', 'Verified role must be "student" directing user to Student UI');
    assert.equal(data.user.email, 'student@vidyasutra.edu.in');
  });

  // Case 2: Teacher credentials → Teacher/Staff login → Teacher UI
  await t.test('2. Teacher credentials → Teacher/Staff login → Teacher UI', async () => {
    const res = await fetch(`${API_BASE}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'login',
        email: 'faculty@vidyasutra.edu.in',
        password: 'Faculty@123',
        role: 'teacher',
      }),
    });

    const data = await res.json();
    assert.equal(res.status, 200, `Expected 200, got ${res.status}: ${JSON.stringify(data)}`);
    assert.equal(data.success, true);
    assert.equal(data.user.role, 'teacher', 'Verified role must be "teacher" directing user to Teacher UI');
    assert.equal(data.user.email, 'faculty@vidyasutra.edu.in');
  });

  // Case 3: Admin credentials → Teacher/Staff login → Admin UI
  await t.test('3. Admin credentials → Teacher/Staff login → Admin UI', async () => {
    const res = await fetch(`${API_BASE}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'login',
        email: 'admin@vidyasutra.edu.in',
        password: 'Admin@123',
        role: 'teacher',
      }),
    });

    const data = await res.json();
    assert.equal(res.status, 200, `Expected 200, got ${res.status}: ${JSON.stringify(data)}`);
    assert.equal(data.success, true);
    assert.equal(data.user.role, 'admin', 'Verified role must be "admin" directing user to Admin UI');
    assert.equal(data.user.email, 'admin@vidyasutra.edu.in');
  });

  // Case 4: Admin credentials → Student login → rejected
  await t.test('4. Admin credentials → Student login → rejected (tells to use Teacher/Staff login)', async () => {
    const res = await fetch(`${API_BASE}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'login',
        email: 'admin@vidyasutra.edu.in',
        password: 'Admin@123',
        role: 'student',
      }),
    });

    const data = await res.json();
    assert.equal(res.status, 403, `Expected 403 Forbidden, got ${res.status}`);
    assert.equal(data.success, false);
    assert.match(data.error, /Teacher \/ Staff/i, 'Error message must instruct user to use Teacher / Staff login');
  });

  // Case 5: Student credentials → Teacher/Staff login → rejected
  await t.test('5. Student credentials → Teacher/Staff login → rejected (tells to use Student login)', async () => {
    const res = await fetch(`${API_BASE}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'login',
        email: 'student@vidyasutra.edu.in',
        password: 'Student@123',
        role: 'teacher',
      }),
    });

    const data = await res.json();
    assert.equal(res.status, 403, `Expected 403 Forbidden, got ${res.status}`);
    assert.equal(data.success, false);
    assert.match(data.error, /Student login/i, 'Error message must instruct user to use Student login');
  });

  // Case 6: Direct access to Admin route by non-admin → rejected/redirected
  await t.test('6. Direct access to Admin route by non-admin → rejected/redirected', async () => {
    // 6a. Direct call to admin API without credentials → 403
    const apiResUnauth = await fetch(`${API_BASE}/api/admin/users`, { method: 'GET' });
    assert.equal(apiResUnauth.status, 403, 'Unauthenticated call to /api/admin/users must return 403');

    // 6b. Direct call to admin API with student session → 403
    const studentUser = await prisma.user.findUnique({ where: { email: 'student@vidyasutra.edu.in' } });
    const studentCookie = `vidyasutra_session=${encodeURIComponent(JSON.stringify({ id: studentUser.id, email: studentUser.email, role: 'student' }))}`;
    const apiResStudent = await fetch(`${API_BASE}/api/admin/users`, {
      method: 'GET',
      headers: { Cookie: studentCookie },
    });
    assert.equal(apiResStudent.status, 403, 'Student call to /api/admin/users must return 403');

    // 6c. Page request to /admin with student cookie → redirected
    const pageResStudent = await fetch(`${API_BASE}/admin`, {
      method: 'GET',
      headers: { Cookie: studentCookie },
      redirect: 'manual',
    });
    // Next.js middleware redirects non-admin to /
    assert.ok(
      pageResStudent.status === 307 || pageResStudent.status === 308 || pageResStudent.status === 302,
      `Expected redirect status (307/308/302), got ${pageResStudent.status}`
    );
  });

  // Helper: Obtain Admin session cookie for admin operations
  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@vidyasutra.edu.in' } });
  const adminCookie = `vidyasutra_session=${encodeURIComponent(JSON.stringify({ id: adminUser.id, email: adminUser.email, role: 'admin' }))}`;

  // Case 7: Admin creates a new student → correct Auth account + profile with selected student role/details
  await t.test('7. Admin creates a new student → correct Auth account + profile with selected student role/details', async () => {
    const timestamp = Date.now();
    const studentEmail = `student_case7_${timestamp}@vidyasutra.edu.in`;
    const studentRoll = `24BCSE${Math.floor(100 + Math.random() * 900)}`;

    const res = await fetch(`${API_BASE}/api/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        name: 'Case 7 Student',
        email: studentEmail,
        password: 'Password@123',
        role: 'student',
        course: 'Computer Science & Engineering',
        section: 'CSE-A',
        semester: 2,
        studentId: studentRoll,
      }),
    });

    const data = await res.json();
    assert.equal(res.status, 200, `Expected 200, got: ${JSON.stringify(data)}`);
    assert.equal(data.success, true);
    assert.equal(data.user.role, 'student');
    assert.equal(data.user.course, 'Computer Science & Engineering');
    assert.equal(data.user.section, 'CSE-A');
    assert.equal(data.user.semester, 2);
    assert.equal(data.user.studentId, studentRoll);

    // Verify in Supabase public.profiles
    const supaProfile = await getProfileFromSupabase({ email: studentEmail });
    if (supaProfile) {
      assert.equal(supaProfile.role, 'student');
      assert.equal(supaProfile.course, 'Computer Science & Engineering');
      assert.equal(supaProfile.section, 'CSE-A');
      assert.equal(supaProfile.semester, 2);
      assert.equal(supaProfile.student_id, studentRoll);
    }

    // Verify in local database
    const dbRecord = await prisma.user.findUnique({
      where: { email: studentEmail },
      include: { student: true },
    });
    assert.ok(dbRecord);
    assert.equal(dbRecord.role, 'STUDENT');
    assert.equal(dbRecord.student.roll_no, studentRoll);

    // Cleanup
    await prisma.user.delete({ where: { id: dbRecord.id } });
  });

  // Case 8: Admin creates a teacher → correct Auth account + profile with selected teacher role/details
  await t.test('8. Admin creates a teacher → correct Auth account + profile with selected teacher role/details', async () => {
    const timestamp = Date.now();
    const teacherEmail = `teacher_case8_${timestamp}@vidyasutra.edu.in`;
    const teacherId = `FAC${Math.floor(100 + Math.random() * 900)}`;

    const res = await fetch(`${API_BASE}/api/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        name: 'Case 8 Faculty',
        email: teacherEmail,
        password: 'Password@123',
        role: 'teacher',
        course: 'Electronics & Communication Engineering',
        section: 'ECE-A',
        semester: 4,
        teacherId,
      }),
    });

    const data = await res.json();
    assert.equal(res.status, 200, `Expected 200, got: ${JSON.stringify(data)}`);
    assert.equal(data.success, true);
    assert.equal(data.user.role, 'teacher');
    assert.equal(data.user.teacherId, teacherId);

    // Verify in Supabase public.profiles
    const supaProfile = await getProfileFromSupabase({ email: teacherEmail });
    if (supaProfile) {
      assert.equal(supaProfile.role, 'teacher');
      assert.equal(supaProfile.student_id, teacherId);
    }

    // Verify in local database
    const dbRecord = await prisma.user.findUnique({ where: { email: teacherEmail } });
    assert.ok(dbRecord);
    assert.equal(dbRecord.role, 'FACULTY');

    // Cleanup
    await prisma.user.delete({ where: { id: dbRecord.id } });
  });

  // Case 9: Admin creates another admin → correct Auth account + profile with admin role
  await t.test('9. Admin creates another admin → correct Auth account + profile with admin role', async () => {
    const timestamp = Date.now();
    const newAdminEmail = `admin_case9_${timestamp}@vidyasutra.edu.in`;

    const res = await fetch(`${API_BASE}/api/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        name: 'Case 9 Admin',
        email: newAdminEmail,
        password: 'Password@123',
        role: 'admin',
      }),
    });

    const data = await res.json();
    assert.equal(res.status, 200, `Expected 200, got: ${JSON.stringify(data)}`);
    assert.equal(data.success, true);
    assert.equal(data.user.role, 'admin');

    // Verify in Supabase public.profiles
    const supaProfile = await getProfileFromSupabase({ email: newAdminEmail });
    if (supaProfile) {
      assert.equal(supaProfile.role, 'admin');
    }

    // Verify in local database
    const dbRecord = await prisma.user.findUnique({ where: { email: newAdminEmail } });
    assert.ok(dbRecord);
    assert.equal(dbRecord.role, 'ADMIN');

    // Cleanup
    await prisma.user.delete({ where: { id: dbRecord.id } });
  });
});
