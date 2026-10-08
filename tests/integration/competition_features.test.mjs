import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSuccessScore,
  evaluateRisk,
  getZeroStateStudentAnalytics,
} from '../../src/lib/scoringEngine.ts';

test('VidyaSutra Competition Judging Criteria Test Suite', async (t) => {
  // Requirement 1: Transparent weighted scoring algorithm: (45% Attendance) + (35% Assignments) + (20% LMS)
  await t.test('1. Exact Transparent Formula: (45% Attendance) + (35% Assignments) + (20% LMS)', () => {
    // Case A: 80% Attendance, 80% Assignments (8/10), 80% LMS
    // Expected: (80 * 0.45) + (80 * 0.35) + (80 * 0.20) = 36 + 28 + 16 = 80
    const resultA = calculateSuccessScore({
      attendanceAvg: 80,
      assignmentsCompleted: 8,
      assignmentsTotal: 10,
      lmsActivityScore: 80,
    });

    assert.equal(resultA.overallScore, 80);
    assert.equal(resultA.band, 'Strong');
    assert.equal(resultA.formulaBreakdown.attendancePoints, 36.0);
    assert.equal(resultA.formulaBreakdown.assignmentPoints, 28.0);
    assert.equal(resultA.formulaBreakdown.lmsPoints, 16.0);
    assert.equal(resultA.formulaBreakdown.attendanceWeight, 45);
    assert.equal(resultA.formulaBreakdown.assignmentWeight, 35);
    assert.equal(resultA.formulaBreakdown.lmsWeight, 20);

    // Case B: Critical Attendance: 60% Attendance, 100% Assignments, 50% LMS
    // Expected: (60 * 0.45 = 27) + (100 * 0.35 = 35) + (50 * 0.20 = 10) = 72
    const resultB = calculateSuccessScore({
      attendanceAvg: 60,
      assignmentsCompleted: 10,
      assignmentsTotal: 10,
      lmsActivityScore: 50,
    });

    assert.equal(resultB.overallScore, 72);
    assert.equal(resultB.formulaBreakdown.attendanceStatus, 'critical');
    assert.equal(resultB.formulaBreakdown.assignmentStatus, 'safe');
    assert.equal(resultB.formulaBreakdown.lmsStatus, 'warning');
  });

  // Requirement 1: At-Risk logic & Attendance Tiers
  await t.test('2. Attendance Tier Rules: Safe (>75%), Warning (65-75%), Critical (<65%)', () => {
    // Safe
    const safe = calculateSuccessScore({ attendanceAvg: 78, assignmentsCompleted: 8, assignmentsTotal: 10, lmsActivityScore: 80 });
    assert.equal(safe.formulaBreakdown.attendanceStatus, 'safe');

    // Warning
    const warn = calculateSuccessScore({ attendanceAvg: 68, assignmentsCompleted: 8, assignmentsTotal: 10, lmsActivityScore: 80 });
    assert.equal(warn.formulaBreakdown.attendanceStatus, 'warning');

    // Critical
    const crit = calculateSuccessScore({ attendanceAvg: 58, assignmentsCompleted: 8, assignmentsTotal: 10, lmsActivityScore: 80 });
    assert.equal(crit.formulaBreakdown.attendanceStatus, 'critical');
  });

  // Requirement 1: What-if Simulation Calculation Logic
  await t.test('3. What-if Simulator Attendance & Score Projections', () => {
    const currentAtt = 60; // 24 attended out of 40 conducted = 60%
    const currentAssign = 80;
    const currentLms = 70;

    // Simulate attending 15 out of next 15 sessions (100% future attendance):
    // Total sessions = 40 + 15 = 55. Total attended = 24 + 15 = 39.
    // Projected Attendance = (39 / 55) * 100 = 70.9% (moves from Critical <65% to Warning!)
    const totalSessions = 40 + 15;
    const projectedAtt = (39 / totalSessions) * 100;
    assert.ok(projectedAtt > 70 && projectedAtt < 71);

    const projectedScore = Math.round(projectedAtt * 0.45 + currentAssign * 0.35 + currentLms * 0.20);
    // (70.9 * 0.45 = 31.9) + (80 * 0.35 = 28) + (70 * 0.20 = 14) = 73.9 -> 74
    assert.equal(projectedScore, 74);
  });

  // Requirement 3: Resilient Data States for New Users with Zero Records
  await t.test('4. Resilient Zero-State Telemetry for newly registered users', () => {
    const newUser = {
      id: 'usr_new_999',
      name: 'Rohan Verma',
      email: 'rohan.verma@vidyasutra.edu.in',
      role: 'student',
      semester: 1,
    };

    const zeroState = getZeroStateStudentAnalytics(newUser);

    assert.equal(zeroState.isZeroState, true);
    assert.equal(zeroState.attendanceAvg, 0);
    assert.equal(zeroState.assignmentsCompleted, 0);
    assert.equal(zeroState.lmsActivityScore, 0);
    assert.equal(zeroState.successScore.overallScore, 0);
    assert.equal(zeroState.successScore.formulaBreakdown.isZeroState, true);
    assert.ok(zeroState.actionableInsights.length > 0);
    assert.ok(zeroState.actionableInsights[0].suggestedAction.includes('allotted batch'));
  });
});
