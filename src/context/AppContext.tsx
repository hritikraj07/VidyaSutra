'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
  DynamicSessionState,
  AttendanceValidationResult,
} from '@/types';
import {
  defaultTimetable,
  defaultAttendanceRecords,
  defaultAssignments,
  defaultSuccessScore,
  defaultRiskRecords,
  defaultSkills,
  defaultPlacements,
} from '@/lib/mockData';
import { createClient } from '@/utils/supabase/client';

const supabase = createClient();

interface AppContextType {
  // Authentication & Current User
  currentUser: UserProfile | null;
  activeRole: UserRole | null;
  isLoadingAuth: boolean;
  logout: () => Promise<void>;

  // Navigation
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Timetable
  timetable: TimetableSlot[];
  refreshTimetable: () => Promise<void>;

  // Attendance
  attendanceRecords: SubjectAttendance[];
  overallAttendancePercentage: number;
  activeSession: DynamicSessionState | null;
  assignedCourses: {
    id: string;
    course_code: string;
    course_name: string;
    section: string;
    room: string;
  }[];
  refreshSession: () => Promise<void>;
  startTeacherSession: (
    courseCode: string,
    section: string,
    sessionName?: string,
    options?: {
      timetableId?: string;
      course?: string;
      semester?: number;
      period?: string;
      teacherLatitude?: number;
      teacherLongitude?: number;
    }
  ) => Promise<{ success: boolean; message?: string }>;
  endTeacherSession: (sessionId?: string) => Promise<{ success: boolean; message?: string }>;
  validateStudentScan: (
    token: string,
    sessionId?: string,
    rawScan?: string,
    location?: { latitude: number; longitude: number; accuracy?: number }
  ) => Promise<AttendanceValidationResult>;
  manualMarkAttendance: (
    sessionId: string,
    studentId: string,
    status: 'PRESENT' | 'ABSENT'
  ) => Promise<{ success: boolean; message?: string }>;
  fetchSessionCohort: (sessionId: string) => Promise<any>;
  lastScanResult: AttendanceValidationResult | null;
  resetLastScanResult: () => void;

  // Assignments
  assignments: Assignment[];
  submitAssignment: (assignmentId: string) => void;
  addAssignment: (newAssignment: Omit<Assignment, 'id'>) => void;

  // Success Score & Risk
  successScore: SuccessScoreBreakdown;
  riskRecords: StudentRiskRecord[];
  addMentorIntervention: (recordId: string, interventionNote: string) => void;

  // Skills
  skills: SkillItem[];
  addSkill: (skill: Omit<SkillItem, 'id' | 'verified'>) => void;
  verifySkill: (skillId: string) => void;

  // Placements
  placements: PlacementOpportunity[];
  applyToPlacement: (placementId: string) => void;

  // Modals
  isQrScannerOpen: boolean;
  setIsQrScannerOpen: (open: boolean) => void;
  isScoreModalOpen: boolean;
  setIsScoreModalOpen: (open: boolean) => void;
  isTeacherSessionActive: boolean;
  toggleTeacherSession: (active: boolean) => Promise<void>;
  restartTeacherSession: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();

  // Authentication state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Academic data states
  const [timetable, setTimetable] = useState<TimetableSlot[]>(defaultTimetable);
  const [attendanceRecords, setAttendanceRecords] = useState<SubjectAttendance[]>(defaultAttendanceRecords);
  const [assignments, setAssignments] = useState<Assignment[]>(defaultAssignments);
  const [successScore, setSuccessScore] = useState<SuccessScoreBreakdown>(defaultSuccessScore);
  const [riskRecords, setRiskRecords] = useState<StudentRiskRecord[]>(defaultRiskRecords);
  const [skills, setSkills] = useState<SkillItem[]>(defaultSkills);
  const [placements, setPlacements] = useState<PlacementOpportunity[]>(defaultPlacements);

  // Dynamic QR Attendance states
  const [activeSession, setActiveSession] = useState<DynamicSessionState | null>(null);
  const [assignedCourses, setAssignedCourses] = useState<
    { id: string; course_code: string; course_name: string; section: string; room: string }[]
  >([]);
  const [lastScanResult, setLastScanResult] = useState<AttendanceValidationResult | null>(null);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [isTeacherSessionActive, setIsTeacherSessionActive] = useState(false);

