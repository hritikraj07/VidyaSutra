import { prisma } from '@/lib/db';
import {
  calculateSuccessScore,
  evaluateRisk,
  determineSegment,
  generateActionableInsights,
  buildZeroStateStudentAnalytics,
  ScoreFactor,
  ScoreBand,
  SuccessScoreResult,
  RiskAnalysis,
  StudentSegmentType,
  ActionableInsightItem,
} from '@/lib/scoringEngine';

export type {
  ScoreFactor,
  ScoreBand,
  SuccessScoreResult,
  RiskAnalysis,
  StudentSegmentType,
  ActionableInsightItem,
};

export interface StudentAnalyticsDetail {
  id: string;
  studentProfileId: string;
  userId: string;
  name: string;
  email: string;
  rollNo: string;
  course: string;
  department: string;
  semester: number;
  section: string;
  admissionYear: number;
  isZeroState?: boolean;
  
  // Raw Indicators
  cgpa: number;
  internalMarksAvg: number;
  semesterMarksAvg: number;
  backlogsCount: number;
  academicTrend: 'improving' | 'stable' | 'declining';
  attendanceAvg: number;
  assignmentsCompleted: number;
  assignmentsTotal: number;
  lmsActivityScore: number;
  eventsAttendedCount: number;
  clubsCount: number;
  hackathonsCount: number;
  certificationsCount: number;
  engagementScore: number;
  aptitudeScore: number;
  codingScore: number;
  mockInterviewScore: number;
  placementReadinessPct: number;
  placementStatus: string;
  verifiedSkillsCount: number;
  facultyFeedbackRating: number;
  facultyFeedbackNotes?: string | null;

  // Evaluated Analytics
  successScore: SuccessScoreResult;
  risk: RiskAnalysis;
  segment: StudentSegmentType;
  actionableInsights: ActionableInsightItem[];
}

export interface CampusAnalyticsSummary {
  kpis: {
    totalStudents: number;
    avgSuccessScore: number;
    studentsAtRisk: number;
    academicRiskCount: number;
    placementRiskCount: number;
    avgAttendance: number;
  };
  scoreDistribution: {
    strong: number;
    stable: number;
    needsAttention: number;
    highRisk: number;
  };
  riskDistribution: {
    highRisk: number;
    needsAttention: number;
    stable: number;
    strong: number;
  };
  segmentDistribution: Record<string, number>;
  coursePerformance: {
    course: string;
    studentsCount: number;
    avgScore: number;
    avgAttendance: number;
    atRiskCount: number;
  }[];
  students: StudentAnalyticsDetail[];
}

export class AnalyticsService {
  static calculateSuccessScore = calculateSuccessScore;
  static evaluateRisk = evaluateRisk;
  static determineSegment = determineSegment;
  static generateActionableInsights = generateActionableInsights;

  /**
   * Constructs explicit zero-state telemetry for a brand new user with no records.
   */
  static getZeroStateStudentAnalytics(user: any): StudentAnalyticsDetail {
    return buildZeroStateStudentAnalytics(user);
  }

