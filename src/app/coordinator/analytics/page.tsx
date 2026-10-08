'use client';

import React from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { CoordinatorAnalyticsView } from '@/features/analytics/CoordinatorAnalyticsView';

const CoordinatorAnalyticsContent: React.FC = () => {
  const { currentUser, isLoadingAuth } = useApp();

  if (isLoadingAuth) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F7F3' }}>
        <div style={{ textAlign: 'center', color: '#64748B' }}>Loading Coordinator Telemetry...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8F7F3', paddingTop: '76px', paddingBottom: '90px' }}>
      <Navbar />
      <main style={{ maxWidth: '1440px', margin: '0 auto' }}>
        <CoordinatorAnalyticsView />
      </main>
      <BottomNav />
    </div>
  );
};

export default function CoordinatorAnalyticsPage() {
  return (
    <AppProvider>
      <CoordinatorAnalyticsContent />
    </AppProvider>
  );
}