  // Fetch timetable entries matching the logged-in user's role and cohort
  const fetchTimetableForUser = useCallback(async (user: UserProfile | null) => {
    if (!user) {
      setTimetable([]);
      return;
    }
    try {
      let url = '/api/timetable';
      if (user.role === 'student') {
        const course = user.course || user.department;
        const sem = user.semester;
        const sec = user.section;
        if (course && sem && sec) {
          url = `/api/timetable?course=${encodeURIComponent(course)}&semester=${sem}&section=${encodeURIComponent(sec)}`;
        } else {
          setTimetable([]);
          return;
        }
      } else if (user.role === 'teacher') {
        url = `/api/timetable?teacherId=${encodeURIComponent(user.id)}&teacherName=${encodeURIComponent(user.name)}`;
      } else {
        url = '/api/timetable';
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.entries) && data.entries.length > 0) {
          const slots: TimetableSlot[] = data.entries.map((e: any, idx: number) => ({
            id: e.id,
            day: e.day,
            subject: e.subject,
            code: e.subjectCode || `CS${301 + idx}`,
            faculty: e.teacherName,
            room: e.room,
            startTime: e.startTime,
            endTime: e.endTime,
            status: (e.day === 'Wednesday' && idx === 0) ? 'live' : 'upcoming',
            type: e.subject.toLowerCase().includes('lab') ? 'Lab' : 'Theory',
            course: e.course,
            semester: e.semester,
            section: e.section,
          }));
          setTimetable(slots);
          return;
        }
      }
      setTimetable([]);
    } catch (err) {
      console.error('Failed to load user timetable:', err);
      setTimetable([]);
    }
  }, []);

  const refreshTimetable = useCallback(async () => {
    if (currentUser) {
      await fetchTimetableForUser(currentUser);
    }
  }, [currentUser, fetchTimetableForUser]);

  // Verify and fetch session on initial load
  useEffect(() => {
    let isMounted = true;
    async function loadAuth() {
      try {
        const res = await fetch('/api/auth');
        const data = await res.json();
        if (!isMounted) return;

        if (data.user) {
          setCurrentUser(data.user);
          setActiveTab('dashboard');
          setIsLoadingAuth(false);

          // Non-blocking background query for timetable matching the authenticated user
          fetchTimetableForUser(data.user);

          // Sync student courses & cohort data into attendance records
          if (data.user.role === 'student') {
            if (Array.isArray(data.user.courses) && data.user.courses.length > 0) {
              const courseAtt: SubjectAttendance[] = data.user.courses.map((c: any) => ({
                id: `att_${c.subjectCode.toLowerCase()}`,
                subject: c.subjectName,
                code: c.subjectCode,
                faculty: 'Course Faculty',
                attended: 0,
                total: 0,
                percentage: 0,
                minimumRequired: 75,
                status: 'safe',
                trend: 'stable',
                lastClassDate: 'Not yet recorded',
              }));
              setAttendanceRecords(courseAtt);
              setSuccessScore(defaultSuccessScore);
            } else {
              // Clean unpopulated fresh state for newly registered students
              setAttendanceRecords([]);
              setAssignments([]);
              setSkills([]);
              setPlacements([]);
              setSuccessScore(defaultSuccessScore);
            }
          }
        } else {
          setCurrentUser(null);
          setTimetable([]);
          setIsLoadingAuth(false);
        }
      } catch (err) {
        console.error('Session load failed:', err);
        if (isMounted) {
          setCurrentUser(null);
          setTimetable([]);
          setIsLoadingAuth(false);
        }
      }
    }
    loadAuth();
    return () => {
      isMounted = false;
    };
  }, [fetchTimetableForUser]);

  const logout = async () => {
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
      try {
        await supabase.auth.signOut();
      } catch {}
    } catch (e) {
      console.error('Logout error:', e);
    }
    setCurrentUser(null);
    window.location.href = '/login';
  };

  // Poll / Fetch active session state from backend
  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch('/api/attendance/session');
      if (res.ok) {
        const data = await res.json();
        if (data.session) {
          setActiveSession(data.session);
          setIsTeacherSessionActive(Boolean(data.session.isActive));
        } else if (data.sessionId) {
          setActiveSession(data);
          setIsTeacherSessionActive(Boolean(data.isActive));
        } else {
          setActiveSession(null);
          setIsTeacherSessionActive(false);
        }

        if (Array.isArray(data.assignedCourses)) {
          setAssignedCourses(data.assignedCourses);
        }
      }
    } catch (e) {
      console.error('Failed to fetch attendance session:', e);
    }
  }, []);

  // Sync session every 2 seconds to keep countdown and tokens live
  useEffect(() => {
    if (!currentUser) return;
    refreshSession();
    const interval = setInterval(refreshSession, 2000);
    return () => clearInterval(interval);
  }, [currentUser, refreshSession]);

  // Overall Attendance calculation
  const overallAttendancePercentage = React.useMemo(() => {
    const totalClasses = attendanceRecords.reduce((acc, curr) => acc + curr.total, 0);
    const attendedClasses = attendanceRecords.reduce((acc, curr) => acc + curr.attended, 0);
    return totalClasses > 0 ? parseFloat(((attendedClasses / totalClasses) * 100).toFixed(1)) : 0;
  }, [attendanceRecords]);

  // Student Validate Scan: Sends scanned token, session ID, and student GPS location
  const validateStudentScan = async (
    token: string,
    sessionId?: string,
    rawScan?: string,
    location?: { latitude: number; longitude: number; accuracy?: number }
  ): Promise<AttendanceValidationResult> => {
    if (!currentUser) {
      return { success: false, message: 'Must be logged in to record attendance.' };
    }

    try {
      const res = await fetch('/api/attendance/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId || activeSession?.sessionId || activeSession?.id,
          token,
          rawScan,
          latitude: location?.latitude,
          longitude: location?.longitude,
          accuracy: location?.accuracy,
        }),
      });

      const data = await res.json();
      setLastScanResult(data);

      if (data.success && data.details) {
        const targetCode = data.details.courseCode || 'CS301';
        const targetSubject = data.details.course || 'Class Lecture';

        // Increment or add attendance record in client state
        setAttendanceRecords((prev) => {
          const exists = prev.some((r) => r.code === targetCode);
          if (exists) {
            return prev.map((rec) => {
              if (rec.code === targetCode) {
                const newAttended = rec.attended + 1;
                const newTotal = rec.total + 1;
                const newPct = parseFloat(((newAttended / newTotal) * 100).toFixed(1));
                return {
                  ...rec,
                  attended: newAttended,
                  total: newTotal,
                  percentage: newPct,
                  status: newPct >= 75 ? 'safe' : newPct >= 70 ? 'warning' : 'critical',
                  trend: 'up',
                  lastClassDate: 'Today (Verified via QR + Location)',
                };
              }
              return rec;
            });
          }
          // If student had empty state and scans for the first time, initialize the course record
          return [
            ...prev,
            {
              id: `att_${targetCode.toLowerCase()}`,
              subject: targetSubject,
              code: targetCode,
              faculty: data.details.teacher || 'Course Instructor',
              attended: 1,
              total: 1,
              percentage: 100,
              minimumRequired: 75,
              status: 'safe',
              trend: 'up',
              lastClassDate: 'Today (Verified via QR + Location)',
            },
          ];
        });

        // Boost Success Score on verified attendance
        setSuccessScore((prev) => {
          const newScore = Math.min(100, prev.overallScore + 15);
          return {
            ...prev,
            overallScore: newScore,
            band: newScore >= 80 ? 'Optimal' : newScore >= 60 ? 'Monitor' : 'At Risk',
            changeThisMonth: prev.changeThisMonth + 15,
            topInsight: `${targetCode} lecture attendance verified with classroom geolocation!`,
          };
        });

        // Trigger immediate session refresh to reflect student count
        refreshSession();
      }

      return data;
    } catch (err: any) {
      const errResult: AttendanceValidationResult = {
        success: false,
        message: 'Network error communicating with attendance verification server.',
        error: err.message,
      };
      setLastScanResult(errResult);
      return errResult;
    }
  };

  const resetLastScanResult = () => setLastScanResult(null);

  // Teacher starts a new attendance session with optional GPS center and timetable details
  const startTeacherSession = async (
    courseCode: string,
    section: string,
    sessionName?: string,
    options?: {
      timetableId?: string;
      course?: string;
      semester?: number;
      period?: string;
      teacherLatitude?: number;
      teacherLongitude?: number;
    }
  ) => {
    try {
      const res = await fetch('/api/attendance/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          courseCode,
          section,
          sessionName,
          timetableId: options?.timetableId,
          course: options?.course,
          semester: options?.semester,
          period: options?.period,
          teacherLatitude: options?.teacherLatitude,
          teacherLongitude: options?.teacherLongitude,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.session) {
        setActiveSession(data.session);
        setIsTeacherSessionActive(true);
        return { success: true, message: 'Attendance session started.' };
      }
      return { success: false, message: data.message || 'Failed to start session.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error starting session.' };
    }
  };

  // Teacher manually marks student PRESENT or ABSENT
  const manualMarkAttendance = async (
    sessionId: string,
    studentId: string,
    status: 'PRESENT' | 'ABSENT'
  ) => {
    try {
      const res = await fetch('/api/attendance/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'manual-mark',
          sessionId,
          studentId,
          status,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        refreshSession();
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Failed to mark attendance manually.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error updating attendance.' };
    }
  };

  // Fetch full cohort list for an attendance session
  const fetchSessionCohort = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/attendance/session?action=cohort&sessionId=${encodeURIComponent(sessionId)}`);
      if (res.ok) {
        return await res.json();
      }
      return null;
    } catch (err) {
      console.error('Failed to fetch session cohort:', err);
      return null;
    }
  };

  // Teacher ends current attendance session (invalidates QR tokens)
  const endTeacherSession = async (sessionId?: string) => {
    try {
      const res = await fetch('/api/attendance/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'end',
          sessionId: sessionId || activeSession?.sessionId || activeSession?.id,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (activeSession) {
          setActiveSession({ ...activeSession, isActive: false, expiresInSeconds: 0 });
        }
        setIsTeacherSessionActive(false);
        refreshSession();
        return { success: true, message: data.message || 'Attendance session ended.' };
      }
      return { success: false, message: data.message || 'Failed to end session.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error ending session.' };
    }
  };

  // Toggle teacher session active
  const toggleTeacherSession = async (active: boolean) => {
    try {
      const res = await fetch('/api/attendance/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', active }),
      });
      if (res.ok) {
        const data = await res.json();
        setActiveSession(data);
        setIsTeacherSessionActive(data.isActive);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Restart teacher session
  const restartTeacherSession = async () => {
    try {
      const res = await fetch('/api/attendance/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restart' }),
      });
      if (res.ok) {
        const data = await res.json();
        setActiveSession(data);
        setIsTeacherSessionActive(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Submit assignment
  const submitAssignment = (assignmentId: string) => {
    setAssignments((prev) =>
      prev.map((asg) =>
        asg.id === assignmentId
          ? {
              ...asg,
              status: 'submitted',
              behavior: {
                ...asg.behavior,
                submittedAt: 'Just now',
                punctuality: 'on_time',
              },
            }
          : asg
      )
    );
  };

  // Add / Upload assignment (Teacher)
  const addAssignment = (newAssignment: Omit<Assignment, 'id'>) => {
    const item: Assignment = {
      ...newAssignment,
      id: `asg_${Date.now()}`,
    };
    setAssignments((prev) => [item, ...prev]);
  };

  // Log mentor intervention
  const addMentorIntervention = (recordId: string, interventionNote: string) => {
    setRiskRecords((prev) =>
      prev.map((rec) =>
        rec.id === recordId
          ? {
              ...rec,
              lastIntervention: `Logged: "${interventionNote}" (Just now)`,
              interventionsCount: rec.interventionsCount + 1,
              severity: rec.severity === 'critical' ? 'high' : 'monitor',
            }
          : rec
      )
    );
  };

  // Skills
  const addSkill = (newSkill: Omit<SkillItem, 'id' | 'verified'>) => {
    const item: SkillItem = {
      ...newSkill,
      id: `skl_${Date.now()}`,
      verified: false,
      verificationSource: 'Self-Declared',
    };
    setSkills((prev) => [...prev, item]);
  };

  const verifySkill = (skillId: string) => {
    setSkills((prev) =>
      prev.map((s) =>
        s.id === skillId
          ? {
              ...s,
              verified: true,
              verificationSource: 'Mentor Verified',
              verifiedAt: 'Today',
            }
          : s
      )
    );
  };

  // Placements
  const applyToPlacement = (placementId: string) => {
    setPlacements((prev) =>
      prev.map((p) => (p.id === placementId ? { ...p, status: 'applied' } : p))
    );
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        activeRole: currentUser?.role || null,
        isLoadingAuth,
        logout,
        activeTab,
        setActiveTab,
        timetable,
        refreshTimetable,
        attendanceRecords,
        overallAttendancePercentage,
        activeSession,
        assignedCourses,
        refreshSession,
        startTeacherSession,
        endTeacherSession,
        validateStudentScan,
        manualMarkAttendance,
        fetchSessionCohort,
        lastScanResult,
        resetLastScanResult,
        assignments,
        submitAssignment,
        addAssignment,
        successScore,
        riskRecords,
        addMentorIntervention,
        skills,
        addSkill,
        verifySkill,
        placements,
        applyToPlacement,
        isQrScannerOpen,
        setIsQrScannerOpen,
        isScoreModalOpen,
        setIsScoreModalOpen,
        isTeacherSessionActive,
        toggleTeacherSession,
        restartTeacherSession,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
