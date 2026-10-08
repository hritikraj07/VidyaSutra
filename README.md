# VidyaSutra — Institutional Academic & Student Success Platform

VidyaSutra is an institutional student portal and academic management system engineered with Next.js 16, TypeScript, Prisma ORM, and Supabase SSR. It delivers verified attendance tracking with dynamic cryptographic rotating QR codes, academic telemetry, behavioral submission analytics, early-warning risk scores, a skills passport, and direct database administration.

---

## Key Features

1. **Strict Institutional Authentication**:
   - Access restricted exclusively to official institutional email addresses (`@vidyasutra.edu.in`).
   - Cryptographic password hashing using `scrypt` with random salt.
   - Session tracking with real-time `last_login_at` timestamp capture.
   - Rejection of unregistered or unauthorized accounts.

2. **Persistent Database Architecture**:
   - Fully persistent database powered by Prisma ORM (`dev.db` for local SQLite or PostgreSQL for production).
   - Relational models: `User`, `StudentProfile`, and `CourseAllotment` with cascading integrity.

3. **Direct Database Admin Access**:
   - **Prisma Studio**: Launch visual database inspector with `npm run db:studio` at `http://localhost:5555`.
   - **Admin Management Panel**: Access `/admin/students` to search, filter, edit, enroll, and delete student records directly.

4. **Dynamic Revolving QR Attendance**:
   - Cryptographic rotating session codes updated every 10 seconds to eliminate proxy attendance.
   - Built-in scanner with duplicate check-in prevention.

5. **Student Success Score & Risk Analytics**:
   - Multidimensional weighted scoring across Attendance, Academics, Assignments, Skills, and Placement Readiness.
   - Dedicated counseling queue for faculty mentors to log interventions.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router + Turbopack)
- **Language**: TypeScript 5
- **ORM & DB**: Prisma 5.22.0 (SQLite / PostgreSQL)
- **Styling**: Vanilla CSS tokens & responsive components
- **Animations**: GSAP 3.15
- **Icons**: Lucide React
- **Runtime**: Node.js 24

---

## Getting Started

### 1. Installation

```bash
npm install
```

### 2. Environment Setup

Create `.env.local` or copy from `.env.example`:

```bash
# Database connection (SQLite local or PostgreSQL)
DATABASE_URL="file:./dev.db"

# Supabase Authentication & SSR
NEXT_PUBLIC_SUPABASE_URL="https://puymklalgdnvkrqtlqsw.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_your_key"
```

### 3. Database Initialization & Seeding

Sync the database schema and populate initial institutional accounts:

```bash
# Push schema to SQLite database
npm run db:push

# Seed users, student profiles, and course allotments
npm run db:seed
```

### 4. Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Initial Credentials (Seeded)

All initial accounts use official `@vidyasutra.edu.in` credentials:

| Role | Email | Password | Details |
|---|---|---|---|
| **Student** | `student@vidyasutra.edu.in` | `Student@123` | Aarav Sharma (Roll: `21BCSE101`, CSE Sem 6) |
| **Faculty** | `faculty@vidyasutra.edu.in` | `Faculty@123` | Dr. Ramesh Verma (Course Instructor) |
| **Mentor** | `mentor@vidyasutra.edu.in` | `Mentor@123` | Prof. Sneha Iyer (Academic Counselor) |
| **Admin** | `admin@vidyasutra.edu.in` | `Admin@123` | Academic Administrator |
| **Placement** | `coordinator@vidyasutra.edu.in` | `Coordinator@123` | Vikram Malhotra (Corporate Relations) |

---

## Direct Database Access for Administrators

### Option 1: Visual Prisma Studio GUI
Run the command:
```bash
npm run db:studio
```
Open [http://localhost:5555](http://localhost:5555) to view, filter, edit, and create records across `users`, `student_profiles`, and `course_allotments`.

### Option 2: In-App Web Admin Dashboard
Navigate to:
```
http://localhost:3000/admin/students
```
Features real-time search, student profile editing modal, new student registration form, and cascading delete actions.

---

## Development Commands

- `npm run dev`: Start Next.js development server
- `npm run build`: Compile optimized production bundle
- `npm run start`: Launch production server
- `npm run db:push`: Push schema changes to the database
- `npm run db:studio`: Launch Prisma Studio visual browser
- `npm run db:seed`: Seed institutional database records
- `npm run test`: Run unit and integration tests

---

## Project Structure

```
hackathon/
├── docs/            # Specifications (PRD, ARCHITECTURE, DESIGN, SECURITY, etc.)
├── prisma/          # Prisma schema & SQLite dev.db
├── public/          # Static assets (logo.jpg)
├── scripts/         # Seeding & automation scripts (seed.mjs)
├── src/
│   ├── app/         # App router (login, admin/students, api, page)
│   ├── components/  # Shared layout components (Navbar, BottomNav)
│   ├── features/    # Domain modules (attendance, assignments, dashboard, etc.)
│   ├── services/    # Business services (authService, studentService)
│   ├── lib/         # Prisma singleton, auth crypto, server singletons
│   ├── context/     # AppContext state provider
│   ├── types/       # Shared TypeScript definitions
│   └── utils/       # Supabase client helpers
├── tests/           # Unit, integration, and e2e test suites
└── package.json
```
