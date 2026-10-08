'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { Home, Calendar, QrCode, Briefcase, Award } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { currentUser, activeTab, setActiveTab, setIsQrScannerOpen, activeRole } = useApp();

  const isStudent = (currentUser?.role || activeRole || '').toLowerCase() === 'student';
  if (!isStudent) return null;

  return (
    <div
      className="mobile-bottom-nav"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid var(--border)',
        padding: '6px 16px 12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 50,
        boxShadow: '0 -4px 16px rgba(16, 24, 40, 0.06)',
      }}
    >
      {/* Home Tab */}
      <button
        onClick={() => setActiveTab('dashboard')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
          background: 'none',
          border: 'none',
          color: activeTab === 'dashboard' ? 'var(--primary)' : 'var(--text-muted)',
          cursor: 'pointer',
          padding: '6px 10px',
        }}
      >
        <Home size={20} strokeWidth={activeTab === 'dashboard' ? 2.5 : 2} />
        <span style={{ fontSize: '0.68rem', fontWeight: activeTab === 'dashboard' ? 700 : 500 }}>
          Home
        </span>
      </button>

      {/* Timetable Tab */}
      <button
        onClick={() => setActiveTab('timetable')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
          background: 'none',
          border: 'none',
          color: activeTab === 'timetable' ? 'var(--primary)' : 'var(--text-muted)',
          cursor: 'pointer',
          padding: '6px 10px',
        }}
      >
        <Calendar size={20} strokeWidth={activeTab === 'timetable' ? 2.5 : 2} />
        <span style={{ fontSize: '0.68rem', fontWeight: activeTab === 'timetable' ? 700 : 500 }}>
          Schedule
        </span>
      </button>

      {/* Prominent Center Scan QR Button */}
      <div style={{ position: 'relative', top: '-16px' }}>
        <button
          onClick={() => setIsQrScannerOpen(true)}
          className="vs-scan-fab"
          aria-label="Scan Attendance QR Code"
          title="Scan Live Dynamic QR"
        >
          <QrCode size={26} strokeWidth={2.3} />
        </button>
      </div>

      {/* Skills Tab */}
      <button
        onClick={() => setActiveTab('skills')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
          background: 'none',
          border: 'none',
          color: activeTab === 'skills' ? 'var(--primary)' : 'var(--text-muted)',
          cursor: 'pointer',
          padding: '6px 10px',
        }}
      >
        <Award size={20} strokeWidth={activeTab === 'skills' ? 2.5 : 2} />
        <span style={{ fontSize: '0.68rem', fontWeight: activeTab === 'skills' ? 700 : 500 }}>
          Skills
        </span>
      </button>

      {/* Placements Tab */}
      <button
        onClick={() => setActiveTab('placements')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
          background: 'none',
          border: 'none',
          color: activeTab === 'placements' ? 'var(--primary)' : 'var(--text-muted)',
          cursor: 'pointer',
          padding: '6px 10px',
        }}
      >
        <Briefcase size={20} strokeWidth={activeTab === 'placements' ? 2.5 : 2} />
        <span style={{ fontSize: '0.68rem', fontWeight: activeTab === 'placements' ? 700 : 500 }}>
          Placements
        </span>
      </button>

      <style jsx>{`
        @media (min-width: 768px) {
          .mobile-bottom-nav {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};
