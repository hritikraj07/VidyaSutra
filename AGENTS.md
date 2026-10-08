<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project Architecture & Conventions

- Source Code: All application code lives inside `src/` (`app/`, `components/`, `features/`, `services/`, `lib/`, `types/`, `utils/`).
- Database: Prisma 5.22.0 with SQLite `dev.db`. Prisma client singleton is at `@/lib/db`.
- Authentication: Enforce institutional domain `@vidyasutra.edu.in`. Passwords hashed with `scrypt` (`@/lib/auth`).
- Documentation: Maintain active specifications in `docs/` (`PRD.md`, `ARCHITECTURE.md`, `DESIGN.md`, `TEST_PLAN.md`, `SECURITY.md`, `DECISIONS.md`, `MEMORY.md`).
- Tests: Test suites are located in `tests/` (`unit/`, `integration/`, `e2e/`). Run with `npm run test`.
- Administrative Access: Visual database viewer via `npm run db:studio` or in-app `/admin/students`.

