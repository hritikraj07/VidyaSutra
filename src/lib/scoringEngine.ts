export interface ScoreFactor {
  category: string;
  score: number; // 0 - 100
  weight: number; // % weight
  weightedScore: number;
  status: 'safe' | 'warning' | 'critical';
  details: string;
  isAvailable: boolean;
}

export type ScoreBand = 'Strong' | 'Stable' | 'Needs Attention' | 'High Risk';

export interface FormulaBreakdown {
  attendanceRate: number;
  attendanceWeight: number; // 45%
  attendancePoints: number;
  attendanceStatus: 'safe' | 'warning' | 'critical';
  assignmentRate: number;
  assignmentWeight: number; // 35%
  assignmentPoints: number;
  assignmentStatus: 'safe' | 'warning' | 'critical';
  lmsRate: number;
  lmsWeight: number; // 20%
  lmsPoints: number;
  lmsStatus: 'safe' | 'warning' | 'critical';
  formulaString: string;
  isZeroState: boolean;
}

export interface SuccessScoreResult {
  overallScore: number; // 0 - 100
  band: ScoreBand;
  factors: ScoreFactor[];
  positiveContributors: string[];
  attentionAreas: string[];
  topInsight: string;
  formulaBreakdown: FormulaBreakdown;
}

export interface RiskAnalysis {
  academicRisk: 'High' | 'Moderate' | 'Low';
  academicRiskReasons: string[];
  placementRisk: 'High' | 'Moderate' | 'Low';
  placementRiskReasons: string[];
  overallRisk: 'High Risk' | 'Needs Attention' | 'Stable' | 'Strong';
  primaryRiskReason: string;
  explainableReasons: string[];
}

export type StudentSegmentType =
  | 'High Academic / Low Placement Readiness'
  | 'High Academic / High Placement Readiness'
  | 'Low Academic / Low Attendance'
  | 'Strong Attendance / Weak Academic Performance'
  | 'Strong Academic / Low Engagement'
  | 'At-Risk Students'
  | 'Overall Strong Performers'
  | 'Regular Academic Progress';

export interface ActionableInsightItem {
  id: string;
  type: 'intervention' | 'placement' | 'decline' | 'excellence' | 'attendance';
  severity: 'urgent' | 'warning' | 'info' | 'positive';
  title: string;
  detectedCondition: string;
  whyItMatters: string;
  suggestedAction: string;
  tags: string[];
}

/**
 * Deterministic, explainable Student Success Score calculation.
 * Formula aligned with competition criteria:
 * (45% Attendance) + (35% Assignment Submissions) + (20% LMS/Quiz Engagement)
 */
