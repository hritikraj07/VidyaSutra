import test from 'node:test';
import assert from 'node:assert/strict';

const API_BASE = 'http://localhost:3000';

test('Smart Campus Analytics: Multi-Role Authorization & Student Isolation Gateway', async (t) => {
  // Helper to obtain session cookie from login
  async function loginAs(email, password, role) {
    const res = await fetch(`${API_BASE}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', email, password, role }),
    });
    const cookie = res.headers.get('set-cookie');
    return cookie;
  }

  // 1. Admin Campus Analytics Access & Update
  await t.test('1. Admin accesses /api/analytics/admin -> receives campus KPIs, score distributions, and segments', async () => {
    const adminCookie = await loginAs('admin@vidyasutra.edu.in', 'Admin@123', 'teacher');
    assert.ok(adminCookie, 'Admin session cookie must be established');

    const res = await fetch(`${API_BASE}/api/analytics/admin`, {
      headers: { Cookie: adminCookie },
    });
    const data = await res.json();

    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.ok(data.kpis.totalStudents >= 4, 'Must return seeded students count');
    assert.ok(data.kpis.avgSuccessScore > 0, 'Average score must be calculated');
    assert.ok(data.scoreDistribution.strong !== undefined, 'Must calculate score distributions');
    assert.ok(data.students.length >= 4, 'Must list student records');
  });

  // 2. Admin updates student telemetry indicators
  await t.test('2. Admin updates student academic record via POST /api/analytics/admin', async () => {
    const adminCookie = await loginAs('admin@vidyasutra.edu.in', 'Admin@123', 'teacher');

    // Get a student's profile id
    const listRes = await fetch(`${API_BASE}/api/analytics/admin`, {
      headers: { Cookie: adminCookie },
    });
    const listData = await listRes.json();
    const student = listData.students[0];

    const updateRes = await fetch(`${API_BASE}/api/analytics/admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        studentProfileId: student.studentProfileId,
        cgpa: 8.9,
        internalMarksAvg: 89,
        codingScore: 92,
      }),
    });
    const updateData = await updateRes.json();
    assert.equal(updateRes.status, 200);
    assert.equal(updateData.success, true);
  });

  // 3. Teacher Scoped Analytics Access
  await t.test('3. Teacher accesses /api/analytics/teacher -> scoped strictly to assigned classes and students', async () => {
    const teacherCookie = await loginAs('faculty@vidyasutra.edu.in', 'Faculty@123', 'teacher');
    assert.ok(teacherCookie, 'Teacher session cookie must be established');

    const res = await fetch(`${API_BASE}/api/analytics/teacher`, {
      headers: { Cookie: teacherCookie },
    });
    const data = await res.json();

    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.ok(data.assignedClasses.length > 0, 'Teacher must see assigned classes');
    assert.ok(data.students.length > 0, 'Teacher must see students in their class');
  });

  // 4. Student Personal Analytics Isolation
  await t.test('4. Student accesses /api/analytics/student -> strictly isolated to own student analytics', async () => {
    const studentCookie = await loginAs('student@vidyasutra.edu.in', 'Student@123', 'student');
    assert.ok(studentCookie, 'Student session cookie must be established');

    const res = await fetch(`${API_BASE}/api/analytics/student`, {
      headers: { Cookie: studentCookie },
    });
    const data = await res.json();

    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.equal(data.student.email, 'student@vidyasutra.edu.in');
    assert.equal(data.student.rollNo, '21BCSE101');
    assert.ok(data.student.successScore.overallScore > 0);
    assert.ok(data.student.successScore.factors.length >= 7);
  });

  // 5. Security: Student rejected from Admin Analytics
  await t.test('5. Security: Student rejected from /api/analytics/admin with 403 Forbidden', async () => {
    const studentCookie = await loginAs('student@vidyasutra.edu.in', 'Student@123', 'student');

    const res = await fetch(`${API_BASE}/api/analytics/admin`, {
      headers: { Cookie: studentCookie },
    });
    assert.equal(res.status, 403, 'Student must be rejected from Admin analytics');
  });

  // 6. Security: Unauthenticated request rejected
  await t.test('6. Security: Unauthenticated request rejected from analytics endpoints', async () => {
    const res = await fetch(`${API_BASE}/api/analytics/admin`);
    assert.equal(res.status, 403);
  });
});
