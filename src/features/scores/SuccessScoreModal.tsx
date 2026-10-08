'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import {
  X,
  TrendingUp,
  Award,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  Sliders,
  RefreshCw,
  Calculator,
  Compass,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { StudentAnalyticsDetail } from '@/services/analyticsService';

export const SuccessScoreModal: React.FC = () => {
  const { isScoreModalOpen, setIsScoreModalOpen, currentUser } = useApp();
  const [analytics, setAnalytics] = useState<StudentAnalyticsDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // What-if Simulator State: classes attended out of next 15 scheduled sessions
  const [simulatorFutureClasses, setSimulatorFutureClasses] = useState<number>(12);
  const totalUpcomingSessions = 15;

  useEffect(() => {
    if (isScoreModalOpen) {
      setIsLoading(true);
      setError(null);
      fetch('/api/analytics/student')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && (data.analytics || data.student)) {
            setAnalytics(data.analytics || data.student);
          } else {
            setError(data.error || 'Failed to load personal success analytics');
          }
        })
        .catch((err) => setError(err.message || 'Network error'))
        .finally(() => setIsLoading(false));
    }
  }, [isScoreModalOpen]);

  // Baseline data extraction
  const score = analytics?.successScore;
  const isZeroState = Boolean(analytics?.isZeroState || score?.formulaBreakdown?.isZeroState);
  const currentAttendance = analytics?.attendanceAvg ?? (isZeroState ? 0 : 82);
  const currentAssignments = analytics?.assignmentsTotal && analytics.assignmentsTotal > 0
    ? Math.round(((analytics.assignmentsCompleted || 0) / analytics.assignmentsTotal) * 100)
    : (isZeroState ? 0 : 80);
  const currentLms = analytics?.lmsActivityScore ?? (isZeroState ? 0 : 80);

  // Core formula components: (45% Attendance) + (35% Assignment Submissions) + (20% LMS/Quiz Engagement)
  const attendancePts = Math.round(currentAttendance * 0.45 * 10) / 10;
  const assignmentsPts = Math.round(currentAssignments * 0.35 * 10) / 10;
  const lmsPts = Math.round(currentLms * 0.20 * 10) / 10;
  const calculatedCompositeScore = Math.round(attendancePts + assignmentsPts + lmsPts);

  // What-if Simulation Calculations
  const assumedPastConducted = 40;
  const assumedPastAttended = Math.round((currentAttendance / 100) * assumedPastConducted);
  
  const projectedAttendance = useMemo(() => {
    const totalSessions = assumedPastConducted + totalUpcomingSessions;
    const totalAttended = assumedPastAttended + simulatorFutureClasses;
    return Math.min(Math.max(Math.round((totalAttended / totalSessions) * 1000) / 10, 0), 100);
  }, [assumedPastAttended, assumedPastConducted, simulatorFutureClasses]);

  const projectedScore = useMemo(() => {
    const projAttPts = projectedAttendance * 0.45;
    const projAssignPts = currentAssignments * 0.35;
    const projLmsPts = currentLms * 0.20;
    return Math.min(Math.max(Math.round(projAttPts + projAssignPts + projLmsPts), 0), 100);
  }, [projectedAttendance, currentAssignments, currentLms]);

  const scoreDelta = projectedScore - (score?.overallScore ?? calculatedCompositeScore);

  const getStandingBand = (s: number) => {
    if (s >= 80) return 'Strong';
    if (s >= 65) return 'Stable';
    if (s >= 50) return 'Needs Attention';
    return 'High Risk';
  };

  const getAttendanceZone = (att: number) => {
    if (att >= 75) return { label: 'Safe (>75%)', color: '#15803D', bg: '#DCFCE7', border: '#BBF7D0' };
    if (att >= 65) return { label: 'Warning (65-75%)', color: '#B45309', bg: '#FEF3C7', border: '#FDE68A' };
    return { label: 'Critical (<65%)', color: '#DC2626', bg: '#FEE2E2', border: '#FECACA' };
  };

  if (!isScoreModalOpen) return null;

  return (
    <div className="vs-modal-backdrop" onClick={() => setIsScoreModalOpen(false)}>
      <div
        className="vs-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '740px',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '26px',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 24px 50px rgba(23, 37, 84, 0.25)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: '#EEF2FB',
                color: '#243B7A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(36, 59, 122, 0.1)',
              }}
            >
              <Calculator size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.28rem', fontWeight: 800, color: '#172554', margin: 0 }}>
                Explainable Success Score & Recovery Plan
              </h2>
              <p style={{ fontSize: '0.78rem', color: '#64748B', margin: 0, marginTop: '2px' }}>
                Mathematical Attribution: (45% Attendance) + (35% Assignments) + (20% LMS/Quizzes)
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsScoreModalOpen(false)}
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

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#64748B', fontSize: '0.9rem' }}>
            <RefreshCw size={26} className="animate-spin" style={{ margin: '0 auto 12px', color: '#243B7A' }} />
            Evaluating deterministic mathematical telemetry...
          </div>
        ) : error ? (
          <div style={{ padding: '16px', backgroundColor: '#FEF2F2', color: '#DC2626', borderRadius: '8px', fontSize: '0.85rem' }}>
            {error}
          </div>
        ) : isZeroState ? (
          /* Zero-State Telemetry Screen */
          <div
            style={{
              padding: '28px',
              backgroundColor: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: 'var(--radius-lg)',
              textAlign: 'center',
              marginBottom: '20px',
            }}
          >
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#D97706' }}>
              <AlertCircle size={26} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#92400E', margin: 0, marginBottom: '6px' }}>
              Zero-State Academic Telemetry
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#B45309', maxWidth: '520px', margin: '0 auto 18px', lineHeight: 1.5 }}>
              Welcome to VidyaSutra! No attendance or academic records have been logged yet for your account. Please check your allotted batch and section (e.g., CSE-A) with your department coordinator or attend your first classroom lecture to initialize telemetry.
            </p>
            <div style={{ display: 'inline-flex', gap: '8px', backgroundColor: '#FFFFFF', padding: '10px 16px', borderRadius: '8px', border: '1px solid #FDE68A', fontSize: '0.78rem', color: '#92400E', fontWeight: 600 }}>
              <span>Assigned Roll No: {currentUser?.rollNo || 'Pending Allotment'}</span>
              <span>•</span>
              <span>Department: {currentUser?.department || 'CSE'}</span>
            </div>
          </div>
        ) : (
          <>
            {/* 1. Score Summary Banner */}
            <div
              style={{
                background: 'linear-gradient(135deg, #172554 0%, #243B7A 100%)',
                color: '#FFFFFF',
                borderRadius: 'var(--radius-lg)',
                padding: '22px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
                marginBottom: '20px',
                boxShadow: '0 8px 24px -4px rgba(23, 37, 84, 0.28)',
              }}
            >
              <div>
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#E7A23B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Current Student Success Index
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '4px' }}>
                  <span style={{ fontSize: '2.6rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>
                    {score?.overallScore ?? calculatedCompositeScore}
                  </span>
                  <span style={{ fontSize: '1.1rem', color: '#BFDBFE' }}>/ 100</span>
                  <span
                    style={{
                      fontSize: '0.76rem',
                      backgroundColor:
                        (score?.overallScore ?? calculatedCompositeScore) >= 80
                          ? '#15803D'
                          : (score?.overallScore ?? calculatedCompositeScore) >= 65
                          ? '#1D4ED8'
                          : (score?.overallScore ?? calculatedCompositeScore) >= 50
                          ? '#D97706'
                          : '#DC2626',
                      color: '#FFFFFF',
                      padding: '3px 10px',
                      borderRadius: '999px',
                      fontWeight: 700,
                    }}
                  >
                    {score?.band ?? getStandingBand(calculatedCompositeScore)} Band
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#DBEAFE', marginTop: '6px', margin: 0 }}>
                  Formula: <strong>45% Attendance + 35% Assignments + 20% LMS/Quizzes</strong>
                </p>
              </div>

              <div
                style={{
                  padding: '12px 18px',
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '0.72rem', color: '#DBEAFE', fontWeight: 600 }}>Attendance Tier</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', marginTop: '2px' }}>
                  {currentAttendance}%
                </div>
                <div style={{ fontSize: '0.68rem', color: currentAttendance >= 75 ? '#86EFAC' : currentAttendance >= 65 ? '#FDE047' : '#FCA5A5', marginTop: '2px', fontWeight: 700 }}>
                  {currentAttendance >= 75 ? 'Safe (>75%)' : currentAttendance >= 65 ? 'Warning (65-75%)' : 'Critical (<65%)'}
                </div>
              </div>
            </div>

            {/* 2. Transparent Mathematical Breakdown Card */}
            <div
              style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 'var(--radius-lg)',
                padding: '18px 20px',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Calculator size={18} color="#243B7A" />
                <h3 style={{ fontSize: '0.94rem', fontWeight: 800, color: '#172554', margin: 0 }}>
                  Exact Mathematical Weight Attribution
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '14px' }}>
                {/* Pillar 1: Attendance */}
                <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748B' }}>1. Attendance (45%)</span>
                    <span
                      style={{
                        fontSize: '0.66rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: currentAttendance >= 75 ? '#DCFCE7' : currentAttendance >= 65 ? '#FEF3C7' : '#FEE2E2',
                        color: currentAttendance >= 75 ? '#15803D' : currentAttendance >= 65 ? '#B45309' : '#DC2626',
                      }}
                    >
                      {currentAttendance >= 75 ? 'SAFE' : currentAttendance >= 65 ? 'WARN' : 'CRITICAL'}
                    </span>
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#172554' }}>
                    {attendancePts}{' '}
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>/ 45.0 pts</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '4px' }}>
                    Calculation: {currentAttendance}% × 0.45 = <strong>{attendancePts} pts</strong>
                  </div>
                </div>

                {/* Pillar 2: Assignments */}
                <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748B' }}>2. Assignments (35%)</span>
                    <span
                      style={{
                        fontSize: '0.66rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: currentAssignments >= 80 ? '#DCFCE7' : currentAssignments >= 60 ? '#FEF3C7' : '#FEE2E2',
                        color: currentAssignments >= 80 ? '#15803D' : currentAssignments >= 60 ? '#B45309' : '#DC2626',
                      }}
                    >
                      {currentAssignments >= 80 ? 'SAFE' : currentAssignments >= 60 ? 'WARN' : 'CRITICAL'}
                    </span>
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#172554' }}>
                    {assignmentsPts}{' '}
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>/ 35.0 pts</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '4px' }}>
                    Calculation: {currentAssignments}% × 0.35 = <strong>{assignmentsPts} pts</strong>
                  </div>
                </div>

                {/* Pillar 3: LMS / Quizzes */}
                <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748B' }}>3. LMS/Quizzes (20%)</span>
                    <span
                      style={{
                        fontSize: '0.66rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: currentLms >= 75 ? '#DCFCE7' : currentLms >= 50 ? '#FEF3C7' : '#FEE2E2',
                        color: currentLms >= 75 ? '#15803D' : currentLms >= 50 ? '#B45309' : '#DC2626',
                      }}
                    >
                      {currentLms >= 75 ? 'SAFE' : currentLms >= 50 ? 'WARN' : 'CRITICAL'}
                    </span>
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#172554' }}>
                    {lmsPts}{' '}
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>/ 20.0 pts</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '4px' }}>
                    Calculation: {currentLms}% × 0.20 = <strong>{lmsPts} pts</strong>
                  </div>
                </div>
              </div>

              {/* Total Equation summary line */}
              <div
                style={{
                  backgroundColor: '#EEF2FB',
                  border: '1px solid #D6E0F5',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px',
                  fontSize: '0.8rem',
                  color: '#172554',
                  fontWeight: 600,
                }}
              >
                <span>
                  Sum: ({attendancePts}) + ({assignmentsPts}) + ({lmsPts}) =
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#243B7A' }}>
                  {calculatedCompositeScore} / 100 Success Points
                </span>
              </div>
            </div>

            {/* 3. Interactive "What-if Simulator" Slider */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '2px solid #243B7A',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
                marginBottom: '20px',
                boxShadow: '0 4px 16px -2px rgba(36, 59, 122, 0.12)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sliders size={18} color="#243B7A" />
                  <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#172554', margin: 0 }}>
                    What-if Attendance & Score Simulator
                  </h3>
                </div>
                <span
                  style={{
                    fontSize: '0.72rem',
                    backgroundColor: '#EEF2FB',
                    color: '#243B7A',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    fontWeight: 700,
                  }}
                >
                  Interactive Projection
                </span>
              </div>

              <p style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 0, marginBottom: '14px' }}>
                Adjust the slider below to simulate your attendance over the next <strong>{totalUpcomingSessions} upcoming sessions</strong> and see projected changes to your hall-ticket eligibility and success score in real-time.
              </p>

              {/* Slider Input */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
                  <span>Future Lectures Attended:</span>
                  <span style={{ color: '#243B7A', fontSize: '0.9rem' }}>
                    {simulatorFutureClasses} of {totalUpcomingSessions} sessions ({Math.round((simulatorFutureClasses / totalUpcomingSessions) * 100)}%)
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={totalUpcomingSessions}
                  step="1"
                  value={simulatorFutureClasses}
                  onChange={(e) => setSimulatorFutureClasses(parseInt(e.target.value, 10))}
                  style={{
                    width: '100%',
                    height: '8px',
                    borderRadius: '4px',
                    accentColor: '#243B7A',
                    cursor: 'pointer',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94A3B8', marginTop: '4px' }}>
                  <span>0 (Miss all)</span>
                  <span>7 (50% pace)</span>
                  <span>15 (Perfect 100% attendance)</span>
                </div>
              </div>

              {/* Projection Result Metrics */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '10px',
                  backgroundColor: '#F8FAFC',
                  padding: '14px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>Projected Attendance</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
                    <span style={{ fontSize: '1.35rem', fontWeight: 800, color: getAttendanceZone(projectedAttendance).color }}>
                      {projectedAttendance}%
                    </span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: projectedAttendance >= currentAttendance ? '#15803D' : '#DC2626' }}>
                      {projectedAttendance >= currentAttendance ? `+${(projectedAttendance - currentAttendance).toFixed(1)}%` : `${(projectedAttendance - currentAttendance).toFixed(1)}%`}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: getAttendanceZone(projectedAttendance).color, marginTop: '2px' }}>
                    {getAttendanceZone(projectedAttendance).label}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>Projected Success Score</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
                    <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#172554' }}>
                      {projectedScore}
                    </span>
                    <span style={{ fontSize: '0.74rem', color: '#64748B' }}>/ 100</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: scoreDelta >= 0 ? '#15803D' : '#DC2626' }}>
                      {scoreDelta >= 0 ? `+${scoreDelta} pts` : `${scoreDelta} pts`}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#64748B', marginTop: '2px' }}>
                    Projected Band: <strong>{getStandingBand(projectedScore)}</strong>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>Hall-Ticket Status</div>
                  <div style={{ marginTop: '4px' }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: getAttendanceZone(projectedAttendance).bg,
                        color: getAttendanceZone(projectedAttendance).color,
                        border: `1px solid ${getAttendanceZone(projectedAttendance).border}`,
                        display: 'inline-block',
                      }}
                    >
                      {projectedAttendance >= 75 ? '✓ Hall-Ticket Eligible' : projectedAttendance >= 65 ? '⚠ Warning: Retest Risk' : '✕ Hall-Ticket Barred (<65%)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Specific Actions to Improve (Personal Recovery Plan) */}
            <div style={{ marginBottom: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Sparkles size={18} color="#E7A23B" />
                <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#172554', margin: 0 }}>
                  Personal Academic Recovery Plan & Direct Actions
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Action Item 1: Attendance */}
                <div
                  style={{
                    padding: '14px 16px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    borderLeft: `5px solid ${currentAttendance < 75 ? '#DC2626' : '#15803D'}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#172554' }}>
                        Step 1: Attendance Recovery Protocol
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '3px' }}>
                        {currentAttendance < 75
                          ? `Attend at least 6 consecutive upcoming classes without missing any to lift attendance from ${currentAttendance}% to safe >75% zone.`
                          : `Maintain consistency by attending 80%+ of scheduled lectures to preserve your safe status for mid-term exams.`}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#243B7A', backgroundColor: '#EEF2FB', padding: '2px 8px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                      Weight: 45%
                    </span>
                  </div>
                </div>

                {/* Action Item 2: Assignment Turnaround */}
                <div
                  style={{
                    padding: '14px 16px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    borderLeft: `5px solid ${currentAssignments < 80 ? '#E7A23B' : '#15803D'}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#172554' }}>
                        Step 2: Coursework & Assignment Completion
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '3px' }}>
                        {currentAssignments < 80
                          ? `Turn in pending submissions to recover missing marks. Reaching 90% completion gains up to +${Math.round((90 - currentAssignments) * 0.35)} composite points.`
                          : `High assignment turnaround (${currentAssignments}%). Ensure all upcoming lab exercises are uploaded on time.`}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#243B7A', backgroundColor: '#EEF2FB', padding: '2px 8px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                      Weight: 35%
                    </span>
                  </div>
                </div>

                {/* Action Item 3: LMS / Quiz Engagement */}
                <div
                  style={{
                    padding: '14px 16px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    borderLeft: `5px solid ${currentLms < 75 ? '#243B7A' : '#15803D'}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#172554' }}>
                        Step 3: LMS Self-Assessment & Quiz Activity
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '3px' }}>
                        Complete the weekly online module practice quizzes on the student learning portal to capture the remaining 20% engagement weight.
                      </div>
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#243B7A', backgroundColor: '#EEF2FB', padding: '2px 8px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                      Weight: 20%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <button
          onClick={() => setIsScoreModalOpen(false)}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#243B7A',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(36, 59, 122, 0.25)',
          }}
        >
          Close Diagnostic Plan
        </button>
      </div>
    </div>
  );
};
