import {
  UserProfile,
  UserRole,
  TimetableSlot,
  SubjectAttendance,
  Assignment,
  SuccessScoreBreakdown,
  StudentRiskRecord,
  SkillItem,
  PlacementOpportunity,
} from '@/types';

// Dynamic profile generator based on authenticating user
export function createInstitutionalProfile(
  email: string,
  role: UserRole,
  customName?: string,
  customRollNo?: string,
  customDept?: string
): UserProfile {
  const defaultNames: Record<UserRole, string> = {
    student: 'Student Portal User',
    teacher: 'Faculty / Staff Member',
    admin: 'System Administrator',
  };

  const parsedName = customName || (
    email.includes('@')
      ? email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      : defaultNames[role]
  );

  return {
    id: `usr_${role}_${Math.random().toString(36).substring(2, 9)}`,
    name: parsedName,
    email: email.trim(),
    role,
    rollNo: customRollNo || undefined,
    department: customDept || undefined,
    semester: undefined,
    section: undefined,
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(parsedName)}&backgroundColor=1b263b`,
    title: role === 'teacher' ? 'Faculty / Staff' : undefined,
  };
}

// Clean Initial States (Zero Mock Data)
export const defaultTimetable: TimetableSlot[] = [];

export const defaultAttendanceRecords: SubjectAttendance[] = [];

export const defaultAssignments: Assignment[] = [];

export const defaultRiskRecords: StudentRiskRecord[] = [];

export const defaultSkills: SkillItem[] = [];

export const defaultPlacements: PlacementOpportunity[] = [];

export const defaultSuccessScore: SuccessScoreBreakdown = {
  overallScore: 0,
  band: 'Neutral',
  changeThisMonth: 0,
  topInsight: 'Awaiting academic telemetry. Attend scheduled lectures to generate diagnostic reports.',
  factors: [
    {
      category: 'Attendance',
      score: 0,
      weight: 25,
      weightedScore: 0,
      status: 'safe',
      details: 'No attendance records logged yet.',
    },
    {
      category: 'Academics',
      score: 0,
      weight: 30,
      weightedScore: 0,
      status: 'safe',
      details: 'No semester test scores recorded yet.',
    },
    {
      category: 'Assignments',
      score: 0,
      weight: 20,
      weightedScore: 0,
      status: 'safe',
      details: 'No assignment submissions recorded yet.',
    },
    {
      category: 'Skills',
      score: 0,
      weight: 15,
      weightedScore: 0,
      status: 'safe',
      details: 'No verified technical skills logged in passport.',
    },
    {
      category: 'Placement Readiness',
      score: 0,
      weight: 10,
      weightedScore: 0,
      status: 'safe',
      details: 'Profile pending initial career skills assessment.',
    },
  ],
  actionablePlan: [
    'Scan classroom QR code during live lectures to log verified attendance.',
    'Review course modules and submit pending coursework on time.',
    'Add your technical competencies in the Skills Passport for mentor validation.',
  ],
};
