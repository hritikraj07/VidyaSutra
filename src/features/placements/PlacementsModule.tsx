'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import {
  Briefcase,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Building,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export const PlacementsModule: React.FC = () => {
  const { placements, applyToPlacement, setActiveTab } = useApp();

  return (
    <div style={{ width: '100%', padding: '16px 28px' }}>
      {/* Header */}
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
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)' }}>
            Placement Drives & Internships
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Algorithmic skill matching based on your verified Skill Passport
          </p>
        </div>

        <button
          onClick={() => setActiveTab('skills')}
          className="vs-btn-secondary"
          style={{ borderRadius: 'var(--radius-full)' }}
        >
          <span>Update Skill Passport</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Opportunities List (DESIGN.md Section 13) */}
      {placements.length === 0 ? (
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
            <Briefcase size={24} />
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>
            No Active Recruitment Drives
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto' }}>
            The Corporate Relations Cell has not scheduled any open drives for your cohort today. Keep your verified Skill Passport updated for algorithmic recruiter matching.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {placements.map((job) => {
          const isHighMatch = job.matchScore >= 80;
          const isApplied = job.status === 'applied';

          return (
            <div
              key={job.id}
              className="vs-card vs-card-hover"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                borderLeft: `4px solid ${isHighMatch ? 'var(--primary)' : 'var(--warning)'}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src={job.logo}
                    alt={job.company}
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      objectFit: 'cover',
                      border: '1px solid var(--border)',
                    }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                        {job.company}
                      </span>
                      <span className="vs-badge vs-badge-info" style={{ fontSize: '0.68rem' }}>
                        {job.type}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)' }}>
                      {job.role}
                    </h3>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      <span>💰 {job.packageStipend}</span>
                      <span>•</span>
                      <span>📍 {job.location}</span>
                      <span>•</span>
                      <span>⏳ Deadline: {job.deadline}</span>
                    </div>
                  </div>
                </div>

                {/* Match Score Badge */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Skill Match
                  </div>
                  <div
                    style={{
                      fontSize: '1.4rem',
                      fontWeight: 800,
                      color: isHighMatch ? 'var(--primary)' : 'var(--warning-text)',
                    }}
                  >
                    {job.matchScore}%
                  </div>
                </div>
              </div>

              {/* Skills Alignment & Gap Analysis (DESIGN.md Section 13) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px',
                  padding: '12px 14px',
                  backgroundColor: '#F8FAFC',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', marginRight: '6px' }}>
                  Requirements:
                </span>

                {/* Matched Skills */}
                {job.matchedSkills.map((s) => (
                  <span
                    key={s}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: 'var(--success-light)',
                      color: 'var(--success-text)',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                    }}
                  >
                    <CheckCircle2 size={13} />
                    {s}
                  </span>
                ))}

                {/* Missing Skills Highlighted */}
                {job.missingSkills.map((s) => (
                  <span
                    key={s}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: 'var(--danger-light)',
                      color: 'var(--danger-text)',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                    }}
                  >
                    <XCircle size={13} />
                    {s}
                  </span>
                ))}
              </div>

              {/* Actions Footer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  {job.missingSkills.length === 0
                    ? '🎉 You meet 100% of the core competencies for this drive!'
                    : `Get ${job.missingSkills[0]} verified to raise your match index to 95%.`}
                </p>

                <button
                  onClick={() => applyToPlacement(job.id)}
                  disabled={isApplied}
                  className={isApplied ? 'vs-btn-secondary' : 'vs-btn-primary'}
                  style={{
                    padding: '8px 18px',
                    fontSize: '0.82rem',
                    backgroundColor: isApplied ? '#F1F5F9' : undefined,
                    color: isApplied ? 'var(--text-muted)' : undefined,
                    cursor: isApplied ? 'default' : 'pointer',
                  }}
                >
                  {isApplied ? 'Application Submitted ✓' : 'Submit Application'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
};
