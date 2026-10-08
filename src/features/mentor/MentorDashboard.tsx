'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Users,
  AlertTriangle,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  UserCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  MessageSquare,
  Plus,
} from 'lucide-react';

export const MentorDashboard: React.FC = () => {
  const { riskRecords, addMentorIntervention } = useApp();
  const [selectedSeverity, setSelectedSeverity] = useState<'all' | 'critical' | 'high' | 'monitor'>('all');
  const [activeInterventionStudentId, setActiveInterventionStudentId] = useState<string | null>(null);
  const [interventionNote, setInterventionNote] = useState<string>('');

  const criticalCount = riskRecords.filter((r) => r.severity === 'critical').length;
  const highCount = riskRecords.filter((r) => r.severity === 'high').length;
  const monitorCount = riskRecords.filter((r) => r.severity === 'monitor').length;

  const filteredRecords = riskRecords.filter((r) => {
    if (selectedSeverity === 'all') return true;
    return r.severity === selectedSeverity;
  });

  const handleSaveIntervention = (recordId: string) => {
    if (!interventionNote.trim()) return;
    addMentorIntervention(recordId, interventionNote.trim());
    setActiveInterventionStudentId(null);
    setInterventionNote('');
  };

  return (
    <div style={{ width: '100%', padding: '16px 28px' }}>
      {/* Mentor Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              padding: '2px 8px',
              borderRadius: '6px',
              textTransform: 'uppercase',
            }}
          >
            Counseling & Intervention Queue
          </span>
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)' }}>
          Mentor Academic Risk Triage
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Early warning system flagging attendance drops, late assignments, and academic risks
        </p>
      </div>

      {/* Triage Buckets (DESIGN.md Section 15) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          marginBottom: '24px',
        }}
      >
        {/* Critical Bucket */}
        <div
          className="vs-card"
          onClick={() => setSelectedSeverity('critical')}
          style={{
            cursor: 'pointer',
            borderLeft: '4px solid var(--danger)',
            backgroundColor: selectedSeverity === 'critical' ? 'var(--danger-light)' : '#FFFFFF',
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--danger-text)', textTransform: 'uppercase' }}>
            CRITICAL
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--danger-text)', marginTop: '4px', lineHeight: 1 }}>
            {criticalCount} <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Students</span>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Immediate parental & academic intervention
          </p>
        </div>

        {/* High Risk Bucket */}
        <div
          className="vs-card"
          onClick={() => setSelectedSeverity('high')}
          style={{
            cursor: 'pointer',
            borderLeft: '4px solid var(--warning)',
            backgroundColor: selectedSeverity === 'high' ? 'var(--warning-light)' : '#FFFFFF',
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--warning-text)', textTransform: 'uppercase' }}>
            HIGH RISK
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--warning-text)', marginTop: '4px', lineHeight: 1 }}>
            {highCount} <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Students</span>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Midterm slide or assignment lapse
          </p>
        </div>

        {/* Monitor Bucket */}
        <div
          className="vs-card"
          onClick={() => setSelectedSeverity('monitor')}
          style={{
            cursor: 'pointer',
            borderLeft: '4px solid var(--info)',
            backgroundColor: selectedSeverity === 'monitor' ? 'var(--info-light)' : '#FFFFFF',
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--info-text)', textTransform: 'uppercase' }}>
            MONITOR
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--info-text)', marginTop: '4px', lineHeight: 1 }}>
            {monitorCount} <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Students</span>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Borderline attendance or pacing flags
          </p>
        </div>
      </div>

      {/* Filter Reset Button */}
      {selectedSeverity !== 'all' && (
        <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Showing <strong>{selectedSeverity}</strong> records
          </span>
          <button
            onClick={() => setSelectedSeverity('all')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Show All
          </button>
        </div>
      )}

      {/* Student Risk Cards Queue */}
      {filteredRecords.length === 0 ? (
        <div
          className="vs-card"
          style={{
            textAlign: 'center',
            padding: '48px 24px',
            backgroundColor: '#FFFFFF',
            border: '1.5px dashed var(--border)',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              backgroundColor: 'var(--success-light)',
              color: 'var(--success-text)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px',
            }}
          >
            <CheckCircle2 size={24} />
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>
            No Students Currently Flagged at Risk
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto' }}>
            All enrolled students are currently maintaining acceptable attendance and coursework submission pacing. The early-warning triage system monitors telemetry in real-time.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredRecords.map((student) => {
          const isCritical = student.severity === 'critical';
          const isHigh = student.severity === 'high';
          const isLogging = activeInterventionStudentId === student.id;

          return (
            <div
              key={student.id}
              className="vs-card vs-card-hover"
              style={{
                borderLeft: `4px solid ${
                  isCritical ? 'var(--danger)' : isHigh ? 'var(--warning)' : 'var(--info)'
                }`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)' }}>
                      {student.name}
                    </h3>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      ({student.rollNo})
                    </span>
                    <span
                      className={`vs-badge ${
                        isCritical ? 'vs-badge-danger' : isHigh ? 'vs-badge-warning' : 'vs-badge-info'
                      }`}
                    >
                      {student.severity.toUpperCase()}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {student.department} • Semester {student.semester}
                  </p>
                </div>

                {/* Score & Attendance Metrics */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Success Score
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)' }}>
                      {student.successScore} / 100
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Avg Attendance
                    </div>
                    <div
                      style={{
                        fontSize: '1.2rem',
                        fontWeight: 800,
                        color: student.attendanceAvg < 75 ? 'var(--danger)' : 'var(--text)',
                      }}
                    >
                      {student.attendanceAvg}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Explainable Diagnostic Reasons (PRD Section 7) */}
              <div
                style={{
                  margin: '12px 0',
                  padding: '10px 14px',
                  backgroundColor: '#F8FAFC',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Why Flagged (Explainable Trigger):
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: isCritical ? 'var(--danger-text)' : 'var(--text)' }}>
                  • {student.primaryRiskReason}
                </div>
                {student.secondaryRiskReason && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    • {student.secondaryRiskReason}
                  </div>
                )}
              </div>

              {/* Intervention History & Log Action */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Last follow-up: <strong>{student.lastIntervention || 'None yet'}</strong> ({student.interventionsCount} recorded)
                </div>

                {!isLogging ? (
                  <button
                    onClick={() => setActiveInterventionStudentId(student.id)}
                    className="vs-btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                  >
                    <Plus size={14} />
                    <span>Log Intervention Note</span>
                  </button>
                ) : (
                  <div style={{ width: '100%', marginTop: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="e.g. Conducted 1-on-1 counseling, assigned remedial lab..."
                        value={interventionNote}
                        onChange={(e) => setInterventionNote(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border)',
                          fontSize: '0.8rem',
                        }}
                      />
                      <button
                        onClick={() => handleSaveIntervention(student.id)}
                        className="vs-btn-primary"
                        style={{ padding: '8px 14px', fontSize: '0.8rem' }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setActiveInterventionStudentId(null)}
                        className="vs-btn-secondary"
                        style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
};
