# VidyaSutra — Architecture Documentation

## 1. Technology Stack
- **Framework**: Next.js 16 (App Router + Turbopack engine)
- **Language**: TypeScript 5+ (Strict typing enabled)
- **Database ORM**: Prisma 5.22.0
- **Database Engine**: SQLite (Local persistent `dev.db`) / PostgreSQL (Compatible schema for production)
- **External Auth & SSR**: Supabase SSR (`@supabase/ssr`, `@supabase/supabase-js`)
- **Animation & Transitions**: GSAP 3.15
- **Icons**: Lucide React
- **QR Engine**: qrcode.js

## 2. Directory & Architecture Structure
```
hackathon/
│
├── docs/                      # Architectural, design, and testing specifications
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── DESIGN.md
│   ├── TEST_PLAN.md
│   ├── SECURITY.md
│   ├── DECISIONS.md
│   └── MEMORY.md
│
├── src/
│   ├── app/                   # Next.js App Router (pages, layouts, route handlers)
│   │   ├── admin/students/    # Protected visual database administration interface
│   │   ├── api/               # Serverless API routes (auth, attendance, admin, timetable)
│   │   │   └── analytics/     # Secure role-governed endpoints (admin, teacher, student)
│   │   ├── login/             # Institutional authentication gateway
│   │   ├── globals.css        # Core design tokens & typography
│   │   ├── layout.tsx         # Root application layout
│   │   └── page.tsx           # Role-based unified portal root
│   │
│   ├── components/            # Reusable shared UI layout components
│   │   └── layout/            # Navbar (floating island pill), BottomNav
│   │
│   ├── features/              # Modular domain feature components
│   │   ├── analytics/         # AdminAnalyticsView, TeacherAnalyticsView
│   │   ├── assignments/       # Coursework management
│   │   ├── attendance/        # QR Scanner, live session host, subject analytics
│   │   ├── dashboard/         # Student & Teacher portal dashboards
│   │   ├── mentor/            # Academic counselors triage queue & interventions
│   │   ├── placements/        # Campus placements & role matching
│   │   ├── scores/            # ExplainableScoreModal (7-pillar diagnostic & telemetry editor)
│   │   ├── skills/            # Skills Passport & verification badges
│   │   └── timetable/         # Daily schedule and slot cards
│   │
│   ├── services/              # Business logic & data access services
│   │   ├── analyticsService.ts# Campus, cohort, and personal student analytics queries
│   │   ├── authService.ts     # User authentication, domain enforcement, scrypt hashing
│   │   └── studentService.ts  # Database CRUD for student profiles & courses
│   │
│   ├── lib/                   # Shared libraries & database singletons
│   │   ├── db.ts              # Global Prisma Client singleton
│   │   ├── scoringEngine.ts   # Deterministic 7-pillar engine, risk logic & segmentation
│   │   ├── auth.ts            # Hashing, role mapping, domain validators
│   │   ├── attendanceServer.ts# Dynamic cryptographic token generator
│   │   └── mockData.ts        # Fallback profile generator & clean state defaults
│   │
│   ├── context/               # Global state management
│   │   └── AppContext.tsx     # Session state, academic telemetry, active tabs
│   │
│   ├── types/                 # Shared TypeScript interfaces & types
│   │   └── index.ts           # Domain models, API payloads, telemetry definitions
│   │
│   ├── utils/                 # Utility libraries
│   │   └── supabase/          # Browser, server, and middleware Supabase clients
│   │
│   └── middleware.ts          # Edge authentication checkpoint & route protection
│
├── prisma/                    # Schema & migrations
│   └── schema.prisma          # User, StudentProfile, CourseAllotment models
│
├── scripts/                   # CLI & utility scripts
│   └── seed.mjs               # Database seeder with institutional accounts
│
├── tests/                     # Automated testing suite
│   ├── unit/                  # Password hashing & domain validation unit tests
│   ├── integration/           # Persistent Prisma database query tests
│   └── e2e/                   # API contract tests
│
├── public/                    # Static assets & institutional branding
│   └── logo.jpg               # Official VidyaSutra emblem
│
├── .env.example               # Environment template
├── .gitignore                 # Secrets & binary exclusions
├── AGENTS.md                  # Next.js & agent coding rules
├── package.json               # Scripts & dependencies
└── tsconfig.json              # TypeScript configuration
```

## 3. Data Flow & Authentication
1. **Request Interception**: `src/middleware.ts` intercepts requests. Unauthenticated requests are directed to `/login`.
2. **Authentication Gateway**:
   - Institutional email (`@vidyasutra.edu.in`) and password complexity verified.
   - Handled by `src/services/authService.ts` against persistent Prisma database (`prisma.user`).
   - Passwords verified with scrypt (`crypto.scryptSync`) with 16-byte random salt.
   - On success, `last_login_at` is updated and an HTTP session cookie is established.
3. **Portal Ingestion**:
   - Client accesses `/`, reads session from `/api/auth`, and dynamically renders role-specific dashboard (Student, Faculty, Mentor, Coordinator, Administrator).

## 4. Database Architecture (Prisma)
- **User**: Primary credentials entity with `id`, `name`, `email` (unique), `password_hash`, `role`, `created_at`, `last_login_at`.
- **StudentProfile**: 1-to-1 extension of `User` with `roll_no` (unique), `department`, `semester`, `section`, `admission_year`.
- **CourseAllotment**: 1-to-many relationship with `StudentProfile` storing `subject_code`, `subject_name`, `status`.
