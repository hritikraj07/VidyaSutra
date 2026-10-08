'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Shield,
  Eye,
  EyeOff,
  GraduationCap,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { UserRole } from '@/types';
import { createClient } from '@/utils/supabase/client';
import { AuthBackgroundCanvas } from '@/components/auth/AuthBackgroundCanvas';

const INSTITUTIONAL_DOMAIN = '@vidyasutra.edu.in';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  // Enforce zero page-level scrolling (single viewport fit)
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('student');

  // Status
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Subtle card parallax offset (-2.5px to +2.5px max, calm & stable)
  const [cardOffset, setCardOffset] = useState({ x: 0, y: 0 });

  const handleMouseMoveOffset = useCallback((normX: number, normY: number) => {
    // Very gentle parallax translation: 2.5px max
    setCardOffset({
      x: Math.round(normX * 2.5 * 10) / 10,
      y: Math.round(normY * 2.5 * 10) / 10,
    });
  }, []);

  // Validate institutional email
  const validateInstitutionalEmail = (inputEmail: string): boolean => {
    const clean = inputEmail.trim().toLowerCase();
    if (!clean.endsWith(INSTITUTIONAL_DOMAIN) || clean === INSTITUTIONAL_DOMAIN) {
      setErrorMsg('Access restricted to official institutional email addresses only (@vidyasutra.edu.in).');
      return false;
    }
    return true;
  };

  // Handle Institutional Sign In (Exact existing functional flow)
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanEmail = email.trim().toLowerCase();

    // 1. Enforce Institutional Domain
    if (!validateInstitutionalEmail(cleanEmail)) return;

    // 2. Enforce Password Presence
    if (!password) {
      setErrorMsg('Please enter your institutional password.');
      return;
    }

    setIsLoading(true);

    try {
      // Authenticate against persistent database gateway
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: cleanEmail,
          password,
          role,
        }),
      });

      const resData = await res.json();

      if (res.ok && resData.success) {
        // Optional sync with Supabase client session in background
        try {
          const { error: supaErr } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });
          if (supaErr) {
            console.warn('Supabase auth notice (using local DB session):', supaErr.message);
          }
        } catch {
          // Non-blocking graceful fallback
        }

        router.push('/');
        router.refresh();
      } else {
        // Clear error feedback
        if (res.status === 404 || resData.error?.includes('not found') || resData.error?.includes('Account not found')) {
          setErrorMsg('Account not found. Please verify your email or contact your institutional administrator.');
        } else if (
          res.status === 401 ||
          resData.error?.includes('Invalid credentials') ||
          resData.error?.includes('verify your password')
        ) {
          setErrorMsg('Invalid credentials. Please verify your password.');
        } else {
          setErrorMsg(resData.error || 'Authentication rejected by institutional security gateway.');
        }
      }
    } catch {
      setErrorMsg('Network error communicating with institutional authentication gateway.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Demo Autofill Helper for Hackathon Evaluators
  const fillDemoAccount = (demoRole: 'student' | 'teacher' | 'admin') => {
    setErrorMsg('');
    if (demoRole === 'student') {
      setRole('student');
      setEmail('student@vidyasutra.edu.in');
      setPassword('VidyaSutra#2026!');
    } else if (demoRole === 'teacher') {
      setRole('teacher');
      setEmail('faculty@vidyasutra.edu.in');
      setPassword('VidyaSutra#2026!');
    } else {
      setRole('teacher'); // Admin uses Teacher/Staff login portal
      setEmail('admin@vidyasutra.edu.in');
      setPassword('VidyaSutra#2026!');
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        height: '100vh',
        maxHeight: '100vh',
        width: '100vw',
        maxWidth: '100vw',
        overflow: 'hidden',
        backgroundColor: '#0F172A', // Deep Midnight base fallback
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box',
        color: '#172033', // Ink
      }}
    >
      {/* 1. Atmospheric Canvas Background (Deep Navy -> Indigo, Academic Nodes, Subtle Parallax) */}
      <AuthBackgroundCanvas onMouseMoveOffset={handleMouseMoveOffset} />

      {/* 2. Ambient Glow Behind the Login Card */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '520px',
          height: '520px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(36, 59, 122, 0.42) 0%, rgba(231, 162, 59, 0.07) 32%, rgba(23, 37, 84, 0.12) 65%, transparent 75%)',
          filter: 'blur(45px)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
        aria-hidden="true"
      />

      {/* 3. Main Card & Form Structure */}
      <div
        className="animate-login-card"
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '430px',
          maxHeight: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transform: `translate3d(${cardOffset.x}px, ${cardOffset.y}px, 0)`,
          transition: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)',
        }}
      >
        {/* Prominent Official Logo with White Badge Frame & One-Time Light Sweep */}
        <div
          className="animate-form-stagger-1"
          style={{
            textAlign: 'center',
            marginBottom: '14px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Framed Logo Badge with Ambient Glow & One-Time Light Sweep */}
          <div
            style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '92px',
              height: '88px',
              borderRadius: '20px',
              backgroundColor: '#FFFFFF',
              border: '1.5px solid rgba(226, 232, 240, 0.95)',
              boxShadow: '0 12px 32px -4px rgba(36, 59, 122, 0.35), 0 4px 12px rgba(23, 37, 84, 0.15)',
              padding: '6px',
              marginBottom: '8px',
              boxSizing: 'border-box',
              overflow: 'hidden',
            }}
          >
            {/* The Existing VidyaSutra Logo (Unmodified) */}
            <img
              src="/logo.jpg"
              alt="VidyaSutra Official Logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block',
              }}
            />

            {/* One-Time Elegant Light Sweep across Logo on Entrance */}
            <div
              className="animate-logo-sweep"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '40%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.85), transparent)',
                pointerEvents: 'none',
              }}
              aria-hidden="true"
            />
          </div>

          <h1
            style={{
              fontSize: '1.55rem',
              fontWeight: 800,
              letterSpacing: '-0.025em',
              color: '#FFFFFF', // High-contrast White over Deep Atmospheric Background
              lineHeight: 1.1,
              margin: 0,
              textShadow: '0 2px 8px rgba(15, 23, 42, 0.5)',
            }}
          >
            VidyaSutra
          </h1>
          <p
            style={{
              fontSize: '0.78rem',
              color: '#CBD5E1', // Soft Slate
              fontWeight: 600,
              margin: '3px 0 0',
              letterSpacing: '0.015em',
            }}
          >
            Modern University Intelligence Platform
          </p>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '6px',
              padding: '3px 12px',
              borderRadius: '999px',
              backgroundColor: 'rgba(36, 59, 122, 0.45)',
              border: '1px solid rgba(160, 185, 235, 0.25)',
              backdropFilter: 'blur(8px)',
              color: '#F8F7F3', // Ivory
              fontSize: '0.68rem',
              fontWeight: 700,
              letterSpacing: '0.025em',
            }}
          >
            <Shield size={11} color="#E7A23B" /> {/* Sutra Saffron */}
            <span>Institutional Authentication Gateway</span>
          </div>
        </div>

        {/* Upgraded Glass-Like Sign-In Card */}
        <div
          style={{
            width: '100%',
            padding: '24px 26px',
            backgroundColor: 'rgba(255, 255, 255, 0.96)', // Premium Frosted Surface for Maximum Readability
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow: '0 28px 65px -12px rgba(15, 23, 42, 0.45), 0 10px 24px -6px rgba(36, 59, 122, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
            borderRadius: '20px',
            border: '1px solid rgba(226, 232, 240, 0.9)',
            boxSizing: 'border-box',
          }}
        >
          {/* Card Header */}
          <div
            className="animate-form-stagger-1"
            style={{
              marginBottom: '16px',
              borderBottom: '1px solid #F1F5F9',
              paddingBottom: '12px',
            }}
          >
            <h2
              style={{
                fontSize: '1.05rem',
                fontWeight: 800,
                color: '#172554', // Deep Navy
                margin: 0,
                letterSpacing: '-0.015em',
              }}
            >
              Institutional Sign In
            </h2>
            <p
              style={{
                fontSize: '0.76rem',
                color: '#64748B', // Slate
                margin: '3px 0 0',
                fontWeight: 500,
              }}
            >
              Select your academic portal and verify institutional credentials.
            </p>
          </div>

          {/* Feedback Alerts */}
          {errorMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                padding: '10px 12px',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '10px',
                color: '#991B1B',
                fontSize: '0.78rem',
                marginBottom: '14px',
                lineHeight: 1.35,
                animation: 'formItemFadeIn 0.25s ease forwards',
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Role / Portal Selector: Student or Teacher / Staff */}
            <div className="animate-form-stagger-2">
              <label
                style={{
                  display: 'block',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#64748B', // Slate
                  textTransform: 'uppercase',
                  marginBottom: '6px',
                  letterSpacing: '0.05em',
                }}
              >
                SELECT PORTAL
              </label>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                }}
              >
                {/* 1. Student Portal Button */}
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    border: role === 'student' ? '2px solid #243B7A' : '1.5px solid #E2E8F0',
                    backgroundColor: role === 'student' ? '#243B7A' : '#F8FAFC',
                    color: role === 'student' ? '#FFFFFF' : '#64748B',
                    fontWeight: role === 'student' ? 700 : 600,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    boxShadow: role === 'student' ? '0 4px 14px rgba(36, 59, 122, 0.28)' : 'none',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  <GraduationCap size={16} color={role === 'student' ? '#E7A23B' : '#64748B'} />
                  <span>Student</span>
                </button>

                {/* 2. Teacher / Staff Portal Button */}
                <button
                  type="button"
                  onClick={() => setRole('teacher')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    border: role === 'teacher' ? '2px solid #243B7A' : '1.5px solid #E2E8F0',
                    backgroundColor: role === 'teacher' ? '#243B7A' : '#F8FAFC',
                    color: role === 'teacher' ? '#FFFFFF' : '#64748B',
                    fontWeight: role === 'teacher' ? 700 : 600,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    boxShadow: role === 'teacher' ? '0 4px 14px rgba(36, 59, 122, 0.28)' : 'none',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  <BookOpen size={16} color={role === 'teacher' ? '#E7A23B' : '#64748B'} />
                  <span>Teacher / Staff</span>
                </button>
              </div>
            </div>

            {/* Email Field with Indigo Focus State */}
            <div className="animate-form-stagger-3">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '5px',
                }}
              >
                <label
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#64748B',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Institutional Email
                </label>
                <span
                  style={{
                    fontSize: '0.67rem',
                    color: '#243B7A', // Vidya Indigo
                    fontWeight: 700,
                    backgroundColor: '#EEF2FB',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                >
                  @vidyasutra.edu.in
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={15}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#64748B',
                  }}
                />
                <input
                  type="email"
                  required
                  placeholder="username@vidyasutra.edu.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    borderRadius: '10px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.86rem',
                    color: '#172033',
                    backgroundColor: '#F8FAFC',
                    outline: 'none',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease',
                    boxSizing: 'border-box',
                    fontWeight: 500,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#243B7A';
                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(36, 59, 122, 0.16)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#CBD5E1';
                    e.currentTarget.style.backgroundColor = '#F8FAFC';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Password Field with Indigo Focus State */}
            <div className="animate-form-stagger-3">
              <label
                style={{
                  display: 'block',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#64748B',
                  textTransform: 'uppercase',
                  marginBottom: '5px',
                  letterSpacing: '0.04em',
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={15}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#64748B',
                  }}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="auth_security_key"
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-form-type="other"
                  required
                  placeholder="Enter your institutional password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 38px 10px 36px',
                    borderRadius: '10px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.86rem',
                    color: '#172033',
                    backgroundColor: '#F8FAFC',
                    outline: 'none',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease',
                    boxSizing: 'border-box',
                    fontWeight: 500,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#243B7A';
                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(36, 59, 122, 0.16)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#CBD5E1';
                    e.currentTarget.style.backgroundColor = '#F8FAFC';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748B',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: '4px',
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit Button in Vidya Indigo with Saffron Accent */}
            <div className="animate-form-stagger-4">
              <button
                type="submit"
                disabled={isLoading}
                className="vs-btn-primary"
                style={{
                  width: '100%',
                  padding: '12px 18px',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  marginTop: '4px',
                  borderRadius: '12px',
                  backgroundColor: '#243B7A', // Vidya Indigo
                  color: '#FFFFFF',
                  border: 'none',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 6px 16px rgba(36, 59, 122, 0.3)',
                  transition: 'background-color 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = '#172554'; // Deep Navy Hover
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(23, 37, 84, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = '#243B7A';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(36, 59, 122, 0.3)';
                  }
                }}
              >
                {isLoading ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        width: '14px',
                        height: '14px',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        borderTopColor: '#E7A23B', // Sutra Saffron
                        borderRadius: '50%',
                        animation: 'spinSlow 0.8s linear infinite',
                        display: 'inline-block',
                      }}
                    />
                    <span>Validating Institutional Access...</span>
                  </span>
                ) : (
                  <>
                    <span>Sign In to Portal</span>
                    <ArrowRight size={15} color="#E7A23B" /> {/* Subtle Saffron Secondary Accent */}
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Access Pills for Hackathon Judges (Discreet & Instant) */}
          <div
            className="animate-form-stagger-4"
            style={{
              marginTop: '16px',
              paddingTop: '12px',
              borderTop: '1px solid #F1F5F9',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}
            >
              <span
                style={{
                  fontSize: '0.67rem',
                  fontWeight: 700,
                  color: '#64748B',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Sparkles size={11} color="#E7A23B" />
                Demo Credentials Fill:
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '6px',
              }}
            >
              <button
                type="button"
                onClick={() => fillDemoAccount('student')}
                title="Fill Student credentials (Student)"
                style={{
                  padding: '5px 8px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#F8FAFC',
                  color: '#172554',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textAlign: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#EEF2FB';
                  e.currentTarget.style.borderColor = '#243B7A';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#F8FAFC';
                  e.currentTarget.style.borderColor = '#CBD5E1';
                }}
              >
                🎓 Student
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount('teacher')}
                title="Fill Faculty credentials (Dr. Ramesh Verma)"
                style={{
                  padding: '5px 8px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#F8FAFC',
                  color: '#172554',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textAlign: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#EEF2FB';
                  e.currentTarget.style.borderColor = '#243B7A';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#F8FAFC';
                  e.currentTarget.style.borderColor = '#CBD5E1';
                }}
              >
                📖 Teacher
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount('admin')}
                title="Fill Administrator credentials"
                style={{
                  padding: '5px 8px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#F8FAFC',
                  color: '#172554',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textAlign: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#EEF2FB';
                  e.currentTarget.style.borderColor = '#243B7A';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#F8FAFC';
                  e.currentTarget.style.borderColor = '#CBD5E1';
                }}
              >
                🛡️ Admin
              </button>
            </div>
          </div>

          {/* Official Security Notice */}
          <div
            className="animate-form-stagger-4"
            style={{
              marginTop: '12px',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: '0.66rem', color: '#64748B', lineHeight: 1.35, margin: 0 }}>
              Protected by VidyaSutra identity verification & institutional encryption. Restricted to authorized{' '}
              <code style={{ fontWeight: 700, color: '#172554' }}>@vidyasutra.edu.in</code> accounts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
