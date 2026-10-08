# VidyaSutra — Product Requirements Document (PRD)

## 1. Product Overview
**VidyaSutra** is an institutional academic and student success platform engineered for higher education institutions. It connects students, faculty, academic counselors/mentors, placement officers, and campus administrators into a unified, authenticated digital ecosystem.

## 2. Target Users
- **Students**: View real-time timetables, verify attendance via dynamic revolving QR codes, track coursework and submissions, maintain a verified Skills Passport, monitor academic Success Scores, and explore placement opportunities.
- **Faculty / Instructors**: Host live classroom sessions with rotating cryptographic QR tokens to curb attendance proxying, review submissions, and manage course allotments.
- **Mentors / Academic Counselors**: Monitor students at risk across academic bands, review multidimensional risk indicators, and log intervention notes.
- **Placement Coordinators**: Track company postings, monitor student eligibility matches, and review talent pipelines.
- **Campus Administrators**: Access database records, manage student enrollment, inspect user credentials, and supervise institutional operations.

## 3. Core Features
1. **Institutional Authentication & Gateway**:
   - Strict institutional domain enforcement (`@vidyasutra.edu.in`).
   - Secure salted password hashing (`crypto.scryptSync`).
   - Role-based routing (Student, Faculty, Mentor, Coordinator, Administrator).
   - Session preservation with HTTP cookies and SSR validation.
2. **Dynamic Revolving QR Attendance**:
   - 10-second rotating cryptographic session tokens (`VS-CS302-XXXX-YYYY`) generated server-side.
   - Live replay protection and duplicate check-in prevention.
3. **Academic Timetable & Schedule**:
   - Day-wise active schedule with lecture types (Theory, Lab, Tutorial) and status indicators.
4. **Assignments & Behavior Tracking**:
   - Submission tracking with turnaround metrics and punctuality indicators.
5. **Smart Campus Analytics & Student Success Engine**:
   - Deterministic 7-Pillar Success Score (Academics 30%, Attendance 20%, Assessments 15%, LMS 10%, Engagement 10%, Placement 10%, Skills 5%).
   - Dynamic weight re-normalization for safe missing data handling without unfair penalties.
   - Explainable multi-factor Risk Detection (Academic Risk & Placement Risk with visible bullet reasons).
   - 7 Rule-Based Student Segments (High Academic / Low Placement, High Academic / High Placement, Low Academic / Low Attendance, Strong Attendance / Weak Academic, Strong Academic / Low Engagement, At-Risk Students, Overall Strong Performers).
   - Actionable Insights generation for targeted academic and career interventions.
   - Role-Specific Analytics:
     - Admin: Campus-wide KPIs, score band distributions, risk breakdowns, interactive filters, student roster, and live telemetry editor.
     - Faculty: Scoped to assigned cohorts, class averages, at-risk learners, and class-level intervention recommendations.
     - Student: Strictly isolated personal success diagnostic, 7 driver progress bars, strengths, and priority focus areas.
6. **Skills Passport & Career Readiness**:
   - Categorized competencies (Programming, AI & Data, Web Tech, Core Engineering) with verification provenance.
7. **Placement Hub**:
   - Job/internship match analytics based on student competencies and academic standing.
8. **Direct Database Admin Panel & Studio**:
   - Protected admin view (`/admin/students`) for real-time CRUD on student records and course allotments.
   - Command-line database inspector via Prisma Studio (`npm run db:studio`).

## 4. Goals & Non-Goals
### Goals
- Fully persistent local and production-ready database schema using Prisma (SQLite / PostgreSQL).
- Strict institutional security preventing unauthorized generic logins.
- Fast, low-latency UI optimized for mobile and desktop screens.
- Zero mock demo bypasses — genuine database-backed authentication.

### Non-Goals
- Generic public user registration (only `@vidyasutra.edu.in` accounts allowed).
- Social logins (Google, GitHub, Facebook) are intentionally excluded for strict institutional compliance.
