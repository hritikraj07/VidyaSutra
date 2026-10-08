export type UserRole = 'student' | 'teacher' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  rollNo?: string;
  course?: string;
  department?: string;
  semester?: number;
  section?: string;
  admissionYear?: number;
  cohort?: string;
  avatar: string;
  title?: string; // For teachers/mentors (e.g., "Associate Professor")
  courses?: {
    id: string;
    subjectCode: string;
    subjectName: string;
    status: string;
  }[];
}

export type LectureStatus = 'live' | 'upcoming' | 'completed';

export interface TimetableSlot {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  subject: string;
  code: string;
  faculty: string;
  room: string;
  startTime: string;
  endTime: string;
  status: LectureStatus;
  type: 'Theory' | 'Lab' | 'Tutorial';
  course?: string;
  semester?: number;
  section?: string;
}

export interface TimetableEntryItem {
  id: string;
  course: string;
  semester: number;
  section: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  startTime: string;
  endTime: string;
  subject: string;
  subjectCode?: string;
  teacherName: string;
  teacherId?: string;
  room: string;
}

export interface SubjectAttendance {
  id: string;
  subject: string;
  code: string;
  faculty: string;
  attended: number;
  total: number;
  percentage: number;
  minimumRequired: number; // usually 75
  status: 'safe' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  lastClassDate: string;
}

export interface DynamicSessionState {
  id?: string;
  sessionId: string;
  subject: string;
  code: string;
  courseCode?: string;
  courseName?: string;
  course?: string;
  semester?: number;
  period?: string;
  faculty: string;
  teacherId?: string;
  teacherName?: string;
  room: string;
  section: string;
  sessionName?: string;
  startedAt: string;
  expiresInSeconds: number;
  remainingSessionSeconds?: number;
  currentToken: string;
  token?: string;
  qrPayload?: string;
  tokenGenerationTime: number;
  presentCount: number;
  totalEnrolled: number;
  isActive: boolean;
  status?: string;
  radiusMeters?: number;
  hasTeacherLocation?: boolean;
  recentCheckIns?: {
    id: string;
    studentName: string;
    rollNo: string;
    source?: string;
    status?: string;
    distance?: number | null;
    markedAt: string;
  }[];
}

export interface CohortStudentItem {
  studentId: string;
  profileId?: string;
  name: string;
  email: string;
  rollNo: string;
  course: string;
  section: string;
  semester: number;
  status: 'PRESENT' | 'ABSENT';
  source: 'qr' | 'manual' | null;
  markedAt: string | null;
  distanceFromTeacher: number | null;
}

export interface AttendanceValidationRequest {
  sessionId: string;
  token: string;
  rawScan?: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
}

export interface AttendanceValidationResult {
  success: boolean;
  message: string;
  subject?: string;
  code?: string;
  timestamp?: string;
  sessionToken?: string;
  error?: string;
  duplicate?: boolean;
  details?: {
    teacher?: string;
    course?: string;
    courseCode?: string;
    section?: string;
    period?: string;
    sessionName?: string;
    student?: string;
    rollNo?: string;
    status?: string;
    source?: string;
    verification?: string;
    distanceMeters?: number | null;
    markedAt?: string;
    presentCount?: number;
  };
  session?: {
    courseName?: string;
    courseCode?: string;
    section?: string;
    markedAt?: string;
  };
}

export type AssignmentStatus = 'pending' | 'submitted' | 'graded' | 'overdue';

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  code: string;
  dueDate: string;
  dueTime: string;
  daysRemaining: number;
  status: AssignmentStatus;
  maxMarks: number;
  scoredMarks?: number;
  behavior: {
    openedAt?: string;
    startedAt?: string;
    submittedAt?: string;
    turnaroundHours?: number;
    punctuality: 'early' | 'on_time' | 'last_minute' | 'late' | 'not_submitted';
  };
}

export interface SuccessScoreFactor {
  category: 'Attendance' | 'Academics' | 'Assignments' | 'Skills' | 'Placement Readiness';
  score: number; // 0 to 100
  weight: number; // percentage weight
  weightedScore: number;
  status: 'safe' | 'warning' | 'critical';
  details: string;
}

export interface SuccessScoreBreakdown {
  overallScore: number; // 0-100
  band: 'Optimal' | 'Monitor' | 'At Risk' | 'Neutral';
  changeThisMonth: number;
  factors: SuccessScoreFactor[];
  topInsight: string;
  actionablePlan: string[];
}

export type RiskSeverity = 'critical' | 'high' | 'monitor';

export interface StudentRiskRecord {
  id: string;
  studentId: string;
  name: string;
  rollNo: string;
  department: string;
  semester: number;
  severity: RiskSeverity;
  successScore: number;
  attendanceAvg: number;
  primaryRiskReason: string;
  secondaryRiskReason?: string;
  lastIntervention?: string;
  interventionsCount: number;
  trend: 'declining' | 'improving' | 'stagnant';
}

export interface SkillItem {
  id: string;
  name: string;
  category: 'Programming' | 'AI & Data' | 'Web Tech' | 'Core Engineering' | 'Soft Skills';
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  verified: boolean;
  verificationSource?: 'Course Project' | 'Mentor Verified' | 'Online Assessment' | 'Self-Declared';
  verifiedAt?: string;
}

export interface PlacementOpportunity {
  id: string;
  role: string;
  company: string;
  logo: string;
  packageStipend: string;
  type: 'Full-Time' | 'Internship' | 'PPO';
  location: string;
  deadline: string;
  matchScore: number; // 0-100%
  requiredSkills: string[];
  matchedSkills: string[];
  missingSkills: string[];
  status: 'eligible' | 'applied' | 'shortlisted' | 'ineligible';
}
