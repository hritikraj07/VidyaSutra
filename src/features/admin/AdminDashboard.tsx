'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  GraduationCap,
  BookOpen,
  Layers,
  Calendar,
  Upload,
  UserCheck,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Shield,
  RefreshCw,
  Clock,
  ArrowRight,
  Pencil,
  X,
  MapPin,
  User as UserIcon,
  TrendingUp,
} from 'lucide-react';

import { useApp } from '@/context/AppContext';
import { AdminAnalyticsView } from '@/features/analytics/AdminAnalyticsView';
import { AdminAttendanceSettingsView } from './AdminAttendanceSettingsView';

interface StudentItem {
  id: string;
  name: string;
  email: string;
  rollNo: string;
  course: string;
  department: string;
  semester: number;
  section: string;
}

interface TeacherItem {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  courses: string[];
}

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  course: string | null;
  section: string | null;
  semester: number | null;
  studentId: string | null;
  teacherId: string | null;
  lastLoginAt?: string | null;
  createdAt?: string;
}

export const AdminDashboard: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();
  const [activeAdminTab, setActiveAdminTab] = useState<
    'overview' | 'analytics' | 'students' | 'teachers' | 'subjects' | 'sections' | 'timetable' | 'users' | 'attendance'
  >('overview');

  useEffect(() => {
    if (activeTab === 'dashboard' || activeTab === 'admin_overview') setActiveAdminTab('overview');
    else if (activeTab === 'admin_analytics') setActiveAdminTab('analytics');
    else if (activeTab === 'admin_students') setActiveAdminTab('students');
    else if (activeTab === 'admin_teachers') setActiveAdminTab('teachers');
    else if (activeTab === 'admin_subjects') setActiveAdminTab('subjects');
    else if (activeTab === 'admin_sections') setActiveAdminTab('sections');
    else if (activeTab === 'admin_timetable') setActiveAdminTab('timetable');
    else if (activeTab === 'admin_users') setActiveAdminTab('users');
    else if (activeTab === 'admin_attendance') setActiveAdminTab('attendance');
  }, [activeTab]);

  const handleTabSwitch = (tabId: string) => {
    window.getSelection()?.removeAllRanges();
    setActiveAdminTab(tabId as any);
    setActiveTab(tabId === 'overview' ? 'dashboard' : `admin_${tabId}`);
  };

  const [students, setStudents] = useState<StudentItem[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Subject / Course State (Dynamic with Add/Remove, credits removed)
  const [subjectsList, setSubjectsList] = useState([
    { code: 'CS301', name: 'Data Structures & Algorithms', sem: 6, dept: 'Computer Science & Engineering' },
    { code: 'CS302', name: 'Database Management Systems', sem: 6, dept: 'Computer Science & Engineering' },
    { code: 'CS303', name: 'Operating Systems', sem: 6, dept: 'Computer Science & Engineering' },
    { code: 'CS304', name: 'Computer Networks', sem: 6, dept: 'Computer Science & Engineering' },
    { code: 'IT201', name: 'Object Oriented Programming', sem: 4, dept: 'Information Technology' },
    { code: 'IT202', name: 'Computer Architecture', sem: 4, dept: 'Information Technology' },
  ]);
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
  const [courseForm, setCourseForm] = useState({
    code: '',
    name: '',
    sem: 1,
    dept: 'Computer Science & Engineering',
  });

  // Section / Class State (Dynamic with Add/Remove)
  const [sectionsList, setSectionsList] = useState([
    { sec: 'CSE-A', dept: 'Computer Science & Engineering', room: 'Hall 301 & 402', capacity: 60 },
    { sec: 'CSE-B', dept: 'Computer Science & Engineering', room: 'Hall 302', capacity: 60 },
    { sec: 'IT-A', dept: 'Information Technology', room: 'Block C - Room 201', capacity: 55 },
    { sec: 'IT-B', dept: 'Information Technology', room: 'Block C - Room 202', capacity: 55 },
  ]);
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);
  const [sectionForm, setSectionForm] = useState({
    sec: '',
    dept: 'Computer Science & Engineering',
    room: 'Hall 301',
    capacity: 60,
  });

  // In-Website Delete Modal State (Zero browser confirm() popups)
  const [websiteDeleteModal, setWebsiteDeleteModal] = useState<{
    isOpen: boolean;
    type: 'user' | 'student' | 'timetable' | 'subject' | 'section';
    id: string;
    name: string;
    title?: string;
    message: string;
  }>({
    isOpen: false,
    type: 'user',
    id: '',
    name: '',
    title: '',
    message: '',
  });
  const [isExecutingDelete, setIsExecutingDelete] = useState(false);

  // User / Role creation form state
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STUDENT', // ADMIN, TEACHER, STUDENT
    rollNo: '',
    course: 'Computer Science & Engineering',
    department: 'Computer Science & Engineering',
    semester: 1,
    section: 'CSE-A',
  });
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // User Management Directory & Edit Modal State
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('student');
  const [userCourseFilter, setUserCourseFilter] = useState('all');
  const [userSectionFilter, setUserSectionFilter] = useState('all');
  const [userSemesterFilter, setUserSemesterFilter] = useState('all');

  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [editUserForm, setEditUserForm] = useState({
    name: '',
    role: 'student',
    course: 'Computer Science & Engineering',
    section: 'CSE-A',
    semester: 1,
    idNumber: '',
  });
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);

  // Timetable Management State
  const [timetableCohort, setTimetableCohort] = useState({
    course: 'Computer Science & Engineering',
    semester: 6,
    section: 'CSE-A',
  });
  const [timetableEntries, setTimetableEntries] = useState<any[]>([]);
  const [isLoadingTimetable, setIsLoadingTimetable] = useState(false);
  const [selectedTimetableDay, setSelectedTimetableDay] = useState<string>('All');
  const [isTimetableModalOpen, setIsTimetableModalOpen] = useState(false);
  const [editingTimetableEntry, setEditingTimetableEntry] = useState<any | null>(null);
  const [timetableForm, setTimetableForm] = useState({
    day: 'Wednesday',
    startTime: '09:00 AM',
    endTime: '10:00 AM',
    subject: '',
    subjectCode: '',
    teacherName: 'Dr. Ramesh Verma',
    room: 'Hall 301',
  });

  // Fetch timetable entries for selected cohort
  const fetchTimetableEntries = async (
    course = timetableCohort.course,
    semester = timetableCohort.semester,
    section = timetableCohort.section
  ) => {
    setIsLoadingTimetable(true);
    try {
      const res = await fetch(
        `/api/timetable?course=${encodeURIComponent(course)}&semester=${semester}&section=${encodeURIComponent(section)}`
      );
      const data = await res.json();
      if (data.entries) {
        setTimetableEntries(data.entries);
      } else {
        setTimetableEntries([]);
      }
    } catch (err) {
      console.error(err);
      setTimetableEntries([]);
    } finally {
      setIsLoadingTimetable(false);
    }
  };

  useEffect(() => {
    if (activeAdminTab === 'timetable') {
      fetchTimetableEntries();
    }
  }, [activeAdminTab, timetableCohort.course, timetableCohort.semester, timetableCohort.section]);

  const handleOpenTimetableModal = (entry?: any) => {
    if (entry) {
      setEditingTimetableEntry(entry);
      setTimetableForm({
        day: entry.day || 'Wednesday',
        startTime: entry.startTime || '09:00 AM',
        endTime: entry.endTime || '10:00 AM',
        subject: entry.subject || '',
        subjectCode: entry.subjectCode || '',
        teacherName: entry.teacherName || 'Dr. Ramesh Verma',
        room: entry.room || 'Hall 301',
      });
    } else {
      setEditingTimetableEntry(null);
      setTimetableForm({
        day: selectedTimetableDay !== 'All' ? selectedTimetableDay : 'Wednesday',
        startTime: '09:00 AM',
        endTime: '10:00 AM',
        subject: '',
        subjectCode: '',
        teacherName: 'Dr. Ramesh Verma',
        room: 'Hall 301',
      });
    }
    setIsTimetableModalOpen(true);
  };

  const handleSaveTimetableEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...timetableForm,
        course: timetableCohort.course,
        semester: Number(timetableCohort.semester),
        section: timetableCohort.section,
      };

      let res;
      if (editingTimetableEntry?.id) {
        res = await fetch('/api/timetable', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingTimetableEntry.id, ...payload }),
        });
      } else {
        res = await fetch('/api/timetable', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (res.ok && data.success) {
        setNotification({
          type: 'success',
          message: editingTimetableEntry ? 'Timetable entry updated successfully.' : 'Timetable entry added successfully.',
        });
        setIsTimetableModalOpen(false);
        setEditingTimetableEntry(null);
        fetchTimetableEntries();
      } else {
        setNotification({ type: 'error', message: data.error || 'Failed to save timetable entry.' });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Network error saving timetable entry.' });
    }
  };

  const handleDeleteTimetableEntry = (id: string, subject: string) => {
    setWebsiteDeleteModal({
      isOpen: true,
      type: 'timetable',
      id,
      name: subject,
      title: 'Delete Schedule Entry',
      message: `Are you sure you want to delete the schedule entry for '${subject}'?`,
    });
  };

  const handleConfirmWebsiteDelete = async () => {
    if (!websiteDeleteModal.isOpen) return;
    setIsExecutingDelete(true);
    try {
      if (websiteDeleteModal.type === 'timetable') {
        const res = await fetch(`/api/timetable?id=${websiteDeleteModal.id}`, { method: 'DELETE' });
        if (res.ok) {
          setNotification({ type: 'success', message: `Timetable entry for '${websiteDeleteModal.name}' deleted.` });
          fetchTimetableEntries();
        } else {
          setNotification({ type: 'error', message: 'Failed to delete timetable entry.' });
        }
      } else if (websiteDeleteModal.type === 'user') {
        const res = await fetch(`/api/admin/users?id=${encodeURIComponent(websiteDeleteModal.id)}`, { method: 'DELETE' });
        const data = await res.json();
        if (res.ok && data.success) {
          setNotification({ type: 'success', message: `User '${websiteDeleteModal.name}' deleted successfully.` });
          fetchUsers();
          fetchStudents();
        } else {
          setNotification({ type: 'error', message: data.error || 'Failed to delete user.' });
        }
      } else if (websiteDeleteModal.type === 'student') {
        const res = await fetch(`/api/admin/students?id=${websiteDeleteModal.id}`, { method: 'DELETE' });
        if (res.ok) {
          setNotification({ type: 'success', message: `Student '${websiteDeleteModal.name}' removed.` });
          fetchStudents();
        } else {
          setNotification({ type: 'error', message: 'Failed to delete student.' });
        }
      } else if (websiteDeleteModal.type === 'subject') {
        setSubjectsList((prev) => prev.filter((s) => s.code !== websiteDeleteModal.id));
        setNotification({ type: 'success', message: `Course ${websiteDeleteModal.id} removed from catalog.` });
      } else if (websiteDeleteModal.type === 'section') {
        setSectionsList((prev) => prev.filter((s) => s.sec !== websiteDeleteModal.id));
        setNotification({ type: 'success', message: `Section ${websiteDeleteModal.id} removed from active classes.` });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Network error executing deletion.' });
    } finally {
      setIsExecutingDelete(false);
      setWebsiteDeleteModal({ ...websiteDeleteModal, isOpen: false });
    }
  };

  // Fetch students from /api/admin/students
  const fetchStudents = async () => {
    setIsLoadingStudents(true);
    try {
      const res = await fetch('/api/admin/students');
      const data = await res.json();
      if (data.students) {
        setStudents(
          data.students.map((s: any) => ({
            id: s.id,
            name: s.name,
            email: s.email,
            rollNo: s.rollNo,
            department: s.department,
            semester: s.semester,
            section: s.section,
          }))
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);
    setIsCreatingUser(true);

    const isRoleAdmin = userForm.role.toUpperCase() === 'ADMIN';
    const isRoleTeacher = userForm.role.toUpperCase() === 'TEACHER';
    const isRoleStudent = userForm.role.toUpperCase() === 'STUDENT';

    try {
      const payload: any = {
        name: userForm.name.trim(),
        email: userForm.email.trim(),
        password: userForm.password,
        role: userForm.role,
      };

      if (isRoleStudent) {
        payload.course = userForm.course;
        payload.section = userForm.section;
        payload.semester = userForm.semester;
        payload.studentId = userForm.rollNo;
        payload.rollNo = userForm.rollNo;
      } else if (isRoleTeacher) {
        // Teacher course and section assignment
        payload.course = userForm.course;
        payload.section = userForm.section;
        payload.teacherId = userForm.rollNo || undefined;
      }
      // For Admin: strictly name, email, password, role - no course, section, or IDs!

      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setNotification({
          type: 'success',
          message: `User '${userForm.name}' created with role ${userForm.role}!`,
        });
        setUserForm({
          name: '',
          email: '',
          password: '',
          role: 'STUDENT',
          rollNo: '',
          course: 'CS301',
          department: 'Computer Science & Engineering',
          semester: 1,
          section: 'CSE-A',
        });
        fetchUsers();
        fetchStudents();
      } else {
        setNotification({
          type: 'error',
          message: data.error || 'Failed to create user.',
        });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Network error.' });
    } finally {
      setIsCreatingUser(false);
    }
  };

  // User Management Directory Handlers
  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const params = new URLSearchParams();
      if (userSearchQuery.trim()) params.append('q', userSearchQuery.trim());
      if (userRoleFilter !== 'all') params.append('role', userRoleFilter);
      if (userCourseFilter !== 'all') params.append('course', userCourseFilter);
      if (userSectionFilter !== 'all') params.append('section', userSectionFilter);
      if (userSemesterFilter !== 'all') params.append('semester', userSemesterFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (e) {
      console.error('Failed to fetch users:', e);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (activeAdminTab === 'users') {
      fetchUsers();
    }
  }, [
    activeAdminTab,
    userSearchQuery,
    userRoleFilter,
    userCourseFilter,
    userSectionFilter,
    userSemesterFilter,
  ]);

  const handleDeleteUser = (id: string, name: string) => {
    setWebsiteDeleteModal({
      isOpen: true,
      type: 'user',
      id,
      name,
      title: 'Delete User Account',
      message: `Are you sure you want to delete user '${name}'? This action cannot be undone.`,
    });
  };

  const handleOpenEditUserModal = (u: UserItem) => {
    setEditingUser(u);
    setEditUserForm({
      name: u.name,
      role: u.role,
      course: u.course || 'Computer Science & Engineering',
      section: u.section || 'CSE-A',
      semester: u.semester || 1,
      idNumber: u.studentId || u.teacherId || '',
    });
    setIsEditUserModalOpen(true);
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsUpdatingUser(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingUser.id,
          name: editUserForm.name,
          role: editUserForm.role,
          course: editUserForm.course,
          section: editUserForm.section,
          semester: editUserForm.semester,
          studentId: editUserForm.role === 'student' ? editUserForm.idNumber : undefined,
          teacherId: editUserForm.role === 'teacher' ? editUserForm.idNumber : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotification({ type: 'success', message: `Profile for '${editUserForm.name}' updated successfully.` });
        setIsEditUserModalOpen(false);
        setEditingUser(null);
        fetchUsers();
        fetchStudents();
      } else {
        setNotification({ type: 'error', message: data.error || 'Failed to update user.' });
      }
    } catch {
      setNotification({ type: 'error', message: 'Network error updating user.' });
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const handleDeleteStudent = (id: string, name: string) => {
    setWebsiteDeleteModal({
      isOpen: true,
      type: 'student',
      id,
      name,
      title: 'Remove Student Record',
      message: `Are you sure you want to remove student '${name}'?`,
    });
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNo?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ width: '100%', padding: '16px 28px' }}>
      {/* 1. Header Banner */}
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
          borderLeft: '5px solid #243B7A',
          padding: '22px 26px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                backgroundColor: 'rgba(36, 59, 122, 0.12)',
                color: '#243B7A',
                border: '1px solid rgba(36, 59, 122, 0.25)',
                padding: '2px 8px',
                borderRadius: '6px',
                textTransform: 'uppercase',
              }}
            >
              Academic Administration
            </span>
            <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
              VidyaSutra Core System Control
            </span>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#172554', margin: 0, letterSpacing: '-0.02em' }}>
            Administrator Dashboard
          </h1>
          <p style={{ fontSize: '0.84rem', color: '#64748B', marginTop: '3px' }}>
            Manage institutional users, faculty course assignments, class sections, and academic data.
          </p>
        </div>

      </section>

      {/* Notification Toast (Floating Bottom-Right) */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '14px 20px',
            borderRadius: '12px',
            backgroundColor: notification.type === 'success' ? '#15803D' : '#DC2626',
            color: '#FFFFFF',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
            fontSize: '0.88rem',
            fontWeight: 700,
            maxWidth: '420px',
          }}
        >
          {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span style={{ flex: 1 }}>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#FFFFFF',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* TAB CONTENTS */}

      {/* TAB ATTENDANCE SETTINGS & AUDIT */}
      {activeAdminTab === 'attendance' && <AdminAttendanceSettingsView />}

      {/* TAB ANALYTICS */}
      {activeAdminTab === 'analytics' && <AdminAnalyticsView />}

      {/* TAB A: OVERVIEW */}
      {activeAdminTab === 'overview' && (
        <div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              marginBottom: '24px',
            }}
          >
            <div className="vs-card" style={{ padding: '20px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B' }}>Enrolled Students</span>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#172554', margin: '4px 0' }}>
                {students.length}
              </div>
              <span style={{ fontSize: '0.74rem', color: '#198754' }}>● Active telemetry active</span>
            </div>

            <div className="vs-card" style={{ padding: '20px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B' }}>Faculty Members</span>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#172554', margin: '4px 0' }}>3</div>
              <span style={{ fontSize: '0.74rem', color: '#64748B' }}>Assigned across departments</span>
            </div>

            <div className="vs-card" style={{ padding: '20px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B' }}>Active Subjects</span>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#172554', margin: '4px 0' }}>6</div>
              <span style={{ fontSize: '0.74rem', color: '#64748B' }}>CS301, CS302, CS303, CS304, IT201, IT202</span>
            </div>

            <div className="vs-card" style={{ padding: '20px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B' }}>Sections & Cohorts</span>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#172554', margin: '4px 0' }}>4</div>
              <span style={{ fontSize: '0.74rem', color: '#64748B' }}>CSE-A, CSE-B, IT-A, IT-B</span>
            </div>
          </div>

          <div
            className="vs-card"
            style={{
              padding: '24px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#172554', marginBottom: '8px' }}>
              Institutional System Status
            </h3>
            <p style={{ fontSize: '0.84rem', color: '#64748B', marginBottom: '16px' }}>
              Real-time attendance encryption, role verification, and Prisma database persistence are operational.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.78rem', color: '#166534', backgroundColor: '#DCFCE7', padding: '4px 10px', borderRadius: '6px', fontWeight: 600 }}>
                ✓ Database: SQLite (Prisma 5.22.0)
              </span>
              <span style={{ fontSize: '0.78rem', color: '#1E40AF', backgroundColor: '#DBEAFE', padding: '4px 10px', borderRadius: '6px', fontWeight: 600 }}>
                ✓ Domain: @vidyasutra.edu.in enforced
              </span>
              <span style={{ fontSize: '0.78rem', color: '#92400E', backgroundColor: '#FEF3C7', padding: '4px 10px', borderRadius: '6px', fontWeight: 600 }}>
                ✓ Dynamic 5s QR Security Active
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB B: STUDENT MANAGEMENT */}
      {activeAdminTab === 'students' && (
        <div className="vs-card" style={{ padding: '24px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#172554', margin: 0 }}>
              Enrolled Students Directory ({students.length})
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} color="#64748B" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                <input
                  type="text"
                  placeholder="Search student or roll no..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    padding: '8px 12px 8px 32px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.84rem',
                    width: '220px',
                  }}
                />
              </div>
              <button
                onClick={fetchStudents}
                style={{
                  background: '#F1F5F9',
                  border: '1px solid #CBD5E1',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Refresh list"
              >
                <RefreshCw size={15} color="#64748B" />
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                  <th style={{ padding: '10px 14px', fontWeight: 700, color: '#64748B' }}>Roll Number</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700, color: '#64748B' }}>Name</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700, color: '#64748B' }}>Email</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700, color: '#64748B' }}>Department</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700, color: '#64748B' }}>Section</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700, color: '#64748B', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((s) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: '#243B7A' }}>{s.rollNo}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: '#172033' }}>{s.name}</td>
                      <td style={{ padding: '10px 14px', color: '#64748B' }}>{s.email}</td>
                      <td style={{ padding: '10px 14px', color: '#64748B' }}>{s.department}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 600 }}>{s.section}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleDeleteStudent(s.id, s.name)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#EF4444',
                            cursor: 'pointer',
                            padding: '4px',
                          }}
                          title="Delete student"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#64748B' }}>
                      No students found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB C: TEACHER MANAGEMENT */}
      {activeAdminTab === 'teachers' && (
        <div className="vs-card animate-fade-in" style={{ padding: '24px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#172554', margin: 0 }}>
                Faculty & Instructor Directory ({users.filter((u) => u.role.toLowerCase() === 'teacher' || u.role.toLowerCase() === 'faculty').length})
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '3px 0 0 0' }}>
                All institutional teachers and their active classroom course assignments.
              </p>
            </div>
            <button
              onClick={() => handleTabSwitch('users')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#243B7A',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Plus size={14} />
              <span>Add / Assign Teacher</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {users.filter((u) => u.role.toLowerCase() === 'teacher' || u.role.toLowerCase() === 'faculty').length > 0 ? (
              users
                .filter((u) => u.role.toLowerCase() === 'teacher' || u.role.toLowerCase() === 'faculty')
                .map((teacher) => (
                  <div
                    key={teacher.id}
                    style={{
                      padding: '18px',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid #E2E8F0',
                      backgroundColor: '#F8FAFC',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, backgroundColor: '#DCFCE7', color: '#166534', padding: '2px 8px', borderRadius: '4px' }}>
                            FACULTY
                          </span>
                          <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                            {teacher.email}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteUser(teacher.id, teacher.name)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#EF4444',
                            cursor: 'pointer',
                            padding: '4px',
                          }}
                          title="Remove faculty member"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#172554', marginBottom: '4px' }}>
                        {teacher.name}
                      </h3>
                      <p style={{ fontSize: '0.82rem', color: '#64748B', marginBottom: '10px' }}>
                        Staff ID: {teacher.teacherId || teacher.studentId || teacher.id.slice(0, 8)}
                      </p>

                      <div style={{ fontSize: '0.78rem', color: '#172033', fontWeight: 700 }}>
                        Assigned Course & Section:
                      </div>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                        {teacher.course ? (
                          <span style={{ backgroundColor: '#EEF2FB', color: '#243B7A', padding: '3px 9px', borderRadius: '6px', fontSize: '0.76rem', fontWeight: 700 }}>
                            {teacher.course} {teacher.section ? `(${teacher.section})` : ''}
                          </span>
                        ) : (
                          <span style={{ backgroundColor: '#FEF3C7', color: '#B45309', padding: '3px 8px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 600 }}>
                            All Classes
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
            ) : (
              <div style={{ padding: '32px', textAlign: 'center', gridColumn: '1 / -1', color: '#64748B' }}>
                <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>No faculty members created yet.</p>
                <p style={{ fontSize: '0.82rem', marginTop: '4px' }}>Use the Users & Roles form to create and assign teachers.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB D: SUBJECT MANAGEMENT (Only Admin Can Add Courses - Credits System Removed) */}
      {activeAdminTab === 'subjects' && (
        <div className="vs-card" style={{ padding: '24px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#172554', margin: 0 }}>
                Course Catalog & Curriculum Codes ({subjectsList.length})
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '4px 0 0 0' }}>
                Active curriculum courses. Credits system disabled. Only Administrator can add or remove courses.
              </p>
            </div>
            <button
              onClick={() => setIsAddCourseModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#243B7A',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: '9px 16px',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(36, 59, 122, 0.2)',
              }}
            >
              <Plus size={15} />
              <span>Add New Course</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            {subjectsList.map((sub) => (
              <div
                key={sub.code}
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #E2E8F0',
                  backgroundColor: '#F8FAFC',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#243B7A', backgroundColor: '#EEF2FB', padding: '2px 8px', borderRadius: '6px' }}>
                      {sub.code}
                    </span>
                    <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>Semester {sub.sem}</span>
                  </div>
                  <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#172554', marginBottom: '4px' }}>
                    {sub.name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B' }}>{sub.dept}</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px', borderTop: '1px solid #E2E8F0', paddingTop: '10px' }}>
                  <button
                    onClick={() => {
                      setWebsiteDeleteModal({
                        isOpen: true,
                        type: 'subject',
                        id: sub.code,
                        name: sub.name,
                        title: 'Delete Course',
                        message: `Are you sure you want to remove '${sub.code} — ${sub.name}' from the institutional catalog?`,
                      });
                    }}
                    style={{
                      background: 'none',
                      border: '1px solid #FCA5A5',
                      borderRadius: '6px',
                      color: '#DC2626',
                      padding: '4px 10px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    title="Remove course"
                  >
                    <Trash2 size={13} />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Course Modal */}
          {isAddCourseModalOpen && (
            <div className="vs-modal-backdrop" style={{ zIndex: 1100 }}>
              <div
                className="vs-card"
                style={{
                  maxWidth: '480px',
                  width: '100%',
                  backgroundColor: '#FFFFFF',
                  padding: '24px',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: '0 20px 35px -10px rgba(23, 37, 84, 0.25)',
                  border: '1px solid #E2E8F0',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#172554', margin: 0 }}>
                    Add Institutional Course
                  </h3>
                  <button
                    onClick={() => setIsAddCourseModalOpen(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
                  >
                    <X size={18} />
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!courseForm.code.trim() || !courseForm.name.trim()) return;
                    setSubjectsList((prev) => [
                      ...prev,
                      {
                        code: courseForm.code.trim().toUpperCase(),
                        name: courseForm.name.trim(),
                        sem: Number(courseForm.sem),
                        dept: courseForm.dept,
                      },
                    ]);
                    setNotification({
                      type: 'success',
                      message: `Course '${courseForm.code.toUpperCase()}' added successfully.`,
                    });
                    setCourseForm({ code: '', name: '', sem: 1, dept: 'Computer Science & Engineering' });
                    setIsAddCourseModalOpen(false);
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#172033', marginBottom: '4px' }}>
                        Course Code *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., CS401 or IT305"
                        value={courseForm.code}
                        onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid #CBD5E1', fontSize: '0.86rem' }}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#172033', marginBottom: '4px' }}>
                        Course Title *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Cloud Computing & DevOps"
                        value={courseForm.name}
                        onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid #CBD5E1', fontSize: '0.86rem' }}
                        required
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#172033', marginBottom: '4px' }}>
                          Semester *
                        </label>
                        <select
                          value={courseForm.sem}
                          onChange={(e) => setCourseForm({ ...courseForm, sem: Number(e.target.value) })}
                          style={{ width: '100%' }}
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                            <option key={s} value={s}>
                              Semester {s}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#172033', marginBottom: '4px' }}>
                          Department *
                        </label>
                        <select
                          value={courseForm.dept}
                          onChange={(e) => setCourseForm({ ...courseForm, dept: e.target.value })}
                          style={{ width: '100%' }}
                        >
                          <option value="Computer Science & Engineering">CSE</option>
                          <option value="Information Technology">IT</option>
                          <option value="Electronics & Communication">ECE</option>
                          <option value="Mechanical Engineering">Mech</option>
                          <option value="Civil Engineering">Civil</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setIsAddCourseModalOpen(false)}
                      style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#64748B', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={{ padding: '8px 18px', borderRadius: 'var(--radius-md)', border: 'none', background: '#243B7A', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Add Course
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB E: SECTION/CLASS MANAGEMENT (Only Admin Can Add or Remove) */}
      {activeAdminTab === 'sections' && (
        <div className="vs-card" style={{ padding: '24px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#172554', margin: 0 }}>
                Classroom & Section Cohorts ({sectionsList.length})
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '4px 0 0 0' }}>
                Active section cohorts. Only Administrator has permissions to add or remove class sections.
              </p>
            </div>
            <button
              onClick={() => setIsAddSectionModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#243B7A',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: '9px 16px',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(36, 59, 122, 0.2)',
              }}
            >
              <Plus size={15} />
              <span>Add New Section</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
            {sectionsList.map((cls) => (
              <div
                key={cls.sec}
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #E2E8F0',
                  backgroundColor: '#F8FAFC',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#172554' }}>
                      Section {cls.sec}
                    </div>
                    <span style={{ fontSize: '0.74rem', backgroundColor: '#EEF2FB', color: '#243B7A', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                      Max: {cls.capacity}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', marginBottom: '8px' }}>{cls.dept}</div>
                  <div style={{ fontSize: '0.78rem', color: '#243B7A', fontWeight: 600 }}>
                    Location: {cls.room}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px', borderTop: '1px solid #E2E8F0', paddingTop: '10px' }}>
                  <button
                    onClick={() => {
                      setWebsiteDeleteModal({
                        isOpen: true,
                        type: 'section',
                        id: cls.sec,
                        name: `Section ${cls.sec}`,
                        title: 'Delete Class Section',
                        message: `Are you sure you want to remove '${cls.sec}' from the institutional active sections?`,
                      });
                    }}
                    style={{
                      background: 'none',
                      border: '1px solid #FCA5A5',
                      borderRadius: '6px',
                      color: '#DC2626',
                      padding: '4px 10px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    title="Remove section"
                  >
                    <Trash2 size={13} />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Section Modal */}
          {isAddSectionModalOpen && (
            <div className="vs-modal-backdrop" style={{ zIndex: 1100 }}>
              <div
                className="vs-card"
                style={{
                  maxWidth: '460px',
                  width: '100%',
                  backgroundColor: '#FFFFFF',
                  padding: '24px',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: '0 20px 35px -10px rgba(23, 37, 84, 0.25)',
                  border: '1px solid #E2E8F0',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#172554', margin: 0 }}>
                    Add Class Section
                  </h3>
                  <button
                    onClick={() => setIsAddSectionModalOpen(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
                  >
                    <X size={18} />
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!sectionForm.sec.trim()) return;
                    setSectionsList((prev) => [
                      ...prev,
                      {
                        sec: sectionForm.sec.trim().toUpperCase(),
                        dept: sectionForm.dept,
                        room: sectionForm.room.trim() || 'Hall 301',
                        capacity: Number(sectionForm.capacity) || 60,
                      },
                    ]);
                    setNotification({
                      type: 'success',
                      message: `Section '${sectionForm.sec.toUpperCase()}' added successfully.`,
                    });
                    setSectionForm({ sec: '', dept: 'Computer Science & Engineering', room: 'Hall 301', capacity: 60 });
                    setIsAddSectionModalOpen(false);
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#172033', marginBottom: '4px' }}>
                        Section Code / Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., CSE-C or IT-C"
                        value={sectionForm.sec}
                        onChange={(e) => setSectionForm({ ...sectionForm, sec: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid #CBD5E1', fontSize: '0.86rem' }}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#172033', marginBottom: '4px' }}>
                        Department *
                      </label>
                      <select
                        value={sectionForm.dept}
                        onChange={(e) => setSectionForm({ ...sectionForm, dept: e.target.value })}
                        style={{ width: '100%' }}
                      >
                        <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                        <option value="Information Technology">Information Technology</option>
                        <option value="Electronics & Communication">Electronics & Communication</option>
                        <option value="Mechanical Engineering">Mechanical Engineering</option>
                        <option value="Civil Engineering">Civil Engineering</option>
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#172033', marginBottom: '4px' }}>
                          Room / Location
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., Hall 303"
                          value={sectionForm.room}
                          onChange={(e) => setSectionForm({ ...sectionForm, room: e.target.value })}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid #CBD5E1', fontSize: '0.86rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#172033', marginBottom: '4px' }}>
                          Capacity
                        </label>
                        <input
                          type="number"
                          value={sectionForm.capacity}
                          onChange={(e) => setSectionForm({ ...sectionForm, capacity: Number(e.target.value) })}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid #CBD5E1', fontSize: '0.86rem' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setIsAddSectionModalOpen(false)}
                      style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#64748B', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={{ padding: '8px 18px', borderRadius: 'var(--radius-md)', border: 'none', background: '#243B7A', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Add Section
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB F: TIMETABLE MANAGEMENT */}
      {activeAdminTab === 'timetable' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header & Cohort Selection */}
          <div className="vs-card" style={{ padding: '24px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#172554', marginBottom: '4px' }}>
                  Institutional Course & Section Timetable
                </h2>
                <p style={{ fontSize: '0.84rem', color: '#64748B' }}>
                  Configure day-wise lecture schedules per course, semester, and section.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleOpenTimetableModal()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#243B7A',
                  color: '#FFFFFF',
                  padding: '10px 18px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(36, 59, 122, 0.2)',
                }}
              >
                <Plus size={16} />
                <span>Add Schedule Entry</span>
              </button>
            </div>

            {/* Cohort Selector: Course, Semester, Section */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '14px',
                padding: '16px',
                backgroundColor: '#F8FAFC',
                borderRadius: 'var(--radius-md)',
                border: '1px solid #E2E8F0',
                marginBottom: '20px',
              }}
            >
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Course / Degree Program
                </label>
                <select
                  value={timetableCohort.course}
                  onChange={(e) => setTimetableCohort({ ...timetableCohort, course: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    backgroundColor: '#FFFFFF',
                    color: '#172033',
                  }}
                >
                  <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electronics & Communication Engineering">Electronics & Communication</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Semester / Year
                </label>
                <select
                  value={timetableCohort.semester}
                  onChange={(e) => setTimetableCohort({ ...timetableCohort, semester: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    backgroundColor: '#FFFFFF',
                    color: '#172033',
                  }}
                >
                  <option value={1}>Semester 1 (Year 1)</option>
                  <option value={2}>Semester 2 (Year 1)</option>
                  <option value={3}>Semester 3 (Year 2)</option>
                  <option value={4}>Semester 4 (Year 2)</option>
                  <option value={5}>Semester 5 (Year 3)</option>
                  <option value={6}>Semester 6 (Year 3)</option>
                  <option value={7}>Semester 7 (Year 4)</option>
                  <option value={8}>Semester 8 (Year 4)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Section / Batch
                </label>
                <select
                  value={timetableCohort.section}
                  onChange={(e) => setTimetableCohort({ ...timetableCohort, section: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    backgroundColor: '#FFFFFF',
                    color: '#172033',
                  }}
                >
                  <option value="CSE-A">CSE-A</option>
                  <option value="CSE-B">CSE-B</option>
                  <option value="IT-A">IT-A</option>
                  <option value="IT-B">IT-B</option>
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                </select>
              </div>
            </div>

            {/* Day Filter Pills */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '16px' }}>
              {['All', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => {
                const count = day === 'All' ? timetableEntries.length : timetableEntries.filter((e) => e.day === day).length;
                const isSelected = selectedTimetableDay === day;
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedTimetableDay(day)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      border: isSelected ? '1px solid #243B7A' : '1px solid #E2E8F0',
                      backgroundColor: isSelected ? '#243B7A' : '#FFFFFF',
                      color: isSelected ? '#FFFFFF' : '#475569',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span>{day}</span>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        padding: '1px 6px',
                        borderRadius: '10px',
                        backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.25)' : '#F1F5F9',
                        color: isSelected ? '#FFFFFF' : '#64748B',
                      }}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Entries Display */}
            {isLoadingTimetable ? (
              <div style={{ padding: '36px', textAlign: 'center', color: '#64748B' }}>
                <Clock size={28} className="animate-spin" style={{ margin: '0 auto 8px', color: '#243B7A' }} />
                <p style={{ fontSize: '0.85rem' }}>Loading cohort timetable...</p>
              </div>
            ) : timetableEntries.filter((e) => selectedTimetableDay === 'All' || e.day === selectedTimetableDay).length === 0 ? (
              <div
                style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  backgroundColor: '#F8FAFC',
                  borderRadius: 'var(--radius-md)',
                  border: '1px dashed #CBD5E1',
                }}
              >
                <Clock size={32} color="#94A3B8" style={{ margin: '0 auto 12px' }} />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#172554', marginBottom: '4px' }}>
                  No Timetable Entries Found
                </h4>
                <p style={{ fontSize: '0.82rem', color: '#64748B', maxWidth: '420px', margin: '0 auto 16px' }}>
                  No classes scheduled for {timetableCohort.course} • Sem {timetableCohort.semester} ({timetableCohort.section})
                  {selectedTimetableDay !== 'All' ? ` on ${selectedTimetableDay}` : ''}.
                </p>
                <button
                  type="button"
                  onClick={() => handleOpenTimetableModal()}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#243B7A',
                    color: '#FFFFFF',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={14} />
                  <span>Add First Entry</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {timetableEntries
                  .filter((e) => selectedTimetableDay === 'All' || e.day === selectedTimetableDay)
                  .map((entry) => (
                    <div
                      key={entry.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 18px',
                        backgroundColor: '#FFFFFF',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                        flexWrap: 'wrap',
                        gap: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: '1 1 300px' }}>
                        <div
                          style={{
                            padding: '8px 12px',
                            backgroundColor: '#EEF2FB',
                            borderRadius: '8px',
                            textAlign: 'center',
                            minWidth: '90px',
                          }}
                        >
                          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#243B7A', textTransform: 'uppercase' }}>
                            {entry.day}
                          </div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#172554', marginTop: '2px' }}>
                            {entry.startTime}
                          </div>
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#172554' }}>
                              {entry.subject}
                            </span>
                            {entry.subjectCode && (
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  backgroundColor: '#F1F5F9',
                                  color: '#475569',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                }}
                              >
                                {entry.subjectCode}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', fontSize: '0.76rem', color: '#64748B', flexWrap: 'wrap' }}>
                            <span>Faculty: <strong style={{ color: '#172033' }}>{entry.teacherName}</strong></span>
                            <span>•</span>
                            <span>Room: <strong style={{ color: '#172033' }}>{entry.room}</strong></span>
                            <span>•</span>
                            <span>To: <strong>{entry.endTime}</strong></span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span
                          style={{
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            backgroundColor: '#FEF3C7',
                            color: '#92400E',
                            padding: '3px 8px',
                            borderRadius: '6px',
                          }}
                        >
                          {entry.section}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleOpenTimetableModal(entry)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid #CBD5E1',
                            backgroundColor: '#FFFFFF',
                            color: '#243B7A',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          <Pencil size={12} />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteTimetableEntry(entry.id, entry.subject)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid #FCA5A5',
                            backgroundColor: '#FEF2F2',
                            color: '#DC2626',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          <Trash2 size={12} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Add / Edit Timetable Modal */}
          {isTimetableModalOpen && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.65)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '16px',
              }}
            >
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  maxWidth: '520px',
                  width: '100%',
                  padding: '24px',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#172554', margin: 0 }}>
                      {editingTimetableEntry ? 'Edit Timetable Entry' : 'Add Timetable Entry'}
                    </h3>
                    <p style={{ fontSize: '0.76rem', color: '#64748B', marginTop: '2px' }}>
                      {timetableCohort.course} • Sem {timetableCohort.semester} ({timetableCohort.section})
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsTimetableModalOpen(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#64748B',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSaveTimetableEntry}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                        Subject Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Distributed Operating Systems"
                        value={timetableForm.subject}
                        onChange={(e) => setTimetableForm({ ...timetableForm, subject: e.target.value })}
                        required
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                        Subject Code
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. CS601"
                        value={timetableForm.subjectCode}
                        onChange={(e) => setTimetableForm({ ...timetableForm, subjectCode: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                        Day of Week *
                      </label>
                      <select
                        value={timetableForm.day}
                        onChange={(e) => setTimetableForm({ ...timetableForm, day: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                      >
                        <option value="Monday">Monday</option>
                        <option value="Tuesday">Tuesday</option>
                        <option value="Wednesday">Wednesday</option>
                        <option value="Thursday">Thursday</option>
                        <option value="Friday">Friday</option>
                        <option value="Saturday">Saturday</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                        Start Time *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 09:00 AM"
                        value={timetableForm.startTime}
                        onChange={(e) => setTimetableForm({ ...timetableForm, startTime: e.target.value })}
                        required
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                        End Time *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 10:00 AM"
                        value={timetableForm.endTime}
                        onChange={(e) => setTimetableForm({ ...timetableForm, endTime: e.target.value })}
                        required
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                      />
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                        Assigned Faculty / Teacher *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Dr. Ramesh Verma"
                        value={timetableForm.teacherName}
                        onChange={(e) => setTimetableForm({ ...timetableForm, teacherName: e.target.value })}
                        required
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                      />
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                        Room / Hall / Lab *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Hall 301 / Lab 4"
                        value={timetableForm.room}
                        onChange={(e) => setTimetableForm({ ...timetableForm, room: e.target.value })}
                        required
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                    <button
                      type="button"
                      onClick={() => setIsTimetableModalOpen(false)}
                      style={{
                        padding: '9px 16px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        backgroundColor: '#FFFFFF',
                        color: '#475569',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={{
                        padding: '9px 20px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: '#243B7A',
                        color: '#FFFFFF',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {editingTimetableEntry ? 'Save Changes' : 'Create Entry'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB H: USER & ROLE MANAGEMENT (Side-by-Side: Add User on Left, Directory on Right) */}
      {activeAdminTab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(330px, 390px) 1fr',
              gap: '24px',
              alignItems: 'start',
            }}
          >
            {/* LEFT COLUMN: Add New User Form */}
            <div
              className="vs-card"
              style={{
                padding: '24px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 'var(--radius-lg)',
                position: 'sticky',
                top: '90px',
              }}
            >
              <h2 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#172554', marginBottom: '4px' }}>
                Create Institutional User
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#64748B', marginBottom: '20px' }}>
                Creates account in Supabase Auth & binds details in <code>public.profiles</code>.
              </p>

              <form onSubmit={handleCreateUser}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                  {/* Role Dropdown */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#172033', marginBottom: '4px' }}>
                      Role *
                    </label>
                    <select
                      value={userForm.role}
                      onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                      style={{ width: '100%', border: '2px solid #243B7A', fontWeight: 700, color: '#243B7A' }}
                      required
                    >
                      <option value="STUDENT">Student</option>
                      <option value="TEACHER">Teacher</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#172033', marginBottom: '4px' }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Rajesh Sharma"
                      value={userForm.name}
                      onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)', border: '1px solid #CBD5E1', fontSize: '0.86rem' }}
                      required
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#172033', marginBottom: '4px' }}>
                      Email * (@vidyasutra.edu.in)
                    </label>
                    <input
                      type="email"
                      placeholder="name@vidyasutra.edu.in"
                      value={userForm.email}
                      onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)', border: '1px solid #CBD5E1', fontSize: '0.86rem' }}
                      required
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#172033', marginBottom: '4px' }}>
                      Password *
                    </label>
                    <input
                      type="password"
                      placeholder="Password@123"
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)', border: '1px solid #CBD5E1', fontSize: '0.86rem' }}
                      required
                    />
                  </div>

                  {/* Role-Specific Fields */}
                  {userForm.role.toUpperCase() === 'STUDENT' && (
                    <>
                      {/* Student Roll No */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#172033', marginBottom: '4px' }}>
                          Student Roll No *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., 24BCSE150"
                          value={userForm.rollNo}
                          onChange={(e) => setUserForm({ ...userForm, rollNo: e.target.value })}
                          style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)', border: '1px solid #CBD5E1', fontSize: '0.86rem' }}
                          required
                        />
                      </div>

                      {/* Course / Program */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#172033', marginBottom: '4px' }}>
                          Degree Program *
                        </label>
                        <select
                          value={userForm.course}
                          onChange={(e) => setUserForm({ ...userForm, course: e.target.value, department: e.target.value })}
                          style={{ width: '100%' }}
                          required
                        >
                          <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                          <option value="Information Technology">Information Technology</option>
                          <option value="Electronics & Communication Engineering">Electronics & Communication</option>
                          <option value="Mechanical Engineering">Mechanical Engineering</option>
                          <option value="Civil Engineering">Civil Engineering</option>
                        </select>
                      </div>

                      {/* Semester & Section */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#172033', marginBottom: '4px' }}>
                            Semester
                          </label>
                          <select
                            value={userForm.semester}
                            onChange={(e) => setUserForm({ ...userForm, semester: Number(e.target.value) })}
                            style={{ width: '100%' }}
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                              <option key={s} value={s}>
                                Sem {s}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#172033', marginBottom: '4px' }}>
                            Section
                          </label>
                          <select
                            value={userForm.section}
                            onChange={(e) => setUserForm({ ...userForm, section: e.target.value })}
                            style={{ width: '100%' }}
                          >
                            {sectionsList.map((sec) => (
                              <option key={sec.sec} value={sec.sec}>
                                {sec.sec}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </>
                  )}

                  {userForm.role.toUpperCase() === 'TEACHER' && (
                    <>
                      {/* Teacher Staff ID */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#172033', marginBottom: '4px' }}>
                          Teacher / Staff ID (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., FAC202501"
                          value={userForm.rollNo}
                          onChange={(e) => setUserForm({ ...userForm, rollNo: e.target.value })}
                          style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)', border: '1px solid #CBD5E1', fontSize: '0.86rem' }}
                        />
                      </div>

                      {/* Assign Course / Subject */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#172033', marginBottom: '4px' }}>
                          Assign Teacher to Course / Subject *
                        </label>
                        <select
                          value={userForm.course}
                          onChange={(e) => setUserForm({ ...userForm, course: e.target.value })}
                          style={{ width: '100%' }}
                          required
                        >
                          {subjectsList.map((sub) => (
                            <option key={sub.code} value={sub.code}>
                              {sub.code} — {sub.name}
                            </option>
                          ))}
                        </select>
                        <span style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '3px', display: 'block' }}>
                          Select curriculum course to allocate to this faculty member.
                        </span>
                      </div>

                      {/* Assign Section */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#172033', marginBottom: '4px' }}>
                          Assign Section *
                        </label>
                        <select
                          value={userForm.section}
                          onChange={(e) => setUserForm({ ...userForm, section: e.target.value })}
                          style={{ width: '100%' }}
                          required
                        >
                          {sectionsList.map((sec) => (
                            <option key={sec.sec} value={sec.sec}>
                              Section {sec.sec}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                  {/* ADMIN role: No course, section, semester, or ID fields! Only Name, Email, Password */}
                </div>

                <button
                  type="submit"
                  disabled={isCreatingUser}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: '100%',
                    backgroundColor: '#243B7A',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 18px',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    cursor: isCreatingUser ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 8px rgba(36, 59, 122, 0.25)',
                  }}
                >
                  <UserCheck size={18} />
                  <span>{isCreatingUser ? 'Synchronizing with Supabase...' : 'Create User'}</span>
                </button>
              </form>
            </div>

            {/* RIGHT COLUMN: Institutional Users Directory */}
            <div
              className="vs-card"
              style={{
                padding: '24px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#172554', margin: 0 }}>
                    Institutional Users Directory ({users.length})
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '3px 0 0 0' }}>
                    Live verified accounts synchronized across Supabase Auth and database records.
                  </p>
                </div>

                <button
                  onClick={fetchUsers}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#F1F5F9',
                    border: '1px solid #CBD5E1',
                    borderRadius: 'var(--radius-md)',
                    padding: '7px 12px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: '#172033',
                    cursor: 'pointer',
                  }}
                  title="Refresh users"
                >
                  <RefreshCw size={14} color="#64748B" />
                  <span>Refresh</span>
                </button>
              </div>

              {/* 3 Role Options: Show Students / Show Teachers / Show Admin (Default: Show Students) */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setUserRoleFilter('student')}
                  style={{
                    padding: '7px 18px',
                    borderRadius: '9999px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: 'none',
                    backgroundColor: userRoleFilter === 'student' ? '#243B7A' : '#F1F5F9',
                    color: userRoleFilter === 'student' ? '#FFFFFF' : '#475569',
                    boxShadow: userRoleFilter === 'student' ? '0 2px 8px rgba(36, 59, 122, 0.25)' : 'none',
                    transition: 'all 0.18s ease',
                  }}
                >
                  Show Students
                </button>
                <button
                  type="button"
                  onClick={() => setUserRoleFilter('teacher')}
                  style={{
                    padding: '7px 18px',
                    borderRadius: '9999px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: 'none',
                    backgroundColor: userRoleFilter === 'teacher' ? '#243B7A' : '#F1F5F9',
                    color: userRoleFilter === 'teacher' ? '#FFFFFF' : '#475569',
                    boxShadow: userRoleFilter === 'teacher' ? '0 2px 8px rgba(36, 59, 122, 0.25)' : 'none',
                    transition: 'all 0.18s ease',
                  }}
                >
                  Show Teachers
                </button>
                <button
                  type="button"
                  onClick={() => setUserRoleFilter('admin')}
                  style={{
                    padding: '7px 18px',
                    borderRadius: '9999px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: 'none',
                    backgroundColor: userRoleFilter === 'admin' ? '#243B7A' : '#F1F5F9',
                    color: userRoleFilter === 'admin' ? '#FFFFFF' : '#475569',
                    boxShadow: userRoleFilter === 'admin' ? '0 2px 8px rgba(36, 59, 122, 0.25)' : 'none',
                    transition: 'all 0.18s ease',
                  }}
                >
                  Show Admin
                </button>
              </div>

              {/* Filters Bar */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: '10px',
                  marginBottom: '18px',
                  padding: '12px',
                  backgroundColor: '#F8FAFC',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #E2E8F0',
                }}
              >
                <div style={{ position: 'relative' }}>
                  <Search size={15} color="#64748B" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                  <input
                    type="text"
                    placeholder="Search name, email, or ID..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 32px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.82rem',
                      backgroundColor: '#FFFFFF',
                    }}
                  />
                </div>

                <div>
                  <select
                    value={userCourseFilter}
                    onChange={(e) => setUserCourseFilter(e.target.value)}
                    style={{ width: '100%', fontSize: '0.8rem', padding: '7px 28px 7px 10px' }}
                  >
                    <option value="all">All Courses</option>
                    <option value="Computer Science & Engineering">CSE</option>
                    <option value="Information Technology">IT</option>
                    <option value="Electronics & Communication Engineering">ECE</option>
                    <option value="Mechanical Engineering">Mech</option>
                    <option value="Civil Engineering">Civil</option>
                  </select>
                </div>

                <div>
                  <select
                    value={userSectionFilter}
                    onChange={(e) => setUserSectionFilter(e.target.value)}
                    style={{ width: '100%', fontSize: '0.8rem', padding: '7px 28px 7px 10px' }}
                  >
                    <option value="all">All Sections</option>
                    <option value="CSE-A">CSE-A</option>
                    <option value="CSE-B">CSE-B</option>
                    <option value="IT-A">IT-A</option>
                    <option value="IT-B">IT-B</option>
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                </div>

                <div>
                  <select
                    value={userSemesterFilter}
                    onChange={(e) => setUserSemesterFilter(e.target.value)}
                    style={{ width: '100%', fontSize: '0.8rem', padding: '7px 28px 7px 10px' }}
                  >
                    <option value="all">All Semesters</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <option key={sem} value={sem}>
                        Sem {sem}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Users List with NO horizontal scrollbar! */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {isLoadingUsers ? (
                  <div style={{ padding: '36px', textAlign: 'center', color: '#64748B', fontSize: '0.86rem' }}>
                    Loading verified institutional users...
                  </div>
                ) : users.length > 0 ? (
                  users.map((u) => {
                    const roleLower = (u.role || '').toLowerCase();
                    const isStudent = roleLower === 'student';
                    const isTeacher = roleLower === 'teacher';
                    const isAdmin = roleLower === 'admin';

                    return (
                      <div
                        key={u.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '12px',
                          padding: '12px 14px',
                          backgroundColor: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          borderRadius: 'var(--radius-md)',
                          transition: 'background-color 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '220px', flex: 1 }}>
                          <div
                            style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '50%',
                              backgroundColor: isStudent ? '#EEF2FB' : isTeacher ? '#DCFCE7' : '#FEF3C7',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: isStudent ? '#243B7A' : isTeacher ? '#166534' : '#92400E',
                              fontWeight: 800,
                              fontSize: '0.82rem',
                              flexShrink: 0,
                            }}
                          >
                            {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#172033' }}>{u.name}</span>
                              <span
                                style={{
                                  padding: '2px 7px',
                                  borderRadius: '5px',
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  backgroundColor: isStudent ? '#EEF2FB' : isTeacher ? '#DCFCE7' : '#FEF3C7',
                                  color: isStudent ? '#243B7A' : isTeacher ? '#166534' : '#92400E',
                                }}
                              >
                                {u.role}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.78rem', color: '#64748B', fontFamily: 'monospace' }}>
                              {u.email}
                            </span>
                          </div>
                        </div>

                        {/* Cohort Badges */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          {u.course && (
                            <span style={{ fontSize: '0.74rem', backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', padding: '2px 7px', borderRadius: '4px', color: '#334155' }}>
                              {u.course.length > 22 ? u.course.slice(0, 20) + '…' : u.course}
                            </span>
                          )}
                          {u.semester != null && (
                            <span style={{ fontSize: '0.74rem', backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', padding: '2px 6px', borderRadius: '4px', color: '#334155' }}>
                              Sem {u.semester}
                            </span>
                          )}
                          {u.section && (
                            <span style={{ fontSize: '0.74rem', backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', padding: '2px 6px', borderRadius: '4px', color: '#334155', fontWeight: 600 }}>
                              {u.section}
                            </span>
                          )}
                          {(u.studentId || u.teacherId) && (
                            <span style={{ fontSize: '0.74rem', backgroundColor: '#EEF2FB', color: '#243B7A', padding: '2px 7px', borderRadius: '4px', fontWeight: 700, fontFamily: 'monospace' }}>
                              {u.studentId || u.teacherId}
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => handleOpenEditUserModal(u)}
                            style={{
                              background: '#FFFFFF',
                              border: '1px solid #CBD5E1',
                              borderRadius: '6px',
                              color: '#243B7A',
                              cursor: 'pointer',
                              padding: '5px 9px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                            }}
                            title="Edit user details"
                          >
                            <Pencil size={12} />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            style={{
                              background: '#FFFFFF',
                              border: '1px solid #FCA5A5',
                              borderRadius: '6px',
                              color: '#DC2626',
                              cursor: 'pointer',
                              padding: '5px 9px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                            }}
                            title="Delete user"
                          >
                            <Trash2 size={12} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ padding: '36px', textAlign: 'center', color: '#64748B', fontSize: '0.86rem' }}>
                    No institutional users match the selected query or filters.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Edit User Profile Modal */}
          {isEditUserModalOpen && editingUser && (
            <div className="vs-modal-backdrop" style={{ zIndex: 1100 }}>
              <div
                className="vs-card"
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 'var(--radius-lg)',
                  padding: '24px',
                  width: '100%',
                  maxWidth: '520px',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
                  border: '1px solid #E2E8F0',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#172554', margin: 0 }}>
                      Edit User Profile
                    </h3>
                    <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                      {editingUser.email}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setIsEditUserModalOpen(false);
                      setEditingUser(null);
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSaveEditUser}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#172033', marginBottom: '4px' }}>
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={editUserForm.name}
                        onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid #CBD5E1', fontSize: '0.86rem' }}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#172033', marginBottom: '4px' }}>
                        Role *
                      </label>
                      <select
                        value={editUserForm.role}
                        onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value })}
                        style={{ width: '100%' }}
                        required
                      >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#172033', marginBottom: '4px' }}>
                        ID / Roll Number
                      </label>
                      <input
                        type="text"
                        value={editUserForm.idNumber}
                        onChange={(e) => setEditUserForm({ ...editUserForm, idNumber: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid #CBD5E1', fontSize: '0.86rem' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#172033', marginBottom: '4px' }}>
                          Course
                        </label>
                        <select
                          value={editUserForm.course}
                          onChange={(e) => setEditUserForm({ ...editUserForm, course: e.target.value })}
                          style={{ width: '100%' }}
                        >
                          <option value="Computer Science & Engineering">CSE</option>
                          <option value="Information Technology">IT</option>
                          <option value="Electronics & Communication Engineering">ECE</option>
                          <option value="Mechanical Engineering">Mech</option>
                          <option value="Civil Engineering">Civil</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#172033', marginBottom: '4px' }}>
                          Semester
                        </label>
                        <select
                          value={editUserForm.semester}
                          onChange={(e) => setEditUserForm({ ...editUserForm, semester: Number(e.target.value) })}
                          style={{ width: '100%' }}
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                            <option key={s} value={s}>
                              Semester {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#172033', marginBottom: '4px' }}>
                        Section
                      </label>
                      <select
                        value={editUserForm.section}
                        onChange={(e) => setEditUserForm({ ...editUserForm, section: e.target.value })}
                        style={{ width: '100%' }}
                      >
                        <option value="CSE-A">CSE-A</option>
                        <option value="CSE-B">CSE-B</option>
                        <option value="IT-A">IT-A</option>
                        <option value="IT-B">IT-B</option>
                        <option value="A">Section A</option>
                        <option value="B">Section B</option>
                        <option value="C">Section C</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditUserModalOpen(false);
                        setEditingUser(null);
                      }}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid #CBD5E1',
                        background: '#FFFFFF',
                        color: '#64748B',
                        fontSize: '0.86rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdatingUser}
                      style={{
                        padding: '8px 18px',
                        borderRadius: 'var(--radius-md)',
                        border: 'none',
                        background: '#243B7A',
                        color: '#FFFFFF',
                        fontSize: '0.86rem',
                        fontWeight: 700,
                        cursor: isUpdatingUser ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {isUpdatingUser ? 'Saving...' : 'Save Profile Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Universal In-Website Delete Confirmation Modal (Replaces browser popups) */}
      {websiteDeleteModal.isOpen && (
        <div className="vs-modal-backdrop" style={{ zIndex: 1200 }}>
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
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
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
                  {websiteDeleteModal.title || 'Confirm Deletion'}
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#64748B', margin: 0 }}>
                  Administrative confirmation
                </p>
              </div>
            </div>

            <p style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.5, marginBottom: '22px' }}>
              {websiteDeleteModal.message}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setWebsiteDeleteModal({ ...websiteDeleteModal, isOpen: false })}
                disabled={isExecutingDelete}
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
                onClick={handleConfirmWebsiteDelete}
                disabled={isExecutingDelete}
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
                <span>{isExecutingDelete ? 'Deleting...' : 'Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