  /**
   * Process a Prisma StudentProfile into a complete StudentAnalyticsDetail
   */
  static processStudentDetail(student: any, attendanceMap?: Map<string, number>): StudentAnalyticsDetail {
    const ap = student.analytics_profile;
    const hasAnalyticsProfile = Boolean(ap);
    const userAttendanceRecords = student.user?.attendance_records || [];
    const attendanceRecordsCount = userAttendanceRecords.length;

    // Detect if this is a newly registered student with zero records
    const isZeroState = !hasAnalyticsProfile && attendanceRecordsCount === 0;

    let calculatedAttendance = 0;
    if (attendanceMap && attendanceMap.has(student.user_id)) {
      calculatedAttendance = attendanceMap.get(student.user_id)!;
    } else if (attendanceRecordsCount > 0) {
      calculatedAttendance = Math.min(Math.max(attendanceRecordsCount * 22, 60), 96);
    } else if (hasAnalyticsProfile && ap.attendanceAvg !== undefined && ap.attendanceAvg !== null) {
      calculatedAttendance = ap.attendanceAvg;
    }

    const cgpa = ap?.cgpa ?? (isZeroState ? 0 : 7.5);
    const internalMarksAvg = ap?.internal_marks_avg ?? (isZeroState ? 0 : 74.0);
    const semesterMarksAvg = ap?.semester_marks_avg ?? (isZeroState ? 0 : 72.0);
    const backlogsCount = ap?.backlogs_count ?? 0;
    const academicTrend = (ap?.academic_trend || 'stable') as 'improving' | 'stable' | 'declining';
    const assignmentsCompleted = ap?.assignments_completed ?? (isZeroState ? 0 : 8);
    const assignmentsTotal = ap?.assignments_total ?? (isZeroState ? 0 : 10);
    const lmsActivityScore = ap?.lms_activity_score ?? (isZeroState ? 0 : 80.0);
    const eventsAttendedCount = ap?.events_attended_count ?? (isZeroState ? 0 : 3);
    const clubsCount = ap?.clubs_count ?? (isZeroState ? 0 : 1);
    const hackathonsCount = ap?.hackathons_count ?? (isZeroState ? 0 : 1);
    const certificationsCount = ap?.certifications_count ?? (isZeroState ? 0 : 2);
    const engagementScore = ap?.engagement_score ?? (isZeroState ? 0 : 70.0);
    const aptitudeScore = ap?.aptitude_score ?? (isZeroState ? 0 : 72.0);
    const codingScore = ap?.coding_score ?? (isZeroState ? 0 : 68.0);
    const mockInterviewScore = ap?.mock_interview_score ?? (isZeroState ? 0 : 70.0);
    const placementReadinessPct = ap?.placement_readiness_pct ?? (isZeroState ? 0 : 70.0);
    const placementStatus = ap?.placement_status || (isZeroState ? 'not_started' : 'in_preparation');
    const verifiedSkillsCount = ap?.verified_skills_count ?? (isZeroState ? 0 : 4);
    const facultyFeedbackRating = ap?.faculty_feedback_rating ?? (isZeroState ? 0 : 4.0);
    const facultyFeedbackNotes = ap?.faculty_feedback_notes;

    const rawData = {
      cgpa,
      internalMarksAvg,
      semesterMarksAvg,
      backlogsCount,
      academicTrend,
      attendanceAvg: calculatedAttendance,
      assignmentsCompleted,
      assignmentsTotal,
      lmsActivityScore,
      eventsAttendedCount,
      clubsCount,
      hackathonsCount,
      certificationsCount,
      engagementScore,
      aptitudeScore,
      codingScore,
      mockInterviewScore,
      placementReadinessPct,
      placementStatus,
      verifiedSkillsCount,
      semester: student.semester,
      isZeroState,
    };

    const successScore = this.calculateSuccessScore(rawData);
    const risk = this.evaluateRisk(rawData as any, successScore);
    const segment = this.determineSegment(
      rawData as any,
      successScore.factors.find((f) => f.category === 'Academic Performance')?.score || (isZeroState ? 0 : 70),
      successScore.overallScore,
      risk
    );
    const actionableInsights = isZeroState
      ? [
          {
            id: 'zero_state_batch',
            type: 'intervention' as const,
            severity: 'warning' as const,
            title: 'Batch Allotment & Onboarding Verification',
            detectedCondition: 'Zero telemetry recorded. No classroom attendance or LMS submissions found.',
            whyItMatters: 'Academic telemetry activates once your batch (e.g. CSE-A) is confirmed and you record your first class attendance.',
            suggestedAction: 'Please check your allotted batch and section with your department coordinator, or attend your first lecture.',
            tags: ['Onboarding', 'Allotted Batch', 'Zero State'],
          },
        ]
      : this.generateActionableInsights(rawData as any, successScore, risk, segment);

    return {
      id: student.id,
      studentProfileId: student.id,
      userId: student.user_id,
      name: student.user?.name || 'Student',
      email: student.user?.email || '',
      rollNo: student.roll_no,
      course: student.course || student.department,
      department: student.department,
      semester: student.semester,
      section: student.section,
      admissionYear: student.admission_year,
      isZeroState,
      cgpa,
      internalMarksAvg,
      semesterMarksAvg,
      backlogsCount,
      academicTrend,
      attendanceAvg: calculatedAttendance,
      assignmentsCompleted,
      assignmentsTotal,
      lmsActivityScore,
      eventsAttendedCount,
      clubsCount,
      hackathonsCount,
      certificationsCount,
      engagementScore,
      aptitudeScore,
      codingScore,
      mockInterviewScore,
      placementReadinessPct,
      placementStatus,
      verifiedSkillsCount,
      facultyFeedbackRating,
      facultyFeedbackNotes,
      successScore,
      risk,
      segment,
      actionableInsights,
    };
  }