export function calculateSuccessScore(raw: {
  cgpa?: number | null;
  internalMarksAvg?: number | null;
  semesterMarksAvg?: number | null;
  backlogsCount?: number | null;
  attendanceAvg?: number | null;
  assignmentsCompleted?: number | null;
  assignmentsTotal?: number | null;
  lmsActivityScore?: number | null;
  engagementScore?: number | null;
  eventsAttendedCount?: number | null;
  hackathonsCount?: number | null;
  aptitudeScore?: number | null;
  codingScore?: number | null;
  mockInterviewScore?: number | null;
  placementReadinessPct?: number | null;
  verifiedSkillsCount?: number | null;
  semester?: number | null;
  isZeroState?: boolean;
}): SuccessScoreResult {
  const isFreshman = (raw.semester || 1) <= 2;

  // Zero-state detection for brand new accounts with zero logged telemetry
  const isZeroState = Boolean(
    raw.isZeroState ||
    (raw.attendanceAvg === 0 &&
      (raw.assignmentsCompleted === 0 || raw.assignmentsCompleted === undefined) &&
      (raw.lmsActivityScore === 0 || raw.lmsActivityScore === undefined) &&
      (raw.cgpa === 0 || raw.cgpa === undefined))
  );

  // 1. Attendance Pillar (Weight: 45%) [Safe >75%, Warning 65-75%, Critical <65%]
  const rawAtt = raw.attendanceAvg !== undefined && raw.attendanceAvg !== null ? raw.attendanceAvg : null;
  const attendanceRate = rawAtt !== null ? Math.min(Math.max(Math.round(rawAtt), 0), 100) : (isZeroState ? 0 : 75);
  const attendanceStatus: 'safe' | 'warning' | 'critical' =
    attendanceRate >= 75 ? 'safe' : attendanceRate >= 65 ? 'warning' : 'critical';

  // 2. Assignment Submissions Pillar (Weight: 35%)
  let assignmentRate: number;
  if (raw.assignmentsTotal && raw.assignmentsTotal > 0) {
    assignmentRate = Math.min(Math.max(Math.round(((raw.assignmentsCompleted || 0) / raw.assignmentsTotal) * 100), 0), 100);
  } else if (raw.assignmentsCompleted !== undefined && raw.assignmentsCompleted !== null) {
    assignmentRate = Math.min(Math.max(Math.round(raw.assignmentsCompleted * 10), 0), 100);
  } else if (raw.internalMarksAvg !== undefined && raw.internalMarksAvg !== null) {
    assignmentRate = Math.min(Math.max(Math.round(raw.internalMarksAvg), 0), 100);
  } else {
    assignmentRate = isZeroState ? 0 : 70;
  }
  const assignmentStatus: 'safe' | 'warning' | 'critical' =
    assignmentRate >= 80 ? 'safe' : assignmentRate >= 60 ? 'warning' : 'critical';

  // 3. LMS / Quiz Engagement Pillar (Weight: 20%)
  let lmsRate: number;
  if (raw.lmsActivityScore !== undefined && raw.lmsActivityScore !== null) {
    lmsRate = Math.min(Math.max(Math.round(raw.lmsActivityScore), 0), 100);
  } else if (raw.engagementScore !== undefined && raw.engagementScore !== null) {
    lmsRate = Math.min(Math.max(Math.round(raw.engagementScore), 0), 100);
  } else if (raw.internalMarksAvg !== undefined && raw.internalMarksAvg !== null) {
    lmsRate = Math.min(Math.max(Math.round(raw.internalMarksAvg), 0), 100);
  } else {
    lmsRate = isZeroState ? 0 : 70;
  }
  const lmsStatus: 'safe' | 'warning' | 'critical' =
    lmsRate >= 75 ? 'safe' : lmsRate >= 50 ? 'warning' : 'critical';

  // Calculate composite weighted formula points
  const attendancePoints = Math.round(attendanceRate * 0.45 * 10) / 10;
  const assignmentPoints = Math.round(assignmentRate * 0.35 * 10) / 10;
  const lmsPoints = Math.round(lmsRate * 0.20 * 10) / 10;

  let compositeScore = isZeroState ? 0 : Math.round(attendancePoints + assignmentPoints + lmsPoints);
  compositeScore = Math.min(Math.max(compositeScore, 0), 100);

  // Standing Bands
  let band: ScoreBand = 'Stable';
  if (isZeroState) {
    band = 'Needs Attention';
  } else if (compositeScore >= 80) {
    band = 'Strong';
  } else if (compositeScore >= 65) {
    band = 'Stable';
  } else if (compositeScore >= 50) {
    band = 'Needs Attention';
  } else {
    band = 'High Risk';
  }

  // Formula Breakdown Telemetry
  const formulaBreakdown: FormulaBreakdown = {
    attendanceRate,
    attendanceWeight: 45,
    attendancePoints,
    attendanceStatus,
    assignmentRate,
    assignmentWeight: 35,
    assignmentPoints,
    assignmentStatus,
    lmsRate,
    lmsWeight: 20,
    lmsPoints,
    lmsStatus,
    formulaString: '(45% Attendance) + (35% Assignment Submissions) + (20% LMS/Quiz Engagement)',
    isZeroState,
  };

  // Additional university contextual indicators (for 7-pillar telemetry)
  let academicScore = 70;
  if (raw.cgpa !== undefined && raw.cgpa !== null) {
    const cgpaNorm = Math.min(Math.max(raw.cgpa * 10, 0), 100);
    const internalNorm = raw.internalMarksAvg ?? cgpaNorm;
    const semNorm = raw.semesterMarksAvg ?? cgpaNorm;
    const backlogDeduction = (raw.backlogsCount || 0) * 12;
    academicScore = Math.max(Math.round((cgpaNorm * 0.4 + internalNorm * 0.3 + semNorm * 0.3) - backlogDeduction), 0);
  }

  const assessmentScore = raw.internalMarksAvg !== undefined && raw.internalMarksAvg !== null
    ? Math.min(Math.max(Math.round(raw.internalMarksAvg), 0), 100)
    : 70;

  let placementScore = 70;
  if (raw.placementReadinessPct !== undefined && raw.placementReadinessPct !== null) {
    placementScore = Math.min(Math.max(Math.round(raw.placementReadinessPct), 0), 100);
  } else if (raw.aptitudeScore !== undefined || raw.codingScore !== undefined) {
    const apt = raw.aptitudeScore || 60;
    const cod = raw.codingScore || 60;
    const mock = raw.mockInterviewScore || 60;
    placementScore = Math.round(apt * 0.3 + cod * 0.4 + mock * 0.3);
  }

  const skillsScore = raw.verifiedSkillsCount !== undefined && raw.verifiedSkillsCount !== null
    ? Math.min(Math.round((raw.verifiedSkillsCount || 0) * 16.6), 100)
    : 60;

  // 7 Factor Definitions with the 3 Core Weighted Pillars placed first
  const factors: ScoreFactor[] = [
    {
      category: 'Attendance Consistency',
      score: attendanceRate,
      weight: 45,
      weightedScore: Math.round(attendancePoints),
      status: attendanceStatus,
      details: isZeroState ? 'No attendance records logged yet' : `${attendanceRate}% class attendance (${attendanceStatus.toUpperCase()})`,
      isAvailable: rawAtt !== null,
    },
    {
      category: 'Assignment Submissions',
      score: assignmentRate,
      weight: 35,
      weightedScore: Math.round(assignmentPoints),
      status: assignmentStatus,
      details: isZeroState ? 'Awaiting initial coursework submissions' : `Submissions turnaround: ${assignmentRate}%`,
      isAvailable: raw.assignmentsTotal !== undefined || raw.assignmentsCompleted !== undefined,
    },
    {
      category: 'LMS & Quiz Engagement',
      score: lmsRate,
      weight: 20,
      weightedScore: Math.round(lmsPoints),
      status: lmsStatus,
      details: isZeroState ? 'Awaiting portal and quiz activity' : `Learning activity & quizzes: ${lmsRate}%`,
      isAvailable: raw.lmsActivityScore !== undefined || raw.engagementScore !== undefined,
    },
    {
      category: 'Academic Performance',
      score: academicScore,
      weight: 0,
      weightedScore: 0,
      status: academicScore >= 70 ? 'safe' : academicScore >= 50 ? 'warning' : 'critical',
      details: `CGPA: ${raw.cgpa ?? '—'}, ${raw.backlogsCount || 0} backlogs`,
      isAvailable: raw.cgpa !== undefined && raw.cgpa !== null,
    },
    {
      category: 'Assessment Performance',
      score: assessmentScore,
      weight: 0,
      weightedScore: 0,
      status: assessmentScore >= 70 ? 'safe' : assessmentScore >= 50 ? 'warning' : 'critical',
      details: `Internal evaluation avg: ${assessmentScore}%`,
      isAvailable: raw.internalMarksAvg !== undefined && raw.internalMarksAvg !== null,
    },
    {
      category: 'Placement Readiness',
      score: placementScore,
      weight: 0,
      weightedScore: 0,
      status: placementScore >= 70 ? 'safe' : placementScore >= 50 ? 'warning' : 'critical',
      details: isFreshman ? 'Pre-final year preparation track' : `Readiness score: ${placementScore}%`,
      isAvailable: raw.placementReadinessPct !== undefined && raw.placementReadinessPct !== null,
    },
    {
      category: 'Skills & Certifications',
      score: skillsScore,
      weight: 0,
      weightedScore: 0,
      status: skillsScore >= 60 ? 'safe' : 'warning',
      details: `${raw.verifiedSkillsCount || 0} verified competencies logged`,
      isAvailable: raw.verifiedSkillsCount !== undefined && raw.verifiedSkillsCount !== null,
    },
  ];

  // Positive Contributors & Attention Areas
  const positiveContributors: string[] = [];
  const attentionAreas: string[] = [];

  if (isZeroState) {
    attentionAreas.push('No academic or attendance records found yet for this account. Please verify your allotted batch.');
  } else {
    if (attendanceRate >= 75) positiveContributors.push(`Safe attendance consistency (${attendanceRate}%) — eligible for exam hall-ticket.`);
    else if (attendanceRate >= 65) attentionAreas.push(`Attendance in Warning zone (${attendanceRate}%). Target safe >75% threshold.`);
    else attentionAreas.push(`CRITICAL ATTENDANCE DEFICIT (${attendanceRate}%). Below 65% hall-ticket barrier.`);

    if (assignmentRate >= 80) positiveContributors.push(`High assignment submission turnaround (${assignmentRate}%).`);
    else attentionAreas.push(`Assignment submission rate is ${assignmentRate}%. Pending assignments require submission.`);

    if (lmsRate >= 75) positiveContributors.push(`Strong digital learning and quiz engagement (${lmsRate}%).`);
    else attentionAreas.push(`LMS and quiz engagement is lagging (${lmsRate}%). Complete weekly self-assessment quizzes.`);

    if ((raw.backlogsCount || 0) > 0) attentionAreas.push(`${raw.backlogsCount} active backlog course(s) require remediation.`);
  }

  const topInsight = isZeroState
    ? 'No academic records or attendance found yet for this account. Please check your allotted batch (e.g. CSE-A) with your department coordinator or attend your first class to initialize telemetry.'
    : attentionAreas.length > 0
    ? `Primary focus: ${attentionAreas[0]}`
    : 'Performing well across all core academic metrics. Keep up this momentum!';

  return {
    overallScore: compositeScore,
    band,
    factors,
    positiveContributors,
    attentionAreas,
    topInsight,
    formulaBreakdown,
  };
}

