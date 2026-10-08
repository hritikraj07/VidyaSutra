'use client';

import React, { useState, useEffect } from 'react';
import {
  Compass,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Users,
  QrCode,
  Calendar,
  Save,
  Activity,
  MapPin,
} from 'lucide-react';

interface AttendanceSettingsData {
  radius_meters: number;
  qr_refresh_seconds: number;
  session_duration_mins: number;
}

interface AttendanceStats {
  totalSessions: number;
  activeSessions: number;
  totalRecords: number;
  qrRecords: number;
  manualRecords: number;
}

interface RecentSessionItem {
  id: string;
  courseCode: string;
  courseName: string;
  section: string;
  semester: number;
  teacherName: string;
  startedAt: string;
  endedAt: string | null;
  radiusMeters: number;
  isActive: boolean;
  status: string;
  attendeesCount: number;
  hasTeacherGps: boolean;
}

export const AdminAttendanceSettingsView: React.FC = () => {
  const [settings, setSettings] = useState<AttendanceSettingsData>({
    radius_meters: 30,
    qr_refresh_seconds: 5,
    session_duration_mins: 60,
  });

  const [stats, setStats] = useState<AttendanceStats>({
    totalSessions: 0,
    activeSessions: 0,
    totalRecords: 0,
    qrRecords: 0,
    manualRecords: 0,
  });

  const [recentSessions, setRecentSessions] = useState<RecentSessionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form input states
  const [formRadius, setFormRadius] = useState<number>(30);
  const [formInterval, setFormInterval] = useState<number>(5);
  const [formDuration, setFormDuration] = useState<number>(60);

  const fetchSettingsAndAudit = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/settings/attendance');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings(data.settings);
          setFormRadius(data.settings.radius_meters);
          setFormInterval(data.settings.qr_refresh_seconds);
          setFormDuration(data.settings.session_duration_mins);
        }
        if (data.stats) {
          setStats(data.stats);
        }
        if (Array.isArray(data.recentSessions)) {
          setRecentSessions(data.recentSessions);
        }
      }
    } catch (err) {
      console.error('Failed to load attendance settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndAudit();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    // Sensible Validation
    if (isNaN(formRadius) || formRadius <= 0) {
      setFeedback({ type: 'error', message: 'Attendance radius must be a positive number greater than 0.' });
      return;
    }
    if (formRadius < 5 || formRadius > 500) {
      setFeedback({ type: 'error', message: 'Attendance radius must be between 5 and 500 meters.' });
      return;
    }
    if (isNaN(formInterval) || formInterval < 3 || formInterval > 60) {
      setFeedback({ type: 'error', message: 'QR refresh interval must be between 3 and 60 seconds.' });
      return;
    }
    if (isNaN(formDuration) || formDuration < 10 || formDuration > 360) {
      setFeedback({ type: 'error', message: 'Session duration must be between 10 and 360 minutes.' });
      return;
    }

    try {
      setIsSaving(true);
      const res = await fetch('/api/admin/settings/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          radius_meters: formRadius,
          qr_refresh_seconds: formInterval,
          session_duration_mins: formDuration,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSettings(data.settings);
        setFeedback({
          type: 'success',
          message: 'Attendance configuration updated. All newly initiated teacher sessions will use these settings.',
        });
        setTimeout(() => setFeedback(null), 4000);
      } else {
        setFeedback({ type: 'error', message: data.message || 'Failed to update settings.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error saving attendance settings.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Toast Feedback */}
      {feedback && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: feedback.type === 'success' ? '#F0FDF4' : '#FEF2F2',
            border: `1px solid ${feedback.type === 'success' ? '#BBF7D0' : '#FECACA'}`,
            color: feedback.type === 'success' ? '#15803D' : '#DC2626',
            fontSize: '0.88rem',
            fontWeight: 600,
          }}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 1. Telemetry & Analytics Overview Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
        }}
      >
        <div className="vs-card" style={{ padding: '20px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B' }}>Fixed GPS Radius</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#EEF2FB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#243B7A' }}>
              <Compass size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#172554' }}>
            {settings.radius_meters}m
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '2px' }}>
            Teacher-centered classroom threshold
          </div>
        </div>

        <div className="vs-card" style={{ padding: '20px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B' }}>QR Refresh Window</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#172554' }}>
            {settings.qr_refresh_seconds}s
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '2px' }}>
            Cryptographic token rotation interval
          </div>
        </div>

        <div className="vs-card" style={{ padding: '20px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B' }}>Total Attendance Logs</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#166534' }}>
              <ShieldCheck size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#172554' }}>
            {stats.totalRecords}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '2px' }}>
            {stats.qrRecords} QR Verified • {stats.manualRecords} Manual
          </div>
        </div>

        <div className="vs-card" style={{ padding: '20px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B' }}>Active Sessions</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F172A' }}>
              <Activity size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#172554' }}>
            {stats.activeSessions}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '2px' }}>
            Of {stats.totalSessions} total lecture sessions
          </div>
        </div>
      </div>

      {/* 2. Configuration Form */}
      <div
        className="vs-card"
        style={{
          padding: '28px',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <Compass size={22} color="#243B7A" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#172554', margin: 0 }}>
            Attendance Security & GPS Geofencing Settings
          </h2>
        </div>
        <p style={{ fontSize: '0.84rem', color: '#64748B', marginBottom: '24px', maxWidth: '640px' }}>
          Configure institutional anti-proxy boundaries. Changing these settings globally governs how teacher
          attendance sessions capture classroom coordinates and validate scanning devices.
        </p>

        <form onSubmit={handleSaveSettings}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
              marginBottom: '24px',
            }}
          >
            {/* Radius Input */}
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
                Default Attendance Radius (Meters) *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  min={5}
                  max={500}
                  step={1}
                  value={formRadius}
                  onChange={(e) => setFormRadius(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px 42px 10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    color: '#172554',
                  }}
                  required
                />
                <span
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '11px',
                    fontSize: '0.8rem',
                    color: '#64748B',
                    fontWeight: 700,
                  }}
                >
                  m
                </span>
              </div>
              <span style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '6px', display: 'block' }}>
                Default: 30 meters. Maximum allowed distance between fixed teacher center and student scan.
              </span>
            </div>

            {/* QR Refresh Interval */}
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
                QR Refresh Interval (Seconds) *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  min={3}
                  max={60}
                  step={1}
                  value={formInterval}
                  onChange={(e) => setFormInterval(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px 42px 10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    color: '#172554',
                  }}
                  required
                />
                <span
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '11px',
                    fontSize: '0.8rem',
                    color: '#64748B',
                    fontWeight: 700,
                  }}
                >
                  sec
                </span>
              </div>
              <span style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '6px', display: 'block' }}>
                Default: 5 seconds. Automatically cycles cryptographic tokens to prevent remote screenshot proxies.
              </span>
            </div>

            {/* Session Duration Rules */}
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
                Max Attendance Session Duration (Minutes) *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  min={10}
                  max={360}
                  step={5}
                  value={formDuration}
                  onChange={(e) => setFormDuration(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px 48px 10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    color: '#172554',
                  }}
                  required
                />
                <span
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '11px',
                    fontSize: '0.8rem',
                    color: '#64748B',
                    fontWeight: 700,
                  }}
                >
                  mins
                </span>
              </div>
              <span style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '6px', display: 'block' }}>
                Default: 60 minutes. Automatically closes attendance sessions that are left open unintentionally.
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#243B7A',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '11px 22px',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: isSaving ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(36, 59, 122, 0.25)',
            }}
          >
            <Save size={16} />
            <span>{isSaving ? 'Saving Changes...' : 'Save Attendance Settings'}</span>
          </button>
        </form>
      </div>

      {/* 3. Attendance Session Audit & History Log */}
      <div
        className="vs-card"
        style={{
          padding: '24px',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#172554', margin: 0 }}>
              Attendance Sessions Audit & History
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '4px 0 0 0' }}>
              Historical audit log of conducted classroom QR sessions with geofence verification telemetry.
            </p>
          </div>

          <button
            onClick={fetchSettingsAndAudit}
            disabled={isLoading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #CBD5E1',
              backgroundColor: '#F8FAFC',
              color: '#475569',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '10px 14px', fontWeight: 700, color: '#475569' }}>Class / Subject</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, color: '#475569' }}>Faculty</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, color: '#475569' }}>Section</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, color: '#475569' }}>Started At</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, color: '#475569' }}>Status</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, color: '#475569' }}>Geofence</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, color: '#475569', textAlign: 'right' }}>
                  Present
                </th>
              </tr>
            </thead>
            <tbody>
              {recentSessions.length > 0 ? (
                recentSessions.map((ses) => (
                  <tr key={ses.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontWeight: 700, color: '#172554' }}>{ses.courseName}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{ses.courseCode}</div>
                    </td>

                    <td style={{ padding: '10px 14px', color: '#334155', fontWeight: 600 }}>
                      {ses.teacherName}
                    </td>

                    <td style={{ padding: '10px 14px' }}>
                      <span
                        style={{
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          backgroundColor: '#EEF2FB',
                          color: '#243B7A',
                          padding: '2px 8px',
                          borderRadius: '4px',
                        }}
                      >
                        {ses.section} (Sem {ses.semester || 1})
                      </span>
                    </td>

                    <td style={{ padding: '10px 14px', color: '#64748B' }}>
                      {new Date(ses.startedAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    <td style={{ padding: '10px 14px' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: ses.isActive ? '#DCFCE7' : '#F1F5F9',
                          color: ses.isActive ? '#15803D' : '#64748B',
                        }}
                      >
                        {ses.isActive ? '● ACTIVE' : 'ENDED'}
                      </span>
                    </td>

                    <td style={{ padding: '10px 14px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          color: ses.hasTeacherGps ? '#15803D' : '#64748B',
                        }}
                      >
                        <MapPin size={12} />
                        {ses.hasTeacherGps ? `Locked (${ses.radiusMeters}m)` : `Default (${ses.radiusMeters}m)`}
                      </span>
                    </td>

                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#172554' }}>
                      {ses.attendeesCount}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: '#64748B' }}>
                    No recorded attendance sessions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
