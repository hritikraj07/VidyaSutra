import test from 'node:test';
import assert from 'node:assert/strict';
import { getTimeGreeting, getFormattedCurrentDate } from '../../src/utils/greeting.ts';

test('Time-based Greeting and Localized Date Unit Tests', async (t) => {
  await t.test('1. Morning hours (04:00 - 11:59) return "Good morning"', () => {
    // 04:00 AM
    const earlyMorning = new Date('2026-10-08T04:00:00');
    assert.equal(getTimeGreeting(earlyMorning), 'Good morning');

    // 07:15 AM (the user's reported time)
    const currentMorning = new Date('2026-10-08T07:15:00');
    assert.equal(getTimeGreeting(currentMorning), 'Good morning');

    // 11:59 AM
    const lateMorning = new Date('2026-10-08T11:59:59');
    assert.equal(getTimeGreeting(lateMorning), 'Good morning');
  });

  await t.test('2. Afternoon hours (12:00 - 16:59) return "Good afternoon"', () => {
    // 12:00 PM
    const noon = new Date('2026-10-08T12:00:00');
    assert.equal(getTimeGreeting(noon), 'Good afternoon');

    // 02:30 PM
    const afternoon = new Date('2026-10-08T14:30:00');
    assert.equal(getTimeGreeting(afternoon), 'Good afternoon');

    // 04:59 PM
    const lateAfternoon = new Date('2026-10-08T16:59:59');
    assert.equal(getTimeGreeting(lateAfternoon), 'Good afternoon');
  });

  await t.test('3. Evening / Night hours (17:00 - 03:59) return "Good evening"', () => {
    // 05:00 PM
    const evening = new Date('2026-10-08T17:00:00');
    assert.equal(getTimeGreeting(evening), 'Good evening');

    // 09:00 PM
    const lateEvening = new Date('2026-10-08T21:00:00');
    assert.equal(getTimeGreeting(lateEvening), 'Good evening');

    // 11:45 PM
    const night = new Date('2026-10-08T23:45:00');
    assert.equal(getTimeGreeting(night), 'Good evening');

    // 02:00 AM
    const lateNight = new Date('2026-10-08T02:00:00');
    assert.equal(getTimeGreeting(lateNight), 'Good evening');
  });

  await t.test('4. Timezone-aligned greetings with explicit target timezones', () => {
    // UTC 02:00:00 corresponds to 07:30:00 in Asia/Kolkata (+05:30) -> Morning in India
    const utcDate = new Date('2026-10-08T02:00:00Z');

    const greetingIST = getTimeGreeting(utcDate, 'Asia/Kolkata');
    assert.equal(greetingIST, 'Good morning');

    // UTC 02:00:00 is 10:00:00 in Asia/Tokyo (+09:00) -> Morning
    const greetingTokyo = getTimeGreeting(utcDate, 'Asia/Tokyo');
    assert.equal(greetingTokyo, 'Good morning');

    // UTC 02:00:00 is 22:00:00 prev day in America/New_York (-04:00) -> Evening
    const greetingNY = getTimeGreeting(utcDate, 'America/New_York');
    assert.equal(greetingNY, 'Good evening');

    // UTC 08:00:00 is 13:30:00 in Asia/Kolkata -> Afternoon in India
    const afternoonUTC = new Date('2026-10-08T08:00:00Z');
    assert.equal(getTimeGreeting(afternoonUTC, 'Asia/Kolkata'), 'Good afternoon');

    // UTC 13:00:00 is 18:30:00 in Asia/Kolkata -> Evening in India
    const eveningUTC = new Date('2026-10-08T13:00:00Z');
    assert.equal(getTimeGreeting(eveningUTC, 'Asia/Kolkata'), 'Good evening');
  });

  await t.test('5. Date formatting returns localized day and month', () => {
    const testDate = new Date('2026-10-08T07:15:00');
    const formatted = getFormattedCurrentDate(testDate);
    assert.ok(formatted.includes('Oct 8') || formatted.includes('October 8'), `Formatted date should contain Oct 8: ${formatted}`);
  });
});