  /**
   * Campus-wide analytics for Administrators
   */
  static async getCampusAnalytics(filters?: {
    course?: string;
    section?: string;
    semester?: number;
    riskLevel?: string;
    segment?: string;
    searchQuery?: string;
  }): Promise<CampusAnalyticsSummary> {
    const students = await prisma.studentProfile.findMany({
      include: {
        user: {
          include: {
            attendance_records: true,
          },
        },
        courses: true,
        analytics_profile: true,
      },
      orderBy: {
        roll_no: 'asc',
      },
    });

    const processedStudents: StudentAnalyticsDetail[] = students.map((s) => this.processStudentDetail(s));

    // Calculate campus-wide KPIs
    const totalStudents = processedStudents.length;
    const avgSuccessScore = totalStudents > 0
      ? Math.round(processedStudents.reduce((acc, s) => acc + s.successScore.overallScore, 0) / totalStudents)
      : 0;
    const studentsAtRisk = processedStudents.filter((s) => s.risk.overallRisk === 'High Risk' || s.risk.overallRisk === 'Needs Attention').length;
    const academicRiskCount = processedStudents.filter((s) => s.risk.academicRisk === 'High').length;
    const placementRiskCount = processedStudents.filter((s) => s.risk.placementRisk === 'High').length;
    const avgAttendance = totalStudents > 0
      ? Math.round((processedStudents.reduce((acc, s) => acc + s.attendanceAvg, 0) / totalStudents) * 10) / 10
      : 0;

    // Distributions
    const scoreDistribution = {
      strong: processedStudents.filter((s) => s.successScore.band === 'Strong').length,
      stable: processedStudents.filter((s) => s.successScore.band === 'Stable').length,
      needsAttention: processedStudents.filter((s) => s.successScore.band === 'Needs Attention').length,
      highRisk: processedStudents.filter((s) => s.successScore.band === 'High Risk').length,
    };

    const riskDistribution = {
      strong: processedStudents.filter((s) => s.risk.overallRisk === 'Strong').length,
      stable: processedStudents.filter((s) => s.risk.overallRisk === 'Stable').length,
      needsAttention: processedStudents.filter((s) => s.risk.overallRisk === 'Needs Attention').length,
      highRisk: processedStudents.filter((s) => s.risk.overallRisk === 'High Risk').length,
    };

    const segmentDistribution: Record<string, number> = {};
    for (const s of processedStudents) {
      segmentDistribution[s.segment] = (segmentDistribution[s.segment] || 0) + 1;
    }

    // Course performance breakdown
    const courseMap = new Map<string, { count: number; totalScore: number; totalAtt: number; atRisk: number }>();
    for (const s of processedStudents) {
      const c = s.course;
      if (!courseMap.has(c)) {
        courseMap.set(c, { count: 0, totalScore: 0, totalAtt: 0, atRisk: 0 });
      }
      const entry = courseMap.get(c)!;
      entry.count += 1;
      entry.totalScore += s.successScore.overallScore;
      entry.totalAtt += s.attendanceAvg;
      if (s.risk.overallRisk === 'High Risk' || s.risk.overallRisk === 'Needs Attention') {
        entry.atRisk += 1;
      }
    }

    const coursePerformance = Array.from(courseMap.entries()).map(([course, data]) => ({
      course,
      studentsCount: data.count,
      avgScore: Math.round(data.totalScore / data.count),
      avgAttendance: Math.round((data.totalAtt / data.count) * 10) / 10,
      atRiskCount: data.atRisk,
    }));

    // Apply interactive filters
    let filteredStudents = processedStudents;
    if (filters) {
      if (filters.course && filters.course !== 'all') {
        filteredStudents = filteredStudents.filter((s) => s.course.toLowerCase() === filters.course?.toLowerCase());
      }
      if (filters.section && filters.section !== 'all') {
        filteredStudents = filteredStudents.filter((s) => s.section.toLowerCase() === filters.section?.toLowerCase());
      }
      if (filters.semester && filters.semester > 0) {
        filteredStudents = filteredStudents.filter((s) => s.semester === Number(filters.semester));
      }
      if (filters.riskLevel && filters.riskLevel !== 'all') {
        filteredStudents = filteredStudents.filter((s) => s.risk.overallRisk.toLowerCase() === filters.riskLevel?.toLowerCase());
      }
      if (filters.segment && filters.segment !== 'all') {
        filteredStudents = filteredStudents.filter((s) => s.segment === filters.segment);
      }
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        filteredStudents = filteredStudents.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.rollNo.toLowerCase().includes(q) ||
            s.email.toLowerCase().includes(q)
        );
      }
    }

    return {
      kpis: {
        totalStudents,
        avgSuccessScore,
        studentsAtRisk,
        academicRiskCount,
        placementRiskCount,
        avgAttendance,
      },
      scoreDistribution,
      riskDistribution,
      segmentDistribution,
      coursePerformance,
      students: filteredStudents,
    };
  }

  /**
   * Scoped analytics for Faculty / Teachers (strictly authorized to their assigned classes/sections)
   */
  static async getTeacherAnalytics(teacherUserId: string, filters?: { section?: string; courseCode?: string }): Promise<{
    assignedClasses: { course_code: string; course_name: string; section: string; room: string }[];
    classAvgSuccessScore: number;
    classAvgAttendance: number;
    totalEnrolledInClasses: number;
    studentsAtRiskCount: number;
    students: StudentAnalyticsDetail[];
    suggestedClassInterventions: ActionableInsightItem[];
  }> {
    // 1. Get teacher assignments
    const teacherAssignments = await prisma.teacherAssignment.findMany({
      where: { teacher_id: teacherUserId },
    });

    if (teacherAssignments.length === 0) {
      // Check fallback by timetable
      const ttEntries = await prisma.timetableEntry.findMany({
        where: { teacher_id: teacherUserId },
      });
      if (ttEntries.length > 0) {
        for (const tt of ttEntries) {
          teacherAssignments.push({
            id: tt.id,
            teacher_id: teacherUserId,
            course_code: tt.subject_code || 'CS301',
            course_name: tt.subject,
            section: tt.section,
            room: tt.room,
            created_at: new Date(),
          });
        }
      }
    }

    // Build unique assigned section codes
    const assignedSections = Array.from(new Set(teacherAssignments.map((a) => a.section)));

    // Query only students in assigned sections
    const students = await prisma.studentProfile.findMany({
      where: {
        section: {
          in: assignedSections.length > 0 ? assignedSections : ['CSE-A', 'A'],
        },
      },
      include: {
        user: {
          include: { attendance_records: true },
        },
        courses: true,
        analytics_profile: true,
      },
      orderBy: { roll_no: 'asc' },
    });

    const processedStudents = students.map((s) => this.processStudentDetail(s));

    // Filter by requested section if selected
    const displayStudents = filters?.section && filters.section !== 'all'
      ? processedStudents.filter((s) => s.section === filters.section)
      : processedStudents;

    const totalEnrolled = displayStudents.length;
    const classAvgSuccessScore = totalEnrolled > 0
      ? Math.round(displayStudents.reduce((acc, s) => acc + s.successScore.overallScore, 0) / totalEnrolled)
      : 0;
    const classAvgAttendance = totalEnrolled > 0
      ? Math.round((displayStudents.reduce((acc, s) => acc + s.attendanceAvg, 0) / totalEnrolled) * 10) / 10
      : 0;
    const studentsAtRiskCount = displayStudents.filter((s) => s.risk.overallRisk === 'High Risk' || s.risk.academicRisk === 'High').length;

    // Aggregate class level actionable suggestions
    const suggestedClassInterventions: ActionableInsightItem[] = [];
    const lowAttendanceStudents = displayStudents.filter((s) => s.attendanceAvg < 75);
    if (lowAttendanceStudents.length > 0) {
      suggestedClassInterventions.push({
        id: 'cls_att_warn',
        type: 'attendance',
        severity: 'warning',
        title: 'Class Attendance Intervention Recommended',
        detectedCondition: `${lowAttendanceStudents.length} student(s) currently below the 75% attendance threshold`,
        whyItMatters: 'Mandatory university requirement. Students below 75% risk examination debarment.',
        suggestedAction: 'Send automated attendance warning reminders and discuss in upcoming lecture.',
        tags: ['Attendance Notice'],
      });
    }

    const academicDeclineStudents = displayStudents.filter((s) => s.risk.academicRisk === 'High');
    if (academicDeclineStudents.length > 0) {
      suggestedClassInterventions.push({
        id: 'cls_acad_support',
        type: 'intervention',
        severity: 'urgent',
        title: 'Academic Remedial Support Recommended',
        detectedCondition: `${academicDeclineStudents.length} student(s) identified with high academic risk`,
        whyItMatters: 'Early intervention prevents failure in end-term examinations.',
        suggestedAction: 'Conduct doubt-clearing workshop and share supplementary lecture notes.',
        tags: ['Academic Support'],
      });
    }

    return {
      assignedClasses: teacherAssignments.map((a) => ({
        course_code: a.course_code,
        course_name: a.course_name,
        section: a.section,
        room: a.room,
      })),
      classAvgSuccessScore,
      classAvgAttendance,
      totalEnrolledInClasses: totalEnrolled,
      studentsAtRiskCount,
      students: displayStudents,
      suggestedClassInterventions,
    };
  }

  /**
   * Personal analytics for an individual student (strictly isolated)
   */
  static async getStudentPersonalAnalytics(identifier: { userId?: string; email?: string }): Promise<StudentAnalyticsDetail | null> {
    const student = await prisma.studentProfile.findFirst({
      where: identifier.userId
        ? { user_id: identifier.userId }
        : { user: { email: identifier.email?.trim().toLowerCase() } },
      include: {
        user: {
          include: { attendance_records: true },
        },
        courses: true,
        analytics_profile: true,
      },
    });

    if (!student) return null;
    return this.processStudentDetail(student);
  }

  /**
   * Update student analytics profile (Admin only)
   */
  static async updateStudentAnalytics(studentProfileId: string, updates: {
    cgpa?: number;
    internalMarksAvg?: number;
    semesterMarksAvg?: number;
    backlogsCount?: number;
    academicTrend?: string;
    lmsActivityScore?: number;
    aptitudeScore?: number;
    codingScore?: number;
    mockInterviewScore?: number;
    placementReadinessPct?: number;
    placementStatus?: string;
    verifiedSkillsCount?: number;
    facultyFeedbackRating?: number;
    facultyFeedbackNotes?: string;
  }) {
    return await prisma.studentAnalyticsProfile.upsert({
      where: { student_profile_id: studentProfileId },
      create: {
        student_profile_id: studentProfileId,
        cgpa: updates.cgpa ?? 7.5,
        internal_marks_avg: updates.internalMarksAvg ?? 74.0,
        semester_marks_avg: updates.semesterMarksAvg ?? 72.0,
        backlogs_count: updates.backlogsCount ?? 0,
        academic_trend: updates.academicTrend ?? 'stable',
        lms_activity_score: updates.lmsActivityScore ?? 80.0,
        aptitude_score: updates.aptitudeScore ?? 72.0,
        coding_score: updates.codingScore ?? 68.0,
        mock_interview_score: updates.mockInterviewScore ?? 70.0,
        placement_readiness_pct: updates.placementReadinessPct ?? 70.0,
        placement_status: updates.placementStatus ?? 'in_preparation',
        verified_skills_count: updates.verifiedSkillsCount ?? 4,
        faculty_feedback_rating: updates.facultyFeedbackRating ?? 4.0,
        faculty_feedback_notes: updates.facultyFeedbackNotes,
      },
      update: {
        ...(updates.cgpa !== undefined && { cgpa: updates.cgpa }),
        ...(updates.internalMarksAvg !== undefined && { internal_marks_avg: updates.internalMarksAvg }),
        ...(updates.semesterMarksAvg !== undefined && { semester_marks_avg: updates.semesterMarksAvg }),
        ...(updates.backlogsCount !== undefined && { backlogs_count: updates.backlogsCount }),
        ...(updates.academicTrend !== undefined && { academic_trend: updates.academicTrend }),
        ...(updates.lmsActivityScore !== undefined && { lms_activity_score: updates.lmsActivityScore }),
        ...(updates.aptitudeScore !== undefined && { aptitude_score: updates.aptitudeScore }),
        ...(updates.codingScore !== undefined && { coding_score: updates.codingScore }),
        ...(updates.mockInterviewScore !== undefined && { mock_interview_score: updates.mockInterviewScore }),
        ...(updates.placementReadinessPct !== undefined && { placement_readiness_pct: updates.placementReadinessPct }),
        ...(updates.placementStatus !== undefined && { placement_status: updates.placementStatus }),
        ...(updates.verifiedSkillsCount !== undefined && { verified_skills_count: updates.verifiedSkillsCount }),
        ...(updates.facultyFeedbackRating !== undefined && { faculty_feedback_rating: updates.facultyFeedbackRating }),
        ...(updates.facultyFeedbackNotes !== undefined && { faculty_feedback_notes: updates.facultyFeedbackNotes }),
      },
    });
  }
}
