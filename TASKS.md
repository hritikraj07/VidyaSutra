# VidyaSutra Project Tasks & Status

## Completed Tasks
- [x] Configure Prisma 5.22.0 database with SQLite local persistence (`dev.db`).
- [x] Create Prisma models: `User`, `StudentProfile`, and `CourseAllotment`.
- [x] Enforce institutional email domain validation (`@vidyasutra.edu.in`) on client and server.
- [x] Implement secure salted password hashing using Node native `crypto.scryptSync`.
- [x] Implement registration and login API with `last_login_at` capture and profile syncing.
- [x] Implement database seeding script (`scripts/seed.mjs`) with students, faculty, mentor, admin, and coordinator.
- [x] Provide direct visual database access via Prisma Studio (`npm run db:studio`).
- [x] Provide dedicated in-app visual administration interface (`/admin/students`) with CRUD actions.
- [x] Restructure project into target professional `src/` architecture (`app/`, `components/`, `features/`, `services/`, `lib/`, `types/`, `utils/`).
- [x] Set up unit, integration, and e2e testing suites in `tests/`.
- [x] Write complete project documentation in `docs/` (`PRD.md`, `ARCHITECTURE.md`, `DESIGN.md`, `TEST_PLAN.md`, `SECURITY.md`, `DECISIONS.md`, `MEMORY.md`).
- [x] Verify zero TypeScript errors and verify production build.

## Current Tasks
- [x] Finalize Antigravity project conventions and rules in `.agents/rules/`.
- [x] Verify full regression passing across all views.

## Pending Tasks / Backlog
- [ ] Implement biometric/fingerprint WebAuthn integration for teacher classroom session approval.
- [ ] Connect production PostgreSQL connection string in `.env.production` for multi-campus replication.

## Known Bugs
- None identified in core database and authentication workflows.
