'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  CheckCircle2,
  AlertTriangle,
  QrCode,
  TrendingUp,
  TrendingDown,
  Info,
  Calendar,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

export const AttendanceView: React.FC = () => {
  const {
    attendanceRecords,
    overallAttendancePercentage,
    setIsQrScannerOpen,
    activeSession,
  } = useApp();

  const [simulatorSubjectId, setSimulatorSubjectId] = useState<string>('att_01');
  const [hypotheticalClassesToAttend, setHypotheticalClassesToAttend] = useState<number>(3);

  const selectedSubject = attendanceRecords.find((s) => s.id === simulatorSubjectId) || attendanceRecords[0] || null;

  // What-if calculation
  const simulatedAttended = selectedSubject ? selectedSubject.attended + hypotheticalClassesToAttend : 0;
  const simulatedTotal = selectedSubject ? selectedSubject.total + hypotheticalClassesToAttend : 0;
  const simulatedPercentage = simulatedTotal > 0 ? parseFloat(((simulatedAttended / simulatedTotal) * 100).toFixed(1)) : 100;

  return (
    <div style={{ width: '100%', padding: '16px 28px' }}>
      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)' }}>
            Attendance & Eligibility
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Minimum 75.0% required across all subjects for semester examination hall ticket
          </p>
        </div>

        <button
          onClick={() => setIsQrScannerOpen(true)}
          className="vs-btn-primary"
          style={{ borderRadius: 'var(--radius-full)' }}
        >
          <QrCode size={16} />
          <span>Scan Live Classroom QR</span>
        </button>
      </div>

      {/* Aggregate Attendance Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {/* Overall Percentage Card */}
        <div
          className="vs-card"
          style={{
            background: attendanceRecords.length === 0
              ? '#FFFFFF'
              : overallAttendancePercentage >= 75
              ? 'linear-gradient(135deg, #ECFDF5 0%, #FFFFFF 100%)'
              : 'linear-gradient(135deg, #FFFBEB 0%, #FFFFFF 100%)',
            border: `1.5px solid ${
              attendanceRecords.length === 0
                ? 'var(--border)'
                : overallAttendancePercentage >= 75
                ? '#A7F3D0'
                : '#FDE68A'
            }`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Overall Standing
            </span>
            <span
              className={`vs-badge ${
                attendanceRecords.length === 0
                  ? 'vs-badge-info'
                  : overallAttendancePercentage >= 75
                  ? 'vs-badge-safe'
                  : 'vs-badge-warning'
              }`}
            >
              {attendanceRecords.length === 0 ? 'No Data' : overallAttendancePercentage >= 75 ? 'Eligible' : 'Warning'}
            </span>
          </div>

          <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>
            {attendanceRecords.length > 0 ? `${overallAttendancePercentage}%` : '0%'}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            {attendanceRecords.length > 0
              ? `Across all ${attendanceRecords.length} enrolled academic courses`
              : 'No attendance logged'}
          </p>
        </div>

        {/* Classes Attended count */}
        <div className="vs-card">
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Classes Attended
          </span>
          <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--text)', marginTop: '6px', lineHeight: 1 }}>
            {attendanceRecords.reduce((acc, curr) => acc + curr.attended, 0)}
            <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              {' '}/ {attendanceRecords.reduce((acc, curr) => acc + curr.total, 0)}
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '6px' }}>
            {attendanceRecords.length > 0 ? 'Logged via verified QR sessions' : 'No classes logged'}
          </p>
        </div>

        {/* Risk Alerts Flag */}
        <div className="vs-card">
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Subjects in Danger Zone
          </span>
          <div
            style={{
              fontSize: '2.4rem',
              fontWeight: 800,
              color: attendanceRecords.filter((s) => s.percentage < 75).length > 0 ? '#EF4444' : 'var(--text)',
              marginTop: '6px',
              lineHeight: 1,
            }}
          >
            {attendanceRecords.filter((s) => s.percentage < 75).length}{' '}
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>Courses</span>
          </div>
          <p
            style={{
              fontSize: '0.75rem',
              color: attendanceRecords.filter((s) => s.percentage < 75).length > 0 ? 'var(--danger-text)' : 'var(--text-muted)',
              fontWeight: 600,
              marginTop: '6px',
            }}
          >
            {attendanceRecords.filter((s) => s.percentage < 75).length > 0
              ? `${attendanceRecords.find((s) => s.percentage < 75)?.code} is currently below 75%`
              : 'All enrolled courses in safe standing'}
          </p>
        </div>
      </div>

      {/* Subject-wise Cards Breakdown (DESIGN.md Section 10) */}
      <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)', marginBottom: '14px' }}>
        Subject-wise Attendance Breakdown
      </h2>

      {attendanceRecords.length === 0 ? (
        <div
          className="vs-card"
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            marginBottom: '32px',
            backgroundColor: '#FFFFFF',
            border: '1.5px dashed var(--border)',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px',
            }}
          >
            <CheckCircle2 size={24} />
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>
            No Attendance Records Yet
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto 16px' }}>
            Once your enrolled instructors launch live classroom sessions and you scan the dynamic QR codes, your real-time subject standing will appear here.
          </p>
          <button
            onClick={() => setIsQrScannerOpen(true)}
            className="vs-btn-primary"
            style={{ borderRadius: 'var(--radius-full)', padding: '8px 18px', fontSize: '0.82rem' }}
          >
            <QrCode size={15} />
            <span>Launch QR Scanner</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
          {attendanceRecords.map((subject) => {
            const isWarning = subject.percentage < 75;
            return (
              <div
                key={subject.id}
                className="vs-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px',
                  borderLeft: `4px solid ${isWarning ? 'var(--danger)' : 'var(--success)'}`,
                }}
              >
                <div style={{ flex: '1 1 240px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>
                      {subject.code}
                    </span>
                    <span className={`vs-badge ${isWarning ? 'vs-badge-danger' : 'vs-badge-safe'}`}>
                      {isWarning ? '⚠ Below 75%' : 'Safe'}
                    </span>
                    {activeSession?.code === subject.code && (
                      <span className="vs-badge vs-badge-info">Live Class Now</span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text)' }}>
                    {subject.subject}
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Faculty: {subject.faculty} • Last class: {subject.lastClassDate}
                  </p>
                </div>

                {/* Attendance Progress & Stats */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: isWarning ? 'var(--danger)' : 'var(--text)' }}>
                      {subject.percentage}%
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {subject.attended} / {subject.total} classes attended
                    </div>
                  </div>

                  {/* Mini Visual Progress Bar */}
                  <div
                    style={{
                      width: '90px',
                      height: '8px',
                      backgroundColor: '#E2E8F0',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(100, subject.percentage)}%`,
                        backgroundColor: isWarning ? 'var(--danger)' : 'var(--success)',
                        borderRadius: '4px',
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Attendance "What-if" Recovery Simulator */}
      <div
        className="vs-card"
        style={{
          background: 'linear-gradient(135deg, #F8FAFC 0%, #FFFFFF 100%)',
          border: '1.5px dashed var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <Sparkles size={18} color="var(--primary)" />
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text)' }}>
            Attendance "What-If" Recovery Simulator
          </h3>
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Model your projected attendance trajectory to plan leave or ensure exam hall-ticket compliance.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
              Select Course:
            </label>
            <select
              value={simulatorSubjectId}
              onChange={(e) => setSimulatorSubjectId(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                fontSize: '0.82rem',
                backgroundColor: '#FFFFFF',
                fontWeight: 600,
              }}
            >
              {attendanceRecords.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} - {s.subject} ({s.percentage}%)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
              Consecutive Classes Attended:
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {[1, 2, 3, 5].map((count) => (
                <button
                  key={count}
                  onClick={() => setHypotheticalClassesToAttend(count)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    backgroundColor: hypotheticalClassesToAttend === count ? 'var(--primary)' : '#FFFFFF',
                    color: hypotheticalClassesToAttend === count ? '#FFFFFF' : 'var(--text)',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  +{count} Classes
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              marginLeft: 'auto',
              padding: '10px 16px',
              backgroundColor: simulatedPercentage >= 75 ? 'var(--success-light)' : 'var(--warning-light)',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${simulatedPercentage >= 75 ? '#A7F3D0' : '#FDE68A'}`,
              textAlign: 'right',
            }}
          >
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Projected Standing
            </div>
            <div
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: simulatedPercentage >= 75 ? 'var(--success-text)' : 'var(--warning-text)',
              }}
            >
              {simulatedPercentage}% {simulatedPercentage >= 75 ? '✓ Safe' : '⚠ Caution'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
