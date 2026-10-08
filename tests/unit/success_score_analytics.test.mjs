import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSuccessScore,
  evaluateRisk,
  determineSegment,
  generateActionableInsights,
} from '../../src/lib/scoringEngine.ts';

test('Smart Campus Analytics: Success Score, Risk & Segmentation Engine', async (t) => {
  // Test 1: Full-indicator calculation (Aarav Sharma top-tier profile)
  await t.test('1. Deterministic Success Score with full telemetry', () => {
    const scoreResult = calculateSuccessScore({
      cgpa: 8.85,
      internalMarksAvg: 88,
      semesterMarksAvg: 86.5,
      backlogsCount: 0,
      attendanceAvg: 92,
      assignmentsCompleted: 10,
      assignmentsTotal: 10,
      lmsActivityScore: 92,
      engagementScore: 86,
      aptitudeScore: 86,
      codingScore: 90,
      mockInterviewScore: 88,
      placementReadinessPct: 88,
      verifiedSkillsCount: 6,
      semester: 6,
    });

    assert.ok(scoreResult.overallScore >= 80, `Expected score >= 80 for top performer, got ${scoreResult.overallScore}`);
    assert.equal(scoreResult.band, 'Strong');
    assert.ok(scoreResult.factors.length >= 7, 'Must evaluate all 7 dimensions');
    assert.ok(scoreResult.positiveContributors.length > 0, 'Must identify positive contributors');
  });

  // Test 2: Safe handling of missing data (e.g. 1st-year Freshman with no placement tests)
  await t.test('2. Missing data handles safely without unfair penalty via dynamic weight re-normalization', () => {
    const freshmanScore = calculateSuccessScore({
      cgpa: 7.8,
      internalMarksAvg: 75,
      semesterMarksAvg: 76,
      backlogsCount: 0,
      attendanceAvg: 84,
      assignmentsCompleted: 5,
      assignmentsTotal: 6,
      lmsActivityScore: 80,
      eventsAttendedCount: 2,
      // No placement tests taken yet
      aptitudeScore: null,
      codingScore: null,
      mockInterviewScore: null,
      placementReadinessPct: null,
      verifiedSkillsCount: 2,
      semester: 1,
    });

    // Score should be stable in 70s, NOT dragged to 0 due to missing placement
    assert.ok(
      freshmanScore.overallScore >= 65 && freshmanScore.overallScore <= 85,
      `Freshman score should re-normalize safely, got ${freshmanScore.overallScore}`
    );
    assert.notEqual(freshmanScore.band, 'High Risk', 'Missing placement tests should not brand a 1st-year as High Risk');
  });

  // Test 3: Multi-indicator Academic and Placement Risk Evaluation
  await t.test('3. Explainable multi-indicator risk evaluation', () => {
    const atRiskData = {
      cgpa: 5.35,
      academicTrend: 'declining',
      internalMarksAvg: 48,
      backlogsCount: 2,
      attendanceAvg: 62,
      aptitudeScore: 42,
      codingScore: 38,
      mockInterviewScore: 40,
      placementReadinessPct: 40,
      verifiedSkillsCount: 1,
      semester: 4,
    };

    const scoreResult = calculateSuccessScore(atRiskData);
    const risk = evaluateRisk(atRiskData, scoreResult);

    assert.equal(risk.academicRisk, 'High', 'Academic risk must be High for sub-60 attendance & 2 backlogs');
    assert.equal(risk.placementRisk, 'High', 'Placement risk must be High for sub-50 coding & aptitude');
    assert.equal(risk.overallRisk, 'High Risk');
    assert.ok(risk.academicRiskReasons.length >= 2, 'Must include visible explainable reasons');
    assert.ok(risk.academicRiskReasons.some((r) => r.includes('backlog')), 'Must highlight backlogs');
    assert.ok(risk.academicRiskReasons.some((r) => r.includes('Attendance')), 'Must highlight attendance');
  });

  // Test 4: Dynamic Student Segmentation
  await t.test('4. Dynamic rule-based segmentation', () => {
    // 4a. High Academic / Low Placement
    const highAcadLowPlaceData = {
      cgpa: 8.42,
      attendanceAvg: 86,
      engagementScore: 54,
      placementReadinessPct: 51.5,
    };
    const seg1 = determineSegment(
      highAcadLowPlaceData,
      82, // academicScore
      74, // successScore
      { overallRisk: 'Stable', academicRisk: 'Low', placementRisk: 'Moderate' }
    );
    assert.equal(seg1, 'High Academic / Low Placement Readiness');

    // 4b. Low Academic / Low Attendance
    const lowAcadLowAttData = {
      cgpa: 5.2,
      attendanceAvg: 62,
      engagementScore: 30,
      placementReadinessPct: 40,
    };
    const seg2 = determineSegment(
      lowAcadLowAttData,
      50,
      44,
      { overallRisk: 'High Risk', academicRisk: 'High', placementRisk: 'High' }
    );
    assert.equal(seg2, 'Low Academic / Low Attendance');

    // 4c. Strong Attendance / Weak Academic Performance
    const strongAttWeakAcadData = {
      cgpa: 5.85,
      attendanceAvg: 92,
      engagementScore: 48,
      placementReadinessPct: 48,
    };
    const seg3 = determineSegment(
      strongAttWeakAcadData,
      56,
      58,
      { overallRisk: 'Needs Attention', academicRisk: 'Moderate', placementRisk: 'Moderate' }
    );
    assert.equal(seg3, 'Strong Attendance / Weak Academic Performance');
  });

  // Test 5: Actionable Insights Generation
  await t.test('5. Actionable Insights conversion', () => {
    const raw = {
      attendanceAvg: 64,
      academicTrend: 'declining',
      cgpa: 5.4,
      placementReadinessPct: 42,
      codingScore: 39,
      backlogsCount: 1,
      lmsActivityScore: 45,
      assignmentsCompleted: 3,
      assignmentsTotal: 10,
    };
    const score = calculateSuccessScore(raw);
    const risk = evaluateRisk({ ...raw, internalMarksAvg: 50, aptitudeScore: 45, mockInterviewScore: 42, verifiedSkillsCount: 1, semester: 4 }, score);
    const insights = generateActionableInsights(raw, score, risk, 'Low Academic / Low Attendance');

    assert.ok(insights.length > 0, 'Must generate actionable insights');
    assert.ok(insights.some((i) => i.title.includes('Intervention')), 'Must recommend academic intervention');
    assert.ok(insights.some((i) => i.suggestedAction.length > 10), 'Must include concrete suggested action');
  });
});
