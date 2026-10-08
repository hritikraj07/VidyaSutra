'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Search,
  Plus,
  Trash2,
  Edit2,
  ArrowLeft,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  BookOpen,
  Sparkles,
} from 'lucide-react';

interface StudentData {
  id: string;
  userId: string;
  name: string;
  email: string;
  rollNo: string;
  department: string;
  semester: number;
  section: string;
  admissionYear: number;
  lastLoginAt: string | null;
  createdAt: string;
  coursesCount: number;
}

import { useApp } from '@/context/AppContext';

export default function AdminStudentsPage() {
  const router = useRouter();
  const { currentUser, isLoadingAuth } = useApp();
  const [students, setStudents] = useState<StudentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!isLoadingAuth) {
      if (!currentUser) {
        router.push('/login');
      } else if (currentUser.role !== 'admin') {
        router.push('/');
      }
    }
  }, [currentUser, isLoadingAuth, router]);

  // Edit modal state
  const [editingStudent, setEditingStudent] = useState<StudentData | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    rollNo: '',
    department: '',
    semester: 1,
    section: 'A',
    admissionYear: 2024,
  });

  // Add modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    password: '',
    rollNo: '',
    department: 'Computer Science & Engineering',
    semester: 1,
    section: 'A',
    admissionYear: 2024,
  });

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/students${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`);
      const data = await res.json();
      if (data.success) {
        setStudents(data.students);
      }
    } catch {
      setNotification({ type: 'error', message: 'Failed to communicate with database server' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [searchQuery]);

  // In-website delete confirmation modal state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = (id: string, name: string) => {
    setDeleteTarget({ id, name });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/students?id=${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', message: `Record for ${deleteTarget.name} deleted successfully.` });
        fetchStudents();
      } else {
        setNotification({ type: 'error', message: data.error || 'Failed to delete record.' });
      }
    } catch {
      setNotification({ type: 'error', message: 'Network error deleting student record.' });
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const openEditModal = (student: StudentData) => {
    setEditingStudent(student);
    setEditForm({
      name: student.name,
      rollNo: student.rollNo,
      department: student.department,
      semester: student.semester,
      section: student.section,
      admissionYear: student.admissionYear,
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    try {
      const res = await fetch('/api/admin/students', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingStudent.id,
          ...editForm,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', message: `Profile for ${editForm.name} updated successfully.` });
        setEditingStudent(null);
        fetchStudents();
      } else {
        setNotification({ type: 'error', message: data.error || 'Failed to update record.' });
      }
    } catch {
      setNotification({ type: 'error', message: 'Network error updating student profile.' });
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', message: `Student ${addForm.name} registered into persistent database!` });
        setIsAddOpen(false);
        setAddForm({
          name: '',
          email: '',
          password: '',
          rollNo: '',
          department: 'Computer Science & Engineering',
          semester: 1,
          section: 'A',
          admissionYear: 2024,
        });
        fetchStudents();
      } else {
        setNotification({ type: 'error', message: data.error || 'Failed to add student.' });
      }
    } catch {
      setNotification({ type: 'error', message: 'Network error creating student record.' });
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', color: 'var(--text-primary)', padding: '24px' }}>
      {/* Header Bar */}
      <div
        style={{
          width: '100%',
          marginBottom: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={() => router.push('/')}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem',
            }}
          >
            <ArrowLeft size={16} /> Back to Portal
          </button>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: 'var(--navy-900)' }}>
              Database Administrator Panel
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Live persistent view of User credentials, StudentProfile rows, and Course Allotments.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => window.open('http://localhost:5555', '_blank')}
            title="Launch Prisma Studio in browser (npm run db:studio)"
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--navy-800)',
              color: 'white',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Database size={15} /> Prisma Studio
          </button>
          <button
            onClick={() => setIsAddOpen(true)}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'var(--primary)',
              color: 'white',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Plus size={16} /> Add Student
          </button>
          <button
            onClick={fetchStudents}
            style={{
              padding: '8px 10px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ width: '100%' }}>
        {/* Notification Alert */}
        {notification && (
          <div
            style={{
              marginBottom: '16px',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: notification.type === 'success' ? '#ECFDF5' : '#FEF2F2',
              border: `1px solid ${notification.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
              color: notification.type === 'success' ? '#065F46' : '#991B1B',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'inherit' }}
            >
              ×
            </button>
          </div>
        )}

        {/* Search & Stats Bar */}
        <div
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1', minWidth: '260px' }}>
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search by student name, institutional email, roll number, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '0.9rem',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Total Registered Students:{' '}
            <strong style={{ color: 'var(--navy-900)' }}>{students.length}</strong>
          </div>
        </div>

        {/* Database Table */}
        <div
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: 'rgba(27, 38, 59, 0.04)',
                    borderBottom: '1px solid var(--border)',
                    color: 'var(--navy-800)',
                    fontWeight: 600,
                  }}
                >
                  <th style={{ padding: '12px 16px' }}>Roll Number</th>
                  <th style={{ padding: '12px 16px' }}>Student Name</th>
                  <th style={{ padding: '12px 16px' }}>Institutional Email</th>
                  <th style={{ padding: '12px 16px' }}>Department</th>
                  <th style={{ padding: '12px 16px' }}>Class</th>
                  <th style={{ padding: '12px 16px' }}>Batch</th>
                  <th style={{ padding: '12px 16px' }}>Courses</th>
                  <th style={{ padding: '12px 16px' }}>Last Active</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                      Loading records from database...
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      No student records found in the database. Use <strong>Add Student</strong> or run{' '}
                      <code>npm run db:seed</code>.
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr
                      key={student.id}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        transition: 'background-color 0.15s ease',
                      }}
                      className="hover:bg-slate-50"
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--navy-900)' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(65, 90, 119, 0.1)',
                            fontFamily: 'monospace',
                          }}
                        >
                          {student.rollNo}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>{student.name}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{student.email}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{student.department}</td>
                      <td style={{ padding: '12px 16px' }}>
                        Sem {student.semester} - Sec {student.section}
                      </td>
                      <td style={{ padding: '12px 16px' }}>{student.admissionYear}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: 'var(--navy-800)',
                            fontWeight: 600,
                          }}
                        >
                          <BookOpen size={14} /> {student.coursesCount} Allotted
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                        {student.lastLoginAt ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={13} /> {new Date(student.lastLoginAt).toLocaleDateString()}
                          </span>
                        ) : (
                          <span style={{ fontStyle: 'italic' }}>Never</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            onClick={() => openEditModal(student)}
                            title="Edit student profile"
                            style={{
                              padding: '6px',
                              borderRadius: '6px',
                              border: '1px solid var(--border)',
                              backgroundColor: 'var(--surface)',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer',
                            }}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(student.id, student.name)}
                            title="Delete student and cascade all allotments"
                            style={{
                              padding: '6px',
                              borderRadius: '6px',
                              border: '1px solid #FECACA',
                              backgroundColor: '#FEF2F2',
                              color: '#DC2626',
                              cursor: 'pointer',
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Student Modal */}
      {editingStudent && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--surface)',
              borderRadius: '12px',
              padding: '24px',
              width: '100%',
              maxWidth: '480px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            <h2 style={{ margin: '0 0 16px', fontSize: '1.2rem', fontWeight: 700 }}>Edit Student Record</h2>
            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    marginTop: '4px',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Roll Number</label>
                <input
                  type="text"
                  required
                  value={editForm.rollNo}
                  onChange={(e) => setEditForm({ ...editForm, rollNo: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    marginTop: '4px',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Department</label>
                <input
                  type="text"
                  required
                  value={editForm.department}
                  onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    marginTop: '4px',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Semester</label>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    required
                    value={editForm.semester}
                    onChange={(e) => setEditForm({ ...editForm, semester: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      marginTop: '4px',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Section</label>
                  <input
                    type="text"
                    required
                    value={editForm.section}
                    onChange={(e) => setEditForm({ ...editForm, section: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      marginTop: '4px',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Year</label>
                  <input
                    type="number"
                    required
                    value={editForm.admissionYear}
                    onChange={(e) => setEditForm({ ...editForm, admissionYear: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      marginTop: '4px',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {isAddOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--surface)',
              borderRadius: '12px',
              padding: '24px',
              width: '100%',
              maxWidth: '500px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            <h2 style={{ margin: '0 0 16px', fontSize: '1.2rem', fontWeight: 700 }}>Enroll New Student</h2>
            <form onSubmit={handleAddStudent} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Full Legal Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diya Patel"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    marginTop: '4px',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Institutional Email (@vidyasutra.edu.in)
                </label>
                <input
                  type="email"
                  required
                  placeholder="student@vidyasutra.edu.in"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    marginTop: '4px',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Initial Password</label>
                <input
                  type="password"
                  required
                  placeholder="Min 8 chars, 1 uppercase, 1 lowercase, 1 digit"
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    marginTop: '4px',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Student Roll Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 24BCSE102"
                  value={addForm.rollNo}
                  onChange={(e) => setAddForm({ ...addForm, rollNo: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    marginTop: '4px',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Semester</label>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    required
                    value={addForm.semester}
                    onChange={(e) => setAddForm({ ...addForm, semester: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      marginTop: '4px',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Section</label>
                  <input
                    type="text"
                    required
                    value={addForm.section}
                    onChange={(e) => setAddForm({ ...addForm, section: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      marginTop: '4px',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Year</label>
                  <input
                    type="number"
                    required
                    value={addForm.admissionYear}
                    onChange={(e) => setAddForm({ ...addForm, admissionYear: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      marginTop: '4px',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Create Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-Website Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="vs-modal-backdrop" style={{ zIndex: 110 }}>
          <div
            className="vs-card"
            style={{
              maxWidth: '440px',
              width: '100%',
              backgroundColor: '#FFFFFF',
              padding: '24px',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 20px 35px -10px rgba(23, 37, 84, 0.25)',
              border: '1px solid #FECACA',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: '#FEF2F2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#DC2626',
                }}
              >
                <Trash2 size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#172554', margin: 0 }}>
                  Confirm Deletion
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#64748B', margin: 0 }}>
                  Institutional student record removal
                </p>
              </div>
            </div>

            <p style={{ fontSize: '0.86rem', color: '#334155', lineHeight: 1.5, marginBottom: '20px' }}>
              Are you sure you want to delete <strong>{deleteTarget.name}</strong>'s institutional record and all course allotments? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                style={{
                  padding: '9px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#334155',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                style={{
                  padding: '9px 18px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Trash2 size={15} />
                <span>{isDeleting ? 'Deleting...' : 'Delete Student'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
