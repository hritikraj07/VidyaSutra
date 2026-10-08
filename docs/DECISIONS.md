# VidyaSutra — Architecture Decision Records (ADR)

## ADR 01: Native Scrypt Hashing vs. Bcrypt Dependency
- **Decision**: Use Node.js built-in `crypto.scryptSync` with random salt and `crypto.timingSafeEqual`.
- **Context**: External npm libraries like `bcrypt` frequently trigger native node-gyp C++ compilation errors on Windows environments and increase bundle weight.
- **Consequences**: Zero external native binary dependencies, fast execution, military-grade key derivation function, and 100% portability.

## ADR 02: Prisma with SQLite Local Engine & External GUI Access
- **Decision**: Configure Prisma 5.22.0 with SQLite database (`dev.db`) at root, providing local persistent storage with `file:./dev.db`.
- **Context**: Enables instant zero-configuration local persistence while allowing external GUIs (Prisma Studio on port 5555, DBeaver, SQLite Browser) to inspect and edit tables directly.
- **Consequences**: Zero cloud latency during local evaluation, instant database reset via `npm run db:seed`, and identical Prisma query syntax for zero-friction migration to PostgreSQL in production.

## ADR 03: Feature-Driven Directory Restructuring into `src/`
- **Decision**: Consolidate application logic under `src/` with clear boundaries: `src/features/` for domain modules (attendance, timetable, assignments, mentor, placements, skills, scores), `src/components/layout/` for shared layouts, `src/services/` for business logic, and `src/lib/` for shared infrastructure.
- **Context**: The previous layout placed all features flatly under `components/` alongside layouts and had root-level code mixed with configuration.
- **Consequences**: Professional, scalable repository layout adhering to standard Next.js 16 conventions.

## ADR 04: Two-Tier Administrative Database Access
- **Decision**: Provide both a command-line GUI (`npm run db:studio` -> Prisma Studio) and an integrated in-app web administration view (`/admin/students`).
- **Context**: Admins require direct raw table inspection as well as an accessible portal for day-to-day student registration, search, and profile maintenance.
- **Consequences**: Comprehensive administrator capabilities catering to both developers and academic staff.
