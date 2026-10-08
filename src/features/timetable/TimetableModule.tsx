'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  QrCode,
  GraduationCap,
  Sparkles,
  BookOpen,
} from 'lucide-react';

export const TimetableModule: React.FC = () => {
  const { timetable, setIsQrScannerOpen, currentUser, setActiveTab } = useApp();

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
  const initialDay = days.includes(todayDayName) ? todayDayName : 'Wednesday';
  const [selectedDay, setSelectedDay] = useState<string>(initialDay);

  const isTeacher = currentUser?.role === 'teacher';
  const filteredSlots = timetable.filter(
    (slot) => !slot.day || slot.day.toLowerCase() === selectedDay.toLowerCase()
  );

  return (
    <div style={{ width: '100%', padding: '16px 28px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          marginBottom: '20px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text)' }}>
              {isTeacher ? 'Faculty Teaching Schedule' : 'Academic Timetable'}
            </h1>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                backgroundColor: isTeacher ? '#FEF3C7' : '#EEF2FB',
                color: isTeacher ? '#92400E' : 'var(--primary)',
                padding: '2px 8px',
                borderRadius: '6px',
                textTransform: 'uppercase',
              }}
            >
              {isTeacher ? 'Instructor Portal' : 'Student Portal'}
            </span>
          </div>

          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            {isTeacher ? (
              <>Faculty: <strong>{currentUser?.name || 'Faculty Member'}</strong> • Department: <strong>{currentUser?.department || 'Academic Department'}</strong></>
            ) : (
              <>Course: <strong>{currentUser?.course || currentUser?.department || 'Degree Program'}</strong> • Semester <strong>{currentUser?.semester || '—'}</strong> {currentUser?.section ? `• Section (${currentUser.section})` : ''}</>
            )}
          </p>
        </div>

        {isTeacher ? (
          <button
            onClick={() => setActiveTab('attendance_live')}
            className="vs-btn-primary"
            style={{ borderRadius: 'var(--radius-full)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <QrCode size={16} />
            <span>Start QR Attendance</span>
          </button>
        ) : (
          <button
            onClick={() => setIsQrScannerOpen(true)}
            className="vs-btn-primary"
            style={{ borderRadius: 'var(--radius-full)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <QrCode size={16} />
            <span>Mark Class Attendance</span>
          </button>
        )}
      </div>

      {/* Cohort Identity Banner for Students */}
      {!isTeacher && (
        <div
          style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <GraduationCap size={20} color="var(--primary)" />
            <div style={{ fontSize: '0.82rem', color: '#334155' }}>
              <strong>Assigned Cohort:</strong> {currentUser?.course || 'Computer Science & Engineering'} • Semester {currentUser?.semester || 6} • Section {currentUser?.section || 'CSE-A'}
            </div>
          </div>
          <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>
            Automated cohort synchronization active
          </span>
        </div>
      )}

      {/* Day Selector Pills */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: '20px',
        }}
      >
        {days.map((day) => {
          const isSelected = selectedDay === day;
          const isToday = day === todayDayName;
          const dayCount = timetable.filter((s) => !s.day || s.day.toLowerCase() === day.toLowerCase()).length;

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid',
                borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
                backgroundColor: isSelected ? 'var(--primary)' : '#FFFFFF',
                color: isSelected ? '#FFFFFF' : 'var(--text)',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: isSelected ? '0 2px 4px rgba(36, 59, 122, 0.2)' : 'none',
              }}
            >
              <span>{day}</span>
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.25)' : '#F1F5F9',
                  color: isSelected ? '#FFFFFF' : 'var(--text-muted)',
                  fontWeight: 700,
                }}
              >
                {dayCount}
              </span>
              {isToday && (
                <span
                  style={{
                    fontSize: '0.65rem',
                    backgroundColor: isSelected ? '#FFFFFF' : 'var(--primary-light)',
                    color: isSelected ? 'var(--primary)' : 'var(--primary)',
                    padding: '1px 5px',
                    borderRadius: '4px',
                  }}
                >
                  Today
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Lectures Schedule List */}
      {filteredSlots.length === 0 ? (
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
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px',
            }}
          >
            <CalendarIcon size={24} />
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>
            No Lectures Scheduled for {selectedDay}
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto' }}>
            {isTeacher
              ? `You have no teaching lectures assigned for ${selectedDay}. Check other days or the admin schedule master.`
              : `There are currently no classes scheduled for your section on ${selectedDay}. Select another day or check back when the department updates schedules.`}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredSlots.map((slot) => {
            const isLive = slot.status === 'live';
            return (
              <div
                key={slot.id}
                className="vs-card vs-card-hover"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px',
                  borderLeft: `4px solid ${
                    isLive ? '#EF4444' : slot.type === 'Lab' ? 'var(--purple)' : 'var(--primary)'
                  }`,
                  background: isLive ? 'linear-gradient(135deg, #EFF6FF 0%, #FFFFFF 100%)' : '#FFFFFF',
                }}
              >
                {/* Left Details */}
                <div style={{ flex: '1 1 280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>
                      {slot.code}
                    </span>
                    <span
                      className="vs-badge"
                      style={{
                        backgroundColor: slot.type === 'Lab' ? 'var(--purple-light)' : '#F1F5F9',
                        color: slot.type === 'Lab' ? 'var(--purple-text)' : 'var(--text)',
                      }}
                    >
                      {slot.type}
                    </span>

                    {/* Section badge */}
                    {slot.section && (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          backgroundColor: '#FEF3C7',
                          color: '#92400E',
                          padding: '1px 7px',
                          borderRadius: '4px',
                        }}
                      >
                        Section {slot.section}
                      </span>
                    )}

                    {isTeacher && slot.course && (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          backgroundColor: '#EEF2FB',
                          color: 'var(--primary)',
                          padding: '1px 7px',
                          borderRadius: '4px',
                        }}
                      >
                        {slot.course} (Sem {slot.semester || '—'})
                      </span>
                    )}

                    {isLive && (
                      <span
                        style={{
                          backgroundColor: '#EF4444',
                          color: '#FFFFFF',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: 'var(--radius-full)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#FFFFFF' }} />
                        LIVE NOW
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)' }}>
                    {slot.subject}
                  </h3>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '14px',
                      fontSize: '0.78rem',
                      color: 'var(--text-muted)',
                      marginTop: '6px',
                    }}
                  >
                    {!isTeacher && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <User size={14} />
                        {slot.faculty}
                      </span>
                    )}
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={14} />
                      {slot.room}
                    </span>
                  </div>
                </div>

                {/* Right: Time & Action */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>
                      <Clock size={15} color="var(--primary)" />
                      <span>{slot.startTime}</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Until {slot.endTime}
                    </div>
                  </div>

                  {isTeacher ? (
                    <button
                      onClick={() => setActiveTab('attendance_live')}
                      className="vs-btn-outline"
                      style={{ padding: '7px 12px', fontSize: '0.78rem', borderRadius: 'var(--radius-full)' }}
                    >
                      <QrCode size={14} />
                      <span>Take Attendance</span>
                    </button>
                  ) : isLive ? (
                    <button
                      onClick={() => setIsQrScannerOpen(true)}
                      className="vs-btn-primary"
                      style={{ padding: '8px 14px', fontSize: '0.8rem', borderRadius: 'var(--radius-full)' }}
                    >
                      <QrCode size={15} />
                      <span>Scan QR</span>
                    </button>
                  ) : (
                    <span
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        backgroundColor: '#F8FAFC',
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      Upcoming
                    </span>
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
