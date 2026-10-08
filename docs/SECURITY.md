# VidyaSutra — Security Architecture & Best Practices

## 1. Authentication Security
- **Strict Domain Boundary**:
  All registration and login requests are restricted to `@vidyasutra.edu.in`. Any attempt to sign in with non-institutional domains (e.g. `@gmail.com`, `@yahoo.com`) is rejected by both client-side validation and server-side route guards.
- **Cryptographic Password Hashing**:
  Passwords are never stored in plaintext. VidyaSutra uses Node's native `crypto.scryptSync` with a 16-byte cryptographically secure random salt and 64-byte key length. Timing-safe comparison (`crypto.timingSafeEqual`) protects against timing attacks during verification.
- **Password Complexity Policy**:
  Enforced minimum length of 8 characters, requiring at least one uppercase letter, one lowercase letter, and one number or special character.

## 2. Session Management & Route Protection
- **Edge Middleware Protection (`src/middleware.ts`)**:
  Inspects incoming requests before hitting route handlers. Any unauthenticated access to the main dashboard `/` or protected views redirects immediately to `/login`.
- **Session Expiry**:
  HTTP cookies are configured with `SameSite=Lax`, `Path=/`, and a 7-day max-age.
- **Database User Re-Verification**:
  Session checks query the persistent database (`prisma.user.findUnique`) on server-side requests to ensure revoked or deleted accounts are terminated immediately.

## 3. Database Isolation & Foreign Key Integrity
- **Cascading Deletions**:
  Foreign keys from `StudentProfile` to `User` and `CourseAllotment` to `StudentProfile` are configured with `onDelete: Cascade` in Prisma, preventing orphan data remnants.
- **Environment Variable Protection**:
  Database credentials and service keys are isolated inside `.env.local` and `.env` (both added to `.gitignore`). A template is preserved in `.env.example` without sensitive credentials.

## 4. Multi-Role Analytics Security & Student Data Isolation
- **Untrusted Client Inputs**:
  The system never trusts client-supplied roles, localStorage tokens, URL query parameters, or client-specified student IDs for authorization.
- **Server-Side Identity Verification**:
  Every analytics endpoint (`/api/analytics/admin`, `/api/analytics/teacher`, `/api/analytics/student`) authenticates the caller via server-side session cookies validated against the persistent database.
- **Student Data Privacy Isolation**:
  A student can only query `/api/analytics/student`, which strictly evaluates the authenticated caller's own record. Any attempt by a student to call `/api/analytics/admin` or `/api/analytics/teacher` is rejected with `403 Forbidden`.
- **Faculty Class Scoping**:
  Teachers can only view analytics for students enrolled in classes/sections officially allotted to them via `TeacherAssignment` or `TimetableEntry`. Direct requests to inspect unassigned cohorts are blocked server-side.
- **Auditable Admin Telemetry Updates**:
  Only users with verified `role === 'admin'` can mutate student analytics profiles (CGPA, marks, aptitude, coding, mock interviews) via `POST /api/analytics/admin`.
