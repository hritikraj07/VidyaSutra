'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { getTimeGreeting, getFormattedCurrentDate } from '@/utils/greeting';
import {
  Users,
  BookOpen,
  Calendar,
  Clock,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Play,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Layers,
  GraduationCap,
  BarChart3,
} from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const {
    currentUser,
    assignedCourses,
    activeSession,
    setActiveTab,
    timetable,
  } = useApp();

  const [greeting, setGreeting] = useState<string>(() => getTimeGreeting());
  const [currentDateString, setCurrentDateString] = useState<string>(() => getFormattedCurrentDate());

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setGreeting(getTimeGreeting(now));
      setCurrentDateString(getFormattedCurrentDate(now));
    };
    updateDateTime();
    const timer = setInterval(updateDateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  const coursesToDisplay = (assignedCourses && assignedCourses.length > 0)
    ? assignedCourses
    : (timetable && timetable.length > 0)
      ? timetable.map((slot) => ({
          id: slot.id,
          course_code: slot.code,
          course_name: slot.subject,
          section: slot.section || 'All',
          room: slot.room,
        }))
      : [];

  const activeLectureCount = coursesToDisplay.length || 2;
  const isSessionLive = Boolean(activeSession?.isActive);

  return (
    <div style={{ width: '100%', padding: '16px 28px' }}>
      {/* 1. Faculty Welcome Header Card */}
      <section
        className="vs-card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderLeft: '5px solid #243B7A', // Vidya Indigo
          boxShadow: '0 4px 16px -2px rgba(23, 37, 84, 0.06)',
          padding: '22px 26px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span
              style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                color: '#243B7A',
                backgroundColor: '#EEF2FB',
                border: '1px solid #D6E0F5',
                padding: '2px 9px',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                textTransform: 'uppercase',
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#E7A23B' }} />
              Faculty Portal
            </span>
            <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
              {currentUser?.department || 'Computer Science & Engineering'}
            </span>
          </div>
          <h1
            style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: '#172554', // Deep Navy
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            {greeting}, {currentUser?.name || 'Faculty Member'}
          </h1>
          <p style={{ fontSize: '0.84rem', color: '#64748B', marginTop: '4px', fontWeight: 500 }}>
            Academic Course & Attendance Management Dashboard • Today is {currentDateString || getFormattedCurrentDate()}
          </p>
        </div>

        {/* Start Attendance Action */}
        <button
          onClick={() => setActiveTab('attendance_live')}
          style={{
            padding: '12px 22px',
            fontSize: '0.9rem',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: '#243B7A',
            color: '#FFFFFF',
            boxShadow: '0 6px 18px rgba(36, 59, 122, 0.28)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 700,
          }}
        >
          <QrCode size={19} color="#E7A23B" />
          <span>{isSessionLive ? 'Open Active QR Session' : 'Start QR Attendance'}</span>
        </button>
      </section>

      {/* 2. Key Metrics Grid */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div className="vs-card" style={{ padding: '20px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748B' }}>Assigned Subjects</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#EEF2FB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#243B7A' }}>
              <BookOpen size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#172554' }}>
            {assignedCourses?.length || 2}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
            Active courses allotted this semester
          </div>
        </div>

        <div className="vs-card" style={{ padding: '20px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748B' }}>Assigned Sections</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
              <Layers size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#172554' }}>
            CSE-A
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
            Primary lecture cohort
          </div>
        </div>

        <div className="vs-card" style={{ padding: '20px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748B' }}>Teaching Load</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#166534' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#172554' }}>
            16 Hrs/Wk
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
            Scheduled lecture & lab credits
          </div>
        </div>
      </section>

      {/* 3. My Subjects & Class Allotments */}
      <section style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#172554' }}>
            My Subjects & Classes
          </h2>
          <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
            Verified institutional allotments
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '16px',
          }}
        >
          {coursesToDisplay && coursesToDisplay.length > 0 ? (
            coursesToDisplay.map((ac) => (
              <div
                key={ac.id}
                className="vs-card"
                style={{
                  padding: '20px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid #E2E8F0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor: '#EEF2FB',
                      color: '#243B7A',
                      padding: '3px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    {ac.course_code}
                  </span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#172554' }}>
                    Section {ac.section}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#172554', marginBottom: '6px' }}>
                  {ac.course_name}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#64748B', marginBottom: '14px' }}>
                  <MapPin size={14} />
                  <span>{ac.room}</span>
                </div>
                <button
                  onClick={() => setActiveTab('analytics')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    width: '100%',
                    padding: '8px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#243B7A',
                    cursor: 'pointer',
                  }}
                >
                  <BarChart3 size={15} />
                  <span>View Course Analytics</span>
                </button>
              </div>
            ))
          ) : (
            <>
              {/* Fallback display for Dr. Verma's default subjects */}
              <div className="vs-card" style={{ padding: '20px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#EEF2FB', color: '#243B7A', padding: '3px 8px', borderRadius: '6px' }}>CS301</span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#172554' }}>Section CSE-A</span>
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#172554', marginBottom: '6px' }}>
                  Data Structures & Algorithms
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#64748B', marginBottom: '14px' }}>
                  <MapPin size={14} />
                  <span>Hall 301 (Block A)</span>
                </div>
                <button
                  onClick={() => setActiveTab('analytics')}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%', padding: '8px', borderRadius: 'var(--radius-md)', backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', fontSize: '0.82rem', fontWeight: 700, color: '#243B7A', cursor: 'pointer' }}
                >
                  <BarChart3 size={15} />
                  <span>View Course Analytics</span>
                </button>
              </div>

              <div className="vs-card" style={{ padding: '20px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#EEF2FB', color: '#243B7A', padding: '3px 8px', borderRadius: '6px' }}>CS302</span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#172554' }}>Section CSE-A</span>
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#172554', marginBottom: '6px' }}>
                  Database Management Systems
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#64748B', marginBottom: '14px' }}>
                  <MapPin size={14} />
                  <span>Hall 402 (Block B)</span>
                </div>
                <button
                  onClick={() => setActiveTab('analytics')}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%', padding: '8px', borderRadius: 'var(--radius-md)', backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', fontSize: '0.82rem', fontWeight: 700, color: '#243B7A', cursor: 'pointer' }}
                >
                  <BarChart3 size={15} />
                  <span>View Course Analytics</span>
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* 4. Quick Actions Row */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
        }}
      >
        <div
          onClick={() => setActiveTab('attendance_live')}
          style={{
            cursor: 'pointer',
            padding: '18px 20px',
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#EEF2FB', color: '#243B7A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <QrCode size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#172554' }}>Live QR Attendance</div>
              <div style={{ fontSize: '0.74rem', color: '#64748B' }}>5-second rotating cryptographic QR</div>
            </div>
          </div>
          <ArrowRight size={18} color="#64748B" />
        </div>

        <div
          onClick={() => setActiveTab('attendance')}
          style={{
            cursor: 'pointer',
            padding: '18px 20px',
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#172554' }}>Attendance Records</div>
              <div style={{ fontSize: '0.74rem', color: '#64748B' }}>View student turnouts & check-in logs</div>
            </div>
          </div>
          <ArrowRight size={18} color="#64748B" />
        </div>

        <div
          onClick={() => setActiveTab('timetable')}
          style={{
            cursor: 'pointer',
            padding: '18px 20px',
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#DCFCE7', color: '#198754', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#172554' }}>Class Schedule</div>
              <div style={{ fontSize: '0.74rem', color: '#64748B' }}>View weekly teaching schedule</div>
            </div>
          </div>
          <ArrowRight size={18} color="#64748B" />
        </div>
      </section>
    </div>
  );
};
