'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentUser, activeRole, logout, setIsQrScannerOpen, activeTab, setActiveTab } = useApp();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setIsMobileNavOpen(false);
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  if (!currentUser) return null;

  const roleLower = (currentUser?.role || activeRole || '').toLowerCase();
  const isAdmin = roleLower === 'admin';
  const isTeacher = !isAdmin && (roleLower === 'teacher' || roleLower === 'faculty' || roleLower === 'staff');
  const isStudent = !isAdmin && !isTeacher;

  const handleBrandClick = () => {
    setActiveTab('dashboard');
    setIsMobileNavOpen(false);
    setIsProfileOpen(false);
  };

  const handleTabSelect = (tab: string) => {
    setActiveTab(tab);
    setIsMobileNavOpen(false);
  };

  const roleLabel = isAdmin ? 'Administrator' : isTeacher ? 'Teacher / Staff' : 'Student';

  return (
    <header
      ref={navRef}
      className="vs-floating-island-wrapper"
      style={{
        position: 'fixed',
        top: '12px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        width: 'max-content',
        maxWidth: 'calc(100vw - 20px)',
        boxSizing: 'border-box',
        pointerEvents: 'none',
      }}
    >
      {/* Floating Island Pill Container */}
      <nav
        className="vs-floating-navbar"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          padding: '6px 10px',
          borderRadius: '9999px',
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(203, 213, 225, 0.8)',
          boxShadow: '0 12px 30px -4px rgba(13, 27, 42, 0.08), 0 4px 12px -2px rgba(13, 27, 42, 0.04)',
          pointerEvents: 'auto',
          boxSizing: 'border-box',
          width: '100%',
        }}
      >
        {/* ========================================================= */}
        {/* 1. LEFT SECTION: Mobile Hamburger + Brand Emblem + Title  */}
        {/* ========================================================= */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 1, minWidth: 0 }}>
          {/* Mobile Navigation Toggle (Visible on <=880px) */}
          <button
            type="button"
            className="vs-mobile-menu-btn"
            onClick={() => {
              setIsMobileNavOpen(!isMobileNavOpen);
              setIsProfileOpen(false);
            }}
            aria-label="Toggle navigation menu"
            style={{
              background: '#F1F5F9',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'none', // Handled via CSS media query
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#1E293B',
              flexShrink: 0,
            }}
          >
            {isMobileNavOpen ? <X size={17} /> : <Menu size={17} />}
          </button>

          <div
            onClick={handleBrandClick}
            className="vs-nav-brand"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              cursor: 'pointer',
              userSelect: 'none',
              padding: '2px 4px 2px 2px',
              borderRadius: '9999px',
              transition: 'opacity 0.15s ease',
              flexShrink: 1,
              minWidth: 0,
            }}
            title="Return to Portal Home"
          >
            {/* Framed Emblem Icon */}
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
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
                width={26}
                height={26}
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
                color: '#172554',
                whiteSpace: 'nowrap',
              }}
            >
              VidyaSutra
            </span>

            {/* Role Pill Badge (Desktop Only to prevent mobile overflow) */}
            <span
              className="vs-role-badge-desktop"
              style={{
                fontSize: '0.62rem',
                fontWeight: 700,
                backgroundColor: isAdmin ? '#FEF3C7' : isTeacher ? '#EEF2FB' : '#EEF2FB',
                color: isAdmin ? '#B45309' : '#243B7A',
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
        </div>

        {/* Divider 1 (Desktop Only) */}
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
        {/* 2. CENTER SECTION: Desktop Pill Navigation Links          */}
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
          {isAdmin && (
            <>
              <button onClick={() => setActiveTab('dashboard')} className={`vs-pill-btn ${activeTab === 'dashboard' || activeTab === 'admin_overview' ? 'vs-pill-btn-active' : ''}`}>Overview</button>
              <button onClick={() => setActiveTab('admin_analytics')} className={`vs-pill-btn ${activeTab === 'admin_analytics' ? 'vs-pill-btn-active' : ''}`}>Analytics</button>
              <button onClick={() => setActiveTab('coordinator_analytics')} className={`vs-pill-btn ${activeTab === 'coordinator_analytics' ? 'vs-pill-btn-active' : ''}`}>Coordinator Analytics</button>
              <button onClick={() => setActiveTab('admin_students')} className={`vs-pill-btn ${activeTab === 'admin_students' ? 'vs-pill-btn-active' : ''}`}>Students</button>
              <button onClick={() => setActiveTab('admin_teachers')} className={`vs-pill-btn ${activeTab === 'admin_teachers' ? 'vs-pill-btn-active' : ''}`}>Teachers</button>
              <button onClick={() => setActiveTab('admin_subjects')} className={`vs-pill-btn ${activeTab === 'admin_subjects' ? 'vs-pill-btn-active' : ''}`}>Subjects</button>
              <button onClick={() => setActiveTab('admin_sections')} className={`vs-pill-btn ${activeTab === 'admin_sections' ? 'vs-pill-btn-active' : ''}`}>Sections</button>
              <button onClick={() => setActiveTab('admin_timetable')} className={`vs-pill-btn ${activeTab === 'admin_timetable' ? 'vs-pill-btn-active' : ''}`}>Timetable</button>
              <button onClick={() => setActiveTab('admin_users')} className={`vs-pill-btn ${activeTab === 'admin_users' ? 'vs-pill-btn-active' : ''}`}>Users & Roles</button>
              <button onClick={() => setActiveTab('admin_attendance')} className={`vs-pill-btn ${activeTab === 'admin_attendance' ? 'vs-pill-btn-active' : ''}`}>Attendance Settings</button>
            </>
          )}

          {isTeacher && (
            <>
              <button onClick={() => setActiveTab('dashboard')} className={`vs-pill-btn ${activeTab === 'dashboard' ? 'vs-pill-btn-active' : ''}`}>Dashboard</button>
              <button onClick={() => setActiveTab('faculty_dashboard')} className={`vs-pill-btn ${activeTab === 'faculty_dashboard' ? 'vs-pill-btn-active' : ''}`}>Faculty Telemetry</button>
              <button onClick={() => setActiveTab('analytics')} className={`vs-pill-btn ${activeTab === 'analytics' ? 'vs-pill-btn-active' : ''}`}>Analytics</button>
              <button onClick={() => setActiveTab('attendance_live')} className={`vs-pill-btn ${activeTab === 'attendance_live' ? 'vs-pill-btn-active' : ''}`}>Live QR Session</button>
              <button onClick={() => setActiveTab('timetable')} className={`vs-pill-btn ${activeTab === 'timetable' ? 'vs-pill-btn-active' : ''}`}>Timetable</button>
              <button onClick={() => setActiveTab('assignments')} className={`vs-pill-btn ${activeTab === 'assignments' ? 'vs-pill-btn-active' : ''}`}>Assignments</button>
            </>
          )}

          {isStudent && (
            <>
              <button onClick={() => setActiveTab('dashboard')} className={`vs-pill-btn ${activeTab === 'dashboard' ? 'vs-pill-btn-active' : ''}`}>Dashboard</button>
              <button onClick={() => setActiveTab('timetable')} className={`vs-pill-btn ${activeTab === 'timetable' ? 'vs-pill-btn-active' : ''}`}>Timetable</button>
              <button onClick={() => setActiveTab('attendance')} className={`vs-pill-btn ${activeTab === 'attendance' ? 'vs-pill-btn-active' : ''}`}>Attendance</button>
              <button onClick={() => setActiveTab('assignments')} className={`vs-pill-btn ${activeTab === 'assignments' ? 'vs-pill-btn-active' : ''}`}>Assignments</button>
              <button onClick={() => setActiveTab('skills')} className={`vs-pill-btn ${activeTab === 'skills' ? 'vs-pill-btn-active' : ''}`}>Skills</button>
              <button onClick={() => setActiveTab('placements')} className={`vs-pill-btn ${activeTab === 'placements' ? 'vs-pill-btn-active' : ''}`}>Placements</button>
            </>
          )}
        </div>

        {/* Divider 2 (Desktop Only) */}
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
        {/* 3. RIGHT SECTION: Profile Pill / Trigger + Sign Out       */}
        {/* ========================================================= */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {/* User Profile Pill / Menu Trigger */}
          <div
            onClick={() => {
              setIsProfileOpen(!isProfileOpen);
              setIsMobileNavOpen(false);
            }}
            className="vs-user-pill"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 8px 4px 4px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(241, 245, 249, 0.9)',
              border: '1px solid rgba(203, 213, 225, 0.85)',
              cursor: 'pointer',
              userSelect: 'none',
              flexShrink: 0,
            }}
            title={`${isAdmin ? 'Admin' : currentUser.name} • ${currentUser.email}`}
          >
            <div
              style={{
                width: '24px',
                height: '24px',
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
                <Shield size={12} />
              ) : isTeacher ? (
                <GraduationCap size={13} />
              ) : (
                <UserIcon size={12} />
              )}
            </div>

            <span
              className="vs-user-name"
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#172554',
                maxWidth: '120px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {isAdmin ? 'Admin' : currentUser.name}
            </span>
          </div>

          {/* Guaranteed Visible & Accessible Responsive Sign Out Button */}
          <button
            type="button"
            onClick={logout}
            title="Sign Out of VidyaSutra"
            className="vs-pill-logout"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 11px',
              borderRadius: '9999px',
              backgroundColor: '#FFFFFF',
              border: '1.5px solid #FECACA',
              color: '#DC2626',
              cursor: 'pointer',
              transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
              fontSize: '0.76rem',
              fontWeight: 700,
              flexShrink: 0,
              whiteSpace: 'nowrap',
              boxShadow: '0 1px 3px rgba(220, 38, 38, 0.08)',
            }}
          >
            <LogOut size={13} />
            <span className="vs-logout-text">Sign Out</span>
          </button>
        </div>
      </nav>

      {/* ========================================================= */}
      {/* 4. MOBILE NAVIGATION DROPDOWN (Role Links)                */}
      {/* ========================================================= */}
      {isMobileNavOpen && (
        <div
          className="vs-mobile-nav-drawer"
          style={{
            marginTop: '8px',
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 20px 40px -8px rgba(15, 23, 42, 0.22)',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            pointerEvents: 'auto',
            animation: 'slideDown 0.18s ease-out',
            maxHeight: '70vh',
            overflowY: 'auto',
          }}
        >
          <div style={{ padding: '4px 8px 8px', borderBottom: '1px solid #F1F5F9', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {roleLabel} Navigation
            </span>
          </div>

          {isAdmin && (
            <>
              <button onClick={() => handleTabSelect('dashboard')} className={`vs-mobile-menu-item ${activeTab === 'dashboard' ? 'vs-mobile-menu-active' : ''}`}>Overview</button>
              <button onClick={() => handleTabSelect('admin_analytics')} className={`vs-mobile-menu-item ${activeTab === 'admin_analytics' ? 'vs-mobile-menu-active' : ''}`}>Analytics</button>
              <button onClick={() => handleTabSelect('coordinator_analytics')} className={`vs-mobile-menu-item ${activeTab === 'coordinator_analytics' ? 'vs-mobile-menu-active' : ''}`}>Coordinator Analytics</button>
              <button onClick={() => handleTabSelect('admin_students')} className={`vs-mobile-menu-item ${activeTab === 'admin_students' ? 'vs-mobile-menu-active' : ''}`}>Students</button>
              <button onClick={() => handleTabSelect('admin_teachers')} className={`vs-mobile-menu-item ${activeTab === 'admin_teachers' ? 'vs-mobile-menu-active' : ''}`}>Teachers</button>
              <button onClick={() => handleTabSelect('admin_subjects')} className={`vs-mobile-menu-item ${activeTab === 'admin_subjects' ? 'vs-mobile-menu-active' : ''}`}>Subjects</button>
              <button onClick={() => handleTabSelect('admin_sections')} className={`vs-mobile-menu-item ${activeTab === 'admin_sections' ? 'vs-mobile-menu-active' : ''}`}>Sections</button>
              <button onClick={() => handleTabSelect('admin_timetable')} className={`vs-mobile-menu-item ${activeTab === 'admin_timetable' ? 'vs-mobile-menu-active' : ''}`}>Timetable</button>
              <button onClick={() => handleTabSelect('admin_users')} className={`vs-mobile-menu-item ${activeTab === 'admin_users' ? 'vs-mobile-menu-active' : ''}`}>Users & Roles</button>
              <button onClick={() => handleTabSelect('admin_attendance')} className={`vs-mobile-menu-item ${activeTab === 'admin_attendance' ? 'vs-mobile-menu-active' : ''}`}>Attendance Settings</button>
            </>
          )}

          {isTeacher && (
            <>
              <button onClick={() => handleTabSelect('dashboard')} className={`vs-mobile-menu-item ${activeTab === 'dashboard' ? 'vs-mobile-menu-active' : ''}`}>Dashboard</button>
              <button onClick={() => handleTabSelect('faculty_dashboard')} className={`vs-mobile-menu-item ${activeTab === 'faculty_dashboard' ? 'vs-mobile-menu-active' : ''}`}>Faculty Telemetry</button>
              <button onClick={() => handleTabSelect('analytics')} className={`vs-mobile-menu-item ${activeTab === 'analytics' ? 'vs-mobile-menu-active' : ''}`}>Analytics</button>
              <button onClick={() => handleTabSelect('attendance_live')} className={`vs-mobile-menu-item ${activeTab === 'attendance_live' ? 'vs-mobile-menu-active' : ''}`}>Live QR Session</button>
              <button onClick={() => handleTabSelect('timetable')} className={`vs-mobile-menu-item ${activeTab === 'timetable' ? 'vs-mobile-menu-active' : ''}`}>Timetable</button>
              <button onClick={() => handleTabSelect('assignments')} className={`vs-mobile-menu-item ${activeTab === 'assignments' ? 'vs-mobile-menu-active' : ''}`}>Assignments</button>
            </>
          )}

          {isStudent && (
            <>
              <button onClick={() => handleTabSelect('dashboard')} className={`vs-mobile-menu-item ${activeTab === 'dashboard' ? 'vs-mobile-menu-active' : ''}`}>Dashboard</button>
              <button onClick={() => handleTabSelect('timetable')} className={`vs-mobile-menu-item ${activeTab === 'timetable' ? 'vs-mobile-menu-active' : ''}`}>Timetable</button>
              <button onClick={() => handleTabSelect('attendance')} className={`vs-mobile-menu-item ${activeTab === 'attendance' ? 'vs-mobile-menu-active' : ''}`}>Attendance</button>
              <button onClick={() => handleTabSelect('assignments')} className={`vs-mobile-menu-item ${activeTab === 'assignments' ? 'vs-mobile-menu-active' : ''}`}>Assignments</button>
              <button onClick={() => handleTabSelect('skills')} className={`vs-mobile-menu-item ${activeTab === 'skills' ? 'vs-mobile-menu-active' : ''}`}>Skills</button>
              <button onClick={() => handleTabSelect('placements')} className={`vs-mobile-menu-item ${activeTab === 'placements' ? 'vs-mobile-menu-active' : ''}`}>Placements</button>
            </>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. USER PROFILE DROPDOWN (Mobile / Quick View)           */}
      {/* ========================================================= */}
      {isProfileOpen && (
        <div
          className="vs-profile-dropdown"
          style={{
            marginTop: '8px',
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 20px 40px -8px rgba(15, 23, 42, 0.22)',
            padding: '16px',
            width: '260px',
            maxWidth: 'calc(100vw - 32px)',
            marginLeft: 'auto',
            pointerEvents: 'auto',
            animation: 'slideDown 0.18s ease-out',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
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
              }}
            >
              {isAdmin ? <Shield size={18} /> : isTeacher ? <GraduationCap size={18} /> : <UserIcon size={18} />}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#172554', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {isAdmin ? 'Administrator' : currentUser.name}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser.email}
              </div>
            </div>
          </div>

          <div
            style={{
              padding: '8px 10px',
              backgroundColor: '#F8FAFC',
              borderRadius: '8px',
              marginBottom: '12px',
              border: '1px solid #E2E8F0',
              fontSize: '0.74rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span style={{ color: '#64748B' }}>Role:</span>
              <span style={{ fontWeight: 700, color: '#243B7A' }}>{roleLabel}</span>
            </div>
            {isStudent && currentUser.rollNo && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Roll No:</span>
                <span style={{ fontWeight: 700, color: '#172554' }}>{currentUser.rollNo}</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={logout}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '10px',
              backgroundColor: '#FEF2F2',
              color: '#DC2626',
              border: '1px solid #FECACA',
              fontWeight: 700,
              fontSize: '0.84rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <LogOut size={15} />
            <span>Sign Out of VidyaSutra</span>
          </button>
        </div>
      )}

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
        .vs-nav-brand:hover {
          opacity: 0.85;
        }
        .vs-mobile-menu-item {
          padding: 8px 12px;
          border-radius: 8px;
          border: none;
          background: transparent;
          text-align: left;
          font-size: 0.82rem;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          transition: background 0.12s ease;
        }
        .vs-mobile-menu-item:hover {
          background: #F1F5F9;
          color: #172554;
        }
        .vs-mobile-menu-active {
          background: #EEF2FB !important;
          color: #243B7A !important;
          font-weight: 700 !important;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 880px) {
          .vs-hide-mobile {
            display: none !important;
          }
          .vs-role-badge-desktop {
            display: none !important;
          }
          .vs-user-name {
            display: none !important;
          }
          .vs-mobile-menu-btn {
            display: flex !important;
          }
        }

        @media (max-width: 360px) {
          .vs-logout-text {
            display: none;
          }
        }
      `}</style>
    </header>
  );
};
