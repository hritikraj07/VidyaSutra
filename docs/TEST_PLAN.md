# VidyaSutra — Test Plan & Quality Assurance

## 1. Testing Strategy
Our testing architecture employs a three-tier pyramid:
1. **Unit Testing (`tests/unit/`)**: Pure functions, mathematical risk score weighting, domain validation, password hashing, and role mappers.
2. **Integration Testing (`tests/integration/`)**: Direct database interactions with Prisma (querying seeded records, verifying foreign key constraints, updating profiles).
3. **End-to-End Testing (`tests/e2e/`)**: API payload validation and request contracts across `/api/auth` and `/api/admin/students`.

## 2. Critical Test Flows
| Flow ID | Scenario | Verification Criteria |
|---|---|---|
| **AUTH-01** | Non-institutional email login attempt | Must reject with HTTP 403 / "Access restricted to official institutional email addresses only" |
| **AUTH-02** | Weak password registration attempt | Must reject with requirement for 8+ chars, uppercase, lowercase, digit |
| **AUTH-03** | Valid login of seeded student | Must verify password hash with scrypt, update `last_login_at`, and set session cookie |
| **AUTH-04** | Unauthorized non-existent email login | Must reject with "Institutional account not found" |
| **DB-01** | Student profile creation & course cascade | Must create `StudentProfile` and linked `CourseAllotment` rows |
| **ADMIN-01**| Admin student record update | Must update department, semester, section, and reflect immediately in database queries |
| **ADMIN-02**| Admin student record deletion | Must delete user and cascade delete linked profile & allotments |

## 3. Running Test Suites
Execute the automated test suite using Node 24 native runner:
```bash
npm run test
```
Outputs passing tests with execution duration and coverage of authentication, database, and payload contracts.
