'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import QRCode from 'qrcode';
import { useApp } from '@/context/AppContext';
import {
  X,
  QrCode,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  StopCircle,
  Play,
  Maximize2,
  Minimize2,
  Users,
  ShieldCheck,
  MapPin,
} from 'lucide-react';

interface QRGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCourseCode?: string;
  defaultSection?: string;
}

export const QRGeneratorModal: React.FC<QRGeneratorModalProps> = ({
  isOpen,
  onClose,
  defaultCourseCode = 'CS301',
  defaultSection = 'CSE-A',
}) => {
  const {
    activeSession,
    refreshSession,
    startTeacherSession,
    endTeacherSession,
    currentUser,
  } = useApp();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedCourseCode, setSelectedCourseCode] = useState(defaultCourseCode);
  const [selectedSection, setSelectedSection] = useState(defaultSection);
  const [sessionTitle, setSessionTitle] = useState('Lecture Attendance Session');
  const [secondsRemaining, setSecondsRemaining] = useState(5);
  const [isClassroomMode, setIsClassroomMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isLive = Boolean(activeSession?.isActive);

  // Synchronize 5-second countdown timer with live rotating session
  useEffect(() => {
    if (!isOpen || !isLive) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          refreshSession();
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isLive, refreshSession]);

  // Render QR Canvas whenever session payload updates
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    if (isLive && activeSession?.qrPayload) {
      QRCode.toCanvas(
        canvasRef.current,
        activeSession.qrPayload,
        {
          width: isClassroomMode ? 440 : 280,
          margin: 2,
          color: {
            dark: '#172554', // Vidya Deep Navy
            light: '#FFFFFF',
          },
          errorCorrectionLevel: 'M',
        },
        (err) => {
          if (err) console.error('Failed to render classroom QR canvas:', err);
        }
      );
    }
  }, [isOpen, isLive, activeSession?.qrPayload, isClassroomMode]);

  const handleStartSession = async () => {
    setIsStarting(true);
    setErrorMessage(null);
    try {
      const result = await startTeacherSession(selectedCourseCode, selectedSection, sessionTitle, {
        course: 'Computer Science & Engineering',
        semester: 6,
        period: '09:00 AM - 10:00 AM',
      });
      if (!result.success) {
        setErrorMessage(result.message || 'Failed to start live session.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error initializing session');
    } finally {
      setIsStarting(false);
    }
  };

  const handleEndSession = async () => {
    setIsEnding(true);
    try {
      await endTeacherSession();
    } finally {
      setIsEnding(false);
    }
  };

  const handleCopyToken = () => {
    const token = activeSession?.currentToken || activeSession?.token;
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="vs-modal-backdrop" onClick={onClose}>
      <div
        className="vs-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: isClassroomMode ? '820px' : '580px',
          maxHeight: '94vh',
          overflowY: 'auto',
          padding: isClassroomMode ? '32px' : '24px',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 25px 60px rgba(23, 37, 84, 0.35)',
          transition: 'all 0.25s ease',
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: '#EEF2FB',
                color: '#243B7A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <QrCode size={22} color="#243B7A" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#172554', margin: 0 }}>
                Live Classroom QR Generator
              </h2>
              <p style={{ fontSize: '0.76rem', color: '#64748B', margin: 0, marginTop: '2px' }}>
                Dynamic 5-second encrypted token for projector & classroom displays
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isLive && (
              <button
                onClick={() => setIsClassroomMode((prev) => !prev)}
                title={isClassroomMode ? 'Standard View' : 'Classroom Screen Projector Mode'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#EEF2FB',
                  color: '#243B7A',
                  border: '1px solid #D6E0F5',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {isClassroomMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                <span>{isClassroomMode ? 'Compact' : 'Classroom Screen'}</span>
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
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {errorMessage && (
          <div style={{ padding: '12px', backgroundColor: '#FEF2F2', color: '#DC2626', borderRadius: '8px', fontSize: '0.82rem', marginBottom: '14px' }}>
            {errorMessage}
          </div>
        )}

        {!isLive ? (
          /* Session Start Configuration */
          <div style={{ padding: '10px 0' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
                Course Subject
              </label>
              <select
                value={selectedCourseCode}
                onChange={(e) => setSelectedCourseCode(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.85rem',
                  backgroundColor: '#FFFFFF',
                  fontWeight: 600,
                }}
              >
                <option value="CS301">CS301 - Data Structures & Algorithms</option>
                <option value="CS302">CS302 - Database Management Systems</option>
                <option value="CS303">CS303 - Operating Systems</option>
                <option value="CS304">CS304 - Computer Networks</option>
                <option value="IT201">IT201 - Object Oriented Programming</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
                  Target Section / Batch
                </label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.85rem',
                    backgroundColor: '#FFFFFF',
                    fontWeight: 600,
                  }}
                >
                  <option value="CSE-A">CSE-A (Batch 1)</option>
                  <option value="CSE-B">CSE-B (Batch 2)</option>
                  <option value="IT-A">IT-A</option>
                  <option value="IT-B">IT-B</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
                  Lecture Session Title
                </label>
                <input
                  type="text"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  placeholder="e.g. Regular Morning Lecture"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.85rem',
                    backgroundColor: '#FFFFFF',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div
              style={{
                padding: '12px 14px',
                backgroundColor: '#F8FAFC',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '0.78rem',
                color: '#64748B',
              }}
            >
              <ShieldCheck size={18} color="#15803D" />
              <span>
                Tokens rotate every 5 seconds cryptographically with GPS geofence checks (30m classroom radius).
              </span>
            </div>

            <button
              onClick={handleStartSession}
              disabled={isStarting}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#243B7A',
                color: '#FFFFFF',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(36, 59, 122, 0.25)',
              }}
            >
              <Play size={16} />
              <span>{isStarting ? 'Initializing Session...' : 'Start Live Classroom QR Attendance'}</span>
            </button>
          </div>
        ) : (
          /* Live Classroom Screen Display Mode */
          <div style={{ textAlign: 'center', padding: isClassroomMode ? '16px 0' : '8px 0' }}>
            {/* Live Banner */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 14px',
                borderRadius: '999px',
                backgroundColor: '#DCFCE7',
                border: '1px solid #BBF7D0',
                color: '#15803D',
                fontWeight: 700,
                fontSize: '0.78rem',
                marginBottom: '14px',
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16A34A', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
              <span>SESSION ACTIVE • {activeSession?.courseCode} ({activeSession?.section})</span>
            </div>

            {/* Big Classroom QR Canvas */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                margin: '0 auto 16px',
                padding: '16px',
                backgroundColor: '#FFFFFF',
                border: '2px solid #243B7A',
                borderRadius: '16px',
                width: 'max-content',
                boxShadow: '0 8px 30px rgba(36, 59, 122, 0.15)',
              }}
            >
              <canvas ref={canvasRef} style={{ display: 'block', borderRadius: '8px' }} />
            </div>

            {/* Countdown Progress Ring Bar */}
            <div style={{ maxWidth: '380px', margin: '0 auto 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: '#64748B', fontWeight: 600, marginBottom: '4px' }}>
                <span>Dynamic Security Token</span>
                <span style={{ color: '#243B7A', fontWeight: 700 }}>Rotating in {secondsRemaining}s</span>
              </div>
              <div style={{ height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${(secondsRemaining / 5) * 100}%`,
                    backgroundColor: secondsRemaining <= 2 ? '#E7A23B' : '#243B7A',
                    transition: 'width 1s linear',
                  }}
                />
              </div>
            </div>

            {/* Token & Verified Stats */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '16px',
                flexWrap: 'wrap',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#172554', fontWeight: 700, backgroundColor: '#F8FAFC', padding: '6px 12px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <Clock size={15} color="#243B7A" />
                <span>Token: <code style={{ color: '#243B7A' }}>{activeSession?.currentToken || activeSession?.token || '---'}</code></span>
                <button
                  onClick={handleCopyToken}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: '#64748B' }}
                >
                  {copied ? <Check size={14} color="#15803D" /> : <Copy size={14} />}
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#15803D', fontWeight: 700, backgroundColor: '#DCFCE7', padding: '6px 12px', borderRadius: '6px', border: '1px solid #BBF7D0' }}>
                <Users size={15} color="#15803D" />
                <span>Students Scanned: {activeSession?.presentCount || 0}</span>
              </div>
            </div>

            {/* End Session Button */}
            <button
              onClick={handleEndSession}
              disabled={isEnding}
              style={{
                padding: '10px 24px',
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)',
              }}
            >
              <StopCircle size={16} />
              <span>{isEnding ? 'Ending Live Session...' : 'Stop & Finalize Attendance Session'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
