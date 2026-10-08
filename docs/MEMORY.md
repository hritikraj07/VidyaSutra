# VidyaSutra — Project Memory & AI Context

## Key Facts
- **Institution Domain**: `@vidyasutra.edu.in`. All logins and registrations MUST end with this domain.
- **Roles Supported**:
  - `STUDENT` (Mapped to UI role `'student'`)
  - `FACULTY` (Mapped to UI role `'teacher'`)
  - `MENTOR` (Mapped to UI role `'mentor'`)
  - `ADMIN` (Mapped to UI role `'admin'`)
  - `COORDINATOR` (Mapped to UI role `'placement_coordinator'`)
- **Default Seed Accounts** (All use password `Student@123` or corresponding role capital):
  - Student: `student@vidyasutra.edu.in` / `Student@123`
  - Faculty: `faculty@vidyasutra.edu.in` / `Faculty@123`
  - Mentor: `mentor@vidyasutra.edu.in` / `Mentor@123`
  - Admin: `admin@vidyasutra.edu.in` / `Admin@123`
  - Coordinator: `coordinator@vidyasutra.edu.in` / `Coordinator@123`
- **Database Engine**: Prisma ORM with SQLite file (`./dev.db`). Pushed via `npm run db:push` or `npx prisma db push`.
- **Admin Direct Access**:
  - Web UI: Navigate to `/admin/students`
  - Visual GUI: Run `npm run db:studio` (opens Prisma Studio at `http://localhost:5555`)
- **Branding Palette**:
  - Navy 900: `#0D1B2A`
  - Navy 800: `#1B263B`
  - Slate 700: `#415A77`
  - Slate 500: `#778DA9`
  - Platinum: `#E0E1DD`
- **Logo File**: `public/logo.jpg`
