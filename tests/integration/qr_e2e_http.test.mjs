import test from 'node:test';
import assert from 'node:assert/strict';

const API_BASE = 'http://localhost:3000';

test('QR Attendance E2E HTTP API Flow: Teacher, Student, Manual Marking & Admin Settings', async (t) => {
  // 1. Authenticate Teacher
  const teacherLoginRes = await fetch(`${API_BASE}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'login',
      email: 'faculty@vidyasutra.edu.in',
      password: 'Faculty@123',
      role: 'teacher',
    }),
  });
  assert.equal(teacherLoginRes.status, 200);
  const teacherCookies = teacherLoginRes.headers.get('set-cookie');
  assert.ok(teacherCookies);

  // 2. Authenticate Student
  const studentLoginRes = await fetch(`${API_BASE}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'login',
      email: 'student@vidyasutra.edu.in',
      password: 'Student@123',
      role: 'student',
    }),
  });
  assert.equal(studentLoginRes.status, 200);
  const studentCookies = studentLoginRes.headers.get('set-cookie');
  assert.ok(studentCookies);

  // 3. Authenticate Admin
  const adminLoginRes = await fetch(`${API_BASE}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'login',
      email: 'admin@vidyasutra.edu.in',
      password: 'Admin@123',
      role: 'teacher', // Teacher/Staff login handles admin
    }),
  });
  assert.equal(adminLoginRes.status, 200);
  const adminCookies = adminLoginRes.headers.get('set-cookie');
  assert.ok(adminCookies);

  let activeSessionId;
  let activeToken;
  const teacherLat = 28.6139;
  const teacherLon = 77.2090;

  await t.test('1. Teacher starts attendance with fixed GPS location center', async () => {
    const startRes = await fetch(`${API_BASE}/api/attendance/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: teacherCookies,
      },
      body: JSON.stringify({
        action: 'start',
        courseCode: 'CS301',
        section: 'CSE-A',
        course: 'Computer Science & Engineering',
        semester: 6,
        period: '09:00 AM - 10:00 AM',
        sessionName: 'Lecture 12 - Data Structures & Algorithms',
        teacherLatitude: teacherLat,
        teacherLongitude: teacherLon,
      }),
    });

    const startData = await startRes.json();
    assert.equal(startRes.status, 200);
    assert.equal(startData.success, true);
    assert.ok(startData.session.id);
    assert.equal(startData.session.courseCode, 'CS301');
    assert.equal(startData.session.section, 'CSE-A');
    assert.equal(startData.session.radiusMeters, 30.0);
    assert.equal(startData.session.hasTeacherLocation, true);
    assert.ok(startData.session.token);

    activeSessionId = startData.session.id;
    activeToken = startData.session.token;
  });

  await t.test('2. GET /api/attendance/session returns live session with 5s dynamic token', async () => {
    const getRes = await fetch(`${API_BASE}/api/attendance/session?sessionId=${activeSessionId}`, {
      headers: { cookie: teacherCookies },
    });
    const getData = await getRes.json();
    assert.equal(getRes.status, 200);
    assert.ok(getData.session);
    assert.equal(getData.session.id, activeSessionId);
    assert.equal(getData.session.isActive, true);
    assert.ok(getData.session.expiresInSeconds <= 5);
    activeToken = getData.session.token;
  });

  await t.test('3. Enrolled student marks attendance INSIDE 30m radius via HTTP scan', async () => {
    const scanRes = await fetch(`${API_BASE}/api/attendance/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: studentCookies,
      },
      body: JSON.stringify({
        sessionId: activeSessionId,
        token: activeToken,
        latitude: 28.61399, // ~11 meters from teacher
        longitude: 77.20905,
        accuracy: 8,
      }),
    });

    const scanData = await scanRes.json();
    assert.equal(scanRes.status, 200);
    assert.equal(scanData.success, true);
    assert.equal(scanData.details.status, 'PRESENT');
    assert.equal(scanData.details.source, 'qr');
    assert.equal(scanData.details.verification, 'QR + Location');
    assert.ok(scanData.details.distanceMeters <= 30);
  });

  await t.test('4. Duplicate scan by same student is rejected with 409', async () => {
    const dupRes = await fetch(`${API_BASE}/api/attendance/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: studentCookies,
      },
      body: JSON.stringify({
        sessionId: activeSessionId,
        token: activeToken,
        latitude: 28.61399,
        longitude: 77.20905,
        accuracy: 8,
      }),
    });

    const dupData = await dupRes.json();
    assert.equal(dupRes.status, 409);
    assert.equal(dupData.success, false);
    assert.equal(dupData.error, 'ALREADY_MARKED');
    assert.match(dupData.message, /already marked/i);
  });

  await t.test('5. Student outside radius (500m) is rejected', async () => {
    // Authenticate another student (rohit.kumar@vidyasutra.edu.in)
    const rohitLoginRes = await fetch(`${API_BASE}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'login',
        email: 'rohit.kumar@vidyasutra.edu.in',
        password: 'Password@123',
        role: 'student',
      }),
    });
    const rohitCookies = rohitLoginRes.headers.get('set-cookie');

    if (rohitCookies) {
      const farRes = await fetch(`${API_BASE}/api/attendance/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: rohitCookies,
        },
        body: JSON.stringify({
          sessionId: activeSessionId,
          token: activeToken,
          latitude: 28.6184, // 500m away
          longitude: 77.2090,
          accuracy: 10,
        }),
      });

      const farData = await farRes.json();
      assert.equal(farData.success, false);
      assert.ok(
        farData.error === 'OUTSIDE_ATTENDANCE_AREA' || farData.error === 'NOT_ENROLLED'
      );
    }
  });

  await t.test('6. Student with unreliable GPS (> 100m) is rejected', async () => {
    const unreliRes = await fetch(`${API_BASE}/api/attendance/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: studentCookies,
      },
      body: JSON.stringify({
        sessionId: activeSessionId,
        token: activeToken,
        latitude: 28.6139,
        longitude: 77.2090,
        accuracy: 150, // 150 meters drift!
      }),
    });

    const unreliData = await unreliRes.json();
    assert.equal(unreliData.success, false);
  });

  await t.test('7. Teacher View/Manage Students: Fetches cohort and checks QR vs Manual source', async () => {
    const cohortRes = await fetch(`${API_BASE}/api/attendance/session?action=cohort&sessionId=${activeSessionId}`, {
      headers: { cookie: teacherCookies },
    });
    const cohortData = await cohortRes.json();
    assert.equal(cohortRes.status, 200);
    assert.ok(Array.isArray(cohortData.students));
    assert.ok(cohortData.summary.totalPresent >= 1);
    assert.ok(cohortData.summary.qrVerifiedCount >= 1);

    const studentRow = cohortData.students.find((s) => s.email === 'student@vidyasutra.edu.in');
    assert.ok(studentRow);
    assert.equal(studentRow.status, 'PRESENT');
    assert.equal(studentRow.source, 'qr');
  });

  await t.test('8. Teacher manually marks an absent student PRESENT (source = manual)', async () => {
    const cohortRes = await fetch(`${API_BASE}/api/attendance/session?action=cohort&sessionId=${activeSessionId}`, {
      headers: { cookie: teacherCookies },
    });
    const cohortData = await cohortRes.json();
    const absentStudent = cohortData.students.find((s) => s.status === 'ABSENT');

    if (absentStudent) {
      const manualRes = await fetch(`${API_BASE}/api/attendance/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: teacherCookies,
        },
        body: JSON.stringify({
          action: 'manual-mark',
          sessionId: activeSessionId,
          studentId: absentStudent.studentId,
          status: 'PRESENT',
        }),
      });

      const manualData = await manualRes.json();
      assert.equal(manualRes.status, 200);
      assert.equal(manualData.success, true);
      assert.equal(manualData.record.status, 'PRESENT');
      assert.equal(manualData.record.source, 'manual');
    }
  });

  await t.test('9. Admin views and updates attendance settings via /api/admin/settings/attendance', async () => {
    // GET settings
    const getSettingsRes = await fetch(`${API_BASE}/api/admin/settings/attendance`, {
      headers: { cookie: adminCookies },
    });
    const getSettingsData = await getSettingsRes.json();
    assert.equal(getSettingsRes.status, 200);
    assert.ok(getSettingsData.settings);
    assert.ok(getSettingsData.stats.totalSessions >= 1);

    // POST update
    const updateRes = await fetch(`${API_BASE}/api/admin/settings/attendance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: adminCookies,
      },
      body: JSON.stringify({
        radius_meters: 35,
        qr_refresh_seconds: 5,
        session_duration_mins: 90,
      }),
    });
    const updateData = await updateRes.json();
    assert.equal(updateRes.status, 200);
    assert.equal(updateData.success, true);
    assert.equal(updateData.settings.radius_meters, 35);

    // Reset to 30
    await fetch(`${API_BASE}/api/admin/settings/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: adminCookies },
      body: JSON.stringify({ radius_meters: 30 }),
    });
  });

  await t.test('10. Teacher ends session -> QR immediately invalidates', async () => {
    const endRes = await fetch(`${API_BASE}/api/attendance/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: teacherCookies,
      },
      body: JSON.stringify({
        action: 'end',
        sessionId: activeSessionId,
      }),
    });

    const endData = await endRes.json();
    assert.equal(endRes.status, 200);
    assert.equal(endData.success, true);

    // Subsequent scan attempt fails
    const postEndScanRes = await fetch(`${API_BASE}/api/attendance/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: studentCookies,
      },
      body: JSON.stringify({
        sessionId: activeSessionId,
        token: activeToken,
        latitude: 28.6139,
        longitude: 77.2090,
      }),
    });

    const postEndData = await postEndScanRes.json();
    assert.equal(postEndScanRes.status, 400);
    assert.equal(postEndData.success, false);
    assert.match(postEndData.message, /ended/i);
  });
});
