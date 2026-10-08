'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  CheckCircle2,
  AlertTriangle,
  QrCode,
  ArrowRight,
  ShieldCheck,
  Clock,
  User,
  BookOpen,
  Sparkles,
  Lock,
} from 'lucide-react';

function AttendanceScanContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const sid = searchParams.get('sid') || searchParams.get('session_id') || searchParams.get('session') || '';
  const token = searchParams.get('token') || searchParams.get('tok') || searchParams.get('session') || '';

  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [result, setResult] = useState<{
    success: boolean;
    duplicate?: boolean;
    error?: string;
    message: string;
    details?: any;
  } | null>(null);

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState('student@vidyasutra.edu.in');
  const [loginPassword, setLoginPassword] = useState('VidyaSutra#2026!');
  const [loginError, setLoginError] = useState<string | null>(null);

  // 1. Check if student is already logged in
  useEffect(() => {
    let isMounted = true;
    async function checkAuthAndValidate() {
      setIsLoading(true);
      try {
        const authRes = await fetch('/api/auth');
        const authData = await authRes.json();

        if (!isMounted) return;

        if (authData.user && authData.user.role === 'student') {
          setCurrentUser(authData.user);
          // Automatically validate scanned attendance
          if (sid && token) {
            await executeValidation(sid, token);
          } else {
            setResult({
              success: false,
              message: 'Invalid attendance link. Missing session ID or verification token.',
            });
            setIsLoading(false);
          }
        } else {
          setCurrentUser(null);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (!isMounted) return;
        setIsLoading(false);
        setResult({
          success: false,
          message: 'Network error connecting to VidyaSutra gateway.',
        });
      }
    }

    checkAuthAndValidate();

    return () => {
      isMounted = false;
    };
  }, [sid, token]);

  const executeValidation = async (targetSid: string, targetToken: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/attendance/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: targetSid,
          token: targetToken,
        }),
      });

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setResult({
        success: false,
        message: 'Unable to connect to VidyaSutra. Check your internet connection and try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 1-Click Authenticate as Student Demo & Submit Scan
  const handleStudentLoginAndScan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: loginEmail,
          password: loginPassword,
          role: 'student',
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setCurrentUser(data.user);
        if (sid && token) {
          await executeValidation(sid, token);
        } else {
          setResult({
            success: false,
            message: 'Signed in, but missing attendance QR session token.',
          });
          setIsLoading(false);
        }
      } else {
        setLoginError(data.error || 'Authentication rejected. Please check your credentials.');
      }
    } catch {
      setLoginError('Network failure connecting to login service.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0F172A',
        backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(36, 59, 122, 0.45) 0%, transparent 75%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        color: '#FFFFFF',
      }}
    >
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            backgroundColor: '#FFFFFF',
            padding: '4px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
            marginBottom: '12px',
          }}
        >
          <img
            src="/logo.jpg"
            alt="VidyaSutra Logo"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#F8FAFC' }}>
          VidyaSutra
        </h1>
        <p style={{ fontSize: '0.82rem', color: '#94A3B8', margin: '4px 0 0 0' }}>
          Academic Intelligence • Classroom Attendance Verification
        </p>
      </div>

      {/* Main Card Container */}
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#FFFFFF',
          color: '#1E293B',
          borderRadius: '20px',
          boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(226, 232, 240, 0.9)',
          overflow: 'hidden',
          padding: '28px 24px',
        }}
      >
        {/* Loading Spinner */}
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '36px 16px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                border: '3px solid #E2E8F0',
                borderTopColor: '#243B7A',
                borderRadius: '50%',
                margin: '0 auto 16px',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#172554', margin: '0 0 6px 0' }}>
              Verifying Attendance...
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748B', margin: 0 }}>
              Validating session cryptographic token and student identity.
            </p>
            <style>{`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}

        {/* Case 1: Attendance Succeeded */}
        {!isLoading && result?.success && (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#DCFCE7',
                color: '#15803D',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px',
                boxShadow: '0 6px 18px rgba(21, 128, 61, 0.25)',
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                color: '#15803D',
                backgroundColor: '#DCFCE7',
                padding: '3px 10px',
                borderRadius: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Verified Present
            </span>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#172554', margin: '10px 0 4px' }}>
              ATTENDANCE MARKED
            </h2>
            <p style={{ fontSize: '0.84rem', color: '#64748B', margin: '0 0 20px' }}>
              Your classroom attendance has been successfully recorded.
            </p>

            {/* Receipt Card */}
            <div
              style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: '#64748B' }}>Subject:</span>
                <strong style={{ color: '#172554' }}>
                  {result.details?.course || result.details?.courseCode || 'Data Structures'}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: '#64748B' }}>Class:</span>
                <strong style={{ color: '#243B7A' }}>{result.details?.section || 'CSE-A'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: '#64748B' }}>Faculty:</span>
                <strong style={{ color: '#172554' }}>
                  {result.details?.teacher || 'Course Instructor'}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: '#64748B' }}>Time:</span>
                <strong style={{ color: '#15803D' }}>
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', paddingTop: '8px', borderTop: '1px dashed #CBD5E1' }}>
                <span style={{ color: '#64748B' }}>Status:</span>
                <span style={{ fontWeight: 800, color: '#15803D', backgroundColor: '#DCFCE7', padding: '2px 8px', borderRadius: '4px' }}>
                  PRESENT
                </span>
              </div>
            </div>

            <button
              onClick={() => router.push('/')}
              style={{
                width: '100%',
                padding: '12px 18px',
                backgroundColor: '#243B7A',
                color: '#FFFFFF',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.9rem',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(36, 59, 122, 0.25)',
              }}
            >
              Back to Dashboard
            </button>
          </div>
        )}

        {/* Case 2: Attendance Failed or Duplicate */}
        {!isLoading && result && !result.success && (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: result.duplicate ? '#FEF3C7' : '#FEE2E2',
                color: result.duplicate ? '#D97706' : '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
              }}
            >
              <AlertTriangle size={30} />
            </div>

            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#172554', margin: '0 0 6px' }}>
              {result.duplicate ? 'Attendance Already Marked' : 'Attendance Not Marked'}
            </h3>
            <p style={{ fontSize: '0.86rem', color: '#64748B', lineHeight: 1.5, margin: '0 0 20px' }}>
              {result.message}
            </p>

            <button
              onClick={() => router.push('/')}
              style={{
                width: '100%',
                padding: '12px 18px',
                backgroundColor: '#243B7A',
                color: '#FFFFFF',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.88rem',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Return to Dashboard
            </button>
          </div>
        )}

        {/* Case 3: Student Not Logged In */}
        {!isLoading && !currentUser && !result && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: '#EEF2FB',
                  color: '#243B7A',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '10px',
                }}
              >
                <Lock size={22} />
              </div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#172554', margin: '0 0 4px' }}>
                Sign in to Record Attendance
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#64748B', margin: 0 }}>
                You must sign in as an enrolled student to verify your identity.
              </p>
            </div>

            {loginError && (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  color: '#DC2626',
                  fontSize: '0.8rem',
                  marginBottom: '14px',
                }}
              >
                {loginError}
              </div>
            )}

            {/* Quick 1-Click Student Demo Button */}
            <button
              type="button"
              onClick={() => handleStudentLoginAndScan()}
              disabled={isLoggingIn}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#243B7A',
                color: '#FFFFFF',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.88rem',
                border: 'none',
                cursor: isLoggingIn ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(36, 59, 122, 0.25)',
                marginBottom: '16px',
              }}
            >
              <span>{isLoggingIn ? 'Verifying...' : '⚡ Continue as Student Demo & Mark'}</span>
              <ArrowRight size={16} />
            </button>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                margin: '14px 0',
                fontSize: '0.74rem',
                color: '#94A3B8',
              }}
            >
              <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
              <span style={{ padding: '0 10px' }}>or sign in with credentials</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
            </div>

            <form onSubmit={handleStudentLoginAndScan} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '4px' }}>
                  Student Email
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.84rem',
                    boxSizing: 'border-box',
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '4px' }}>
                  Password
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.84rem',
                    boxSizing: 'border-box',
                  }}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#0F172A',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  border: 'none',
                  cursor: isLoggingIn ? 'not-allowed' : 'pointer',
                  marginTop: '4px',
                }}
              >
                Sign In &amp; Record Attendance
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AttendanceScanPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F172A', color: '#FFFFFF' }}>
          Loading Attendance Scanner...
        </div>
      }
    >
      <AttendanceScanContent />
    </Suspense>
  );
}
