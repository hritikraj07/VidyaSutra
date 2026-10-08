'use client';

import React, { useState } from 'react';
import {
  X,
  TrendingUp,
  Award,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Briefcase,
  BookOpen,
  Calendar,
  Layers,
  Edit3,
  Save,
  Clock,
} from 'lucide-react';
import { StudentAnalyticsDetail } from '@/services/analyticsService';

interface ExplainableScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentAnalyticsDetail | null;
  isAdmin?: boolean;
  onStudentUpdated?: (updated: StudentAnalyticsDetail) => void;
}

export const ExplainableScoreModal: React.FC<ExplainableScoreModalProps> = ({
  isOpen,
  onClose,
  student,
  isAdmin = false,
  onStudentUpdated,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // Editable fields for admin
  const [editCgpa, setEditCgpa] = useState<number>(student?.cgpa ?? 7.5);
  const [editInternal, setEditInternal] = useState<number>(student?.internalMarksAvg ?? 75);
  const [editSemester, setEditSemester] = useState<number>(student?.semesterMarksAvg ?? 72);
  const [editBacklogs, setEditBacklogs] = useState<number>(student?.backlogsCount ?? 0);
  const [editTrend, setEditTrend] = useState<string>(student?.academicTrend ?? 'stable');
  const [editAptitude, setEditAptitude] = useState<number>(student?.aptitudeScore ?? 70);
  const [editCoding, setEditCoding] = useState<number>(student?.codingScore ?? 70);
  const [editInterview, setEditInterview] = useState<number>(student?.mockInterviewScore ?? 70);
  const [editSkillsCount, setEditSkillsCount] = useState<number>(student?.verifiedSkillsCount ?? 3);
  const [editFacultyNotes, setEditFacultyNotes] = useState<string>(student?.facultyFeedbackNotes ?? '');

  if (!isOpen || !student) return null;

  const score = student.successScore;
  const risk = student.risk;

  const handleSaveTelemetry = async () => {
    setIsSaving(true);
    setSaveMsg('');
    try {
      const res = await fetch('/api/analytics/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentProfileId: student.studentProfileId,
          cgpa: Number(editCgpa),
          internalMarksAvg: Number(editInternal),
          semesterMarksAvg: Number(editSemester),
          backlogsCount: Number(editBacklogs),
          academicTrend: editTrend,
          aptitudeScore: Number(editAptitude),
          codingScore: Number(editCoding),
          mockInterviewScore: Number(editInterview),
          placementReadinessPct: Math.round(Number(editAptitude) * 0.3 + Number(editCoding) * 0.4 + Number(editInterview) * 0.3),
          verifiedSkillsCount: Number(editSkillsCount),
          facultyFeedbackNotes: editFacultyNotes,
        }),
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        setSaveMsg('✅ Telemetry updated! Re-evaluating score...');
        setIsEditing(false);
        // Refresh student data callback
        if (onStudentUpdated) {
          // Re-fetch updated campus data
          const getRes = await fetch(`/api/analytics/admin?q=${encodeURIComponent(student.rollNo)}`);
          const getData = await getRes.json();
          if (getData.students && getData.students.length > 0) {
            onStudentUpdated(getData.students[0]);
          }
        }
      } else {
        setSaveMsg(`❌ Error: ${resData.error || 'Failed to update record'}`);
      }
    } catch (err: any) {
      setSaveMsg(`❌ Network error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const getBandBadgeStyle = (band: string) => {
    switch (band) {
      case 'Strong':
        return { bg: '#E8F5E9', color: '#198754', border: '#A7F3D0' };
      case 'Stable':
        return { bg: '#EEF2FB', color: '#243B7A', border: '#D6E0F5' };
      case 'Needs Attention':
        return { bg: '#FEF3C7', color: '#B45309', border: '#FDE68A' };
      case 'High Risk':
      default:
        return { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' };
    }
  };

  const bandStyle = getBandBadgeStyle(score.band);

  return (
    <div className="vs-modal-backdrop" onClick={onClose} style={{ zIndex: 110 }}>
      <div
        className="vs-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '720px',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '24px 28px',
          borderRadius: '20px',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 25px 65px -12px rgba(23, 37, 84, 0.25)',
          border: '1px solid #E2E8F0',
        }}
      >
        {/* Header Bar */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  backgroundColor: '#EEF2FB',
                  color: '#243B7A',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  textTransform: 'uppercase',
                }}
              >
                Roll: {student.rollNo}
              </span>
              <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
                {student.course} • Sem {student.semester} ({student.section})
              </span>
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#172554', margin: 0 }}>
              {student.name}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isAdmin && !isEditing && (
              <button
                onClick={() => {
                  setEditCgpa(student.cgpa);
                  setEditInternal(student.internalMarksAvg);
                  setEditSemester(student.semesterMarksAvg);
                  setEditBacklogs(student.backlogsCount);
                  setEditTrend(student.academicTrend);
                  setEditAptitude(student.aptitudeScore);
                  setEditCoding(student.codingScore);
                  setEditInterview(student.mockInterviewScore);
                  setEditSkillsCount(student.verifiedSkillsCount);
                  setEditFacultyNotes(student.facultyFeedbackNotes || '');
                  setIsEditing(true);
                }}
                className="vs-btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.75rem', gap: '5px' }}
              >
                <Edit3 size={13} />
                <span>Edit Telemetry</span>
              </button>
            )}

            <button
              onClick={onClose}
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
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {saveMsg && (
          <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: '#F8FAFC', fontSize: '0.8rem', marginBottom: '14px', border: '1px solid #E2E8F0' }}>
            {saveMsg}
          </div>
        )}

        {/* Admin Telemetry Edit Form Modal Mode */}
        {isEditing ? (
          <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '14px', border: '1px solid #CBD5E1', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#172554', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Edit3 size={16} color="#243B7A" />
              <span>Admin Telemetry & Academic Indicator Management</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B' }}>CGPA (0 - 10)</label>
                <input
                  type="number"
                  step="0.05"
                  value={editCgpa}
                  onChange={(e) => setEditCgpa(parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B' }}>Internal Marks Avg (%)</label>
                <input
                  type="number"
                  value={editInternal}
                  onChange={(e) => setEditInternal(parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B' }}>Semester Marks Avg (%)</label>
                <input
                  type="number"
                  value={editSemester}
                  onChange={(e) => setEditSemester(parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B' }}>Backlogs Count</label>
                <input
                  type="number"
                  value={editBacklogs}
                  onChange={(e) => setEditBacklogs(parseInt(e.target.value) || 0)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B' }}>Academic Trend</label>
                <select
                  value={editTrend}
                  onChange={(e) => setEditTrend(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
                >
                  <option value="improving">Improving</option>
                  <option value="stable">Stable</option>
                  <option value="declining">Declining</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B' }}>Aptitude Score (100)</label>
                <input
                  type="number"
                  value={editAptitude}
                  onChange={(e) => setEditAptitude(parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B' }}>Coding Score (100)</label>
                <input
                  type="number"
                  value={editCoding}
                  onChange={(e) => setEditCoding(parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B' }}>Interview Score (100)</label>
                <input
                  type="number"
                  value={editInterview}
                  onChange={(e) => setEditInterview(parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B' }}>Verified Skills Count</label>
                <input
                  type="number"
                  value={editSkillsCount}
                  onChange={(e) => setEditSkillsCount(parseInt(e.target.value) || 0)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B' }}>Faculty Counselor Notes</label>
              <textarea
                rows={2}
                value={editFacultyNotes}
                onChange={(e) => setEditFacultyNotes(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
                placeholder="Observation or intervention recommendation..."
              />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveTelemetry}
                className="vs-btn-primary"
                style={{ padding: '8px 16px', fontSize: '0.8rem' }}
              >
                <Save size={14} />
                <span>{isSaving ? 'Recalculating...' : 'Save & Update Success Score'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="vs-btn-secondary"
                style={{ padding: '8px 14px', fontSize: '0.8rem' }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        {/* 1. Composite Banner: Success Score + Band + Segment */}
        <div
          style={{
            background: 'linear-gradient(135deg, #172554 0%, #243B7A 100%)',
            color: '#FFFFFF',
            borderRadius: '16px',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '20px',
            boxShadow: '0 8px 24px -4px rgba(36, 59, 122, 0.25)',
          }}
        >
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#D6E0F5', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Deterministic Success Score
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontSize: '2.6rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>
                {score.overallScore}
              </span>
              <span style={{ fontSize: '1rem', color: '#CBD5E1' }}>/ 100</span>
              <span
                style={{
                  fontSize: '0.74rem',
                  backgroundColor: bandStyle.bg,
                  color: bandStyle.color,
                  border: `1px solid ${bandStyle.border}`,
                  padding: '3px 10px',
                  borderRadius: '999px',
                  fontWeight: 700,
                  marginLeft: '6px',
                }}
              >
                {score.band} Band
              </span>
            </div>

            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '0.7rem',
                  backgroundColor: 'rgba(231, 162, 59, 0.2)',
                  color: '#E7A23B',
                  border: '1px solid rgba(231, 162, 59, 0.4)',
                  padding: '2px 9px',
                  borderRadius: '999px',
                  fontWeight: 700,
                }}
              >
                Segment: {student.segment}
              </span>
            </div>
          </div>

          <div
            style={{
              padding: '12px 18px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              minWidth: '150px',
            }}
          >
            <div style={{ fontSize: '0.7rem', color: '#D6E0F5', fontWeight: 600 }}>Overall Standing</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF', marginTop: '2px' }}>
              {risk.overallRisk}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#CBD5E1', marginTop: '2px' }}>
              Attendance: <strong>{student.attendanceAvg.toFixed(1)}%</strong>
            </div>
          </div>
        </div>

        {/* 2. Multi-Indicator Risk Flags with Explainable Bullet Points */}
        <div style={{ marginBottom: '22px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#172554', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldAlert size={16} color="#243B7A" />
            <span>Multi-Indicator Risk Diagnostics & Reasons</span>
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {/* Academic Risk Card */}
            <div
              style={{
                padding: '14px 16px',
                borderRadius: '12px',
                backgroundColor: risk.academicRisk === 'High' ? '#FEF2F2' : risk.academicRisk === 'Moderate' ? '#FFFBEB' : '#F0FDF4',
                border: `1px solid ${risk.academicRisk === 'High' ? '#FECACA' : risk.academicRisk === 'Moderate' ? '#FDE68A' : '#BBF7D0'}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: risk.academicRisk === 'High' ? '#991B1B' : risk.academicRisk === 'Moderate' ? '#92400E' : '#166534' }}>
                  Academic Risk: {risk.academicRisk}
                </span>
                <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748B' }}>CGPA: {student.cgpa.toFixed(2)}</span>
              </div>
              {risk.academicRiskReasons.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.74rem', color: '#334155', lineHeight: 1.45 }}>
                  {risk.academicRiskReasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ margin: 0, fontSize: '0.74rem', color: '#166534' }}>All academic metrics healthy (zero backlogs, strong exams).</p>
              )}
            </div>

            {/* Placement Risk Card */}
            <div
              style={{
                padding: '14px 16px',
                borderRadius: '12px',
                backgroundColor: risk.placementRisk === 'High' ? '#FEF2F2' : risk.placementRisk === 'Moderate' ? '#FFFBEB' : '#F0FDF4',
                border: `1px solid ${risk.placementRisk === 'High' ? '#FECACA' : risk.placementRisk === 'Moderate' ? '#FDE68A' : '#BBF7D0'}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: risk.placementRisk === 'High' ? '#991B1B' : risk.placementRisk === 'Moderate' ? '#92400E' : '#166534' }}>
                  Placement Risk: {risk.placementRisk}
                </span>
                <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748B' }}>Readiness: {student.placementReadinessPct.toFixed(0)}%</span>
              </div>
              {risk.placementRiskReasons.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.74rem', color: '#334155', lineHeight: 1.45 }}>
                  {risk.placementRiskReasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ margin: 0, fontSize: '0.74rem', color: '#166534' }}>Coding and interview scores align with recruitment cutoffs.</p>
              )}
            </div>
          </div>
        </div>

        {/* 3. The 7 Explainable Indicator Progress Bars */}
        <div style={{ marginBottom: '22px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#172554', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={16} color="#243B7A" />
            <span>Explainable Scoring Drivers (Normalized 0 – 100)</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {score.factors.map((factor) => {
              const barColor = factor.score >= 75 ? '#198754' : factor.score >= 60 ? '#243B7A' : factor.score >= 45 ? '#E7A23B' : '#DC2626';

              return (
                <div
                  key={factor.category}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#172554' }}>
                        {factor.category}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#64748B', marginLeft: '6px' }}>
                        (Weight: {factor.weight}%)
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#172554' }}>
                        {factor.score}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#64748B' }}>/ 100</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ width: '100%', height: '7px', borderRadius: '999px', backgroundColor: '#E2E8F0', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${factor.score}%`,
                        height: '100%',
                        backgroundColor: barColor,
                        borderRadius: '999px',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>

                  <p style={{ fontSize: '0.68rem', color: '#64748B', margin: '4px 0 0' }}>
                    {factor.details}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Positive Contributors & Areas to Improve */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '22px' }}>
          <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: '#166534', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <CheckCircle2 size={14} color="#166534" />
              <span>Positive Contributors</span>
            </h4>
            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.74rem', color: '#14532D', lineHeight: 1.45 }}>
              {score.positiveContributors.length > 0 ? (
                score.positiveContributors.map((c, i) => <li key={i}>{c}</li>)
              ) : (
                <li>Baseline performance active across indicators.</li>
              )}
            </ul>
          </div>

          <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: '#92400E', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <AlertTriangle size={14} color="#92400E" />
              <span>Attention Areas</span>
            </h4>
            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.74rem', color: '#78350F', lineHeight: 1.45 }}>
              {score.attentionAreas.length > 0 ? (
                score.attentionAreas.map((a, i) => <li key={i}>{a}</li>)
              ) : (
                <li>No immediate critical blockers flagged.</li>
              )}
            </ul>
          </div>
        </div>

        {/* 5. Actionable Insights Cards */}
        <div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#172554', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} color="#E7A23B" />
            <span>Targeted Actionable Recommendations</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {student.actionableInsights.map((ins) => (
              <div
                key={ins.id}
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  backgroundColor: ins.severity === 'urgent' ? '#FEF2F2' : ins.severity === 'positive' ? '#F0FDF4' : '#FFFBEB',
                  border: `1px solid ${ins.severity === 'urgent' ? '#FECACA' : ins.severity === 'positive' ? '#BBF7D0' : '#FDE68A'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      backgroundColor: '#FFFFFF',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      color: '#172554',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    {ins.tags.join(' • ')}
                  </span>
                  <strong style={{ fontSize: '0.82rem', color: '#172554' }}>{ins.title}</strong>
                </div>

                <p style={{ fontSize: '0.74rem', color: '#475569', margin: '4px 0' }}>
                  <strong>What was detected:</strong> {ins.detectedCondition}
                </p>
                <p style={{ fontSize: '0.74rem', color: '#475569', margin: '4px 0' }}>
                  <strong>Why it matters:</strong> {ins.whyItMatters}
                </p>
                <div
                  style={{
                    marginTop: '6px',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    color: '#0F172A',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <ArrowRight size={13} color="#243B7A" />
                  <span><strong>Suggested Action:</strong> {ins.suggestedAction}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '24px', paddingTop: '14px', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="vs-btn-primary" style={{ padding: '8px 20px', fontSize: '0.84rem' }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
