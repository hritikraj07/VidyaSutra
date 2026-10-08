'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Users,
  BookOpen,
  Layers,
  CheckCircle2,
  RefreshCw,
  Eye,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { ExplainableScoreModal } from '@/features/scores/ExplainableScoreModal';
import { StudentAnalyticsDetail, ActionableInsightItem } from '@/services/analyticsService';

interface TeacherAnalyticsData {
  assignedClasses: { course_code: string; course_name: string; section: string; room: string }[];
  classAvgSuccessScore: number;
  classAvgAttendance: number;
  totalEnrolledInClasses: number;
  studentsAtRiskCount: number;
  students: StudentAnalyticsDetail[];
  suggestedClassInterventions: ActionableInsightItem[];
}

export const TeacherAnalyticsView: React.FC = () => {
  const [data, setData] = useState<TeacherAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');

  // Explainable Score Modal
  const [selectedStudent, setSelectedStudent] = useState<StudentAnalyticsDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedSection !== 'all') params.append('section', selectedSection);
      if (selectedCourse !== 'all') params.append('courseCode', selectedCourse);

      const url = params.toString() ? `/api/analytics/teacher?${params.toString()}` : '/api/analytics/teacher';
      const res = await fetch(url);
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json);
      } else {
        setError(json.error || 'Failed to fetch teacher class analytics');
      }
    } catch (err: any) {
      setError(err.message || 'Network error fetching teacher analytics');
    } finally {
      setIsLoading(false);
    }
  }, [selectedSection, selectedCourse]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleOpenStudent = (student: StudentAnalyticsDetail) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const coursesList = data?.assignedClasses
    ? Array.from(new Set(data.assignedClasses.map((c) => c.course_code)))
    : [];

  const sectionsList = data?.assignedClasses
    ? Array.from(
        new Set(
          data.assignedClasses
            .filter((c) => selectedCourse === 'all' || c.course_code === selectedCourse)
            .map((c) => c.section)
        )
      )
    : [];

  return (
    <div style={{ width: '100%', padding: '16px 28px' }} className="animate-fade-in">
      {/* 1. Header Banner */}
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
          borderLeft: '5px solid #243B7A',
          boxShadow: '0 4px 16px -2px rgba(23, 37, 84, 0.06)',
          padding: '22px 26px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#243B7A',
                backgroundColor: '#EEF2FB',
                border: '1px solid #D6E0F5',
                padding: '2px 8px',
                borderRadius: '6px',
                textTransform: 'uppercase',
              }}
            >
              Faculty Cohort Analytics
            </span>
            <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
              Authorized Class & Section Scope
            </span>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#172554', margin: 0, letterSpacing: '-0.02em' }}>
            Classroom Student Success Insights
          </h1>
          <p style={{ fontSize: '0.84rem', color: '#64748B', marginTop: '4px' }}>
            Monitor student academic standing, identify learners requiring remediation, and filter by course and section.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Course Filter Dropdown */}
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            style={{
              padding: '8px 36px 8px 12px',
              borderRadius: '8px',
              border: '1.5px solid #CBD5E1',
              backgroundColor: '#FFFFFF',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: '#172554',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="all">All Courses / Subjects</option>
            {coursesList.map((code) => {
              const item = data?.assignedClasses?.find((c) => c.course_code === code);
              return (
                <option key={code} value={code}>
                  {code} — {item?.course_name || code}
                </option>
              );
            })}
          </select>

          {/* Section Filter Dropdown */}
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            style={{
              padding: '8px 36px 8px 12px',
              borderRadius: '8px',
              border: '1.5px solid #CBD5E1',
              backgroundColor: '#FFFFFF',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: '#172554',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="all">All Sections (All Students)</option>
            {sectionsList.map((sec) => (
              <option key={sec} value={sec}>
                Section {sec}
              </option>
            ))}
          </select>

          <button
            onClick={fetchAnalytics}
            disabled={isLoading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#EEF2FB',
              color: '#243B7A',
              border: '1px solid #D6E0F5',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </section>

      {/* 2. Class KPIs Grid */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
          marginBottom: '20px',
        }}
      >
        {/* Class Avg Score */}
        <div className="vs-card" style={{ padding: '20px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Class Mean Score
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '1.9rem', fontWeight: 800, color: '#172554', lineHeight: 1 }}>
              {data?.classAvgSuccessScore || 0}
            </span>
            <span style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 600 }}>/ 100</span>
          </div>
          <div style={{ fontSize: '0.74rem', color: '#15803D', fontWeight: 600, marginTop: '6px' }}>
            ● Composite class benchmark
          </div>
        </div>

        {/* Class Avg Attendance */}
        <div className="vs-card" style={{ padding: '20px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Class Attendance
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#15803D' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ fontSize: '1.9rem', fontWeight: 800, color: '#172554', lineHeight: 1 }}>
              {data?.classAvgAttendance || 0}
            </span>
            <span style={{ fontSize: '1rem', color: '#64748B', fontWeight: 700 }}>%</span>
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600, marginTop: '6px' }}>
            Mandatory threshold: 75%
          </div>
        </div>

        {/* Students At Risk */}
        <div
          className="vs-card"
          style={{
            padding: '20px',
            backgroundColor: '#FFFFFF',
            border: (data?.studentsAtRiskCount || 0) > 0 ? '1px solid #FECACA' : '1px solid #E2E8F0',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Learners Needing Focus
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: (data?.studentsAtRiskCount || 0) > 0 ? '#DC2626' : '#172554', lineHeight: 1 }}>
            {data?.studentsAtRiskCount || 0}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#DC2626', fontWeight: 600, marginTop: '6px' }}>
            Academic or attendance risk flags
          </div>
        </div>

        {/* Total Enrolled */}
        <div className="vs-card" style={{ padding: '20px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Enrolled in Class
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#EEF2FB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#243B7A' }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#172554', lineHeight: 1 }}>
            {data?.totalEnrolledInClasses || 0}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600, marginTop: '6px' }}>
            Students in your assigned sections
          </div>
        </div>
      </section>

      {/* 3. Class Actionable Intervention Cards */}
      {data?.suggestedClassInterventions && data.suggestedClassInterventions.length > 0 && (
        <section style={{ marginBottom: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Sparkles size={17} color="#E7A23B" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#172554', margin: 0 }}>
              Faculty Actionable Interventions
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
            {data.suggestedClassInterventions.map((item) => (
              <div
                key={item.id}
                className="vs-card"
                style={{
                  padding: '18px 20px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: 'var(--radius-lg)',
                  border: item.severity === 'urgent' ? '1px solid #FECACA' : '1px solid #FDE68A',
                  borderLeft: `5px solid ${item.severity === 'urgent' ? '#DC2626' : '#E7A23B'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#172554', margin: 0 }}>
                    {item.title}
                  </h3>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      backgroundColor: item.severity === 'urgent' ? '#FEE2E2' : '#FEF3C7',
                      color: item.severity === 'urgent' ? '#DC2626' : '#B45309',
                      padding: '2px 7px',
                      borderRadius: '6px',
                    }}
                  >
                    Action Required
                  </span>
                </div>

                <div style={{ fontSize: '0.78rem', color: '#1E293B', fontWeight: 600, marginBottom: '6px' }}>
                  <strong>Trigger:</strong> {item.detectedCondition}
                </div>

                <div style={{ fontSize: '0.76rem', color: '#64748B', marginBottom: '10px' }}>
                  <strong>Context:</strong> {item.whyItMatters}
                </div>

                <div
                  style={{
                    backgroundColor: '#F8FAFC',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    color: '#243B7A',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <ArrowRight size={14} color="#243B7A" />
                  <span>Recommendation: {item.suggestedAction}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. Enrolled Students Analytics Table */}
      <section
        className="vs-card"
        style={{
          padding: '22px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#172554', margin: 0 }}>
              Classroom Roster & Performance Indicators
            </h2>
            <p style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px' }}>
              Click any student to inspect transparent score drivers and explainability diagnostic
            </p>
          </div>
        </div>

        {error && (
          <div style={{ padding: '12px', backgroundColor: '#FEF2F2', color: '#DC2626', borderRadius: '8px', fontSize: '0.82rem', marginBottom: '14px' }}>
            {error}
          </div>
        )}

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748B', fontSize: '0.86rem' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px', color: '#243B7A' }} />
            Loading class telemetry...
          </div>
        ) : !data?.students || data.students.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
            <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>No student records found in assigned classes</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#64748B', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 12px' }}>Student</th>
                  <th style={{ padding: '10px 12px' }}>Roll No</th>
                  <th style={{ padding: '10px 12px' }}>Section</th>
                  <th style={{ padding: '10px 12px' }}>Success Score</th>
                  <th style={{ padding: '10px 12px' }}>Academic Risk</th>
                  <th style={{ padding: '10px 12px' }}>Attendance</th>
                  <th style={{ padding: '10px 12px' }}>Segment</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Diagnostic</th>
                </tr>
              </thead>
              <tbody>
                {data.students.map((student) => {
                  const score = student.successScore;
                  const risk = student.risk;

                  const bandBadgeStyle: React.CSSProperties =
                    score.band === 'Strong'
                      ? { backgroundColor: '#DCFCE7', color: '#15803D', border: '1px solid #BBF7D0' }
                      : score.band === 'Stable'
                      ? { backgroundColor: '#DBEAFE', color: '#1D4ED8', border: '1px solid #BFDBFE' }
                      : score.band === 'Needs Attention'
                      ? { backgroundColor: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A' }
                      : { backgroundColor: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA' };

                  return (
                    <tr
                      key={student.id}
                      style={{ borderBottom: '1px solid #F1F5F9', fontSize: '0.82rem' }}
                      className="hover:bg-slate-50"
                    >
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 700, color: '#172554' }}>{student.name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{student.email}</div>
                      </td>
                      <td style={{ padding: '12px', fontWeight: 600, color: '#1E293B' }}>{student.rollNo}</td>
                      <td style={{ padding: '12px', fontWeight: 600, color: '#1E293B' }}>{student.section}</td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#172554' }}>
                            {score.overallScore}
                          </span>
                          <span
                            style={{
                              ...bandBadgeStyle,
                              padding: '2px 7px',
                              borderRadius: '999px',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                            }}
                          >
                            {score.band}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            backgroundColor:
                              risk.academicRisk === 'High'
                                ? '#FEE2E2'
                                : risk.academicRisk === 'Moderate'
                                ? '#FEF3C7'
                                : '#F0FDF4',
                            color:
                              risk.academicRisk === 'High'
                                ? '#DC2626'
                                : risk.academicRisk === 'Moderate'
                                ? '#B45309'
                                : '#15803D',
                          }}
                        >
                          {risk.academicRisk === 'High' && <AlertTriangle size={12} />}
                          {risk.academicRisk}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ fontWeight: 700, color: student.attendanceAvg >= 75 ? '#15803D' : '#DC2626' }}>
                          {student.attendanceAvg}%
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span
                          style={{
                            backgroundColor: '#F1F5F9',
                            color: '#334155',
                            padding: '2px 7px',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                          }}
                        >
                          {student.segment}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleOpenStudent(student)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            backgroundColor: '#243B7A',
                            color: '#FFFFFF',
                            border: 'none',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(36, 59, 122, 0.2)',
                          }}
                        >
                          <Eye size={13} />
                          <span>Inspect</span>
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

      {/* 5. Explainable Score Modal (Teacher Mode: Read-Only, No Telemetry Editing) */}
      <ExplainableScoreModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        student={selectedStudent}
        isAdmin={false}
      />
    </div>
  );
};