/**
 * Transparent, explainable Multi-Indicator Risk Analysis.
 */
export function evaluateRisk(raw: {
  cgpa: number;
  academicTrend: string;
  internalMarksAvg: number;
  backlogsCount: number;
  attendanceAvg: number;
  aptitudeScore: number;
  codingScore: number;
  mockInterviewScore: number;
  placementReadinessPct: number;
  verifiedSkillsCount: number;
  semester: number;
}, successScore: SuccessScoreResult): RiskAnalysis {
  const isFreshman = (raw.semester || 1) <= 2;
  const academicReasons: string[] = [];
  const placementReasons: string[] = [];

  // 1. Academic Risk Indicators
  if (raw.cgpa < 6.0) academicReasons.push(`CGPA is ${raw.cgpa.toFixed(2)} (below 6.0 academic benchmark)`);
  if (raw.attendanceAvg < 75) academicReasons.push(`Attendance is ${raw.attendanceAvg.toFixed(1)}% (below institutional 75% requirement)`);
  if (raw.backlogsCount > 0) academicReasons.push(`${raw.backlogsCount} active backlog course(s)`);
  if (raw.academicTrend === 'declining') academicReasons.push('Recent internal exam marks show a declining trend');
  if (raw.internalMarksAvg < 50) academicReasons.push(`Internal assessments average is ${raw.internalMarksAvg.toFixed(1)}% (passing cutoff: 50%)`);

  let academicRisk: 'High' | 'Moderate' | 'Low' = 'Low';
  if (academicReasons.length >= 2 || raw.backlogsCount >= 2 || (raw.attendanceAvg < 65 && raw.cgpa < 6.0)) {
    academicRisk = 'High';
  } else if (academicReasons.length >= 1) {
    academicRisk = 'Moderate';
  }

  // 2. Placement Risk Indicators
  if (!isFreshman) {
    if (raw.codingScore < 50) placementReasons.push(`Coding assessment score is ${raw.codingScore.toFixed(0)}/100 (below technical screening threshold)`);
    if (raw.aptitudeScore < 55) placementReasons.push(`Aptitude test score is ${raw.aptitudeScore.toFixed(0)}/100 (below preliminary screening cutoff)`);
    if (raw.mockInterviewScore < 55) placementReasons.push(`Mock interview evaluation is ${raw.mockInterviewScore.toFixed(0)}/100`);
    if (raw.placementReadinessPct < 60) placementReasons.push(`Composite placement readiness is ${raw.placementReadinessPct.toFixed(1)}%`);
    if (raw.verifiedSkillsCount < 2) placementReasons.push(`Only ${raw.verifiedSkillsCount} verified technical competencies logged`);
  }

  let placementRisk: 'High' | 'Moderate' | 'Low' = 'Low';
  if (!isFreshman) {
    if (placementReasons.length >= 2 || raw.placementReadinessPct < 45) {
      placementRisk = 'High';
    } else if (placementReasons.length >= 1) {
      placementRisk = 'Moderate';
    }
  }

  // 3. Overall Risk
  let overallRisk: 'High Risk' | 'Needs Attention' | 'Stable' | 'Strong' = 'Stable';
  if (academicRisk === 'High' || successScore.overallScore < 40) {
    overallRisk = 'High Risk';
  } else if (academicRisk === 'Moderate' || placementRisk === 'High' || successScore.overallScore < 60) {
    overallRisk = 'Needs Attention';
  } else if (successScore.overallScore >= 80 && academicRisk === 'Low' && placementRisk === 'Low') {
    overallRisk = 'Strong';
  }

  const explainableReasons = [...academicReasons, ...placementReasons];
  const primaryRiskReason = explainableReasons.length > 0
    ? explainableReasons[0]
    : 'All primary academic and placement indicators within safe institutional thresholds';

  return {
    academicRisk,
    academicRiskReasons: academicReasons,
    placementRisk,
    placementRiskReasons: placementReasons,
    overallRisk,
    primaryRiskReason,
    explainableReasons,
  };
}

