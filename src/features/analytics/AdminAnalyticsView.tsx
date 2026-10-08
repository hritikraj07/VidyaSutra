'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  ShieldAlert,
  Award,
  Users,
  Search,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Layers,
  GraduationCap,
  Briefcase,
  ChevronRight,
  SlidersHorizontal,
  X,
  ArrowUpRight,
} from 'lucide-react';
import { ExplainableScoreModal } from '@/features/scores/ExplainableScoreModal';
import { StudentAnalyticsDetail, CampusAnalyticsSummary } from '@/services/analyticsService';

export const AdminAnalyticsView: React.FC = () => {
  const [data, setData] = useState<CampusAnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [semesterFilter, setSemesterFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [segmentFilter, setSegmentFilter] = useState('all');

  // Selected student for explainable score modal
  const [selectedStudent, setSelectedStudent] = useState<StudentAnalyticsDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch campus analytics data
  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('q', searchQuery.trim());
      if (courseFilter !== 'all') params.append('course', courseFilter);
      if (sectionFilter !== 'all') params.append('section', sectionFilter);
      if (semesterFilter !== 'all') params.append('semester', semesterFilter);
      if (riskFilter !== 'all') params.append('risk', riskFilter);
      if (segmentFilter !== 'all') params.append('segment', segmentFilter);

      const url = `/api/analytics/admin?${params.toString()}`;
      const res = await fetch(url);
      const json = await res.json();

      if (res.ok && json.success) {
        setData(json);
      } else {
        setError(json.error || 'Failed to load campus analytics');
      }
    } catch (err: any) {
      setError(err.message || 'Network error fetching analytics');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, courseFilter, sectionFilter, semesterFilter, riskFilter, segmentFilter]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleOpenStudentDetail = (student: StudentAnalyticsDetail) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const handleStudentUpdated = (updated: StudentAnalyticsDetail) => {
    setSelectedStudent(updated);
    // Refresh campus overview
    fetchAnalytics();
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setCourseFilter('all');
    setSectionFilter('all');
    setSemesterFilter('all');
    setRiskFilter('all');
    setSegmentFilter('all');
  };

  const hasActiveFilters =
    Boolean(searchQuery) ||
    courseFilter !== 'all' ||
    sectionFilter !== 'all' ||
    semesterFilter !== 'all' ||
    riskFilter !== 'all' ||
    segmentFilter !== 'all';

  const kpis = data?.kpis || {
    totalStudents: 0,
    avgSuccessScore: 0,
    studentsAtRisk: 0,
    academicRiskCount: 0,
    placementRiskCount: 0,
    avgAttendance: 0,
  };

  const scoreDist = data?.scoreDistribution || { strong: 0, stable: 0, needsAttention: 0, highRisk: 0 };
  const totalStudentsCount = kpis.totalStudents || 1;

  return (
    <div style={{ width: '100%' }}>
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
          boxShadow: '0 4px 16px -2px rgba(23, 37, 84, 0.06)',
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
              Smart Campus Intelligence
            </span>
            <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
              Deterministic Multi-Factor Student Success Model
            </span>
          </div>
          <h1
            style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              color: '#172554',
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            Predict, Optimize & Improve Student Success
          </h1>
          <p style={{ fontSize: '0.84rem', color: '#64748B', marginTop: '4px' }}>
            Auditable 7-pillar telemetry integrating Academics (30%), Attendance (20%), Assessments (15%), LMS (10%), Engagement (10%), Placements (10%), and Skills (5%).
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          disabled={isLoading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#EEF2FB',
            color: '#243B7A',
            border: '1px solid #D6E0F5',
            borderRadius: 'var(--radius-md)',
            padding: '9px 16px',
            fontSize: '0.84rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          <span>Refresh Analytics</span>
        </button>
      </section>

      {/* 2. Top KPI Cards */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '14px',
          marginBottom: '20px',
        }}
      >
        {/* KPI 1: Total Enrolled */}
        <div
          className="vs-card"
          style={{
            padding: '18px 20px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Enrolled Students
            </span>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', backgroundColor: '#EEF2FB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#243B7A' }}>
              <Users size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#172554', lineHeight: 1 }}>
            {kpis.totalStudents}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '6px', display: 'block' }}>
            Verified student profiles
          </span>
        </div>

        {/* KPI 2: Campus Average Score */}
        <div
          className="vs-card"
          style={{
            padding: '18px 20px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Avg Success Score
            </span>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '1.9rem', fontWeight: 800, color: '#172554', lineHeight: 1 }}>
              {kpis.avgSuccessScore}
            </span>
            <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>/ 100</span>
          </div>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: kpis.avgSuccessScore >= 75 ? '#15803D' : kpis.avgSuccessScore >= 60 ? '#2563EB' : '#D97706',
              marginTop: '6px',
              display: 'inline-block',
            }}
          >
            ● Campus Mean: {kpis.avgSuccessScore >= 80 ? 'Strong' : kpis.avgSuccessScore >= 60 ? 'Stable' : 'Attention'}
          </span>
        </div>

        {/* KPI 3: Students At Risk */}
        <div
          className="vs-card"
          style={{
            padding: '18px 20px',
            backgroundColor: '#FFFFFF',
            border: kpis.studentsAtRisk > 0 ? '1px solid #FECACA' : '1px solid #E2E8F0',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Students At Risk
            </span>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', backgroundColor: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}>
              <AlertTriangle size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: kpis.studentsAtRisk > 0 ? '#DC2626' : '#172554', lineHeight: 1 }}>
            {kpis.studentsAtRisk}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#DC2626', fontWeight: 600, marginTop: '6px', display: 'block' }}>
            Needs immediate faculty focus
          </span>
        </div>

        {/* KPI 4: Academic Risk */}
        <div
          className="vs-card"
          style={{
            padding: '18px 20px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Academic Risk
            </span>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', backgroundColor: '#FFEDD5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C2410C' }}>
              <BookOpen size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#172554', lineHeight: 1 }}>
            {kpis.academicRiskCount}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '6px', display: 'block' }}>
            CGPA/Backlog/Marks alerts
          </span>
        </div>

        {/* KPI 5: Placement Risk */}
        <div
          className="vs-card"
          style={{
            padding: '18px 20px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Placement Risk
            </span>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', backgroundColor: '#F3E8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7E22CE' }}>
              <Briefcase size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#172554', lineHeight: 1 }}>
            {kpis.placementRiskCount}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '6px', display: 'block' }}>
            Aptitude & coding deficit
          </span>
        </div>

        {/* KPI 6: Average Attendance */}
        <div
          className="vs-card"
          style={{
            padding: '18px 20px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Avg Attendance
            </span>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', backgroundColor: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#15803D' }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
            <span style={{ fontSize: '1.9rem', fontWeight: 800, color: '#172554', lineHeight: 1 }}>
              {kpis.avgAttendance}
            </span>
            <span style={{ fontSize: '1rem', color: '#64748B', fontWeight: 700 }}>%</span>
          </div>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: kpis.avgAttendance >= 75 ? '#15803D' : '#DC2626',
              marginTop: '6px',
              display: 'inline-block',
            }}
          >
            {kpis.avgAttendance >= 75 ? 'Above 75% baseline' : 'Below 75% threshold'}
          </span>
        </div>
      </section>

      {/* 3. Distributions & Segments Grid */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        {/* Card A: Success Score Distribution */}
        <div
          className="vs-card"
          style={{
            padding: '20px 22px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={17} color="#243B7A" />
              <h3 style={{ fontSize: '0.94rem', fontWeight: 800, color: '#172554', margin: 0 }}>
                Score Band Distribution
              </h3>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Deterministic Bands</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Strong */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '3px' }}>
                <span style={{ fontWeight: 700, color: '#15803D' }}>Strong (80 - 100)</span>
                <span style={{ fontWeight: 700, color: '#172033' }}>{scoreDist.strong} student(s)</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.round((scoreDist.strong / totalStudentsCount) * 100)}%`,
                    height: '100%',
                    backgroundColor: '#15803D',
                    borderRadius: '4px',
                  }}
                />
              </div>
            </div>

            {/* Stable */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '3px' }}>
                <span style={{ fontWeight: 700, color: '#2563EB' }}>Stable (60 - 79)</span>
                <span style={{ fontWeight: 700, color: '#172033' }}>{scoreDist.stable} student(s)</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.round((scoreDist.stable / totalStudentsCount) * 100)}%`,
                    height: '100%',
                    backgroundColor: '#2563EB',
                    borderRadius: '4px',
                  }}
                />
              </div>
            </div>

            {/* Needs Attention */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '3px' }}>
                <span style={{ fontWeight: 700, color: '#D97706' }}>Needs Attention (40 - 59)</span>
                <span style={{ fontWeight: 700, color: '#172033' }}>{scoreDist.needsAttention} student(s)</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.round((scoreDist.needsAttention / totalStudentsCount) * 100)}%`,
                    height: '100%',
                    backgroundColor: '#D97706',
                    borderRadius: '4px',
                  }}
                />
              </div>
            </div>

            {/* High Risk */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '3px' }}>
                <span style={{ fontWeight: 700, color: '#DC2626' }}>High Risk (0 - 39)</span>
                <span style={{ fontWeight: 700, color: '#172033' }}>{scoreDist.highRisk} student(s)</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.round((scoreDist.highRisk / totalStudentsCount) * 100)}%`,
                    height: '100%',
                    backgroundColor: '#DC2626',
                    borderRadius: '4px',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card B: Student Segments Breakdown */}
        <div
          className="vs-card"
          style={{
            padding: '20px 22px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={17} color="#243B7A" />
              <h3 style={{ fontSize: '0.94rem', fontWeight: 800, color: '#172554', margin: 0 }}>
                Cohort Segments (Click to filter)
              </h3>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Multi-Pillar Rules</span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
            {data?.segmentDistribution &&
              Object.entries(data.segmentDistribution).map(([segName, count]) => {
                const isSelected = segmentFilter === segName;
                return (
                  <button
                    key={segName}
                    onClick={() => setSegmentFilter(isSelected ? 'all' : segName)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '5px 10px',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor: isSelected ? '#243B7A' : '#F8FAFC',
                      color: isSelected ? '#FFFFFF' : '#1E293B',
                      border: `1px solid ${isSelected ? '#243B7A' : '#CBD5E1'}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{segName}</span>
                    <span
                      style={{
                        backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.25)' : '#E2E8F0',
                        color: isSelected ? '#FFFFFF' : '#475569',
                        padding: '1px 6px',
                        borderRadius: '999px',
                        fontSize: '0.7rem',
                      }}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
          </div>
        </div>
      </section>

      {/* 4. Interactive Filters Bar */}
      <section
        className="vs-card"
        style={{
          padding: '18px 22px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SlidersHorizontal size={17} color="#243B7A" />
            <h3 style={{ fontSize: '0.94rem', fontWeight: 800, color: '#172554', margin: 0 }}>
              Interactive Telemetry Filters
            </h3>
          </div>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.76rem',
                fontWeight: 700,
                color: '#DC2626',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <X size={14} />
              <span>Reset all filters</span>
            </button>
          )}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '10px',
          }}
        >
          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <Search
              size={15}
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
            />
            <input
              type="text"
              placeholder="Search name, roll..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 32px',
                fontSize: '0.82rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                outline: 'none',
                backgroundColor: '#F8FAFC',
              }}
            />
          </div>

          {/* Course Filter */}
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            style={{
              padding: '8px 10px',
              fontSize: '0.82rem',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              backgroundColor: '#F8FAFC',
              outline: 'none',
              fontWeight: 600,
              color: '#1E293B',
            }}
          >
            <option value="all">All Departments / Courses</option>
            <option value="Computer Science & Engineering">Computer Science & Engineering</option>
            <option value="Information Technology">Information Technology</option>
          </select>

          {/* Section Filter */}
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            style={{
              padding: '8px 10px',
              fontSize: '0.82rem',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              backgroundColor: '#F8FAFC',
              outline: 'none',
              fontWeight: 600,
              color: '#1E293B',
            }}
          >
            <option value="all">All Sections</option>
            <option value="CSE-A">CSE-A</option>
            <option value="CSE-B">CSE-B</option>
            <option value="IT-A">IT-A</option>
            <option value="IT-B">IT-B</option>
          </select>

          {/* Semester Filter */}
          <select
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            style={{
              padding: '8px 10px',
              fontSize: '0.82rem',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              backgroundColor: '#F8FAFC',
              outline: 'none',
              fontWeight: 600,
              color: '#1E293B',
            }}
          >
            <option value="all">All Semesters</option>
            <option value="1">Semester 1 (Freshmen)</option>
            <option value="2">Semester 2</option>
            <option value="3">Semester 3</option>
            <option value="4">Semester 4</option>
            <option value="5">Semester 5</option>
            <option value="6">Semester 6</option>
            <option value="7">Semester 7</option>
            <option value="8">Semester 8</option>
          </select>

          {/* Risk Level Filter */}
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            style={{
              padding: '8px 10px',
              fontSize: '0.82rem',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              backgroundColor: '#F8FAFC',
              outline: 'none',
              fontWeight: 600,
              color: '#1E293B',
            }}
          >
            <option value="all">All Risk Levels</option>
            <option value="High Risk">High Risk</option>
            <option value="Needs Attention">Needs Attention</option>
            <option value="Stable">Stable</option>
            <option value="Strong">Strong</option>
          </select>

          {/* Segment Filter */}
          <select
            value={segmentFilter}
            onChange={(e) => setSegmentFilter(e.target.value)}
            style={{
              padding: '8px 10px',
              fontSize: '0.82rem',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              backgroundColor: '#F8FAFC',
              outline: 'none',
              fontWeight: 600,
              color: '#1E293B',
            }}
          >
            <option value="all">All Student Segments</option>
            <option value="High Academic / Low Placement Readiness">High Academic / Low Placement</option>
            <option value="High Academic / High Placement Readiness">High Academic / High Placement</option>
            <option value="Low Academic / Low Attendance">Low Academic / Low Attendance</option>
            <option value="Strong Attendance / Weak Academic Performance">Strong Attendance / Weak Academic</option>
            <option value="Strong Academic / Low Engagement">Strong Academic / Low Engagement</option>
            <option value="At-Risk Students">At-Risk Students</option>
            <option value="Overall Strong Performers">Overall Strong Performers</option>
          </select>
        </div>
      </section>

      {/* 5. Filtered Student Insights Table */}
      <section
        className="vs-card"
        style={{
          padding: '22px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#172554', margin: 0 }}>
              Student Telemetry & Success Scores
            </h2>
            <p style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px' }}>
              Showing {data?.students?.length || 0} student records based on active criteria
            </p>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#FEF2F2',
              color: '#DC2626',
              border: '1px solid #FECACA',
              borderRadius: '8px',
              fontSize: '0.82rem',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748B', fontSize: '0.86rem' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px', color: '#243B7A' }} />
            Evaluating multi-factor student telemetry...
          </div>
        ) : !data?.students || data.students.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
            <GraduationCap size={36} color="#CBD5E1" style={{ margin: '0 auto 8px' }} />
            <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>No student records match the selected filters</p>
            <button
              onClick={handleResetFilters}
              style={{
                marginTop: '10px',
                padding: '6px 14px',
                borderRadius: '6px',
                backgroundColor: '#EEF2FB',
                color: '#243B7A',
                border: '1px solid #D6E0F5',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#64748B', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 12px' }}>Student</th>
                  <th style={{ padding: '10px 12px' }}>Class / Cohort</th>
                  <th style={{ padding: '10px 12px' }}>Success Score</th>
                  <th style={{ padding: '10px 12px' }}>Academic Risk</th>
                  <th style={{ padding: '10px 12px' }}>Placement Risk</th>
                  <th style={{ padding: '10px 12px' }}>Segment</th>
                  <th style={{ padding: '10px 12px' }}>Attendance</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.students.map((student) => {
                  const score = student.successScore;
                  const risk = student.risk;

                  const bandBadgeStyle: React.CSSProperties =
                    score.band === 'Strong'
                      ? { backgroundColor: '#DCFCE7', color: '#15803D', border: '1px solid #BBF7D0' }
                      : score.band === 'Stable'
                      ? { backgroundColor: '#DBEAFE', color: '#1D4ED8', border: '1px solid #BFDBFE' }
                      : score.band === 'Needs Attention'
                      ? { backgroundColor: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A' }
                      : { backgroundColor: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA' };

                  return (
                    <tr
                      key={student.id}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        fontSize: '0.82rem',
                        transition: 'background-color 0.15s ease',
                      }}
                      className="hover:bg-slate-50"
                    >
                      {/* Name & Roll */}
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 700, color: '#172554' }}>{student.name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                          Roll: {student.rollNo} • {student.email}
                        </div>
                      </td>

                      {/* Cohort */}
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 600, color: '#1E293B' }}>{student.course}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                          Sem {student.semester} • Section {student.section}
                        </div>
                      </td>

                      {/* Success Score */}
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#172554' }}>
                            {score.overallScore}
                          </span>
                          <span
                            style={{
                              ...bandBadgeStyle,
                              padding: '2px 7px',
                              borderRadius: '999px',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                            }}
                          >
                            {score.band}
                          </span>
                        </div>
                      </td>

                      {/* Academic Risk */}
                      <td style={{ padding: '12px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            backgroundColor:
                              risk.academicRisk === 'High'
                                ? '#FEE2E2'
                                : risk.academicRisk === 'Moderate'
                                ? '#FEF3C7'
                                : '#F0FDF4',
                            color:
                              risk.academicRisk === 'High'
                                ? '#DC2626'
                                : risk.academicRisk === 'Moderate'
                                ? '#B45309'
                                : '#15803D',
                          }}
                        >
                          {risk.academicRisk === 'High' && <AlertTriangle size={12} />}
                          {risk.academicRisk}
                        </span>
                      </td>

                      {/* Placement Risk */}
                      <td style={{ padding: '12px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            backgroundColor:
                              risk.placementRisk === 'High'
                                ? '#FEE2E2'
                                : risk.placementRisk === 'Moderate'
                                ? '#FEF3C7'
                                : '#F0FDF4',
                            color:
                              risk.placementRisk === 'High'
                                ? '#DC2626'
                                : risk.placementRisk === 'Moderate'
                                ? '#B45309'
                                : '#15803D',
                          }}
                        >
                          {risk.placementRisk}
                        </span>
                      </td>

                      {/* Segment */}
                      <td style={{ padding: '12px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            backgroundColor: '#F1F5F9',
                            color: '#334155',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            maxWidth: '180px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={student.segment}
                        >
                          {student.segment}
                        </span>
                      </td>

                      {/* Attendance */}
                      <td style={{ padding: '12px' }}>
                        <span
                          style={{
                            fontWeight: 700,
                            color: student.attendanceAvg >= 75 ? '#15803D' : '#DC2626',
                          }}
                        >
                          {student.attendanceAvg}%
                        </span>
                      </td>

                      {/* Inspect Action */}
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleOpenStudentDetail(student)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            backgroundColor: '#243B7A',
                            color: '#FFFFFF',
                            border: 'none',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(36, 59, 122, 0.2)',
                            transition: 'background-color 0.15s ease',
                          }}
                        >
                          <Eye size={13} />
                          <span>Inspect & Explain</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 6. Explainable Score & Telemetry Edit Modal */}
      <ExplainableScoreModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        student={selectedStudent}
        isAdmin={true}
        onStudentUpdated={handleStudentUpdated}
      />
    </div>
  );
};
