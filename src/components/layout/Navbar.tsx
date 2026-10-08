'use client';

import React from 'react';
import Image from 'next/image';
import { useApp } from '@/context/AppContext';
import {
  QrCode,
  LogOut,
  LayoutDashboard,
  Calendar,
  CheckCircle2,
  BookOpen,
  Sparkles,
  Briefcase,
  Users,
  Shield,
  GraduationCap,
  User as UserIcon,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentUser, activeRole, logout, setIsQrScannerOpen, activeTab, setActiveTab } = useApp();

  if (!currentUser) return null;

  const roleLower = (currentUser?.role || activeRole || '').toLowerCase();
  const isAdmin = roleLower === 'admin';
  const isTeacher = !isAdmin && (roleLower === 'teacher' || roleLower === 'faculty' || roleLower === 'staff');
  const isStudent = !isAdmin && !isTeacher;

  const handleBrandClick = () => {
    setActiveTab('dashboard');
  };

  return (
    <header
      className="vs-floating-island-wrapper"
      style={{
        position: 'fixed',
        top: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        width: 'max-content',
        maxWidth: 'calc(100vw - 32px)',
        boxSizing: 'border-box',
        pointerEvents: 'none', // Allows clicking through wrapper edges
      }}
    >
      {/* Floating Island Pill Container */}
      <nav
        className="vs-floating-navbar"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 10px 6px 12px',
          borderRadius: '9999px',
          backgroundColor: 'rgba(255, 255, 255, 0.82)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(203, 213, 225, 0.75)',
          boxShadow: '0 12px 30px -4px rgba(13, 27, 42, 0.08), 0 4px 12px -2px rgba(13, 27, 42, 0.04)',
          pointerEvents: 'auto',
          boxSizing: 'border-box',
          transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
        }}
      >
        {/* ========================================================= */}
        {/* 1. LEFT SECTION: Brand Emblem + Title + Role Badge       */}
        {/* ========================================================= */}
        <div
          onClick={handleBrandClick}
          className="vs-nav-brand"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            userSelect: 'none',
            padding: '2px 6px 2px 2px',
            borderRadius: '9999px',
            transition: 'opacity 0.15s ease',
          }}
          title="Return to Portal Home"
        >
          {/* Framed Emblem Icon */}
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '9px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2px',
              boxSizing: 'border-box',
              boxShadow: '0 1px 3px rgba(13, 27, 42, 0.06)',
              flexShrink: 0,
            }}
          >
            <Image
              src="/logo.webp"
              alt="VidyaSutra Official Logo"
              width={28}
              height={28}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          </div>

          {/* Brand Name */}
          <span
            style={{
              fontSize: '0.9rem',
              fontWeight: 800,
              letterSpacing: '-0.025em',
              color: '#172554', // Deep Navy
              whiteSpace: 'nowrap',
            }}
          >
            VidyaSutra
          </span>

          {/* Role Pill Badge */}
          <span
            style={{
              fontSize: '0.62rem',
              fontWeight: 700,
              backgroundColor: isAdmin ? '#FEF3C7' : isTeacher ? '#EEF2FB' : '#EEF2FB',
              color: isAdmin ? '#B45309' : '#243B7A', // Amber for Admin, Vidya Indigo for Teacher/Student
              border: `1px solid ${isAdmin ? '#FDE68A' : '#D6E0F5'}`,
              padding: '2px 7px',
              borderRadius: '999px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              whiteSpace: 'nowrap',
            }}
          >
            {isAdmin ? 'ADMINISTRATOR' : isTeacher ? 'TEACHER / STAFF' : 'STUDENT'}
          </span>
        </div>

        {/* Divider 1 */}
        <div
          className="vs-nav-divider vs-hide-mobile"
          style={{
            width: '1px',
            height: '20px',
            backgroundColor: 'rgba(203, 213, 225, 0.8)',
            margin: '0 2px',
            flexShrink: 0,
          }}
        />

        {/* ========================================================= */}
        {/* 2. CENTER SECTION: Linear / Vercel Pill Navigation Links  */}
        {/* ========================================================= */}
        <div
          className="vs-nav-center-pill vs-hide-mobile"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            backgroundColor: 'rgba(241, 245, 249, 0.65)',
            padding: '3px',
            borderRadius: '9999px',
            border: '1px solid rgba(226, 232, 240, 0.7)',
          }}
        >
          {/* ADMIN ROLE LINKS */}
          {isAdmin && (
            <>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`vs-pill-btn ${activeTab === 'dashboard' || activeTab === 'admin_overview' ? 'vs-pill-btn-active' : ''}`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('admin_analytics')}
                className={`vs-pill-btn ${activeTab === 'admin_analytics' ? 'vs-pill-btn-active' : ''}`}
              >
                Analytics
              </button>
              <button
                onClick={() => setActiveTab('coordinator_analytics')}
                className={`vs-pill-btn ${activeTab === 'coordinator_analytics' ? 'vs-pill-btn-active' : ''}`}
              >
                Coordinator Analytics
              </button>
              <button
                onClick={() => setActiveTab('admin_students')}
                className={`vs-pill-btn ${activeTab === 'admin_students' ? 'vs-pill-btn-active' : ''}`}
              >
                Students
              </button>
              <button
                onClick={() => setActiveTab('admin_teachers')}
                className={`vs-pill-btn ${activeTab === 'admin_teachers' ? 'vs-pill-btn-active' : ''}`}
              >
                Teachers
              </button>
              <button
                onClick={() => setActiveTab('admin_subjects')}
                className={`vs-pill-btn ${activeTab === 'admin_subjects' ? 'vs-pill-btn-active' : ''}`}
              >
                Subjects
              </button>
              <button
                onClick={() => setActiveTab('admin_sections')}
                className={`vs-pill-btn ${activeTab === 'admin_sections' ? 'vs-pill-btn-active' : ''}`}
              >
                Sections
              </button>
              <button
                onClick={() => setActiveTab('admin_timetable')}
                className={`vs-pill-btn ${activeTab === 'admin_timetable' ? 'vs-pill-btn-active' : ''}`}
              >
                Timetable
              </button>
              <button
                onClick={() => setActiveTab('admin_users')}
                className={`vs-pill-btn ${activeTab === 'admin_users' ? 'vs-pill-btn-active' : ''}`}
              >
                Users & Roles
              </button>
              <button
                onClick={() => setActiveTab('admin_attendance')}
                className={`vs-pill-btn ${activeTab === 'admin_attendance' ? 'vs-pill-btn-active' : ''}`}
              >
                Attendance Settings
              </button>
            </>
          )}

          {/* TEACHER / STAFF ROLE LINKS */}
          {isTeacher && (
            <>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`vs-pill-btn ${activeTab === 'dashboard' ? 'vs-pill-btn-active' : ''}`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('faculty_dashboard')}
                className={`vs-pill-btn ${activeTab === 'faculty_dashboard' ? 'vs-pill-btn-active' : ''}`}
              >
                Faculty Telemetry
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`vs-pill-btn ${activeTab === 'analytics' ? 'vs-pill-btn-active' : ''}`}
              >
                Analytics
              </button>
              <button
                onClick={() => setActiveTab('attendance_live')}
                className={`vs-pill-btn ${activeTab === 'attendance_live' ? 'vs-pill-btn-active' : ''}`}
              >
                Live QR Session
              </button>
              <button
                onClick={() => setActiveTab('timetable')}
                className={`vs-pill-btn ${activeTab === 'timetable' ? 'vs-pill-btn-active' : ''}`}
              >
                Timetable
              </button>
              <button
                onClick={() => setActiveTab('assignments')}
                className={`vs-pill-btn ${activeTab === 'assignments' ? 'vs-pill-btn-active' : ''}`}
              >
                Assignments
              </button>
            </>
          )}

          {/* STUDENT ROLE LINKS */}
          {isStudent && (
            <>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`vs-pill-btn ${activeTab === 'dashboard' ? 'vs-pill-btn-active' : ''}`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('timetable')}
                className={`vs-pill-btn ${activeTab === 'timetable' ? 'vs-pill-btn-active' : ''}`}
              >
                Timetable
              </button>
              <button
                onClick={() => setActiveTab('attendance')}
                className={`vs-pill-btn ${activeTab === 'attendance' ? 'vs-pill-btn-active' : ''}`}
              >
                Attendance
              </button>
              <button
                onClick={() => setActiveTab('assignments')}
                className={`vs-pill-btn ${activeTab === 'assignments' ? 'vs-pill-btn-active' : ''}`}
              >
                Assignments
              </button>
              <button
                onClick={() => setActiveTab('skills')}
                className={`vs-pill-btn ${activeTab === 'skills' ? 'vs-pill-btn-active' : ''}`}
              >
                Skills
              </button>
              <button
                onClick={() => setActiveTab('placements')}
                className={`vs-pill-btn ${activeTab === 'placements' ? 'vs-pill-btn-active' : ''}`}
              >
                Placements
              </button>
            </>
          )}
        </div>

        {/* Divider 2 */}
        <div
          className="vs-nav-divider vs-hide-mobile"
          style={{
            width: '1px',
            height: '20px',
            backgroundColor: 'rgba(203, 213, 225, 0.8)',
            margin: '0 2px',
            flexShrink: 0,
          }}
        />

        {/* ========================================================= */}
        {/* 3. RIGHT SECTION: Quick Action + User Pill + Sign Out      */}
        {/* ========================================================= */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* User Profile Pill with Role Icon & Name */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '4px 12px 4px 5px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(241, 245, 249, 0.9)',
              border: '1px solid rgba(203, 213, 225, 0.85)',
              cursor: 'default',
            }}
            title={`${isAdmin ? 'Admin' : currentUser.name} • ${currentUser.email}`}
          >
            {/* Distinguishable Role Icon Badge */}
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isAdmin
                  ? 'linear-gradient(135deg, #4F46E5 0%, #312E81 100%)'
                  : isTeacher
                  ? 'linear-gradient(135deg, #243B7A 0%, #172554 100%)'
                  : 'linear-gradient(135deg, #0D9488 0%, #047857 100%)',
                color: '#FFFFFF',
                flexShrink: 0,
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
              }}
            >
              {isAdmin ? (
                <Shield size={13} />
              ) : isTeacher ? (
                <GraduationCap size={14} />
              ) : (
                <UserIcon size={13} />
              )}
            </div>

            <span
              className="vs-user-name"
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#172554',
                maxWidth: '180px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {isAdmin ? 'Admin' : currentUser.name}
            </span>
          </div>

          {/* Premium Sign Out Button for Everyone */}
          <button
            type="button"
            onClick={logout}
            title="Sign Out of VidyaSutra"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 13px',
              borderRadius: '9999px',
              backgroundColor: '#FFFFFF',
              border: '1.5px solid #FECACA',
              color: '#DC2626',
              cursor: 'pointer',
              transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
              fontSize: '0.78rem',
              fontWeight: 700,
              flexShrink: 0,
              boxShadow: '0 1px 3px rgba(220, 38, 38, 0.08)',
            }}
            className="vs-pill-logout"
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>
        </div>
      </nav>

      {/* Styled JSX for Vercel/Linear Micro-interactions & Responsiveness */}
      <style jsx>{`
        .vs-pill-btn {
          padding: 5px 12px;
          border-radius: 9999px;
          font-size: 0.78rem;
          font-weight: 600;
          color: #64748B;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
        }
        .vs-pill-btn:hover {
          color: #172033;
          background: rgba(255, 255, 255, 0.85);
        }
        .vs-pill-btn-active {
          color: #FFFFFF !important;
          background: #243B7A !important;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(36, 59, 122, 0.28);
        }
        .vs-pill-logout:hover {
          background-color: #FEF2F2 !important;
          border-color: #EF4444 !important;
          color: #B91C1C !important;
          transform: translateY(-1px);
          box-shadow: 0 3px 8px rgba(220, 38, 38, 0.16) !important;
        }
        .vs-quick-action-btn:hover {
          transform: translateY(-1px);
          filter: brightness(1.08);
        }
        .vs-quick-action-btn:active {
          transform: translateY(0);
        }
        .vs-nav-brand:hover {
          opacity: 0.85;
        }

        @media (max-width: 880px) {
          .vs-hide-mobile {
            display: none !important;
          }
          .vs-user-name {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
};
