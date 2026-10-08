'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import gsap from 'gsap';
import { AppProvider, useApp } from '@/context/AppContext';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { StudentDashboard } from '@/features/dashboard/StudentDashboard';
import { TeacherDashboard } from '@/features/dashboard/TeacherDashboard';
import { TimetableModule } from '@/features/timetable/TimetableModule';
import { AttendanceView } from '@/features/attendance/AttendanceView';
import { AssignmentsModule } from '@/features/assignments/AssignmentsModule';

// Dynamic code-splitting for heavy modals and secondary views
const AdminDashboard = dynamic(
  () => import('@/features/admin/AdminDashboard').then((m) => m.AdminDashboard),
  { ssr: false }
);
const SkillsModule = dynamic(
  () => import('@/features/skills/SkillsModule').then((m) => m.SkillsModule),
  { ssr: false }
);
const PlacementsModule = dynamic(
  () => import('@/features/placements/PlacementsModule').then((m) => m.PlacementsModule),
  { ssr: false }
);
const TeacherQRSession = dynamic(
  () => import('@/features/attendance/TeacherQRSession').then((m) => m.TeacherQRSession),
  { ssr: false }
);
const QRScannerModal = dynamic(
  () => import('@/features/attendance/QRScannerModal').then((m) => m.QRScannerModal),
  { ssr: false }
);
const SuccessScoreModal = dynamic(
  () => import('@/features/scores/SuccessScoreModal').then((m) => m.SuccessScoreModal),
  { ssr: false }
);
const TeacherAnalyticsView = dynamic(
  () => import('@/features/analytics/TeacherAnalyticsView').then((m) => m.TeacherAnalyticsView),
  { ssr: false }
);
const FacultyDashboardView = dynamic(
  () => import('@/features/analytics/FacultyDashboardView').then((m) => m.FacultyDashboardView),
  { ssr: false }
);
const CoordinatorAnalyticsView = dynamic(
  () => import('@/features/analytics/CoordinatorAnalyticsView').then((m) => m.CoordinatorAnalyticsView),
  { ssr: false }
);

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
          <Image
            src="/logo.webp"
            alt="VidyaSutra Official Logo"
            width={48}
            height={48}
            priority
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