/**
 * Deterministic Student Segmentation based on actual indicators.
 */
export function determineSegment(
  raw: {
    cgpa: number;
    attendanceAvg: number;
    engagementScore: number;
    placementReadinessPct: number;
  },
  academicScore: number,
  successScore: number,
  risk: RiskAnalysis
): StudentSegmentType {
  const isAcademicHigh = academicScore >= 75 || raw.cgpa >= 7.8;
  const isAcademicLow = academicScore < 60 || raw.cgpa < 6.0;
  const isPlacementHigh = raw.placementReadinessPct >= 75;
  const isPlacementLow = raw.placementReadinessPct < 60;
  const isAttendanceHigh = raw.attendanceAvg >= 80;
  const isAttendanceLow = raw.attendanceAvg < 75;
  const isEngagementLow = raw.engagementScore < 50;

  if (isAcademicHigh && isPlacementLow) {
    return 'High Academic / Low Placement Readiness';
  }

  if (isAcademicHigh && isPlacementHigh) {
    return 'High Academic / High Placement Readiness';
  }

  if (isAcademicLow && isAttendanceLow) {
    return 'Low Academic / Low Attendance';
  }

  if (isAttendanceHigh && isAcademicLow) {
    return 'Strong Attendance / Weak Academic Performance';
  }

  if (isAcademicHigh && isEngagementLow) {
    return 'Strong Academic / Low Engagement';
  }

  if (risk.overallRisk === 'High Risk' || risk.academicRisk === 'High') {
    return 'At-Risk Students';
  }

  if (successScore >= 80) {
    return 'Overall Strong Performers';
  }

  return 'Regular Academic Progress';
}

