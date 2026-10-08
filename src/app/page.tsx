'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { AppProvider, useApp } from '@/context/AppContext';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { StudentDashboard } from '@/features/dashboard/StudentDashboard';
import { TeacherDashboard } from '@/features/dashboard/TeacherDashboard';
import { AdminDashboard } from '@/features/admin/AdminDashboard';
import { TimetableModule } from '@/features/timetable/TimetableModule';
import { AttendanceView } from '@/features/attendance/AttendanceView';
import { AssignmentsModule } from '@/features/assignments/AssignmentsModule';
import { SkillsModule } from '@/features/skills/SkillsModule';
import { PlacementsModule } from '@/features/placements/PlacementsModule';
import { TeacherQRSession } from '@/features/attendance/TeacherQRSession';
import { QRScannerModal } from '@/features/attendance/QRScannerModal';
import { SuccessScoreModal } from '@/features/scores/SuccessScoreModal';
import { TeacherAnalyticsView } from '@/features/analytics/TeacherAnalyticsView';
import { FacultyDashboardView } from '@/features/analytics/FacultyDashboardView';
import { CoordinatorAnalyticsView } from '@/features/analytics/CoordinatorAnalyticsView';

const MainPortal: React.FC = () => {
  const router = useRouter();
  const { currentUser, activeRole, activeTab, isLoadingAuth } = useApp();
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Normalize role strictly to 'admin', 'teacher', or 'student'
  const rawRole = (currentUser?.role || activeRole || 'student').toLowerCase();
  const normalizedRole: 'admin' | 'teacher' | 'student' =
    rawRole === 'admin'
      ? 'admin'
      : rawRole === 'teacher' || rawRole === 'faculty' || rawRole === 'staff'
      ? 'teacher'
      : 'student';

  // Redirect to /login if unauthenticated after session check completes
  useEffect(() => {
    if (!isLoadingAuth && !currentUser) {
      window.location.replace('/login');
    }
  }, [isLoadingAuth, currentUser]);

  // Safety timer fallback: if auth verification takes > 2s, don't leave user hanging on splash
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!currentUser) {
        window.location.replace('/login');
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [currentUser]);

  // Subtle GSAP entrance animation for cards
  useEffect(() => {
    if (!containerRef.current) return;
    const cards = containerRef.current.querySelectorAll('.vs-card');
    if (cards.length > 0) {
      gsap.fromTo(
        cards,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.35, stagger: 0.04, ease: 'power2.out' }
      );
    }
  }, [activeTab, normalizedRole]);

  // Premium branded loading state while authenticating (Never returns blank null!)
  if (isLoadingAuth || !currentUser) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F8F7F3', // Ivory
          gap: '14px',
          padding: '20px',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
            boxShadow: '0 8px 24px -4px rgba(23, 37, 84, 0.12)',
          }}
        >
          <img
            src="/logo.jpg"
            alt="VidyaSutra Logo"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </div>
        <div style={{ textAlign: 'center' }}>
          <h1
            style={{
              fontSize: '1.05rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: '#172554', // Deep Navy
              marginBottom: '3px',
            }}
          >
            VidyaSutra
          </h1>
          <p
            style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#64748B', // Slate
            }}
          >
            {isLoadingAuth ? 'Verifying institutional credentials...' : 'Redirecting to login portal...'}
          </p>

          {!isLoadingAuth && !currentUser && (
            <button
              onClick={() => window.location.replace('/login')}
              style={{
                marginTop: '12px',
                padding: '8px 16px',
                fontSize: '0.82rem',
                fontWeight: 600,
                borderRadius: '8px',
                backgroundColor: '#243B7A',
                color: '#FFFFFF',
                cursor: 'pointer',
                border: 'none',
                boxShadow: '0 2px 8px rgba(36, 59, 122, 0.25)',
              }}
            >
              Go to Institutional Login Portal &rarr;
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main
        ref={containerRef}
        style={{
          minHeight: '100vh',
          paddingTop: '80px',
          paddingBottom: normalizedRole === 'student' ? '80px' : '30px',
        }}
      >
        {/* ADMIN PORTAL VIEWS */}
        {normalizedRole === 'admin' && (
          <>
            {activeTab === 'coordinator_analytics' ? <CoordinatorAnalyticsView /> : <AdminDashboard />}
          </>
        )}

        {/* TEACHER / STAFF PORTAL VIEWS */}
        {normalizedRole === 'teacher' && (
          <>
            {activeTab === 'faculty_dashboard' && <FacultyDashboardView />}
            {activeTab === 'coordinator_analytics' && <CoordinatorAnalyticsView />}
            {activeTab === 'analytics' && <TeacherAnalyticsView />}
            {(activeTab === 'attendance_live' || activeTab === 'attendance') && <TeacherQRSession />}
            {activeTab === 'timetable' && <TimetableModule />}
            {activeTab === 'assignments' && <AssignmentsModule />}
            {/* Fallback to Teacher Dashboard Overview */}
            {activeTab !== 'faculty_dashboard' &&
              activeTab !== 'coordinator_analytics' &&
              activeTab !== 'analytics' &&
              activeTab !== 'attendance_live' &&
              activeTab !== 'attendance' &&
              activeTab !== 'timetable' &&
              activeTab !== 'assignments' && <TeacherDashboard />}
          </>
        )}

        {/* STUDENT PORTAL VIEWS */}
        {normalizedRole === 'student' && (
          <>
            {activeTab === 'timetable' && <TimetableModule />}
            {activeTab === 'attendance' && <AttendanceView />}
            {activeTab === 'assignments' && <AssignmentsModule />}
            {activeTab === 'skills' && <SkillsModule />}
            {activeTab === 'placements' && <PlacementsModule />}
            {/* Fallback to Student Dashboard */}
            {activeTab !== 'timetable' &&
              activeTab !== 'attendance' &&
              activeTab !== 'assignments' &&
              activeTab !== 'skills' &&
              activeTab !== 'placements' && <StudentDashboard />}
          </>
        )}

        {/* Global Modals (Scanner for student, score modal) */}
        {normalizedRole === 'student' && <QRScannerModal />}
        <SuccessScoreModal />
      </main>
      {normalizedRole === 'student' && <BottomNav />}
    </>
  );
};

export default function Page() {
  return (
    <AppProvider>
      <MainPortal />
    </AppProvider>
  );
}
