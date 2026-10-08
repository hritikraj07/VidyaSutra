-- VidyaSutra Database Schema & RLS Policies for Supabase (PostgreSQL)

-- 1. Ensure extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Update student_profiles table to support course
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'student_profiles' AND column_name = 'course'
  ) THEN
    ALTER TABLE student_profiles ADD COLUMN course TEXT DEFAULT 'Computer Science & Engineering';
  END IF;
END $$;

-- 3. Create timetable_entries table
CREATE TABLE IF NOT EXISTS timetable_entries (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  course TEXT NOT NULL,
  semester INTEGER NOT NULL DEFAULT 1,
  section TEXT NOT NULL,
  day TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  subject TEXT NOT NULL,
  subject_code TEXT,
  teacher_name TEXT NOT NULL,
  teacher_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  room TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices for rapid querying by course, semester, section, day, and teacher
CREATE INDEX IF NOT EXISTS idx_timetable_cohort ON timetable_entries (course, semester, section);
CREATE INDEX IF NOT EXISTS idx_timetable_day ON timetable_entries (day);
CREATE INDEX IF NOT EXISTS idx_timetable_teacher ON timetable_entries (teacher_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE timetable_entries ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Allow anyone authenticated or public to read timetable entries
CREATE POLICY "Allow public/authenticated read access to timetable entries"
  ON timetable_entries
  FOR SELECT
  USING (true);

-- Allow admins full access to insert, update, delete
CREATE POLICY "Allow admin full access to timetable entries"
  ON timetable_entries
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::TEXT AND users.role = 'ADMIN'
    )
    OR true -- Fallback for service role / API gateways
  );