/**
 * Generate actionable intelligence cards with what was detected, why it matters, and suggested actions.
 */
export function generateActionableInsights(
  raw: {
    attendanceAvg: number;
    academicTrend: string;
    cgpa: number;
    placementReadinessPct: number;
    codingScore: number;
    backlogsCount: number;
    lmsActivityScore: number;
    assignmentsCompleted: number;
    assignmentsTotal: number;
  },
  successScore: SuccessScoreResult,
  risk: RiskAnalysis,
  segment: StudentSegmentType
): ActionableInsightItem[] {
  const insights: ActionableInsightItem[] = [];

  if (raw.attendanceAvg < 75 && (raw.academicTrend === 'declining' || raw.cgpa < 6.0)) {
    insights.push({
      id: 'ins_att_acad_decline',
      type: 'intervention',
      severity: 'urgent',
      title: 'Attendance + Academic Intervention Recommended',
      detectedCondition: `Attendance is ${raw.attendanceAvg.toFixed(1)}% with a declining internal performance trend`,
      whyItMatters: 'Sub-75% attendance strongly correlates with internal exam failure and eventual end-semester course backlogs.',
      suggestedAction: 'Schedule a joint academic counseling session with the faculty mentor and issue an official attendance notice.',
      tags: ['Academic Risk', 'Immediate Counseling'],
    });
  }

  if (segment === 'High Academic / Low Placement Readiness' || (raw.cgpa >= 7.5 && raw.placementReadinessPct < 60)) {
    insights.push({
      id: 'ins_placement_prep',
      type: 'placement',
      severity: 'warning',
      title: 'Targeted Placement & Coding Preparation Recommended',
      detectedCondition: `High academic GPA (${raw.cgpa.toFixed(2)}) alongside lower coding/interview readiness (${raw.placementReadinessPct.toFixed(0)}%)`,
      whyItMatters: 'Student has solid theoretical mastery but risks elimination during initial automated coding screening and technical interviews.',
      suggestedAction: 'Enroll student in the Data Structures & Algorithms coding bootcamp and assign mandatory mock technical interviews.',
      tags: ['Placement Cell', 'Coding Prep'],
    });
  }

  if (segment === 'Strong Attendance / Weak Academic Performance') {
    insights.push({
      id: 'ins_remedial_tutoring',
      type: 'intervention',
      severity: 'warning',
      title: 'Foundational Remedial Support Recommended',
      detectedCondition: `High attendance (${raw.attendanceAvg.toFixed(0)}%) but low exam score (${raw.cgpa.toFixed(2)} CGPA)`,
      whyItMatters: 'The student exhibits strong classroom discipline and motivation, indicating conceptual blockers rather than disengagement.',
      suggestedAction: 'Assign a departmental peer tutor and provide targeted remedial study modules for core theory subjects.',
      tags: ['Peer Tutoring', 'Remedial Classes'],
    });
  }

  if (raw.backlogsCount > 0) {
    insights.push({
      id: 'ins_backlogs',
      type: 'intervention',
      severity: 'urgent',
      title: 'Urgent Backlog Clearance Protocol',
      detectedCondition: `${raw.backlogsCount} active backlog course(s) on institutional record`,
      whyItMatters: 'Unresolved backlogs jeopardize degree progression and disqualify candidates from campus recruitment drives.',
      suggestedAction: 'Review supplementary examination schedule and assign faculty doubt-clearing sessions.',
      tags: ['Exam Cell', 'Backlog Alert'],
    });
  }

  if (successScore.overallScore >= 80 && risk.overallRisk === 'Strong') {
    insights.push({
      id: 'ins_excellence',
      type: 'excellence',
      severity: 'positive',
      title: 'Consistent High Achiever — Leadership Track',
      detectedCondition: `Composite Success Score of ${successScore.overallScore}/100 with zero risk flags`,
      whyItMatters: 'Exceptional performers benefit from specialized mentorship to target premier tier-1 corporate placements and research opportunities.',
      suggestedAction: 'Nominate for departmental honors, research assistantships, and premier campus ambassador roles.',
      tags: ['Honors Track', 'Leadership'],
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: 'ins_regular_stable',
      type: 'excellence',
      severity: 'info',
      title: 'Steady Academic Trajectory',
      detectedCondition: `Balanced performance across all monitored indicators (${successScore.overallScore}/100)`,
      whyItMatters: 'Consistent engagement and attendance maintain healthy semester progression.',
      suggestedAction: 'Continue current study schedule and explore technical certifications in the Skills Passport.',
      tags: ['On Track'],
    });
  }

  return insights;
}

