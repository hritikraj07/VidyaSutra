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
  ShieldAlert,
  BarChart2,
  GraduationCap,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { QRGeneratorModal } from '@/features/attendance/QRGeneratorModal';
import { StudentAnalyticsDetail } from '@/services/analyticsService';

export const CoordinatorAnalyticsView: React.FC = () => {
  const { currentUser } = useApp();
  const [students, setStudents] = useState<StudentAnalyticsDetail[]>([]);
  const [kpis, setKpis] = useState<any>(null);
  const [coursePerformance, setCoursePerformance] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedBatch, setSelectedBatch] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<'all' | 'critical' | 'warning'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Action states
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [alertSuccessToast, setAlertSuccessToast] = useState<string | null>(null);
  const [alertingStudentId, setAlertingStudentId] = useState<string | null>(null);
  const [alertedStudents, setAlertedStudents] = useState<Set<string>>(new Set());

  const fetchCoordinatorData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/analytics/admin');
      const json = await res.json();
      if (res.ok && json.success) {
        setStudents(json.students || []);
        setKpis(json.kpis || null);
        setCoursePerformance(json.coursePerformance || []);
      } else {
        setError(json.error || 'Failed to fetch coordinator analytics');
      }
    } catch (err: any) {
      setError(err.message || 'Network error fetching analytics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoordinatorData();
  }, [fetchCoordinatorData]);

  // Unique batches/sections
  const batchesList = useMemo(() => {
    const fromStudents = students.map((s) => s.section);
    return Array.from(new Set(fromStudents)).filter(Boolean);
  }, [students]);

  // Filtered student dataset
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesBatch = selectedBatch === 'all' || s.section === selectedBatch;
      const matchesSearch =
        searchQuery.trim() === '' ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.rollNo.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesBatch && matchesSearch;
    });
  }, [students, selectedBatch, searchQuery]);

  // Batch Attendance Breakdown Calculations
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

  // At-Risk Student Watchlist across coordinator scope
  const atRiskWatchlist = useMemo(() => {
    return filteredStudents.filter((s) => {
      const isCrit = s.attendanceAvg < 65;
      const isWarn = s.attendanceAvg < 75 && !isCrit;
      const isScoreLow = s.successScore?.overallScore < 65;
      const isAtRisk = isCrit || isWarn || isScoreLow || s.risk?.overallRisk === 'High Risk';

      if (!isAtRisk) return false;
      if (riskFilter === 'critical') return isCrit;
      if (riskFilter === 'warning') return isWarn;
      return true;
    });
  }, [filteredStudents, riskFilter]);

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
            ? `Critical attendance alert from Academic Coordinator (${student.attendanceAvg}% < 65%). Mandatory conference required.`
            : `Attendance Warning (${student.attendanceAvg}%). Mandatory 75% threshold required.`,
          type: 'coordinator_intervention',
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setAlertedStudents((prev) => new Set(prev).add(student.id));
        setAlertSuccessToast(`🚨 Coordinator Notice sent to ${student.name} (${student.rollNo}) regarding attendance standing.`);
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
      {/* 1. Header Banner */}
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
              Academic Coordinator Console
            </span>
            <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
              VidyaSutra Multi-Batch Telemetry
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
            Coordinator Academic Analytics
          </h1>
          <p style={{ fontSize: '0.84rem', color: '#64748B', marginTop: '4px', fontWeight: 500 }}>
            Batch Attendance Breakdown • Multi-Batch At-Risk Watchlist • Classroom QR Generator
          </p>
        </div>

        {/* Action: Open Classroom QR Modal */}
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
            <span>Classroom Screen QR Generator</span>
          </button>
        </div>
      </section>

      {/* Notification Toast */}
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
          }}
        >
          <CheckCircle2 size={18} />
          <span>{alertSuccessToast}</span>
        </div>
      )}

      {/* 2. Batch Filters */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: '#172554' }}>
            <Filter size={15} color="#243B7A" />
            <span>Filter Cohort / Batch:</span>
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedBatch('all')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: selectedBatch === 'all' ? '#243B7A' : '#CBD5E1',
                backgroundColor: selectedBatch === 'all' ? '#243B7A' : '#FFFFFF',
                color: selectedBatch === 'all' ? '#FFFFFF' : '#475569',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              All Cohorts ({students.length})
            </button>
            {batchesList.map((b) => (
              <button
                key={b}
                onClick={() => setSelectedBatch(b)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: selectedBatch === b ? '#243B7A' : '#CBD5E1',
                  backgroundColor: selectedBatch === b ? '#243B7A' : '#FFFFFF',
                  color: selectedBatch === b ? '#FFFFFF' : '#475569',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {b}
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
              placeholder="Search by student or roll..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: '0.8rem', width: '180px' }}
            />
          </div>

          <button
            onClick={fetchCoordinatorData}
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
              Cohort attendance split for <strong>{selectedBatch === 'all' ? 'All Department Batches' : `Batch ${selectedBatch}`}</strong> ({attendanceBreakdown.total} students)
            </p>
          </div>

          <div style={{ display: 'flex', gap: '14px', fontSize: '0.76rem', fontWeight: 700 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#15803D' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#16A34A' }} />
              Safe (&gt;75%): {attendanceBreakdown.safeCount} ({attendanceBreakdown.safePct}%)
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#B45309' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#E7A23B' }} />
              Warning (65-75%): {attendanceBreakdown.warnCount} ({attendanceBreakdown.warnPct}%)
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#DC2626' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#DC2626' }} />
              Critical (&lt;65%): {attendanceBreakdown.critCount} ({attendanceBreakdown.critPct}%)
            </span>
          </div>
        </div>

        {/* Visual Aggregate Bar */}
        <div style={{ marginBottom: '18px' }}>
          <div
            style={{
              height: '34px',
              width: '100%',
              backgroundColor: '#F1F5F9',
              borderRadius: '8px',
              overflow: 'hidden',
              display: 'flex',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
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
                fontSize: '0.78rem',
                transition: 'width 0.4s ease',
              }}
              title={`Safe (>75%): ${attendanceBreakdown.safeCount} students (${attendanceBreakdown.safePct}%)`}
            >
              {attendanceBreakdown.safePct > 6 && `Safe ${attendanceBreakdown.safePct}%`}
            </div>

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
                fontSize: '0.78rem',
                transition: 'width 0.4s ease',
              }}
              title={`Warning (65-75%): ${attendanceBreakdown.warnCount} students (${attendanceBreakdown.warnPct}%)`}
            >
              {attendanceBreakdown.warnPct > 6 && `Warning ${attendanceBreakdown.warnPct}%`}
            </div>

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
                fontSize: '0.78rem',
                transition: 'width 0.4s ease',
              }}
              title={`Critical (<65%): ${attendanceBreakdown.critCount} students (${attendanceBreakdown.critPct}%)`}
            >
              {attendanceBreakdown.critPct > 6 && `Critical ${attendanceBreakdown.critPct}%`}
            </div>
          </div>
        </div>

        {/* 3 Metric Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          <div style={{ padding: '14px 16px', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#15803D' }}>Safe Attendance (&gt;75%)</span>
              <CheckCircle2 size={16} color="#15803D" />
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#14532D', marginTop: '4px' }}>
              {attendanceBreakdown.safeCount}{' '}
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#15803D' }}>({attendanceBreakdown.safePct}%)</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#166534', marginTop: '2px' }}>
              Full exam eligibility cleared
            </div>
          </div>

          <div style={{ padding: '14px 16px', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#B45309' }}>Warning Tier (65-75%)</span>
              <AlertTriangle size={16} color="#B45309" />
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#78350F', marginTop: '4px' }}>
              {attendanceBreakdown.warnCount}{' '}
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#B45309' }}>({attendanceBreakdown.warnPct}%)</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#92400E', marginTop: '2px' }}>
              Faculty advisories dispatched
            </div>
          </div>

          <div style={{ padding: '14px 16px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#DC2626' }}>Critical Deficit (&lt;65%)</span>
              <ShieldAlert size={16} color="#DC2626" />
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#7F1D1D', marginTop: '4px' }}>
              {attendanceBreakdown.critCount}{' '}
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#DC2626' }}>({attendanceBreakdown.critPct}%)</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#991B1B', marginTop: '2px' }}>
              Immediate coordinator barrier action
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
              Flagged students with attendance deficits or composite risk requiring coordinator interventions
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setRiskFilter('all')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: riskFilter === 'all' ? '#243B7A' : '#CBD5E1',
                backgroundColor: riskFilter === 'all' ? '#EEF2FB' : '#FFFFFF',
                color: riskFilter === 'all' ? '#243B7A' : '#64748B',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              All At-Risk ({atRiskWatchlist.length})
            </button>
            <button
              onClick={() => setRiskFilter('critical')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: riskFilter === 'critical' ? '#DC2626' : '#CBD5E1',
                backgroundColor: riskFilter === 'critical' ? '#FEE2E2' : '#FFFFFF',
                color: riskFilter === 'critical' ? '#DC2626' : '#64748B',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Critical (&lt;65%)
            </button>
            <button
              onClick={() => setRiskFilter('warning')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: riskFilter === 'warning' ? '#B45309' : '#CBD5E1',
                backgroundColor: riskFilter === 'warning' ? '#FEF3C7' : '#FFFFFF',
                color: riskFilter === 'warning' ? '#B45309' : '#64748B',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Warning (65-75%)
            </button>
          </div>
        </div>

        {atRiskWatchlist.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px', color: '#15803D', backgroundColor: '#F0FDF4', borderRadius: '8px' }}>
            <CheckCircle2 size={28} style={{ margin: '0 auto 8px' }} />
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>No Flagged Students in Selected View</div>
            <div style={{ fontSize: '0.78rem', color: '#166534', marginTop: '2px' }}>
              All students in the selected cohort maintain safe academic standing.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#64748B', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 14px' }}>Roll Number</th>
                  <th style={{ padding: '12px 14px' }}>Student Name</th>
                  <th style={{ padding: '12px 14px' }}>Batch / Section</th>
                  <th style={{ padding: '12px 14px' }}>Attendance</th>
                  <th style={{ padding: '12px 14px' }}>Current Score</th>
                  <th style={{ padding: '12px 14px' }}>Risk Driver</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Coordinator Action</th>
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

                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 700, color: '#172554' }}>{student.name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{student.email}</div>
                      </td>

                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#475569' }}>
                        {student.section}
                      </td>

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

                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                          <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#172554' }}>
                            {student.successScore?.overallScore ?? 0}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#64748B' }}>/ 100</span>
                        </div>
                      </td>

                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: '0.76rem', color: '#B45309', fontWeight: 600 }}>
                          {isCrit
                            ? 'Below 65% hall-ticket barrier'
                            : isWarn
                            ? 'Attendance <75% threshold'
                            : 'Score remediation needed'}
                        </span>
                      </td>

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
        defaultSection={selectedBatch !== 'all' ? selectedBatch : 'CSE-A'}
      />
    </div>
  );
};
