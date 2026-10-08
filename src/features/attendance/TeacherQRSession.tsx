'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import QRCode from 'qrcode';
import { useApp } from '@/context/AppContext';
import {
  Play,
  RotateCcw,
  ShieldCheck,
  Users,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  StopCircle,
  BookOpen,
  MapPin,
  GraduationCap,
  Search,
  UserCheck,
  UserX,
  Compass,
  Calendar,
  X,
  Filter,
} from 'lucide-react';
import { CohortStudentItem } from '@/types';

export const TeacherQRSession: React.FC = () => {
  const {
    currentUser,
    activeSession,
    assignedCourses,
    timetable,
    refreshSession,
    startTeacherSession,
    endTeacherSession,
    manualMarkAttendance,
    fetchSessionCohort,
    isTeacherSessionActive,
  } = useApp();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(5);
  const [sessionSecondsRemaining, setSessionSecondsRemaining] = useState(120);
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Form selection states for starting attendance
  const [selectedTimetableId, setSelectedTimetableId] = useState<string>('');
  const [selectedCourseCode, setSelectedCourseCode] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('CSE-A');
  const [selectedCourse, setSelectedCourse] = useState<string>('Computer Science & Engineering');
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('09:00 AM - 10:00 AM');
  const [sessionLectureTitle, setSessionLectureTitle] = useState<string>('Regular Lecture Session');

  // Teacher GPS Center coordinates (captured ONCE at session start)
  const [teacherGpsCenter, setTeacherGpsCenter] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isCapturingGps, setIsCapturingGps] = useState(false);

  // "Manage Students" Cohort Modal states
  const [isManageStudentsOpen, setIsManageStudentsOpen] = useState(false);
  const [cohortStudents, setCohortStudents] = useState<CohortStudentItem[]>([]);
  const [cohortSummary, setCohortSummary] = useState<{
    totalCohort: number;
    totalPresent: number;
    totalAbsent: number;
    qrVerifiedCount: number;
    manualCount: number;
  }>({
    totalCohort: 0,
    totalPresent: 0,
    totalAbsent: 0,
    qrVerifiedCount: 0,
    manualCount: 0,
  });
  const [isLoadingCohort, setIsLoadingCohort] = useState(false);
  const [cohortSearch, setCohortSearch] = useState('');
  const [cohortFilter, setCohortFilter] = useState<'all' | 'present' | 'absent'>('all');
  const [updatingStudentId, setUpdatingStudentId] = useState<string | null>(null);

  // Set default selection when assigned courses / timetable load
  useEffect(() => {
    if (timetable && timetable.length > 0 && !selectedCourseCode) {
      const first = timetable[0];
      setSelectedTimetableId(first.id);
      setSelectedCourseCode(first.code);
      setSelectedSection(first.section || 'CSE-A');
      setSelectedCourse(first.course || 'Computer Science & Engineering');
      setSelectedSemester(first.semester || 1);
      setSelectedPeriod(`${first.startTime} - ${first.endTime}`);
    } else if (assignedCourses && assignedCourses.length > 0 && !selectedCourseCode) {
      setSelectedCourseCode(assignedCourses[0].course_code);
      setSelectedSection(assignedCourses[0].section || 'CSE-A');
    }
  }, [timetable, assignedCourses, selectedCourseCode]);

  // Keep local 5-second countdown timer smooth and sync on 0
  useEffect(() => {
    if (!activeSession || !activeSession.isActive) return;

    const initialSecs =
      activeSession.expiresInSeconds && activeSession.expiresInSeconds <= 5
        ? activeSession.expiresInSeconds
        : 5;
    setSecondsRemaining(initialSecs);

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          refreshSession();
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeSession?.currentToken, activeSession?.isActive, refreshSession]);

  // Synchronize 2-minute session countdown timer
  useEffect(() => {
    if (!activeSession || !activeSession.isActive) return;

    const initialSessionSecs =
      typeof activeSession.remainingSessionSeconds === 'number'
        ? activeSession.remainingSessionSeconds
        : 120;
    setSessionSecondsRemaining(initialSessionSecs);

    const sessionTimer = setInterval(() => {
      setSessionSecondsRemaining((prev) => {
        if (prev <= 1) {
          refreshSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(sessionTimer);
  }, [activeSession?.id, activeSession?.isActive, activeSession?.startedAt, refreshSession]);

  // Render QR code to canvas whenever token or session updates
  useEffect(() => {
    if (!canvasRef.current || !activeSession || !activeSession.isActive) return;

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://vidyasutra.vercel.app';
    const sid = activeSession.sessionId || activeSession.id;
    const tok = activeSession.masterToken || activeSession.currentToken || activeSession.token;
    const scanUrl = `${baseUrl}/attendance/scan?sid=${sid}&token=${tok}`;

    QRCode.toCanvas(
      canvasRef.current,
      scanUrl,
      {
        width: 280,
        margin: 2,
        color: {
          dark: '#172554', // Deep Navy
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'M',
      },
      (err) => {
        if (err) console.error('QR code generation error:', err);
      }
    );
  }, [activeSession?.id, activeSession?.masterToken, activeSession?.currentToken, activeSession?.isActive]);

  // Load Cohort data for "Manage Students"
  const loadCohortData = useCallback(async () => {
    if (!activeSession?.id && !activeSession?.sessionId) return;
    const sid = activeSession.id || activeSession.sessionId;
    const data = await fetchSessionCohort(sid);
    if (data && Array.isArray(data.students)) {
      setCohortStudents(data.students);
      if (data.summary) {
        setCohortSummary(data.summary);
      }
    }
  }, [activeSession?.id, activeSession?.sessionId, fetchSessionCohort]);

  // Auto-sync cohort student list when modal is open
  useEffect(() => {
    if (!isManageStudentsOpen) return;
    loadCohortData();
    const interval = setInterval(loadCohortData, 2500);
    return () => clearInterval(interval);
  }, [isManageStudentsOpen, loadCohortData]);

  // Request teacher device location ONCE at session start
  const captureTeacherLocation = (): Promise<{ latitude: number; longitude: number } | null> => {
    return new Promise((resolve) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        // Fallback default coordinates if browser doesn't support geolocation
        resolve({ latitude: 28.6139, longitude: 77.2090 });
        return;
      }

      setIsCapturingGps(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsCapturingGps(false);
          const coords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
          setTeacherGpsCenter(coords);
          resolve(coords);
        },
        (err) => {
          console.warn('Teacher geolocation permission denied or timeout:', err.message);
          setIsCapturingGps(false);
          // Fallback to campus classroom coordinates
          const defaultLoc = { latitude: 28.6139, longitude: 77.2090 };
          setTeacherGpsCenter(defaultLoc);
          resolve(defaultLoc);
        },
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
      );
    });
  };

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);
    setIsStarting(true);

    if (!selectedCourseCode) {
      setErrorMessage('Please select a course to start attendance.');
      setIsStarting(false);
      return;
    }

    // Step 1: Capture teacher fixed GPS location center once
    const location = await captureTeacherLocation();

    // Step 2: Start session on server
    const res = await startTeacherSession(
      selectedCourseCode,
      selectedSection,
      sessionLectureTitle || 'Current Lecture',
      {
        timetableId: selectedTimetableId || undefined,
        course: selectedCourse,
        semester: selectedSemester,
        period: selectedPeriod,
        teacherLatitude: location?.latitude,
        teacherLongitude: location?.longitude,
      }
    );

    setIsStarting(false);
    if (!res.success) {
      setErrorMessage(res.message || 'Could not start attendance session.');
    } else {
      setSuccessNotice('Attendance session started. Fixed 30m GPS center locked and 5s dynamic QR active.');
      setTimeout(() => setSuccessNotice(null), 4000);
    }
  };

  const handleEndSession = async () => {
    setIsEnding(true);
    setErrorMessage(null);
    const res = await endTeacherSession();
    setIsEnding(false);
    if (!res.success) {
      setErrorMessage(res.message || 'Failed to end session.');
    } else {
      setIsManageStudentsOpen(false);
      setSuccessNotice('Attendance session closed. All dynamic QR codes invalidated.');
      setTimeout(() => setSuccessNotice(null), 4000);
    }
  };

  const handleManualMark = async (studentId: string, currentStatus: string) => {
    if (!activeSession) return;
    const newStatus = currentStatus === 'PRESENT' ? 'ABSENT' : 'PRESENT';
    setUpdatingStudentId(studentId);

    const sid = activeSession.id || activeSession.sessionId;
    const res = await manualMarkAttendance(sid, studentId, newStatus);
    setUpdatingStudentId(null);

    if (res.success) {
      // Optimistically update local cohort list
      setCohortStudents((prev) =>
        prev.map((s) =>
          s.studentId === studentId
            ? {
                ...s,
                status: newStatus,
                source: 'manual',
                markedAt: new Date().toISOString(),
              }
            : s
        )
      );
      loadCohortData();
    } else {
      setErrorMessage(res.message || 'Failed to update student attendance.');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const copyToken = () => {
    if (activeSession?.currentToken) {
      navigator.clipboard.writeText(activeSession.currentToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const presentCount = activeSession?.presentCount || 0;
  const totalEnrolled = activeSession?.totalEnrolled || 45;
  const presentPercent = Math.min(100, Math.round((presentCount / Math.max(1, totalEnrolled)) * 100));

  // Filtered students for "Manage Students" modal
  const filteredStudents = cohortStudents.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(cohortSearch.toLowerCase()) ||
      student.rollNo.toLowerCase().includes(cohortSearch.toLowerCase()) ||
      student.email.toLowerCase().includes(cohortSearch.toLowerCase());

    if (!matchesSearch) return false;
    if (cohortFilter === 'present') return student.status === 'PRESENT';
    if (cohortFilter === 'absent') return student.status === 'ABSENT';
    return true;
  });

  return (
    <div style={{ width: '100%', padding: '16px 28px' }}>
      {/* Alerts */}
      {errorMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: 'var(--radius-md)',
            color: '#DC2626',
            fontSize: '0.88rem',
            marginBottom: '16px',
            fontWeight: 500,
          }}
        >
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {successNotice && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            backgroundColor: '#ECFDF5',
            border: '1px solid #A7F3D0',
            borderRadius: 'var(--radius-md)',
            color: '#198754',
            fontSize: '0.88rem',
            marginBottom: '16px',
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={18} />
          <span>{successNotice}</span>
        </div>
      )}

      {/* SESSION SETUP FORM (When no active session exists) */}
      {(!activeSession || !activeSession.isActive) && (
        <div
          className="vs-card"
          style={{
            padding: '32px 28px',
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-xl)',
            boxShadow: '0 10px 30px -5px rgba(23, 37, 84, 0.08)',
            border: '1px solid var(--border)',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                backgroundColor: 'rgba(36, 59, 122, 0.1)',
                color: '#243B7A',
                padding: '3px 10px',
                borderRadius: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Faculty Portal
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
              Instructor: <strong>{currentUser?.name || 'Faculty Member'}</strong>
            </span>
          </div>

          <h1
            style={{
              fontSize: '1.45rem',
              fontWeight: 800,
              color: '#172554',
              marginBottom: '6px',
              letterSpacing: '-0.02em',
            }}
          >
            Start Dynamic QR Attendance
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '24px', maxWidth: '640px' }}>
            Select your scheduled class from the timetable. The system will prompt for your device location once,
            fix the classroom center coordinates, and generate a dynamic 5-second rotating QR code.
          </p>

          <form onSubmit={handleStartSession}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                gap: '20px',
                marginBottom: '24px',
              }}
            >
              {/* Timetable Class Selector */}
              {timetable && timetable.length > 0 && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      color: '#172033',
                      marginBottom: '8px',
                    }}
                  >
                    Select Today&apos;s Timetable Class *
                  </label>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <select
                      value={selectedTimetableId}
                      onChange={(e) => {
                        const tid = e.target.value;
                        setSelectedTimetableId(tid);
                        const match = timetable.find((t) => t.id === tid);
                        if (match) {
                          setSelectedCourseCode(match.code);
                          setSelectedSection(match.section || 'CSE-A');
                          setSelectedCourse(match.course || 'Computer Science & Engineering');
                          setSelectedSemester(match.semester || 1);
                          setSelectedPeriod(`${match.startTime} - ${match.endTime}`);
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        border: '1.5px solid #243B7A',
                        backgroundColor: '#F8FAFC',
                        color: '#172554',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        outline: 'none',
                      }}
                    >
                      {timetable.map((slot) => (
                        <option key={slot.id} value={slot.id}>
                          {slot.subject} ({slot.code}) • Section {slot.section} • {slot.day} {slot.startTime} - {slot.endTime} • {slot.room}
                        </option>
                      ))}
                    </select>
                  </div>
                  <span style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '4px', display: 'block' }}>
                    Auto-populates subject, section, semester, and scheduled period from your teaching timetable.
                  </span>
                </div>
              )}

              {/* Course / Subject */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    color: '#172033',
                    marginBottom: '8px',
                  }}
                >
                  Course / Subject *
                </label>
                <input
                  type="text"
                  value={selectedCourseCode}
                  onChange={(e) => setSelectedCourseCode(e.target.value)}
                  placeholder="e.g. CS301"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.88rem',
                    backgroundColor: '#FFFFFF',
                    color: '#172554',
                    fontWeight: 600,
                  }}
                  required
                />
              </div>

              {/* Section */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    color: '#172033',
                    marginBottom: '8px',
                  }}
                >
                  Target Section *
                </label>
                <input
                  type="text"
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  placeholder="e.g. CSE-A"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.88rem',
                    backgroundColor: '#FFFFFF',
                    color: '#172554',
                    fontWeight: 600,
                  }}
                  required
                />
              </div>

              {/* Semester & Period */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    color: '#172033',
                    marginBottom: '8px',
                  }}
                >
                  Semester
                </label>
                <input
                  type="number"
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(Number(e.target.value))}
                  min={1}
                  max={8}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.88rem',
                    backgroundColor: '#FFFFFF',
                    color: '#172554',
                    fontWeight: 600,
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    color: '#172033',
                    marginBottom: '8px',
                  }}
                >
                  Period / Time
                </label>
                <input
                  type="text"
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  placeholder="e.g. Period 2 (10:00 AM - 11:00 AM)"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.88rem',
                    backgroundColor: '#FFFFFF',
                    color: '#172554',
                    fontWeight: 600,
                  }}
                />
              </div>

              {/* Description */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#172033',
                    marginBottom: '8px',
                  }}
                >
                  Lecture Description
                </label>
                <input
                  type="text"
                  value={sessionLectureTitle}
                  onChange={(e) => setSessionLectureTitle(e.target.value)}
                  placeholder="e.g. Lecture 12 - Binary Search Trees & AVL Rotations"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.88rem',
                    backgroundColor: '#FFFFFF',
                    color: '#172033',
                  }}
                />
              </div>
            </div>

            {/* GPS Geofence Notice */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                backgroundColor: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: 'var(--radius-md)',
                marginBottom: '20px',
                fontSize: '0.82rem',
                color: '#166534',
              }}
            >
              <Compass size={18} color="#15803D" />
              <span>
                <strong>GPS Classroom Lock:</strong> Clicking &apos;Start Attendance&apos; will request your location once.
                This sets a fixed 30-meter classroom radius that remains locked even if you move around the classroom.
              </span>
            </div>

            <button
              type="submit"
              disabled={isStarting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#243B7A',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: '12px 24px',
                fontSize: '0.92rem',
                fontWeight: 700,
                cursor: isStarting ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(36, 59, 122, 0.3)',
                transition: 'all 0.2s ease',
              }}
            >
              <Play size={18} fill="#FFFFFF" />
              <span>{isStarting ? 'Locking Location & Initializing...' : 'Start Attendance'}</span>
            </button>
          </form>
        </div>
      )}

      {/* ACTIVE ATTENDANCE SESSION DISPLAY */}
      {activeSession && activeSession.isActive && (
        <>
          {/* Header Card with Session Details */}
          <div
            className="vs-card"
            style={{
              marginBottom: '20px',
              background: 'linear-gradient(135deg, #243B7A 0%, #172554 100%)',
              color: '#FFFFFF',
              border: 'none',
              boxShadow: '0 8px 24px -4px rgba(23, 37, 84, 0.25)',
              padding: '24px',
              borderRadius: 'var(--radius-xl)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      backgroundColor: 'rgba(231, 162, 59, 0.2)',
                      color: '#E7A23B',
                      border: '1px solid rgba(231, 162, 59, 0.4)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Teacher Portal
                  </span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      backgroundColor: '#198754',
                      color: '#FFFFFF',
                      padding: '2px 10px',
                      borderRadius: '6px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    ● Attendance Active
                  </span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      color: '#FFFFFF',
                      padding: '2px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    Radius: {activeSession?.radiusMeters || 30}m
                  </span>
                </div>

                <h1
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    color: '#FFFFFF',
                    margin: '2px 0 6px 0',
                  }}
                >
                  {activeSession?.subject || activeSession?.courseName || 'Data Structures'}
                </h1>

                {/* Session metadata grid */}
                <div
                  style={{
                    fontSize: '0.84rem',
                    color: '#DBEAFE',
                    display: 'flex',
                    gap: '12px',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                  }}
                >
                  <span>Course: <strong>{activeSession?.course || 'Computer Science & Engineering'}</strong></span>
                  <span>•</span>
                  <span>Section: <strong>{activeSession?.section || 'CSE-A'}</strong></span>
                  <span>•</span>
                  <span>Semester: <strong>{activeSession?.semester || 1}</strong></span>
                  <span>•</span>
                  <span>Period: <strong>{activeSession?.period || 'Period 1'}</strong></span>
                  <span>•</span>
                  <span>
                    Started: {new Date(activeSession.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Action Buttons: View/Manage Students & End Attendance */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => setIsManageStudentsOpen(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#FFFFFF',
                    color: '#172554',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 18px',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <Users size={17} color="#243B7A" />
                  <span>View / Manage Students</span>
                </button>

                <button
                  onClick={handleEndSession}
                  disabled={isEnding}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#EF4444',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 18px',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    cursor: isEnding ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                  }}
                >
                  <StopCircle size={18} />
                  <span>{isEnding ? 'Terminating...' : 'End Attendance'}</span>
                </button>
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '20px',
            }}
          >
            {/* Dynamic Rotating QR Card */}
            <div
              className="vs-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                padding: '28px 24px',
                backgroundColor: '#FFFFFF',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-md)',
                position: 'relative',
              }}
            >
              {/* Header Badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#EFF6FF',
                  color: '#1D4ED8',
                  padding: '4px 12px',
                  borderRadius: '999px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  marginBottom: '10px',
                }}
              >
                <Sparkles size={13} />
                <span>VIDYASUTRA ATTENDANCE</span>
              </div>

              {/* Title: LIVE ATTENDANCE */}
              <h2
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 900,
                  color: '#172554',
                  margin: '0 0 14px 0',
                  letterSpacing: '-0.02em',
                }}
              >
                LIVE ATTENDANCE
              </h2>

              {/* Subject & Class Information Panel */}
              <div
                style={{
                  width: '100%',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '10px',
                  textAlign: 'left',
                }}
              >
                <div>
                  <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                    Subject
                  </span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#172554', wordBreak: 'break-word' }}>
                    {activeSession?.subject || activeSession?.courseName || activeSession?.courseCode || 'Data Structures'}
                  </span>
                </div>

                <div>
                  <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                    Class
                  </span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#172554' }}>
                    {activeSession?.course
                      ? `${activeSession.course} - ${activeSession.section}`
                      : `B.Tech CSE - ${activeSession?.section || 'A'}`}
                  </span>
                </div>

                <div>
                  <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                    Session
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      color: sessionSecondsRemaining > 0 && activeSession?.isActive ? '#15803D' : '#DC2626',
                    }}
                  >
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: sessionSecondsRemaining > 0 && activeSession?.isActive ? '#22C55E' : '#DC2626',
                        display: 'inline-block',
                      }}
                    />
                    {sessionSecondsRemaining > 0 && activeSession?.isActive ? 'Live' : 'Expired'}
                  </span>
                </div>

                <div>
                  <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                    Expires In
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.88rem',
                      fontWeight: 900,
                      fontFamily: 'monospace',
                      color: sessionSecondsRemaining > 20 ? '#1D4ED8' : '#DC2626',
                    }}
                  >
                    <Clock size={13} />
                    {sessionSecondsRemaining > 0
                      ? `${String(Math.floor(sessionSecondsRemaining / 60)).padStart(2, '0')}:${String(sessionSecondsRemaining % 60).padStart(2, '0')}`
                      : '00:00'}
                  </span>
                </div>
              </div>

              {/* QR Canvas or Expired View */}
              {sessionSecondsRemaining > 0 && activeSession?.isActive ? (
                <>
                  {/* QR Canvas Container with Frame */}
                  <div
                    style={{
                      padding: '16px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '20px',
                      border: '2px solid #E2E8F0',
                      boxShadow: '0 8px 24px -4px rgba(23, 37, 84, 0.12)',
                      position: 'relative',
                      marginBottom: '14px',
                    }}
                  >
                    <canvas ref={canvasRef} style={{ display: 'block', borderRadius: '12px' }} />
                  </div>

                  {/* Instruction text */}
                  <p
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: '#334155',
                      margin: '0 0 12px 0',
                      lineHeight: 1.4,
                    }}
                  >
                    Scan this QR using<br />the VidyaSutra Student app
                  </p>

                  {/* Attendance Count Status */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: '#F1F5F9',
                      padding: '8px 18px',
                      borderRadius: '10px',
                      marginBottom: '16px',
                      border: '1px solid #CBD5E1',
                    }}
                  >
                    <Users size={18} color="#243B7A" />
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#172554' }}>
                      Students Present: <strong>{presentCount} / {totalEnrolled}</strong>
                    </span>
                  </div>

                  {/* End Session Button */}
                  <button
                    onClick={handleEndSession}
                    disabled={isEnding}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      width: '100%',
                      maxWidth: '280px',
                      backgroundColor: '#EF4444',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '10px 18px',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      cursor: isEnding ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
                    }}
                  >
                    <StopCircle size={16} />
                    <span>{isEnding ? 'Ending Session...' : 'End Session'}</span>
                  </button>
                </>
              ) : (
                /* Session Expired Overlay / State */
                <div
                  style={{
                    padding: '24px 16px',
                    backgroundColor: '#FEF2F2',
                    borderRadius: '16px',
                    border: '1.5px solid #FECACA',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '14px',
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: '#FEE2E2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#DC2626',
                    }}
                  >
                    <Clock size={24} />
                  </div>

                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#991B1B', margin: 0 }}>
                    Attendance session expired.
                  </h3>

                  <p style={{ fontSize: '0.82rem', color: '#7F1D1D', margin: 0, lineHeight: 1.4 }}>
                    The 2-minute validity window for this session has ended. This QR code is now invalid and can no longer be scanned.
                  </p>

                  <button
                    onClick={handleEndSession}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: '#243B7A',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '10px 20px',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      marginTop: '6px',
                    }}
                  >
                    <RotateCcw size={16} />
                    <span>Start New Session</span>
                  </button>
                </div>
              )}

              {/* Token copy info for testing fallback */}
              {sessionSecondsRemaining > 0 && activeSession?.isActive && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: '12px',
                    fontSize: '0.72rem',
                    color: '#64748B',
                  }}
                >
                  <span>Token: {activeSession?.currentToken || activeSession?.masterToken || 'TOKEN'}</span>
                  <button
                    onClick={copyToken}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: copied ? '#198754' : '#64748B',
                      cursor: 'pointer',
                      padding: '2px',
                    }}
                    title="Copy token code"
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
              )}
            </div>

            {/* Live Student Attendee Log & Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Turnout Progress Card */}
              <div
                className="vs-card"
                style={{
                  padding: '20px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={18} color="#243B7A" />
                    <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#172033' }}>
                      Today's Attendance
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      color: presentPercent >= 75 ? '#15803D' : '#D97706',
                      backgroundColor: presentPercent >= 75 ? '#DCFCE7' : '#FEF3C7',
                      padding: '3px 10px',
                      borderRadius: '6px',
                    }}
                  >
                    Rate: {presentPercent}%
                  </span>
                </div>

                {/* 4 Analytics Metrics: Present, Absent, Total, Attendance Rate */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '8px',
                    marginBottom: '14px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ padding: '8px 4px', backgroundColor: '#F0FDF4', borderRadius: '8px', border: '1px solid #BBF7D0' }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>Present</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#15803D' }}>{presentCount}</div>
                  </div>
                  <div style={{ padding: '8px 4px', backgroundColor: '#FEF2F2', borderRadius: '8px', border: '1px solid #FECACA' }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#991B1B', textTransform: 'uppercase' }}>Absent</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#DC2626' }}>{Math.max(0, totalEnrolled - presentCount)}</div>
                  </div>
                  <div style={{ padding: '8px 4px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#172554' }}>{totalEnrolled}</div>
                  </div>
                  <div style={{ padding: '8px 4px', backgroundColor: '#EFF6FF', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#1D4ED8', textTransform: 'uppercase' }}>Rate</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1D4ED8' }}>{presentPercent}%</div>
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div
                    style={{
                      height: '8px',
                      backgroundColor: '#E2E8F0',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${presentPercent}%`,
                        backgroundColor: presentPercent >= 75 ? '#198754' : '#E7A23B',
                        borderRadius: '4px',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '6px', fontSize: '0.74rem', color: '#64748B' }}>
                    <ShieldCheck size={14} color="#198754" />
                    <span>Fixed Center GPS + Anti-Proxy</span>
                  </div>

                  <button
                    onClick={() => setIsManageStudentsOpen(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#243B7A',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    Manage Student List →
                  </button>
                </div>
              </div>

              {/* Real-Time Scan Feed */}
              <div
                className="vs-card"
                style={{
                  flex: 1,
                  padding: '20px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border)',
                }}
              >
                <h3
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: 800,
                    color: '#172554',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>Live Student Check-Ins</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#166534' }}>
                    ● Real-Time Feed
                  </span>
                </h3>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    maxHeight: '260px',
                    overflowY: 'auto',
                  }}
                >
                  {activeSession.recentCheckIns && activeSession.recentCheckIns.length > 0 ? (
                    activeSession.recentCheckIns.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          backgroundColor: idx === 0 ? '#F0FDF4' : '#F8FAFC',
                          borderRadius: 'var(--radius-md)',
                          border: `1px solid ${idx === 0 ? '#BBF7D0' : '#E2E8F0'}`,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <CheckCircle2 size={16} color="#198754" />
                          <div>
                            <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#172554' }}>
                              {item.studentName}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                              Roll: {item.rollNo} • Section {activeSession.section}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              backgroundColor: item.source === 'manual' ? '#DBEAFE' : '#DCFCE7',
                              color: item.source === 'manual' ? '#1D4ED8' : '#15803D',
                              padding: '2px 8px',
                              borderRadius: '4px',
                            }}
                          >
                            {item.source === 'manual' ? 'Manual' : 'QR Verified'}
                          </span>
                          <span
                            style={{
                              fontSize: '0.74rem',
                              fontWeight: 600,
                              color: '#64748B',
                            }}
                          >
                            {new Date(item.markedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div
                      style={{
                        padding: '32px 16px',
                        textAlign: 'center',
                        color: '#64748B',
                        fontSize: '0.84rem',
                        backgroundColor: '#F8FAFC',
                        borderRadius: 'var(--radius-md)',
                        border: '1px dashed #CBD5E1',
                      }}
                    >
                      <Users size={28} style={{ margin: '0 auto 8px auto', display: 'block', opacity: 0.4 }} />
                      <span>Waiting for students to scan the live QR code...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 4. "MANAGE STUDENTS" COHORT MODAL (Requirement 7) */}
      {isManageStudentsOpen && activeSession && (
        <div
          className="vs-modal-backdrop"
          onClick={() => setIsManageStudentsOpen(false)}
          style={{ zIndex: 1100 }}
        >
          <div
            className="vs-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '820px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px',
              borderRadius: 'var(--radius-xl)',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 25px 50px -12px rgba(23, 37, 84, 0.25)',
              border: '1px solid #CBD5E1',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
                borderBottom: '1px solid #E2E8F0',
                paddingBottom: '14px',
              }}
            >
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#172554', margin: 0 }}>
                  Manage Students Attendance
                </h2>
                <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '4px 0 0 0' }}>
                  {activeSession?.subject || activeSession?.courseName} • Section {activeSession?.section} • Semester {activeSession?.semester || 1}
                </p>
              </div>

              <button
                onClick={() => setIsManageStudentsOpen(false)}
                style={{
                  background: '#F1F5F9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748B',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Turnout Stats Bar */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '12px',
                marginBottom: '16px',
              }}
            >
              <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>Total Cohort</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#172554' }}>
                  {cohortSummary.totalCohort || cohortStudents.length}
                </div>
              </div>

              <div style={{ padding: '12px', backgroundColor: '#F0FDF4', borderRadius: '8px', border: '1px solid #BBF7D0', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: '#166534', fontWeight: 700 }}>Total Present</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#15803D' }}>
                  {cohortSummary.totalPresent}
                </div>
              </div>

              <div style={{ padding: '12px', backgroundColor: '#FEF2F2', borderRadius: '8px', border: '1px solid #FECACA', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: '#991B1B', fontWeight: 700 }}>Total Absent</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#DC2626' }}>
                  {cohortSummary.totalAbsent}
                </div>
              </div>

              <div style={{ padding: '12px', backgroundColor: '#EFF6FF', borderRadius: '8px', border: '1px solid #BFDBFE', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: '#1E40AF', fontWeight: 700 }}>QR Verified</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1D4ED8' }}>
                  {cohortSummary.qrVerifiedCount}
                </div>
              </div>

              <div style={{ padding: '12px', backgroundColor: '#FAF5FF', borderRadius: '8px', border: '1px solid #E9D5FF', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: '#6B21A8', fontWeight: 700 }}>Manually Marked</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#7E22CE' }}>
                  {cohortSummary.manualCount}
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: '16px',
              }}
            >
              <div style={{ position: 'relative', flex: '1 1 240px' }}>
                <Search size={16} color="#64748B" style={{ position: 'absolute', left: '12px', top: '10px' }} />
                <input
                  type="text"
                  placeholder="Search students by name or roll number..."
                  value={cohortSearch}
                  onChange={(e) => setCohortSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 36px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.84rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => setCohortFilter('all')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: cohortFilter === 'all' ? '#243B7A' : '#CBD5E1',
                    backgroundColor: cohortFilter === 'all' ? '#243B7A' : '#FFFFFF',
                    color: cohortFilter === 'all' ? '#FFFFFF' : '#475569',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  All ({cohortStudents.length})
                </button>
                <button
                  onClick={() => setCohortFilter('present')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: cohortFilter === 'present' ? '#166534' : '#CBD5E1',
                    backgroundColor: cohortFilter === 'present' ? '#166534' : '#FFFFFF',
                    color: cohortFilter === 'present' ? '#FFFFFF' : '#475569',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Present ({cohortSummary.totalPresent})
                </button>
                <button
                  onClick={() => setCohortFilter('absent')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: cohortFilter === 'absent' ? '#DC2626' : '#CBD5E1',
                    backgroundColor: cohortFilter === 'absent' ? '#DC2626' : '#FFFFFF',
                    color: cohortFilter === 'absent' ? '#FFFFFF' : '#475569',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Absent ({cohortSummary.totalAbsent})
                </button>
              </div>
            </div>

            {/* Students Table */}
            <div
              style={{
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                overflow: 'hidden',
                maxHeight: '440px',
                overflowY: 'auto',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ padding: '10px 14px', fontWeight: 700, color: '#475569' }}>Student</th>
                    <th style={{ padding: '10px 14px', fontWeight: 700, color: '#475569' }}>Roll No</th>
                    <th style={{ padding: '10px 14px', fontWeight: 700, color: '#475569' }}>Status</th>
                    <th style={{ padding: '10px 14px', fontWeight: 700, color: '#475569' }}>Source</th>
                    <th style={{ padding: '10px 14px', fontWeight: 700, color: '#475569', textAlign: 'right' }}>
                      Manual Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((s) => {
                      const isPresent = s.status === 'PRESENT';
                      const isUpdating = updatingStudentId === s.studentId;

                      return (
                        <tr
                          key={s.studentId}
                          style={{
                            borderBottom: '1px solid #F1F5F9',
                            backgroundColor: isPresent ? '#FAFDFA' : '#FFFFFF',
                          }}
                        >
                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ fontWeight: 700, color: '#172554' }}>{s.name}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{s.email}</div>
                          </td>

                          <td style={{ padding: '10px 14px', fontWeight: 600, color: '#475569' }}>
                            {s.rollNo}
                          </td>

                          <td style={{ padding: '10px 14px' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.74rem',
                                fontWeight: 800,
                                padding: '3px 8px',
                                borderRadius: '4px',
                                backgroundColor: isPresent ? '#DCFCE7' : '#FEE2E2',
                                color: isPresent ? '#15803D' : '#B91C1C',
                              }}
                            >
                              {isPresent ? '✓ PRESENT' : '✗ ABSENT'}
                            </span>
                          </td>

                          <td style={{ padding: '10px 14px' }}>
                            {s.source === 'qr' ? (
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  backgroundColor: '#DCFCE7',
                                  color: '#166534',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  border: '1px solid #BBF7D0',
                                }}
                              >
                                QR Verified
                              </span>
                            ) : s.source === 'manual' ? (
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  backgroundColor: '#DBEAFE',
                                  color: '#1D4ED8',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  border: '1px solid #BFDBFE',
                                }}
                              >
                                Manual
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>—</span>
                            )}
                          </td>

                          <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                            <button
                              onClick={() => handleManualMark(s.studentId, s.status)}
                              disabled={isUpdating}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: '1px solid',
                                borderColor: isPresent ? '#FECACA' : '#BBF7D0',
                                backgroundColor: isPresent ? '#FEF2F2' : '#F0FDF4',
                                color: isPresent ? '#DC2626' : '#166534',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                cursor: isUpdating ? 'not-allowed' : 'pointer',
                              }}
                            >
                              {isUpdating
                                ? 'Updating...'
                                : isPresent
                                ? 'Mark Absent'
                                : 'Mark Present'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#64748B' }}>
                        No students found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                marginTop: '16px',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={() => setIsManageStudentsOpen(false)}
                style={{
                  padding: '8px 18px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#243B7A',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