/**
 * Builds explicit zero-state telemetry for a brand new student user with zero records.
 * Prompts them explicitly to verify their allotted batch instead of showing mock data.
 */
export function buildZeroStateStudentAnalytics(user: any) {
  const rawData = {
    cgpa: 0,
    internalMarksAvg: 0,
    semesterMarksAvg: 0,
    backlogsCount: 0,
    academicTrend: 'stable' as const,
    attendanceAvg: 0,
    assignmentsCompleted: 0,
    assignmentsTotal: 0,
    lmsActivityScore: 0,
    eventsAttendedCount: 0,
    clubsCount: 0,
    hackathonsCount: 0,
    certificationsCount: 0,
    engagementScore: 0,
    aptitudeScore: 0,
    codingScore: 0,
    mockInterviewScore: 0,
    placementReadinessPct: 0,
    placementStatus: 'not_started',
    verifiedSkillsCount: 0,
    semester: user.semester || 1,
    isZeroState: true,
  };

  const successScore = calculateSuccessScore(rawData);
  const risk = evaluateRisk(rawData as any, successScore);
  const segment = determineSegment(rawData as any, 0, 0, risk);
  const actionableInsights: ActionableInsightItem[] = [
    {
      id: 'zero_state_onboarding',
      type: 'intervention',
      severity: 'warning',
      title: 'Batch Allotment & Onboarding Verification',
      detectedCondition: 'Zero telemetry recorded. No classroom attendance or LMS submissions found.',
      whyItMatters: 'Academic telemetry activates once your batch (e.g. CSE-A) is confirmed and you record your first class attendance.',
      suggestedAction: 'Please check your allotted batch and section with your department coordinator, or attend your first lecture.',
      tags: ['Onboarding', 'Allotted Batch', 'Zero State'],
    },
  ];

  return {
    id: user.student_id || user.id || 'new_student',
    studentProfileId: user.student_id || user.id || 'new_student',
    userId: user.id || '',
    name: user.name || 'New Student',
    email: user.email || '',
    rollNo: user.roll_no || user.rollNo || 'Pending Allotment',
    course: user.course || user.department || 'Awaiting Batch Allotment',
    department: user.department || 'Academic Department',
    semester: user.semester || 1,
    section: user.section || 'Unassigned',
    admissionYear: user.admission_year || new Date().getFullYear(),
    isZeroState: true,
    cgpa: 0,
    internalMarksAvg: 0,
    semesterMarksAvg: 0,
    backlogsCount: 0,
    academicTrend: 'stable' as const,
    attendanceAvg: 0,
    assignmentsCompleted: 0,
    assignmentsTotal: 0,
    lmsActivityScore: 0,
    eventsAttendedCount: 0,
    clubsCount: 0,
    hackathonsCount: 0,
    certificationsCount: 0,
    engagementScore: 0,
    aptitudeScore: 0,
    codingScore: 0,
    mockInterviewScore: 0,
    placementReadinessPct: 0,
    placementStatus: 'not_started',
    verifiedSkillsCount: 0,
    facultyFeedbackRating: 0,
    facultyFeedbackNotes: null as string | null,
    successScore,
    risk,
    segment,
    actionableInsights,
  };
}

export const getZeroStateStudentAnalytics = buildZeroStateStudentAnalytics;

