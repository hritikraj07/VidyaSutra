'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Navbar } from '@/components/layout/Navbar';
import { AdminDashboard } from '@/features/admin/AdminDashboard';

export default function AdminPage() {
  const router = useRouter();
  const { currentUser, isLoadingAuth } = useApp();

  useEffect(() => {
    if (!isLoadingAuth) {
      if (!currentUser) {
        router.push('/login');
      } else if (currentUser.role !== 'admin') {
        // Non-admin attempting direct route access: redirect to home
        router.push('/');
      }
    }
  }, [currentUser, isLoadingAuth, router]);

  if (isLoadingAuth || !currentUser || currentUser.role !== 'admin') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F8F7F3',
          gap: '12px',
        }}
      >
        <p style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 600 }}>
          Verifying administrator authorization...
        </p>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh', paddingTop: '80px', paddingBottom: '30px' }}>
        <AdminDashboard />
      </main>
    </>
  );
}
