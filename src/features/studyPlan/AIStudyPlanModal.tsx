'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Sparkles,
  BookOpen,
  Clock,
  CheckCircle2,
  Circle,
  RefreshCw,
  AlertCircle,
  Calendar,
  ChevronRight,
  TrendingUp,
  Sliders,
  Award,
} from 'lucide-react';
import { StudyPlanService, WeeklyStudyPlan, StudyPlanTask } from '@/services/studyPlanService';
import { useApp } from '@/context/AppContext';

interface AIStudyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProgressUpdate?: (completedCount: number, totalCount: number) => void;
}

export const AIStudyPlanModal: React.FC<AIStudyPlanModalProps> = ({
  isOpen,
  onClose,
  onProgressUpdate,
}) => {
  const { currentUser, attendanceRecords } = useApp();
  const [plan, setPlan] = useState<WeeklyStudyPlan | null>(null);
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('all');
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [availableDailyHours, setAvailableDailyHours] = useState<number>(2.5);

  // Initialize or restore plan from local storage / service
  useEffect(() => {
    if (!isOpen) return;

    const storageKey = `vs_study_plan_${currentUser?.email || 'default'}`;
    const saved = localStorage.getItem(storageKey);

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPlan(parsed);
        return;
      } catch {
        // Fall back to generate fresh plan
      }
    }

    // Generate deterministic fresh plan
    const generated = StudyPlanService.generateWeeklyPlan({
      studentName: currentUser?.name,
      courses: currentUser?.courses,
      attendanceAvg: attendanceRecords.length > 0
        ? Math.round(attendanceRecords.reduce((s, a) => s + a.percentage, 0) / attendanceRecords.length)
        : 82,
      weakSubjects: ['CS301'],
      upcomingExams: [{ subject: 'Data Structures & Algorithms', daysLeft: 12 }],
      dailyAvailableHours: availableDailyHours,
    });
    setPlan(generated);
    localStorage.setItem(storageKey, JSON.stringify(generated));
  }, [isOpen, currentUser, attendanceRecords, availableDailyHours]);

  const handleToggleTask = (taskId: string) => {
    if (!plan) return;

    const updatedTasks = plan.tasks.map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );

    const completedCount = updatedTasks.filter((t) => t.completed).length;
    const updatedPlan: WeeklyStudyPlan = {
      ...plan,
      tasks: updatedTasks,
      completedTasksCount: completedCount,
    };

    setPlan(updatedPlan);
    const storageKey = `vs_study_plan_${currentUser?.email || 'default'}`;
    localStorage.setItem(storageKey, JSON.stringify(updatedPlan));

    if (onProgressUpdate) {
      onProgressUpdate(completedCount, updatedPlan.totalTasksCount);
    }
  };

  const handleRegenerate = () => {
    setIsRegenerating(true);
    setTimeout(() => {
      const generated = StudyPlanService.generateWeeklyPlan({
        studentName: currentUser?.name,
        courses: currentUser?.courses,
        attendanceAvg: attendanceRecords.length > 0
          ? Math.round(attendanceRecords.reduce((s, a) => s + a.percentage, 0) / attendanceRecords.length)
          : 82,
        weakSubjects: ['CS301'],
        upcomingExams: [{ subject: 'Data Structures & Algorithms', daysLeft: 12 }],
        dailyAvailableHours: availableDailyHours,
      });
      setPlan(generated);
      const storageKey = `vs_study_plan_${currentUser?.email || 'default'}`;
      localStorage.setItem(storageKey, JSON.stringify(generated));
      setIsRegenerating(false);

      if (onProgressUpdate) {
        onProgressUpdate(0, generated.totalTasksCount);
      }
    }, 400);
  };

  const filteredTasks = useMemo(() => {
    if (!plan) return [];
    if (selectedDayFilter === 'all') return plan.tasks;
    return plan.tasks.filter(
      (t) => t.day.toLowerCase() === selectedDayFilter.toLowerCase()
    );
  }, [plan, selectedDayFilter]);

  const progressPct = plan
    ? Math.round((plan.completedTasksCount / plan.totalTasksCount) * 100)
    : 0;

  if (!isOpen || !plan) return null;

  const daysList = ['all', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        className="vs-card animate-scale-up"
        style={{
          width: '100%',
          maxWidth: '780px',
          maxHeight: '90vh',
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          border: '1px solid #CBD5E1',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #E2E8F0',
            backgroundColor: '#FAFCFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                backgroundColor: '#EEF2FB',
                border: '1px solid #D6E0F5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#243B7A',
              }}
            >
              <Sparkles size={20} color="#E7A23B" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#172554', margin: 0 }}>
                  Personalized AI Study Plan
                </h2>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    backgroundColor: '#DCFCE7',
                    color: '#15803D',
                    border: '1px solid #BBF7D0',
                    padding: '2px 7px',
                    borderRadius: '6px',
                    textTransform: 'uppercase',
                  }}
                >
                  Intelligence Engine
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px', margin: 0 }}>
                Tailored for {currentUser?.name || 'Student'} • {plan.targetFocus}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              title="Regenerate plan with updated criteria"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#243B7A',
                backgroundColor: '#EEF2FB',
                border: '1px solid #D6E0F5',
                cursor: isRegenerating ? 'not-allowed' : 'pointer',
              }}
            >
              <RefreshCw size={13} className={isRegenerating ? 'animate-spin' : ''} />
              <span>{isRegenerating ? 'Recalculating...' : 'Regenerate'}</span>
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748B',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Close study plan modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {/* Diagnostic Context Callout */}
          <div
            style={{
              backgroundColor: '#EEF2FB',
              border: '1px solid #D6E0F5',
              borderLeft: '4px solid #243B7A',
              borderRadius: '10px',
              padding: '12px 16px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
            }}
          >
            <AlertCircle size={18} color="#243B7A" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div style={{ fontSize: '0.82rem', color: '#172554', lineHeight: 1.45 }}>
              <div style={{ fontWeight: 700, marginBottom: '2px' }}>Why this plan was synthesized:</div>
              <div>
                Recent assessment telemetry identified an <strong>8% drop in Calculus & Algorithms</strong> comprehension, while your <strong>OS attendance</strong> requires recovery before the 75% cutoff. This 7-day routine prioritizes weak-topic remediation with targeted {plan.weeklyTargetHours} hours of weekly engagement.
              </div>
            </div>
          </div>

          {/* Progress Overview Bar */}
          <div
            style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '14px 18px',
              marginBottom: '18px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                  Weekly Completion Progress
                </span>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#172554', marginTop: '2px' }}>
                  {plan.completedTasksCount} of {plan.totalTasksCount} sessions completed ({progressPct}%)
                </div>
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: progressPct >= 75 ? '#DCFCE7' : '#FEF3C7',
                  color: progressPct >= 75 ? '#15803D' : '#92400E',
                  border: `1px solid ${progressPct >= 75 ? '#BBF7D0' : '#FDE68A'}`,
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                <Clock size={13} />
                <span>{plan.weeklyTargetHours} hrs total allocated</span>
              </div>
            </div>

            {/* Progress Meter Bar */}
            <div
              style={{
                width: '100%',
                height: '8px',
                backgroundColor: '#E2E8F0',
                borderRadius: '9999px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progressPct}%`,
                  height: '100%',
                  backgroundColor: progressPct === 100 ? '#10B981' : '#243B7A',
                  borderRadius: '9999px',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>

          {/* Day Filters */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              paddingBottom: '8px',
              marginBottom: '16px',
            }}
          >
            {daysList.map((day) => {
              const isSelected = selectedDayFilter.toLowerCase() === day.toLowerCase();
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDayFilter(day)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.76rem',
                    fontWeight: isSelected ? 700 : 600,
                    backgroundColor: isSelected ? '#243B7A' : '#F1F5F9',
                    color: isSelected ? '#FFFFFF' : '#475569',
                    border: 'none',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    textTransform: 'capitalize',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Tasks List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredTasks.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '36px 20px',
                  color: '#64748B',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '12px',
                  border: '1px dashed #CBD5E1',
                }}
              >
                <Calendar size={28} style={{ margin: '0 auto 8px', color: '#94A3B8' }} />
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#172554' }}>
                  No study sessions scheduled for {selectedDayFilter}
                </div>
                <div style={{ fontSize: '0.8rem', marginTop: '2px' }}>
                  Select "All" to inspect the complete 7-day academic plan.
                </div>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleToggleTask(task.id)}
                  className="vs-card vs-card-hover"
                  style={{
                    padding: '14px 16px',
                    backgroundColor: task.completed ? '#F8FAFC' : '#FFFFFF',
                    borderRadius: '12px',
                    border: `1px solid ${task.completed ? '#E2E8F0' : '#CBD5E1'}`,
                    borderLeft: `4px solid ${
                      task.completed
                        ? '#94A3B8'
                        : task.priority === 'high'
                        ? '#E7A23B'
                        : '#243B7A'
                    }`,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    cursor: 'pointer',
                    opacity: task.completed ? 0.75 : 1,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Interactive Checkbox */}
                  <div style={{ marginTop: '2px', flexShrink: 0 }}>
                    {task.completed ? (
                      <CheckCircle2 size={20} color="#15803D" strokeWidth={2.5} />
                    ) : (
                      <Circle size={20} color="#94A3B8" strokeWidth={2} />
                    )}
                  </div>

                  {/* Task Details */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: '#243B7A',
                            backgroundColor: '#EEF2FB',
                            padding: '2px 7px',
                            borderRadius: '5px',
                          }}
                        >
                          {task.day} • {task.subjectCode}
                        </span>
                        <h4
                          style={{
                            fontSize: '0.88rem',
                            fontWeight: 700,
                            color: task.completed ? '#64748B' : '#172554',
                            textDecoration: task.completed ? 'line-through' : 'none',
                            margin: 0,
                          }}
                        >
                          {task.topic}
                        </h4>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: '#64748B',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Clock size={12} />
                          {task.durationMinutes} mins
                        </span>
                        {task.priority === 'high' && (
                          <span
                            style={{
                              fontSize: '0.66rem',
                              fontWeight: 700,
                              backgroundColor: '#FEF3C7',
                              color: '#92400E',
                              border: '1px solid #FDE68A',
                              padding: '1px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            Priority
                          </span>
                        )}
                      </div>
                    </div>

                    <p
                      style={{
                        fontSize: '0.76rem',
                        color: task.completed ? '#94A3B8' : '#64748B',
                        marginTop: '4px',
                        marginBottom: 0,
                        lineHeight: 1.4,
                      }}
                    >
                      💡 <strong>Why:</strong> {task.reason}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid #E2E8F0',
            backgroundColor: '#FAFCFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
            Click any session card to mark as completed. Progress updates your student dashboard in real time.
          </div>
          <button
            onClick={onClose}
            className="vs-btn-primary"
            style={{
              padding: '8px 18px',
              fontSize: '0.82rem',
              borderRadius: '8px',
              backgroundColor: '#243B7A',
              color: '#FFFFFF',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            Save & Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
