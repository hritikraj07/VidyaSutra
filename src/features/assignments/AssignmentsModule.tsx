'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Calendar,
  Sparkles,
  Award,
  Plus,
  X,
  FileCheck,
  Paperclip,
  Check,
  BookOpen,
  Send,
} from 'lucide-react';
import { Assignment } from '@/types';

export const AssignmentsModule: React.FC = () => {
  const { assignments, submitAssignment, addAssignment, currentUser, activeRole } = useApp();
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted'>('all');

  // Role detection
  const roleLower = (currentUser?.role || activeRole || '').toLowerCase();
  const isTeacher = roleLower === 'teacher' || roleLower === 'faculty' || roleLower === 'staff';

  // Teacher Create Assignment Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('Data Structures & Algorithms');
  const [newCode, setNewCode] = useState('CS301');
  const [newSection, setNewSection] = useState('CSE-A');
  const [newDueDate, setNewDueDate] = useState(() => new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
  const [newDueTime, setNewDueTime] = useState('23:59');
  const [newMaxMarks, setNewMaxMarks] = useState(50);

  // Student Submit Assignment Modal State
  const [submittingAssignment, setSubmittingAssignment] = useState<Assignment | null>(null);
  const [studentFileName, setStudentFileName] = useState<string | null>(null);
  const [studentComments, setStudentComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    addAssignment({
      title: newTitle.trim(),
      subject: newSubject,
      code: newCode,
      dueDate: newDueDate,
      dueTime: newDueTime,
      daysRemaining: 5,
      status: 'pending',
      maxMarks: Number(newMaxMarks) || 50,
      behavior: {
        openedAt: 'Just now',
        startedAt: undefined,
        submittedAt: undefined,
        punctuality: 'early',
      },
    });

    setIsCreateModalOpen(false);
    setNewTitle('');
    showToast(`✅ Assignment "${newTitle.trim()}" published for class ${newSection}!`);
  };

  const handleConfirmStudentSubmit = () => {
    if (!submittingAssignment) return;
    setIsSubmitting(true);
    setTimeout(() => {
      submitAssignment(submittingAssignment.id);
      setIsSubmitting(false);
      setSubmittingAssignment(null);
      setStudentFileName(null);
      setStudentComments('');
      showToast(`🎉 Assignment "${submittingAssignment.title}" submitted successfully!`);
    }, 400);
  };

  const filteredAssignments = assignments.filter((a) => {
    if (filter === 'pending') return a.status === 'pending';
    if (filter === 'submitted') return a.status === 'submitted' || a.status === 'graded';
    return true;
  });

  return (
    <div style={{ width: '100%', padding: '16px 28px' }}>
      {/* 1. Header Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#243B7A',
                backgroundColor: '#EEF2FB',
                border: '1px solid #D6E0F5',
                padding: '2px 8px',
                borderRadius: '6px',
                textTransform: 'uppercase',
              }}
            >
              {isTeacher ? 'Faculty Coursework Management' : 'Academic Coursework'}
            </span>
          </div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#172554', margin: 0 }}>
            {isTeacher ? 'Class Assignments & Problem Sets' : 'My Coursework & Submissions'}
          </h1>
          <p style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '2px' }}>
            {isTeacher
              ? 'Post problem sets, laboratory exercises, and review student submission telemetry.'
              : 'Track deadlines, review submission punctuality, and upload work.'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Teacher Upload / Create Button */}
          {isTeacher && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#243B7A',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: '9px 16px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(36, 59, 122, 0.25)',
              }}
            >
              <Plus size={16} />
              <span>Post New Assignment</span>
            </button>
          )}

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['all', 'pending', 'submitted'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${filter === tab ? '#243B7A' : '#CBD5E1'}`,
                  backgroundColor: filter === tab ? '#243B7A' : '#FFFFFF',
                  color: filter === tab ? '#FFFFFF' : '#172033',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab === 'all' ? 'All' : tab === 'pending' ? 'Pending' : 'Submitted'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Behavioral Insights Banner */}
      <div
        className="vs-card"
        style={{
          background: 'linear-gradient(135deg, #FFFBEB 0%, #FFFFFF 100%)',
          border: '1px solid #FDE68A',
          marginBottom: '20px',
          padding: '16px 20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Sparkles size={16} color="#B45309" />
          <h3 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#B45309', margin: 0 }}>
            {isTeacher ? 'Pedagogical Telemetry Tracking' : 'Submission Behavior Telemetry'}
          </h3>
        </div>
        <p style={{ fontSize: '0.78rem', color: '#64748B', lineHeight: 1.45, margin: 0 }}>
          {isTeacher
            ? 'VidyaSutra tracks pacing telemetry (when assignments are opened vs. submitted). Consistent early pacing correlates directly with higher Success Scores and lower academic risk.'
            : 'Starting assignments earlier directly contributes to your Student Success Score and demonstrates disciplined academic pacing.'}
        </p>
      </div>

      {/* 3. Assignment Cards List */}
      {filteredAssignments.length === 0 ? (
        <div
          className="vs-card"
          style={{
            textAlign: 'center',
            padding: '48px 24px',
            backgroundColor: '#FFFFFF',
            border: '1.5px dashed #CBD5E1',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              backgroundColor: '#EEF2FB',
              color: '#243B7A',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px',
            }}
          >
            <CheckCircle2 size={24} />
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#172554', marginBottom: '4px' }}>
            No Coursework In This View
          </h3>
          <p style={{ fontSize: '0.82rem', color: '#64748B', maxWidth: '420px', margin: '0 auto' }}>
            {isTeacher
              ? 'Click "Post New Assignment" to distribute a problem set or laboratory exercise to your students.'
              : 'You are completely caught up! New problem sets and exercises will appear here when posted by faculty.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredAssignments.map((assignment) => {
            const isPending = assignment.status === 'pending';
            const isDueToday = assignment.dueDate === 'Today';

            return (
              <div
                key={assignment.id}
                className="vs-card vs-card-hover"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
                  border: '1px solid #E2E8F0',
                  borderLeft: `5px solid ${
                    isDueToday ? '#DC2626' : isPending ? '#E7A23B' : '#15803D'
                  }`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#243B7A' }}>
                        {assignment.code} • {assignment.subject}
                      </span>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          backgroundColor:
                            assignment.status === 'graded'
                              ? '#DCFCE7'
                              : isPending
                              ? '#FEF3C7'
                              : '#DBEAFE',
                          color:
                            assignment.status === 'graded'
                              ? '#15803D'
                              : isPending
                              ? '#B45309'
                              : '#1D4ED8',
                        }}
                      >
                        {assignment.status === 'graded'
                          ? `Graded (${assignment.scoredMarks}/${assignment.maxMarks})`
                          : assignment.status.toUpperCase()}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.08rem', fontWeight: 800, color: '#172554', margin: 0 }}>
                      {assignment.title}
                    </h3>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: isDueToday ? '#DC2626' : '#1E293B',
                      }}
                    >
                      <Clock size={15} />
                      <span>
                        Due: {assignment.dueDate}, {assignment.dueTime}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '2px' }}>
                      Max marks: {assignment.maxMarks}
                    </div>
                  </div>
                </div>

                {/* Behavioral Analytics Row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '14px',
                    padding: '10px 14px',
                    backgroundColor: '#F8FAFC',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.76rem',
                    color: '#64748B',
                  }}
                >
                  <div>
                    Opened: <strong>{assignment.behavior.openedAt || 'Not opened'}</strong>
                  </div>
                  <div>•</div>
                  <div>
                    Started: <strong>{assignment.behavior.startedAt || 'In progress'}</strong>
                  </div>
                  <div>•</div>
                  <div>
                    Pacing:{' '}
                    <span
                      style={{
                        fontWeight: 700,
                        color:
                          assignment.behavior.punctuality === 'early'
                            ? '#15803D'
                            : assignment.behavior.punctuality === 'last_minute'
                            ? '#DC2626'
                            : '#243B7A',
                      }}
                    >
                      {assignment.behavior.punctuality.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  {assignment.behavior.submittedAt && (
                    <>
                      <div>•</div>
                      <div style={{ color: '#15803D' }}>
                        Submitted: <strong>{assignment.behavior.submittedAt}</strong>
                      </div>
                    </>
                  )}
                </div>

                {/* Action Buttons */}
                {!isTeacher && isPending && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                    <button
                      onClick={() => setSubmittingAssignment(assignment)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 18px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        backgroundColor: '#243B7A',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(36, 59, 122, 0.25)',
                      }}
                    >
                      <Upload size={14} />
                      <span>Upload & Submit Assignment</span>
                    </button>
                  </div>
                )}

                {isTeacher && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.74rem', color: '#15803D', fontWeight: 700 }}>
                      ● Active Classroom Submission Window
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Teacher Create Assignment Modal */}
      {isCreateModalOpen && (
        <div className="vs-modal-backdrop" onClick={() => setIsCreateModalOpen(false)}>
          <div
            className="vs-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '560px',
              padding: '24px',
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-xl)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#EEF2FB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#243B7A' }}>
                  <Plus size={18} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#172554', margin: 0 }}>
                    Post New Class Assignment
                  </h2>
                  <p style={{ fontSize: '0.76rem', color: '#64748B', margin: 0 }}>
                    Distribute coursework to enrolled students
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#172033', marginBottom: '6px' }}>
                    Assignment Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Lab Exercise 4: Binary Search Trees Implementation"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#172033', marginBottom: '6px' }}>
                      Subject / Course *
                    </label>
                    <select
                      value={newCode}
                      onChange={(e) => {
                        const code = e.target.value;
                        setNewCode(code);
                        if (code === 'CS301') setNewSubject('Data Structures & Algorithms');
                        else if (code === 'CS302') setNewSubject('Database Management Systems');
                        else if (code === 'CS303') setNewSubject('Operating Systems');
                      }}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', outline: 'none', backgroundColor: '#FFFFFF' }}
                    >
                      <option value="CS301">CS301 — Data Structures</option>
                      <option value="CS302">CS302 — Database Systems</option>
                      <option value="CS303">CS303 — Operating Systems</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#172033', marginBottom: '6px' }}>
                      Target Section *
                    </label>
                    <select
                      value={newSection}
                      onChange={(e) => setNewSection(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', outline: 'none', backgroundColor: '#FFFFFF' }}
                    >
                      <option value="CSE-A">CSE-A</option>
                      <option value="CSE-B">CSE-B</option>
                      <option value="All">All Sections</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#172033', marginBottom: '6px' }}>
                      Due Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                      style={{ width: '100%', padding: '9px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.84rem', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#172033', marginBottom: '6px' }}>
                      Due Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={newDueTime}
                      onChange={(e) => setNewDueTime(e.target.value)}
                      style={{ width: '100%', padding: '9px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.84rem', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#172033', marginBottom: '6px' }}>
                      Max Marks
                    </label>
                    <input
                      type="number"
                      value={newMaxMarks}
                      onChange={(e) => setNewMaxMarks(Number(e.target.value))}
                      style={{ width: '100%', padding: '9px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.84rem', outline: 'none' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#243B7A', color: '#FFFFFF', fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(36, 59, 122, 0.28)' }}
                >
                  Publish Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Student Upload & Submission Modal */}
      {submittingAssignment && (
        <div className="vs-modal-backdrop" onClick={() => setSubmittingAssignment(null)}>
          <div
            className="vs-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '520px',
              padding: '24px',
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-xl)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#172554', margin: 0 }}>
                  Submit Coursework
                </h2>
                <p style={{ fontSize: '0.76rem', color: '#64748B', margin: 0 }}>
                  {submittingAssignment.code} — {submittingAssignment.title}
                </p>
              </div>
              <button
                onClick={() => setSubmittingAssignment(null)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#172033', marginBottom: '6px' }}>
                  Upload Solution Document / Code Zip *
                </label>
                <div
                  onClick={() => setStudentFileName(`Submission_${currentUser?.rollNo || 'Roll'}_${submittingAssignment.code}.pdf`)}
                  style={{
                    border: '1.5px dashed #CBD5E1',
                    borderRadius: '10px',
                    padding: '20px',
                    textAlign: 'center',
                    backgroundColor: studentFileName ? '#F0FDF4' : '#F8FAFC',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Upload size={24} color={studentFileName ? '#15803D' : '#243B7A'} style={{ margin: '0 auto 6px' }} />
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: studentFileName ? '#15803D' : '#172554' }}>
                    {studentFileName ? `Selected: ${studentFileName}` : 'Click to select solution file (PDF, ZIP, IPYNB)'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '3px' }}>
                    Supported formats: PDF, DOCX, ZIP, PY (Max 25MB)
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#172033', marginBottom: '6px' }}>
                  Submission Notes / Comments (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Add any execution instructions or notes for the faculty..."
                  value={studentComments}
                  onChange={(e) => setStudentComments(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.84rem', outline: 'none' }}
                />
              </div>

              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#EEF2FB',
                  borderRadius: '8px',
                  fontSize: '0.76rem',
                  color: '#243B7A',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Sparkles size={16} />
                <span>Pacing will be logged as <strong>On-Time Early Submission</strong>.</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => setSubmittingAssignment(null)}
                style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStudentSubmit}
                disabled={isSubmitting}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#243B7A',
                  color: '#FFFFFF',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(36, 59, 122, 0.28)',
                }}
              >
                <Send size={14} />
                <span>{isSubmitting ? 'Submitting...' : 'Confirm & Turn In'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: '#172554',
            color: '#FFFFFF',
            padding: '12px 18px',
            borderRadius: '10px',
            fontSize: '0.86rem',
            fontWeight: 700,
            boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
