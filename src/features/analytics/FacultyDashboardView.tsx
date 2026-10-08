'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Users,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  QrCode,
  Bell,
  RefreshCw,
  Search,
  Filter,
  Check,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  BarChart2,
} from 'lucide-react';
import { QRGeneratorModal } from '@/features/attendance/QRGeneratorModal';
import { StudentAnalyticsDetail } from '@/services/analyticsService';

export const FacultyDashboardView: React.FC = () => {
  const { currentUser } = useApp();
  const [students, setStudents] = useState<StudentAnalyticsDetail[]>([]);
  const [assignedClasses, setAssignedClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [alertSuccessToast, setAlertSuccessToast] = useState<string | null>(null);
  const [alertingStudentId, setAlertingStudentId] = useState<string | null>(null);
  const [alertedStudents, setAlertedStudents] = useState<Set<string>>(new Set());

  const fetchFacultyData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/analytics/teacher');
      const json = await res.json();
      if (res.ok && json.success) {
        setStudents(json.students || []);
        setAssignedClasses(json.assignedClasses || []);
      } else {
        setError(json.error || 'Failed to fetch faculty class analytics');
      }
    } catch (err: any) {
      setError(err.message || 'Network error fetching analytics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFacultyData();
  }, [fetchFacultyData]);

  // Section options
  const sectionsList = useMemo(() => {
    const fromClasses = assignedClasses.map((c) => c.section);
    const fromStudents = students.map((s) => s.section);
    return Array.from(new Set([...fromClasses, ...fromStudents])).filter(Boolean);
  }, [assignedClasses, students]);

  // Filtered student list
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSection = selectedSection === 'all' || s.section === selectedSection;
      const matchesSearch =
        searchQuery.trim() === '' ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.rollNo.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSection && matchesSearch;
    });
  }, [students, selectedSection, searchQuery]);

  // Attendance Category Breakdown Calculations
  // Safe: >75%, Warning: 65-75%, Critical: <65%
  const attendanceBreakdown = useMemo(() => {
    const total = filteredStudents.length;
    if (total === 0) return { safeCount: 0, safePct: 0, warnCount: 0, warnPct: 0, critCount: 0, critPct: 0, total: 0 };

    const safeCount = filteredStudents.filter((s) => s.attendanceAvg >= 75).length;
    const warnCount = filteredStudents.filter((s) => s.attendanceAvg >= 65 && s.attendanceAvg < 75).length;
    const critCount = filteredStudents.filter((s) => s.attendanceAvg < 65).length;

    return {
      safeCount,
      safePct: Math.round((safeCount / total) * 100),
      warnCount,
      warnPct: Math.round((warnCount / total) * 100),
      critCount,
      critPct: Math.round((critCount / total) * 100),
      total,
    };
  }, [filteredStudents]);

  // At-Risk Watchlist (Flagged students: Attendance <75% or Success Score <65)
  const atRiskWatchlist = useMemo(() => {
    return filteredStudents.filter((s) => {
      const isAttRisk = s.attendanceAvg < 75;
      const isScoreRisk = s.successScore?.overallScore < 65;
      const isHighRisk = s.risk?.overallRisk === 'High Risk' || s.risk?.overallRisk === 'Needs Attention';
      return isAttRisk || isScoreRisk || isHighRisk;
    });
  }, [filteredStudents]);

  // Action: Alert Student
  const handleAlertStudent = async (student: StudentAnalyticsDetail) => {
    setAlertingStudentId(student.id);
    try {
      const res = await fetch('/api/alerts/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id,
          rollNo: student.rollNo,
          studentName: student.name,
          reason: student.attendanceAvg < 65
            ? `Critical attendance deficit (${student.attendanceAvg}% < 65% hall-ticket barrier).`
            : `Attendance Warning (${student.attendanceAvg}%). Mandatory 75% threshold required.`,
          type: 'attendance_intervention',
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setAlertedStudents((prev) => new Set(prev).add(student.id));
        setAlertSuccessToast(`🚨 Alert dispatched to ${student.name} (${student.rollNo}) regarding attendance standing.`);
        setTimeout(() => setAlertSuccessToast(null), 4500);
      } else {
        alert(json.error || 'Failed to dispatch alert.');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    } finally {
      setAlertingStudentId(null);
    }
  };

  return (
    <div style={{ width: '100%', padding: '20px 32px' }} className="animate-fade-in">
      {/* 1. Header Banner with Action Buttons */}
      <section
        className="vs-card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderLeft: '5px solid #243B7A',
          boxShadow: '0 4px 18px -2px rgba(23, 37, 84, 0.08)',
          padding: '24px 28px',
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
                textTransform: 'uppercase',
              }}
            >
              Faculty Portal Telemetry
            </span>
            <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
              {currentUser?.department || 'Computer Science & Engineering'}
            </span>
          </div>
          <h1
            style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: '#172554',
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            Faculty Analytics & Class Operations
          </h1>
          <p style={{ fontSize: '0.84rem', color: '#64748B', marginTop: '4px', fontWeight: 500 }}>
            Batch Attendance Breakdown • At-Risk Student Watchlist • Live Classroom QR
          </p>
        </div>

        {/* Live Classroom Screen QR Launcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setIsQRModalOpen(true)}
            style={{
              padding: '12px 22px',
              backgroundColor: '#243B7A',
              color: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.88rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 6px 18px rgba(36, 59, 122, 0.28)',
            }}
          >
            <QrCode size={19} color="#E7A23B" />
            <span>Live Classroom QR Generator</span>
          </button>
        </div>
      </section>

      {/* Alert Success Notification Toast */}
      {alertSuccessToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: '#15803D',
            color: '#FFFFFF',
            padding: '14px 20px',
            borderRadius: '10px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: 700,
            fontSize: '0.86rem',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <CheckCircle2 size={18} />
          <span>{alertSuccessToast}</span>
        </div>
      )}

      {/* 2. Filters & Batch Selector */}
      <section
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: '#172554' }}>
            <Filter size={15} color="#243B7A" />
            <span>Select Batch:</span>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setSelectedSection('all')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: selectedSection === 'all' ? '#243B7A' : '#CBD5E1',
                backgroundColor: selectedSection === 'all' ? '#243B7A' : '#FFFFFF',
                color: selectedSection === 'all' ? '#FFFFFF' : '#475569',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              All Batches ({students.length})
            </button>
            {sectionsList.map((sec) => (
              <button
                key={sec}
                onClick={() => setSelectedSection(sec)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: selectedSection === sec ? '#243B7A' : '#CBD5E1',
                  backgroundColor: selectedSection === sec ? '#243B7A' : '#FFFFFF',
                  color: selectedSection === sec ? '#FFFFFF' : '#475569',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {sec}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              padding: '6px 12px',
            }}
          >
            <Search size={15} color="#94A3B8" />
            <input
              type="text"
              placeholder="Search student or roll no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: '0.8rem', width: '180px' }}
            />
          </div>

          <button
            onClick={fetchFacultyData}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#475569',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </section>

      {/* 3. Batch Attendance Breakdown Bar Chart */}
      <section
        className="vs-card"
        style={{
          padding: '24px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '24px',
          boxShadow: '0 4px 16px -2px rgba(23, 37, 84, 0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart2 size={18} color="#243B7A" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#172554', margin: 0 }}>
                Batch Attendance Breakdown
              </h2>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px', margin: 0 }}>
              Attendance distribution for batch <strong>{selectedSection === 'all' ? 'All Assigned Sections' : selectedSection}</strong> ({attendanceBreakdown.total} students)
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#15803D' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#16A34A' }} />
              Safe (&gt;75%)
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#B45309' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#E7A23B' }} />
              Warning (65-75%)
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#DC2626' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#DC2626' }} />
              Critical (&lt;65%)
            </span>
          </div>
        </div>

        {/* Aggregate Visual Bar Component */}
        <div style={{ marginBottom: '18px' }}>
          <div
            style={{
              height: '32px',
              width: '100%',
              backgroundColor: '#F1F5F9',
              borderRadius: '8px',
              overflow: 'hidden',
              display: 'flex',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            {/* Safe Bar */}
            <div
              style={{
                width: `${attendanceBreakdown.safePct}%`,
                backgroundColor: '#16A34A',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.75rem',
                transition: 'width 0.4s ease',
              }}
              title={`Safe (>75%): ${attendanceBreakdown.safeCount} students (${attendanceBreakdown.safePct}%)`}
            >
              {attendanceBreakdown.safePct > 8 && `${attendanceBreakdown.safePct}%`}
            </div>

            {/* Warning Bar */}
            <div
              style={{
                width: `${attendanceBreakdown.warnPct}%`,
                backgroundColor: '#E7A23B',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.75rem',
                transition: 'width 0.4s ease',
              }}
              title={`Warning (65-75%): ${attendanceBreakdown.warnCount} students (${attendanceBreakdown.warnPct}%)`}
            >
              {attendanceBreakdown.warnPct > 8 && `${attendanceBreakdown.warnPct}%`}
            </div>

            {/* Critical Bar */}
            <div
              style={{
                width: `${attendanceBreakdown.critPct}%`,
                backgroundColor: '#DC2626',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.75rem',
                transition: 'width 0.4s ease',
              }}
              title={`Critical (<65%): ${attendanceBreakdown.critCount} students (${attendanceBreakdown.critPct}%)`}
            >
              {attendanceBreakdown.critPct > 8 && `${attendanceBreakdown.critPct}%`}
            </div>
          </div>
        </div>

        {/* 3 Metrics Cards below Bar Chart */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          {/* Safe Card */}
          <div
            style={{
              padding: '14px 16px',
              backgroundColor: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: '8px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#15803D' }}>Safe Zone (&gt;75%)</span>
              <CheckCircle2 size={16} color="#15803D" />
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#14532D', marginTop: '4px' }}>
              {attendanceBreakdown.safeCount}{' '}
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#15803D' }}>
                ({attendanceBreakdown.safePct}%)
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#166534', marginTop: '2px' }}>
              Eligible for regular examination hall-tickets
            </div>
          </div>

          {/* Warning Card */}
          <div
            style={{
              padding: '14px 16px',
              backgroundColor: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: '8px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#B45309' }}>Warning Zone (65-75%)</span>
              <AlertTriangle size={16} color="#B45309" />
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#78350F', marginTop: '4px' }}>
              {attendanceBreakdown.warnCount}{' '}
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#B45309' }}>
                ({attendanceBreakdown.warnPct}%)
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#92400E', marginTop: '2px' }}>
              Approaching danger line; require alert notice
            </div>
          </div>

          {/* Critical Card */}
          <div
            style={{
              padding: '14px 16px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '8px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#DC2626' }}>Critical Zone (&lt;65%)</span>
              <ShieldAlert size={16} color="#DC2626" />
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#7F1D1D', marginTop: '4px' }}>
              {attendanceBreakdown.critCount}{' '}
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#DC2626' }}>
                ({attendanceBreakdown.critPct}%)
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#991B1B', marginTop: '2px' }}>
              Below mandatory threshold; hall-ticket barrier
            </div>
          </div>
        </div>
      </section>

      {/* 4. At-Risk Student Watchlist Table */}
      <section
        className="vs-card"
        style={{
          padding: '24px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 4px 16px -2px rgba(23, 37, 84, 0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} color="#DC2626" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#172554', margin: 0 }}>
                At-Risk Student Watchlist ({atRiskWatchlist.length})
              </h2>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px', margin: 0 }}>
              Students flagged with sub-75% attendance or score deficits requiring direct faculty intervention
            </p>
          </div>

          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              backgroundColor: atRiskWatchlist.length > 0 ? '#FEE2E2' : '#DCFCE7',
              color: atRiskWatchlist.length > 0 ? '#DC2626' : '#15803D',
              padding: '3px 10px',
              borderRadius: '999px',
            }}
          >
            {atRiskWatchlist.length} Flagged Learner{atRiskWatchlist.length !== 1 ? 's' : ''}
          </span>
        </div>

        {atRiskWatchlist.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px', color: '#15803D', backgroundColor: '#F0FDF4', borderRadius: '8px' }}>
            <CheckCircle2 size={28} style={{ margin: '0 auto 8px' }} />
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>No At-Risk Students in Current Selection!</div>
            <div style={{ fontSize: '0.78rem', color: '#166534', marginTop: '2px' }}>
              All students in {selectedSection === 'all' ? 'assigned batches' : selectedSection} maintain safe attendance (&gt;75%) and steady scores.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#64748B', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 14px' }}>Roll Number</th>
                  <th style={{ padding: '12px 14px' }}>Student Name</th>
                  <th style={{ padding: '12px 14px' }}>Batch</th>
                  <th style={{ padding: '12px 14px' }}>Attendance</th>
                  <th style={{ padding: '12px 14px' }}>Current Score</th>
                  <th style={{ padding: '12px 14px' }}>Primary Risk Flag</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Faculty Action</th>
                </tr>
              </thead>
              <tbody>
                {atRiskWatchlist.map((student) => {
                  const isCrit = student.attendanceAvg < 65;
                  const isWarn = student.attendanceAvg < 75 && !isCrit;
                  const hasBeenAlerted = alertedStudents.has(student.id);

                  return (
                    <tr
                      key={student.id}
                      style={{ borderBottom: '1px solid #F1F5F9', fontSize: '0.84rem' }}
                      className="hover:bg-slate-50"
                    >
                      {/* Roll Number */}
                      <td style={{ padding: '12px 14px' }}>
                        <span
                          style={{
                            fontWeight: 800,
                            color: '#1E293B',
                            backgroundColor: '#F1F5F9',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.78rem',
                          }}
                        >
                          {student.rollNo}
                        </span>
                      </td>

                      {/* Name & Email */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 700, color: '#172554' }}>{student.name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{student.email}</div>
                      </td>

                      {/* Section */}
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#475569' }}>
                        {student.section}
                      </td>

                      {/* Attendance % */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              fontWeight: 800,
                              fontSize: '0.9rem',
                              color: isCrit ? '#DC2626' : isWarn ? '#B45309' : '#15803D',
                            }}
                          >
                            {student.attendanceAvg}%
                          </span>
                          <span
                            style={{
                              fontSize: '0.64rem',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: isCrit ? '#FEE2E2' : '#FEF3C7',
                              color: isCrit ? '#DC2626' : '#B45309',
                            }}
                          >
                            {isCrit ? 'CRITICAL' : 'WARNING'}
                          </span>
                        </div>
                      </td>

                      {/* Current Score */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                          <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#172554' }}>
                            {student.successScore?.overallScore ?? 0}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#64748B' }}>/ 100</span>
                        </div>
                      </td>

                      {/* Risk Flag */}
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: '0.76rem', color: '#B45309', fontWeight: 600 }}>
                          {isCrit
                            ? 'Below 65% hall-ticket barrier'
                            : isWarn
                            ? 'Attendance <75% threshold'
                            : 'Score remediation needed'}
                        </span>
                      </td>

                      {/* Action: Alert Student Button */}
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleAlertStudent(student)}
                          disabled={alertingStudentId === student.id || hasBeenAlerted}
                          style={{
                            padding: '6px 14px',
                            backgroundColor: hasBeenAlerted ? '#DCFCE7' : '#DC2626',
                            color: hasBeenAlerted ? '#15803D' : '#FFFFFF',
                            border: hasBeenAlerted ? '1px solid #BBF7D0' : 'none',
                            borderRadius: '6px',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            cursor: hasBeenAlerted ? 'default' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            boxShadow: hasBeenAlerted ? 'none' : '0 2px 8px rgba(220, 38, 38, 0.25)',
                          }}
                        >
                          {hasBeenAlerted ? (
                            <>
                              <Check size={13} color="#15803D" />
                              <span>Alerted ✓</span>
                            </>
                          ) : alertingStudentId === student.id ? (
                            <>
                              <RefreshCw size={13} className="animate-spin" />
                              <span>Sending...</span>
                            </>
                          ) : (
                            <>
                              <Bell size={13} />
                              <span>Alert Student</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Classroom Screen QR Modal */}
      <QRGeneratorModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        defaultSection={selectedSection !== 'all' ? selectedSection : 'CSE-A'}
      />
    </div>
  );
};
