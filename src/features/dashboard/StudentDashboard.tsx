'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Calendar,
  Clock,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  TrendingUp,
  Award,
  Briefcase,
  Users,
  Sparkles,
  ArrowRight,
  FileText,
  AlertCircle,
  HelpCircle,
  ChevronRight,
} from 'lucide-react';
import { getTimeGreeting, getFormattedCurrentDate } from '@/utils/greeting';

export const StudentDashboard: React.FC = () => {
  const {
    currentUser,
    overallAttendancePercentage,
    attendanceRecords,
    timetable,
    assignments,
    successScore,
    skills,
    placements,
    setIsQrScannerOpen,
    setIsScoreModalOpen,
    setActiveTab,
  } = useApp();

  const [personalAnalytics, setPersonalAnalytics] = useState<any>(null);
  const [greeting, setGreeting] = useState<string>(() => getTimeGreeting());
  const [currentDateString, setCurrentDateString] = useState<string>(() => getFormattedCurrentDate());

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setGreeting(getTimeGreeting(now));
      setCurrentDateString(getFormattedCurrentDate(now));
    };
    updateDateTime();
    const timer = setInterval(updateDateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetch('/api/analytics/student')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.analytics) setPersonalAnalytics(d.analytics);
      })
      .catch(() => {});
  }, []);

  const isZeroState = Boolean(
    personalAnalytics?.isZeroState ||
    personalAnalytics?.successScore?.formulaBreakdown?.isZeroState ||
    (attendanceRecords.length === 0 && !personalAnalytics?.analytics_profile && (!currentUser?.rollNo || currentUser?.rollNo === 'Unassigned'))
  );
  const activeScore = isZeroState ? 0 : (personalAnalytics?.successScore?.overallScore ?? successScore.overallScore);
  const activeBand = isZeroState
    ? 'Needs Attention'
    : (personalAnalytics?.successScore?.band ?? (activeScore >= 80 ? 'Strong' : activeScore >= 65 ? 'Stable' : activeScore >= 50 ? 'Needs Attention' : 'High Risk'));
  const positiveContributors = personalAnalytics?.successScore?.positiveContributors || [];
  const attentionAreas = personalAnalytics?.successScore?.attentionAreas || [];
  const scoreFactors = personalAnalytics?.successScore?.factors || [];

  const liveLecture = timetable.find((t) => t.status === 'live');
  const pendingAssignments = assignments.filter((a) => a.status === 'pending');
  const criticalAttendance = attendanceRecords.find((a) => a.percentage < 75);

  return (
    <div style={{ width: '100%', padding: '16px 28px' }}>
      {/* 1. Welcoming Student Greeting Section (DESIGN.md Section 4) */}
      <section
        className="vs-card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderLeft: '5px solid #243B7A', // Vidya Indigo
          boxShadow: '0 4px 16px -2px rgba(23, 37, 84, 0.06)',
          padding: '20px 24px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span
              style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                color: '#243B7A',
                backgroundColor: '#EEF2FB',
                border: '1px solid #D6E0F5',
                padding: '2px 9px',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#E7A23B' }} />
              Roll: {currentUser?.rollNo || 'Unassigned'}
            </span>
            <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
              {currentUser?.course || currentUser?.department || 'Department Pending'} • Sem {currentUser?.semester || '—'} {currentUser?.section ? `(${currentUser.section})` : ''}
            </span>
          </div>
          <h1
            style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: '#172554', // Deep Navy
              lineHeight: 1.2,
            }}
          >
            {greeting}, {currentUser?.name?.split(' ')[0] || 'Student'}
          </h1>
          <p style={{ fontSize: '0.84rem', color: '#64748B', marginTop: '3px', fontWeight: 500 }}>
            Welcome back to your academic journey • Today is {currentDateString || getFormattedCurrentDate()}
          </p>
        </div>

        {/* Prominent Quick Scan QR Attendance Action */}
        <button
          onClick={() => setIsQrScannerOpen(true)}
          className="vs-btn-primary"
          style={{
            padding: '12px 22px',
            fontSize: '0.9rem',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: '#243B7A', // Vidya Indigo
            color: '#FFFFFF',
            boxShadow: '0 6px 18px rgba(36, 59, 122, 0.28)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <QrCode size={20} strokeWidth={2.3} color="#E7A23B" /> {/* Sutra Saffron */}
          <span>Scan Live Classroom QR</span>
        </button>
      </section>

      {/* Zero-State Academic Telemetry Banner */}
      {isZeroState && (
        <div
          className="vs-card"
          style={{
            backgroundColor: '#FFFBEB',
            border: '1px solid #FDE68A',
            borderLeft: '5px solid #D97706',
            padding: '16px 20px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                backgroundColor: '#FEF3C7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#D97706',
                flexShrink: 0,
              }}
            >
              <AlertCircle size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 800, color: '#92400E', fontSize: '0.92rem' }}>
                Zero-State Telemetry • Awaiting Batch Allotment
              </div>
              <div style={{ color: '#B45309', fontSize: '0.8rem', marginTop: '2px', lineHeight: 1.4 }}>
                No attendance or academic records found yet for this account. Please check your allotted batch and section (e.g., CSE-A) with your department coordinator or attend your scheduled class to initialize live telemetry.
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsScoreModalOpen(true)}
            style={{
              padding: '7px 14px',
              backgroundColor: '#D97706',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Check Batch Telemetry
          </button>
        </div>
      )}

      {/* 2. Success Score + AI Insight Cards (DESIGN.md Sections 8 & 9) */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {/* Success Score Card */}
        <div
          className="vs-card vs-card-hover"
          onClick={() => setIsScoreModalOpen(true)}
          style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            borderLeft: '4px solid #243B7A',
            backgroundColor: '#FFFFFF',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <TrendingUp size={16} color="#243B7A" />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                Student Success Score
              </span>
              <span
                className={`vs-badge ${
                  activeScore >= 80
                    ? 'vs-badge-safe'
                    : activeScore >= 60
                    ? 'vs-badge-info'
                    : activeScore >= 40
                    ? 'vs-badge-warning'
                    : 'vs-badge-danger'
                }`}
                style={{ fontSize: '0.68rem', padding: '1px 6px' }}
              >
                {activeBand}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '2.1rem', fontWeight: 800, color: '#172554', lineHeight: 1 }}>
                {activeScore}
              </span>
              <span style={{ fontSize: '0.95rem', color: '#64748B', fontWeight: 600 }}>
                / 100
              </span>
            </div>

            <p style={{ fontSize: '0.76rem', color: isZeroState ? '#B45309' : '#15803D', fontWeight: 600, marginTop: '4px' }}>
              {isZeroState ? 'Awaiting initial class telemetry & batch allocation' : 'Formula: 45% Attendance + 35% Assignments + 20% LMS'}
            </p>

            <button
              onClick={() => setIsScoreModalOpen(true)}
              style={{
                marginTop: '10px',
                background: 'none',
                border: 'none',
                color: '#243B7A',
                fontWeight: 700,
                fontSize: '0.78rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: 0,
                cursor: 'pointer',
              }}
            >
              <span>View why & recovery plan</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Circular Visual Gauge */}
          <div style={{ position: 'relative', width: '84px', height: '84px', flexShrink: 0 }}>
            <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="3.4"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#243B7A"
                strokeDasharray={`${activeScore}, 100`}
                strokeWidth="3.4"
                strokeLinecap="round"
              />
            </svg>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: '1rem', fontWeight: 800, color: '#172554' }}>
                {activeScore}%
              </span>
            </div>
          </div>
        </div>

        {/* AI Insight Card (Explainable behavioral intelligence) */}
        <div
          className="vs-card vs-card-hover"
          style={{
            background: 'linear-gradient(135deg, #EEF2FB 0%, #FFFFFF 100%)',
            border: '1px solid #D6E0F5',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={16} color="#E7A23B" />
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#172554', textTransform: 'uppercase' }}>
                AI Academic Diagnostic
              </span>
            </div>
            <span
              className={`vs-badge ${
                criticalAttendance
                  ? 'vs-badge-danger'
                  : attendanceRecords.length > 0
                  ? 'vs-badge-safe'
                  : 'vs-badge-info'
              }`}
              style={{ fontSize: '0.68rem' }}
            >
              {criticalAttendance ? 'Action Required' : attendanceRecords.length > 0 ? 'On Track' : 'Initial Standing'}
            </span>
          </div>

          <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#172554', marginBottom: '6px' }}>
            {criticalAttendance
              ? `${criticalAttendance.code} Attendance dropped to ${criticalAttendance.percentage}%`
              : attendanceRecords.length > 0
              ? 'Consistent Academic Pace'
              : 'Awaiting Academic Telemetry'}
          </h3>
          <p style={{ fontSize: '0.78rem', color: '#64748B', lineHeight: 1.45, marginBottom: '12px' }}>
            {criticalAttendance
              ? `Below the 75% exam hall-ticket rule. Attending the next 2 lectures will lift your standing to 76.2%.`
              : attendanceRecords.length > 0
              ? successScore.topInsight
              : 'Awaiting academic telemetry. Attend scheduled lectures to generate diagnostic reports.'}
          </p>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveTab('attendance')}
              className="vs-btn-primary"
              style={{
                padding: '7px 14px',
                fontSize: '0.76rem',
                backgroundColor: '#243B7A',
                color: '#FFFFFF',
                borderRadius: '8px',
              }}
            >
              <span>View Attendance Log</span>
            </button>
            <button
              onClick={() => setIsScoreModalOpen(true)}
              className="vs-btn-secondary"
              style={{ padding: '7px 14px', fontSize: '0.76rem', borderRadius: '8px' }}
            >
              <span>What-if Simulator</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3. Feature Cards Grid (DESIGN.md Section 7) */}
      <section style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)', marginBottom: '12px' }}>
          Academic Core Modules
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '12px',
          }}
        >
          {/* Card 1: Attendance */}
          <div
            className="vs-card vs-card-hover"
            onClick={() => setActiveTab('attendance')}
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-lg)',
              cursor: 'pointer',
              backgroundColor: '#FFFFFF',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '10px',
              }}
            >
              <CheckCircle2 size={18} />
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Attendance
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', marginTop: '2px' }}>
              {attendanceRecords.length > 0 ? `${overallAttendancePercentage}%` : '0%'}
            </div>
            <div style={{ fontSize: '0.7rem', color: criticalAttendance ? 'var(--danger-text)' : attendanceRecords.length > 0 ? 'var(--success-text)' : 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>
              {criticalAttendance
                ? `1 Warning (${criticalAttendance.code})`
                : attendanceRecords.length > 0
                ? 'All Enrolled Courses Safe'
                : 'No attendance logged'}
            </div>
          </div>

          {/* Card 2: Timetable */}
          <div
            className="vs-card vs-card-hover"
            onClick={() => setActiveTab('timetable')}
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-lg)',
              cursor: 'pointer',
              backgroundColor: '#FFFFFF',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'var(--info-light)',
                color: 'var(--info)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '10px',
              }}
            >
              <Calendar size={18} />
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Timetable
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', marginTop: '2px' }}>
              {timetable.length} Classes
            </div>
            <div style={{ fontSize: '0.7rem', color: liveLecture ? 'var(--danger-text)' : 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>
              {liveLecture ? '1 Live Now' : timetable.length > 0 ? 'No Live Class' : 'No live classes scheduled'}
            </div>
          </div>

          {/* Card 3: Assignments */}
          <div
            className="vs-card vs-card-hover"
            onClick={() => setActiveTab('assignments')}
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-lg)',
              cursor: 'pointer',
              backgroundColor: '#FFFFFF',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'var(--warning-light)',
                color: 'var(--warning-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '10px',
              }}
            >
              <FileText size={18} />
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Assignments
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', marginTop: '2px' }}>
              {pendingAssignments.length} Pending
            </div>
            <div style={{ fontSize: '0.7rem', color: pendingAssignments.length > 0 ? 'var(--warning-text)' : 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>
              {pendingAssignments.length > 0 ? `${pendingAssignments.length} Need Action` : assignments.length > 0 ? 'All Completed' : '0 Pending'}
            </div>
          </div>

          {/* Card 4: Placements */}
          <div
            className="vs-card vs-card-hover"
            onClick={() => setActiveTab('placements')}
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-lg)',
              cursor: 'pointer',
              backgroundColor: '#FFFFFF',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'var(--success-light)',
                color: 'var(--success-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '10px',
              }}
            >
              <Briefcase size={18} />
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Placements
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', marginTop: '2px' }}>
              {placements.length} Drives
            </div>
            <div style={{ fontSize: '0.7rem', color: placements.length > 0 ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>
              {placements.length > 0 ? 'Open Applications' : '0 Active Drives'}
            </div>
          </div>

          {/* Card 5: Skills */}
          <div
            className="vs-card vs-card-hover"
            onClick={() => setActiveTab('skills')}
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-lg)',
              cursor: 'pointer',
              backgroundColor: '#FFFFFF',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'var(--purple-light)',
                color: 'var(--purple-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '10px',
              }}
            >
              <Award size={18} />
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Skills Passport
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', marginTop: '2px' }}>
              {skills.filter((s) => s.verified).length} Verified
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '2px' }}>
              {skills.length > 0 ? `${skills.filter((s) => !s.verified).length} In Review` : '0 Verified'}
            </div>
          </div>

          {/* Card 6: Notes / LMS */}
          <div
            className="vs-card vs-card-hover"
            onClick={() => setActiveTab('timetable')}
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-lg)',
              cursor: 'pointer',
              backgroundColor: '#FFFFFF',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: '#F1F5F9',
                color: 'var(--text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '10px',
              }}
            >
              <BookOpen size={18} />
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Academic LMS
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', marginTop: '2px' }}>
              Course Hub
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '2px' }}>
              Syllabus & Notes
            </div>
          </div>
        </div>
      </section>

      {/* 4. Today's Timetable Lecture Banner (DESIGN.md Section 4) */}
      <section style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)' }}>
            Today's Timetable
          </h2>
          <button
            onClick={() => setActiveTab('timetable')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
            }}
          >
            View Weekly Schedule →
          </button>
        </div>

        {timetable.length === 0 ? (
          <div
            className="vs-card"
            style={{
              padding: '24px',
              backgroundColor: '#FFFFFF',
              border: '1.5px dashed var(--border)',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              No classes allotted yet. Contact your coordinator or administrator.
            </p>
          </div>
        ) : (
          <>
            {liveLecture && (
              <div
                className="vs-card"
                style={{
                  background: 'linear-gradient(135deg, var(--primary-light) 0%, #FFFFFF 100%)',
                  border: '1.5px solid var(--border)',
                  marginBottom: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        backgroundColor: 'var(--danger)',
                        color: '#FFFFFF',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#FFFFFF', display: 'inline-block' }} />
                      LIVE NOW
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {liveLecture.startTime} – {liveLecture.endTime}
                    </span>
                  </div>
                  <span className="vs-badge vs-badge-info">{liveLecture.room}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)' }}>
                      {liveLecture.subject} ({liveLecture.code})
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Instructor: <strong>{liveLecture.faculty}</strong>
                    </p>
                  </div>

                  <button
                    onClick={() => setIsQrScannerOpen(true)}
                    className="vs-btn-primary"
                    style={{ padding: '8px 16px', borderRadius: 'var(--radius-full)' }}
                  >
                    <QrCode size={16} />
                    <span>Mark Attendance</span>
                  </button>
                </div>
              </div>
            )}

            {timetable[0] && !liveLecture && (
              <div
                className="vs-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      backgroundColor: 'var(--primary-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--primary)',
                    }}
                  >
                    <Clock size={20} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        NEXT UP ({timetable[0].startTime})
                      </span>
                      <span className="vs-badge" style={{ backgroundColor: 'var(--primary-light)', fontSize: '0.65rem' }}>
                        {timetable[0].type}
                      </span>
                    </div>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text)' }}>
                      {timetable[0].subject} ({timetable[0].code})
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {timetable[0].faculty} • {timetable[0].room}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsQrScannerOpen(true)}
                  className="vs-btn-primary"
                  style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                >
                  Check In
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* 5. Your Next Priorities Section */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)', marginBottom: '12px' }}>
          Your Next Priorities
        </h2>

        {criticalAttendance || pendingAssignments.length > 0 || skills.filter((s) => !s.verified).length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {criticalAttendance && (
              <div
                className="vs-card vs-card-hover"
                onClick={() => setIsQrScannerOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  cursor: 'pointer',
                  borderLeft: '4px solid var(--danger)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--danger-light)',
                      color: 'var(--danger-text)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                    }}
                  >
                    1
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)' }}>
                      Scan Attendance for {criticalAttendance.code}
                    </h4>
                    <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      Urgent: Standing is currently at {criticalAttendance.percentage}%. Minimum 75% required.
                    </p>
                  </div>
                </div>
                <span className="vs-badge vs-badge-danger">Priority Action</span>
              </div>
            )}

            {pendingAssignments.length > 0 && (
              <div
                className="vs-card vs-card-hover"
                onClick={() => setActiveTab('assignments')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  cursor: 'pointer',
                  borderLeft: '4px solid var(--warning)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--warning-light)',
                      color: 'var(--warning-text)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                    }}
                  >
                    2
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)' }}>
                      Submit {pendingAssignments[0].title}
                    </h4>
                    <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      Due {pendingAssignments[0].dueDate} at {pendingAssignments[0].dueTime}
                    </p>
                  </div>
                </div>
                <span className="vs-badge vs-badge-warning">Due Soon</span>
              </div>
            )}
          </div>
        ) : (
          <div
            className="vs-card"
            style={{
              padding: '24px',
              backgroundColor: '#FFFFFF',
              border: '1.5px dashed var(--border)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'var(--success-light)',
                color: 'var(--success-text)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '8px',
              }}
            >
              <CheckCircle2 size={20} />
            </div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text)', marginBottom: '2px' }}>
              All Caught Up!
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              No critical attendance warnings or pending submissions required right now.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};
