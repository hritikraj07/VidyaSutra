'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Award,
  CheckCircle2,
  Clock,
  Plus,
  ShieldCheck,
  Sparkles,
  BookOpen,
  UserCheck,
} from 'lucide-react';
import { SkillItem } from '@/types';

export const SkillsModule: React.FC = () => {
  const { skills, addSkill, verifySkill, activeRole } = useApp();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState<SkillItem['category']>('Programming');
  const [newSkillLevel, setNewSkillLevel] = useState<SkillItem['level']>('Intermediate');

  const verifiedSkills = skills.filter((s) => s.verified);
  const pendingSkills = skills.filter((s) => !s.verified);

  const handleCreateSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    addSkill({
      name: newSkillName.trim(),
      category: newSkillCategory,
      level: newSkillLevel,
    });
    setNewSkillName('');
    setIsAddOpen(false);
  };

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
            Student Skill Passport
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Verified technical competencies tied directly to campus recruitment eligibility
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="vs-btn-primary"
          style={{ borderRadius: 'var(--radius-full)' }}
        >
          <Plus size={16} />
          <span>Add Skill</span>
        </button>
      </div>

      {/* Add Skill Form Drawer/Card */}
      {isAddOpen && (
        <form
          onSubmit={handleCreateSkill}
          className="vs-card"
          style={{
            marginBottom: '24px',
            backgroundColor: '#F8FAFC',
            border: '1.5px solid var(--primary)',
          }}
        >
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>
            Register New Competency
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Skill Name:
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Kubernetes, TypeScript, PyTorch"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  fontSize: '0.82rem',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Category:
              </label>
              <select
                value={newSkillCategory}
                onChange={(e) => setNewSkillCategory(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  fontSize: '0.82rem',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <option value="Programming">Programming</option>
                <option value="AI & Data">AI & Data</option>
                <option value="Web Tech">Web Tech</option>
                <option value="Core Engineering">Core Engineering</option>
                <option value="Soft Skills">Soft Skills</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Proficiency Level:
              </label>
              <select
                value={newSkillLevel}
                onChange={(e) => setNewSkillLevel(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  fontSize: '0.82rem',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Expert">Expert</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="vs-btn-secondary"
              style={{ padding: '6px 14px' }}
            >
              Cancel
            </button>
            <button type="submit" className="vs-btn-primary" style={{ padding: '6px 18px' }}>
              Save & Submit for Review
            </button>
          </div>
        </form>
      )}

      {/* Verified Skills Section (DESIGN.md Section 14) */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <ShieldCheck size={18} color="var(--success)" />
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)' }}>
            Verified Credentials ({verifiedSkills.length})
          </h2>
        </div>

        {verifiedSkills.length === 0 ? (
          <div
            className="vs-card"
            style={{
              textAlign: 'center',
              padding: '32px 20px',
              backgroundColor: '#FFFFFF',
              border: '1.5px dashed var(--border)',
            }}
          >
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              No verified competencies yet. Click <strong>+ Add Skill</strong> above to register technical abilities and request mentor or faculty verification.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {verifiedSkills.map((skill) => (
              <div
                key={skill.id}
                className="vs-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  borderLeft: '4px solid var(--success)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={16} color="var(--success)" />
                    <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text)' }}>
                      {skill.name}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {skill.category} • {skill.level}
                  </div>
                </div>

                <span className="vs-badge vs-badge-safe" style={{ fontSize: '0.7rem' }}>
                  {skill.verificationSource}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Self-Declared Skills Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Clock size={18} color="var(--warning)" />
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)' }}>
            Self-Declared / Pending Review ({pendingSkills.length})
          </h2>
        </div>

        {pendingSkills.length === 0 ? (
          <div
            className="vs-card"
            style={{
              textAlign: 'center',
              padding: '28px 20px',
              backgroundColor: '#FFFFFF',
              border: '1.5px dashed var(--border)',
            }}
          >
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              No pending unverified skills. Add newly learned technologies to build your verified portfolio for placement drives.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          {pendingSkills.map((skill) => (
            <div
              key={skill.id}
              className="vs-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderLeft: '4px solid var(--warning)',
              }}
            >
              <div>
                <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text)' }}>
                  {skill.name}
                </span>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {skill.category} • {skill.level}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="vs-badge vs-badge-warning" style={{ fontSize: '0.68rem' }}>
                  Unverified
                </span>

                {/* Teacher / Staff can click to verify */}
                {activeRole === 'teacher' && (
                  <button
                    onClick={() => verifySkill(skill.id)}
                    className="vs-btn-primary"
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.7rem',
                      backgroundColor: 'var(--success)',
                    }}
                  >
                    Verify
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
};
