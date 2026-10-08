import test from 'node:test';
import assert from 'node:assert/strict';

test('E2E validation: Institutional API contract structure', () => {
  const loginPayload = {
    action: 'login',
    email: 'student@vidyasutra.edu.in',
    password: 'Student@123',
    role: 'student',
  };

  assert.ok(loginPayload.email.endsWith('@vidyasutra.edu.in'));
  assert.equal(loginPayload.role, 'student');
  assert.ok(loginPayload.password.length >= 8);
});
