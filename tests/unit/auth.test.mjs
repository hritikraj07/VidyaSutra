import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';

const INSTITUTIONAL_DOMAIN = '@vidyasutra.edu.in';

function isInstitutionalEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const clean = email.trim().toLowerCase();
  return clean.endsWith(INSTITUTIONAL_DOMAIN) && clean.length > INSTITUTIONAL_DOMAIN.length;
}

function validatePasswordStrength(password) {
  if (!password || password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long.' };
  }
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigitOrSpecial = /[\d\W]/.test(password);

  if (!hasUpper || !hasLower || !hasDigitOrSpecial) {
    return {
      valid: false,
      error: 'Password must contain uppercase, lowercase, and digit/special char.',
    };
  }
  return { valid: true };
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

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

test('Institutional email validator accepts valid institutional domains', () => {
  assert.equal(isInstitutionalEmail('student@vidyasutra.edu.in'), true);
  assert.equal(isInstitutionalEmail('faculty.cs@vidyasutra.edu.in'), true);
  assert.equal(isInstitutionalEmail('admin@vidyasutra.edu.in'), true);
});

test('Institutional email validator rejects non-institutional domains', () => {
  assert.equal(isInstitutionalEmail('student@gmail.com'), false);
  assert.equal(isInstitutionalEmail('student@yahoo.co.in'), false);
  assert.equal(isInstitutionalEmail('@vidyasutra.edu.in'), false);
  assert.equal(isInstitutionalEmail(''), false);
});

test('Password strength validation enforces 8+ chars and complexity', () => {
  assert.equal(validatePasswordStrength('Student@123').valid, true);
  assert.equal(validatePasswordStrength('short1!').valid, false); // <8 chars
  assert.equal(validatePasswordStrength('alllowercase1!').valid, false); // no upper
  assert.equal(validatePasswordStrength('ALLUPPERCASE1!').valid, false); // no lower
  assert.equal(validatePasswordStrength('NoSpecialOrNumber').valid, false); // no digit or special
});

test('Password hashing and scrypt verification works securely', () => {
  const password = 'TestSecurePassword#2026';
  const hashed = hashPassword(password);
  assert.notEqual(password, hashed);
  assert.equal(verifyPassword(password, hashed), true);
  assert.equal(verifyPassword('WrongPassword#2026', hashed), false);
});
