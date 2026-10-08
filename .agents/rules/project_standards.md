# Antigravity Project Rules & Standards

## 1. General Coding Standards
- Use TypeScript strictly. Avoid `any` types; prefer typed interfaces defined in `@/types`.
- Clean imports using `@/...` aliases configured in `tsconfig.json`.
- Keep modules focused and single-responsibility.
- Avoid duplicate code; extract reusable patterns to `@/lib` or `@/components`.
- Never expose API keys or secrets in source code; use `.env.local` / `.env`.

## 2. Frontend Conventions
- **App Router**: Follow Next.js 16 conventions inside `src/app/`.
- **Feature Encapsulation**: Keep feature-specific components inside `src/features/<feature-name>/`.
- **Shared Components**: Place cross-feature components in `src/components/layout/` or `src/components/ui/`.
- **Styling**: Use CSS custom properties defined in `src/app/globals.css`. Follow the 5-tone institutional palette:
  - `--navy-900: #0D1B2A`
  - `--navy-800: #1B263B`
  - `--navy-700: #415A77`
  - `--navy-500: #778DA9`
  - `--platinum: #E0E1DD`
- **Animations**: Use GSAP micro-animations with subtle stagger and ease (`power2.out`).
- **Icons**: Standardize on `lucide-react` icons.

## 3. Backend & Database Conventions
- **Service Layer**: Keep data and business logic inside `src/services/` (e.g. `AuthService`, `StudentService`).
- **Prisma Singleton**: Always import `prisma` from `@/lib/db`. Do not instantiate `new PrismaClient()` in route handlers.
- **Cascading Integrity**: Ensure relational foreign keys have appropriate cascading behavior in `prisma/schema.prisma`.
- **Serverless Resiliency**: Use global state singletons for development state preservation where needed (e.g. `attendanceServer.ts`).

## 4. Testing Conventions
- Organize tests under `tests/`:
  - `tests/unit/`: Test pure functions, cryptographic hashing, domain validators.
  - `tests/integration/`: Test persistent Prisma database interactions and queries.
  - `tests/e2e/`: Test API route contracts and payload handling.
- Run tests via `npm run test` using Node.js native test runner (`node --test`).

## 5. Security Practices
- **Domain Gate**: Restrict authentication strictly to `@vidyasutra.edu.in`.
- **Password Hashing**: Hash passwords using `crypto.scryptSync` with random salt. Compare with `crypto.timingSafeEqual`.
- **Route Protection**: Use `src/middleware.ts` to redirect unauthenticated users to `/login`.
- **Input Sanitization**: Trim and sanitize email, roll number, and user inputs before database storage.
- Keep `.env` and `.env.local` out of version control.

## 6. Project Architecture
```
hackathon/
├── docs/            # Architecture, PRD, security & decision records
├── prisma/          # Prisma schema & SQLite database
├── public/          # Static assets (logo.jpg)
├── scripts/         # Seed & CLI automation
├── src/
│   ├── app/         # App router (pages & route handlers)
│   ├── components/  # Shared layout components
│   ├── features/    # Domain modules (attendance, timetable, etc.)
│   ├── services/    # Business logic & DB queries
│   ├── lib/         # Prisma client, auth crypto
│   ├── context/     # AppContext state
│   ├── types/       # Shared TypeScript models
│   └── utils/       # Supabase client helpers
└── tests/           # Unit, integration, and e2e test suites
```
