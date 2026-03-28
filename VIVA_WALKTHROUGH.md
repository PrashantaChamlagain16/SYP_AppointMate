# AppointMate Viva Walkthrough (Full Defense Guide)

This document is your complete speaking guide for viva.
It is written from your actual codebase so you can explain confidently with technical depth.

---

## 1. Project in 30 Seconds (Opening Pitch)

AppointMate is a full-stack clinic appointment platform where:
- Patients can register, browse approved doctors, pay and book slots, cancel/reschedule, and submit reviews.
- Doctors can create profiles, wait for admin approval, set availability, and accept/reject pending appointments.
- Admin can approve doctors, manage users, monitor appointments, and review both contact feedback and clinical ratings.

The system uses:
- React + Vite frontend
- Node.js + Express backend
- PostgreSQL database
- JWT authentication with role-based authorization

---

## 2. Problem Statement and Objective

### Problem
Manual appointment systems create:
- Double booking errors
- Delay in confirmations
- Low transparency for patients
- Weak control over doctor verification

### Objective
Build a centralized digital system that:
- Controls booking with strict time-slot validation
- Ensures only approved doctors are bookable
- Gives separate dashboards for patient, doctor, and admin
- Tracks appointment lifecycle and patient feedback

---

## 3. High-Level Architecture

```text
React (Frontend, Vite)
   |
   | REST API calls (/api/...)
   v
Express Server (Node.js)
   |
   | SQL via pg Pool
   v
PostgreSQL Database
```

### Runtime flow
1. Frontend sends request to `/api/...`.
2. Backend middleware verifies JWT and role.
3. Controller validates business rules.
4. SQL runs via `pg` pool.
5. Response returns JSON to frontend.
6. UI updates state and dashboard views.

---

## 4. Tech Stack and Why It Was Chosen

- React: component-based UI, clean dashboard and page separation.
- Vite: fast dev server and fast production build.
- Node.js + Express: lightweight REST API development.
- PostgreSQL: strong relational integrity, perfect for healthcare entities and constraints.
- JWT: stateless auth suitable for role-based APIs.
- bcryptjs: secure password hashing.

---

## 5. Project Structure You Should Explain

```text
03 Developments/
  Backend/
    config/        -> DB pool config
    models/        -> table creation scripts
    controllers/   -> API business logic
    routes/        -> endpoint definitions
    middleware/    -> auth/role checks
    server.js      -> app bootstrap and route mounting
  Frontend/
    src/pages/     -> page-level features (patient/doctor/admin/public)
    src/components -> reusable components (layout, slot picker)
    src/state/     -> auth context + UI feedback context
    src/utils/api.js -> API client wrapper
```

---

## 6. Backend Walkthrough (Deep)

## 6.1 Server bootstrap

In `Backend/server.js`:
- Loads env vars.
- Creates Express app with CORS + JSON middleware.
- Mounts all route modules.
- Tests DB connection before start.
- Auto-creates/repairs tables at startup using model scripts.

This is important in viva because it shows startup robustness and schema self-healing behavior.

## 6.2 Database connection design

In `Backend/config/db.js`:
- Supports `DATABASE_URL` OR separate DB env variables.
- Optional SSL controlled by `DB_SSL=true`.
- Adds `pool.testConnection()` to verify DB before serving API.

---

## 6.3 Authentication and access control

### JWT auth
- Token generated in login with 1-day expiry.
- Middleware verifies token and fetches live user from DB.
- Blocked users are denied even if token exists.

### Role middleware
- Reusable middleware checks required roles (`admin`, `doctor`, `patient`).

### Doctor approval middleware
- Even doctor role cannot use doctor-only operational endpoints unless profile is approved by admin.

This layered security is a strong viva point.

---

## 6.4 Database schema (table-by-table)

## `users`
Purpose:
- Master account table for admin/doctor/patient.

Key fields:
- `email` unique
- `password` hashed
- `role` check constraint (`admin`, `doctor`, `patient`)
- `is_active` for admin block/unblock
- profile attributes (`phone`, `gender`, `dob`, `address`, `profile_image_url`)

## `doctors`
Purpose:
- Doctor professional profile linked to user.

Key fields:
- `user_id` unique FK to `users` (one doctor profile per user)
- credentials (`specialization`, `qualification`, `license_number`)
- `consultation_fee`
- `is_approved` admin approval flag

## `doctor_availability`
Purpose:
- Weekly availability schedule per doctor.

Key fields:
- `doctor_id` unique FK (single row profile per doctor)
- `available_days` (comma-separated weekdays)
- `start_time`, `end_time`, `slot_duration`

## `appointments`
Purpose:
- Core transactional booking record.

Key fields:
- `patient_id`, `doctor_id`
- `appointment_date`, `appointment_time`
- status with constraint (`pending`, `confirmed`, `cancelled`, `completed`)
- cancel metadata (`cancelled_by`, `cancellation_reason`)
- reschedule flags (`rescheduled_by_patient`, `doctor_reschedule_notified_at`)

Integrity rule:
- Partial unique index prevents duplicate active slot:
  same doctor + same date + same time cannot exist for `pending` or `confirmed`.

## `payments`
Purpose:
- Payment record per appointment.

Key fields:
- `appointment_id` UNIQUE FK (one payment per booking)
- `amount`, `method`, `transaction_ref`
- payment status (`pending`, `paid`, `failed`, `refunded`)

## `reviews`
Purpose:
- Patient review linked to completed/past consultation.

Key fields:
- `appointment_id` UNIQUE FK (one review per appointment)
- `rating` 1..5
- optional comment

## `feedbacks`
Purpose:
- Public contact page feedback form storage.

## `appointment_status_history`
Purpose:
- Designed for status audit history.
- Table exists and has FKs, but status transitions are not yet writing into it (future extension point).

## `notifications`
Purpose:
- Designed for in-app/email notification persistence.
- Table exists but current notification behavior is toast + query-driven reschedule info.

---

## 6.5 API module walkthrough

## Auth (`/api/auth`)
- `POST /register`: patient/doctor registration.
  - Doctor registration requires specialization, qualification, license, phone.
  - Uses DB transaction to create user + doctor profile atomically.
- `POST /login`: verifies password, blocks inactive users, denies unapproved doctors.
- `GET /me`: fetch logged-in profile.
- `PUT /me`: update logged-in profile.

## Doctors (`/api/doctors`)
- `POST /create` doctor-only create profile.
- `PUT /me` doctor-only update profile.
- `GET /me` doctor-only get own profile.
- `GET /` public list of approved + active doctors, supports filter by name/specialization.
- `GET /:id` public detail for approved + active doctor with rating summary.

## Availability (`/api/availability`)
- `GET /me` doctor own availability.
- `POST /set` approved-doctor-only create/update availability.
- `GET /:doctor_id` public availability lookup for booking UI.

## Appointments (`/api/appointments`)
- `POST /book` patient-only booking + payment insertion in one DB transaction.
- `GET /my` role-sensitive list (patient sees own doctor appointments; doctor sees own patient appointments).
- `GET /reschedule-notifications` doctor-only one-time reschedule notices.
- `PUT /reschedule/:id` patient-only rescheduling with full validation.
- `PUT /cancel/:id` patient/doctor/admin allowed with ownership checks.

## Doctor confirmation (`/api/appointment-confirmation`)
- `GET /pending` doctor-only pending requests.
- `PUT /confirm/:id` doctor confirms pending request.
- `PUT /reject/:id` doctor rejects pending request.

## Reviews (`/api/reviews`)
- `GET /doctor/:doctorId` public review summary and latest list.
- `GET /my-pending` patient pending-review list.
- `POST /` patient creates review only after appointment completion time.

## Feedback (`/api/feedback`)
- `POST /` public contact form submission.

## Admin (`/api/admin`)
- `GET /users` list users with doctor profile flags.
- `PUT /block/:id` block user.
- `PUT /unblock/:id` unblock user.
- `DELETE /users/:id` delete user (self-delete prevented for admin).
- `GET /appointments` all appointments monitor.
- `GET /doctors/pending` pending doctor approvals.
- `PUT /doctors/approve/:doctorId` approve doctor profile.
- `GET /feedbacks` unified feed of reviews + contact messages.

---

## 6.6 Critical business rules (very important for viva)

### Booking constraints
- Only patients can book.
- Booking time must be:
  - Weekday only (Mon-Fri)
  - Between 10:00 and 16:00
  - In 30-minute granularity
  - Not earlier than current time if booking same day
- Doctor must be approved and active.
- Doctor availability day/time must match.
- Payment object is mandatory.
- Paid amount must match doctor consultation fee exactly.
- Slot collision check + DB unique index both protect against double booking.

### Rescheduling constraints
- Only patient owner can reschedule.
- Only `pending` or `confirmed` appointments can be rescheduled.
- New slot must pass the same validation as booking.

### Review constraints
- Only patient owner can rate.
- One review per appointment.
- Allowed only after appointment completion time or if status is `completed`.

---

## 7. Frontend Walkthrough (Deep)

## 7.1 App shell and routing

`src/App.jsx`:
- Defines public pages and protected dashboards.
- `PrivateRoute` checks token + role before rendering route.

Role routes:
- Patient: `/patient`
- Doctor: `/doctor`
- Admin: `/admin/*`

## 7.2 Global state

### AuthContext
- Stores token and user in localStorage.
- Provides `login`, `register`, `logout`, and session update methods.

### UiFeedbackContext
- Centralized toast messages.
- Reusable confirm dialog for sensitive admin actions.

## 7.3 API utility

`src/utils/api.js`:
- One request wrapper for all methods.
- Injects bearer token automatically when provided.
- Uses `VITE_API_URL` or `/api` default.

## 7.4 Public flow pages
- Landing page shows featured doctors.
- Doctors listing supports search + specialization filter.
- Doctor profile shows details and live review summary.
- Contact page submits feedback form.
- Auth page handles login + registration (doctor and patient modes).

## 7.5 Patient flow pages
- Booking page:
  - Uses slot picker from doctor availability.
  - Sends payment metadata with transaction reference.
- Patient dashboard:
  - Appointment history
  - cancel/reschedule actions
  - pending reviews and submit rating form

## 7.6 Doctor flow pages
- Doctor dashboard:
  - pending requests
  - accept/reject actions
  - full timeline with search and filters
  - one-time reschedule notices
- My Profile page:
  - doctor profile editing
  - availability days/time/slot-duration setup

## 7.7 Admin flow pages
- Doctor approval page
- User management (block/unblock/delete)
- Appointment monitor
- Feedback monitor (reviews + contact feedback)

---

## 8. End-to-End Scenarios You Should Narrate

## Scenario A: Patient booking lifecycle
1. Patient logs in.
2. Opens doctors list and chooses specialist.
3. Slot picker reads doctor availability.
4. Patient enters reason + payment reference.
5. Backend validates time/day/availability/fee/slot collision.
6. Appointment + payment inserted transactionally.
7. Doctor sees request in pending dashboard and confirms/rejects.

## Scenario B: Doctor onboarding lifecycle
1. Doctor registers with mandatory credentials.
2. System creates doctor profile with `is_approved=false`.
3. Doctor login blocked until admin approval.
4. Admin approves profile.
5. Doctor can login, set availability, and manage requests.

## Scenario C: Feedback lifecycle
1. Contact form submission creates `feedbacks` record.
2. Patient post-appointment review creates `reviews` record.
3. Admin feedback page merges both via SQL `UNION ALL`.

---

## 9. Security Design (What to Say)

Implemented:
- bcrypt hashing for passwords.
- JWT auth and signed claims.
- Role-based authorization middleware.
- Active-account check in auth middleware.
- SQL parameterized queries (`$1`, `$2`, ...) against SQL injection.
- Ownership checks for cancel/reschedule/confirm flows.
- Server-side business validation (not relying on frontend only).

Tradeoffs/limitations:
- JWT stored in localStorage (XSS risk compared with httpOnly cookies).
- No refresh token rotation.
- No API rate limiting yet.
- No audit write into `appointment_status_history` yet.

---

## 10. Data Integrity and Transaction Design

Strong points:
- Registration and booking use DB transactions (`BEGIN/COMMIT/ROLLBACK`) to avoid partial writes.
- Check constraints enforce valid enumerations.
- Unique constraints/indexes prevent duplicates and one-to-many mistakes.
- Foreign keys preserve referential integrity.

---

## 11. What Was Verified Before Viva

Verified from this environment:
- Frontend production build passed using `npm.cmd run build` in `Frontend`.
- Backend source syntax check passed using `node --check` across core backend files.

Not fully executed here:
- Full API integration run against live Postgres not executed in this check session.

---

## 12. Demo Plan for Viva (10-15 Minutes)

## Demo setup before entering room
- Start backend: `cd Backend && npm run dev`
- Start frontend: `cd Frontend && npm run dev`
- Ensure PostgreSQL is running and `.env` configured.
- Keep three accounts ready:
  - Admin account
  - Approved doctor account
  - Patient account
- Keep one pending doctor ready for approval demo.

## Live demo script
1. Show landing + doctor search/filter quickly.
2. Patient login -> open doctor profile -> book slot with payment ref.
3. Doctor login -> show pending request -> confirm.
4. Patient dashboard -> show status update, then reschedule.
5. Doctor dashboard -> show reschedule notification toast.
6. Patient dashboard -> submit review.
7. Admin login -> approve doctor, manage users, monitor appointments, open feedbacks.

## Narration line
"The key point is server-side enforcement. Even if UI is bypassed, booking still fails if rules are violated."

---

## 13. High-Probability Viva Questions and Strong Answers

## A. Architecture
Q1. Why did you choose a monorepo with separate frontend/backend folders?
A: It keeps separation of concerns while making development and submission simple. Backend API and frontend UI are decoupled but versioned together.

Q2. Why React + Express instead of full-stack framework?
A: This project focuses on explicit API design and role-based backend logic. React + Express gave full control over route-level security and SQL operations.

Q3. How does data flow from UI to DB?
A: UI calls `api.js` wrapper, backend route hits middleware, controller validates business rules, SQL executes through pg pool, JSON result returns to UI.

Q4. Why PostgreSQL?
A: Strong relational consistency, foreign keys, constraints, and SQL aggregation for ratings/feedback.

Q5. How is role isolation handled?
A: Route-level middleware checks JWT and then role. Some routes add extra doctor-approval middleware.

## B. Authentication and Security
Q6. How are passwords stored?
A: bcrypt hash with salt rounds, never plain text.

Q7. How do you verify users from token?
A: JWT decode + DB lookup every request in auth middleware; blocked users are denied.

Q8. Can blocked users still use old token?
A: No. Middleware checks `is_active` from DB on each protected request.

Q9. Are SQL injection attacks prevented?
A: Yes, all queries use parameterized placeholders (`$1`, `$2`, ...).

Q10. Why is localStorage token a risk?
A: If XSS exists, token can be read. In production we should move to httpOnly secure cookies + CSRF strategy.

## C. Booking Logic
Q11. What prevents double booking?
A: Two layers: query check before insert + partial unique index on doctor/date/time for active statuses.

Q12. Why validate booking on backend if frontend already filters slots?
A: Frontend can be bypassed. Backend is final source of truth.

Q13. Why weekdays only and 10:00-16:00?
A: Defined clinic business policy in current scope. Centralized in `validateClinicSlot` for maintainability.

Q14. How do you verify payment?
A: Current phase validates method/ref/amount matching consultation fee and records payment. Real gateway callback verification is future scope.

Q15. Why use transaction in booking?
A: To ensure appointment and payment are either both written or both rolled back.

## D. Doctor Approval
Q16. Why block doctor login before approval?
A: Prevents unverified practitioners from accessing doctor operations and being bookable.

Q17. What if doctor is approved but account is blocked later?
A: Middleware checks `is_active`, so blocked account loses access regardless of approval state.

Q18. Can non-approved doctor set availability?
A: No. Availability set route includes `requireApprovedDoctor`.

## E. Reviews and Feedback
Q19. How do you stop fake reviews?
A: Only patient owner can review, one review per appointment, and review only after appointment completion time/status.

Q20. Why keep contact feedback separate from reviews?
A: Different semantics. Contact feedback is general support input, while reviews are appointment-linked ratings.

Q21. How do you show both feedback types in admin page?
A: SQL `UNION ALL` merges review and contact entries into one unified feed.

## F. Database and Integrity
Q22. Why one doctor profile per user?
A: `doctors.user_id` is unique to enforce one-to-one relationship.

Q23. Why one availability row per doctor?
A: `doctor_availability.doctor_id` unique for simpler schedule management.

Q24. Why one payment per appointment?
A: `payments.appointment_id` unique; this model assumes one consultation payment per booking.

Q25. Why one review per appointment?
A: `reviews.appointment_id` unique to prevent rating spam.

Q26. Why keep `appointment_status_history` table if unused?
A: It is pre-structured for future audit logging and analytics; current MVP focuses on core booking workflows.

Q27. Why keep `notifications` table if not fully integrated?
A: Designed for extensibility toward persistent in-app/email notification channels.

## G. Frontend Design and State
Q28. Why use context for auth?
A: Session state is needed across route guards, headers, and dashboards.

Q29. Why a shared API wrapper?
A: Ensures consistent error handling and token injection without repeating fetch code.

Q30. How are dashboards personalized?
A: Backend returns role-specific data, and frontend routes are role-guarded via `PrivateRoute`.

Q31. How is UX feedback handled?
A: Toast and confirm dialog centralized in `UiFeedbackContext`.

Q32. How does slot picker work?
A: Reads doctor availability, computes next weekdays and slot intervals, and disables past slots for today.

## H. Admin Governance
Q33. Can admin block/delete self?
A: No. Backend explicitly prevents self block/delete for safety.

Q34. What are admin’s core controls?
A: Doctor approvals, user account governance, appointment monitoring, feedback/review monitoring.

Q35. How does admin identify pending doctors?
A: Query on `doctors.is_approved = false` joined with user profile details.

## I. Deployment and Operations
Q36. How do frontend and backend communicate in dev?
A: Vite proxy forwards `/api` to `http://localhost:5000`.

Q37. What env vars are required?
A: `JWT_SECRET`, DB connection values (`DATABASE_URL` or DB_HOST/DB_USER/DB_PASSWORD/DB_NAME/DB_PORT), optional `DB_SSL`, optional `PORT`.

Q38. What happens if DB is down at startup?
A: Server fails startup intentionally after connection test; avoids serving broken API.

## J. Limitations and Future Scope
Q39. Biggest current limitation?
A: Payment verification is simulated; no real payment gateway callback or webhook verification yet.

Q40. Another limitation?
A: No automated test suite currently.

Q41. Another limitation?
A: No true appointment completion endpoint; review uses current time condition as fallback.

Q42. If given next sprint, what will you implement first?
A: Status-history logging, real payment verification, and role-based audit logs.

---

## 14. Honest Limitations (Say This Confidently)

- `appointment_status_history` and `notifications` tables are provisioned but not yet fully used in controllers.
- `utils/emailService.js` is currently an empty placeholder.
- Payment step currently validates input and amount but does not verify against external gateway callback.
- No automated unit/integration tests yet.
- Token persistence is localStorage based.

Framing line for viva:
"I intentionally completed a stable MVP with strict booking constraints and role governance first, and I prepared clean extension points for audit logs, notifications, and real payment integration."

---

## 15. Improvement Roadmap (You Can Present as Future Work)

1. Write status transitions into `appointment_status_history` on every confirm/cancel/reschedule action.
2. Add real payment gateway webhook verification.
3. Move JWT to secure httpOnly cookie model.
4. Add rate limiting and request validation library.
5. Add automated tests:
   - Controller unit tests
   - API integration tests
   - Booking conflict regression tests
6. Add appointment completion endpoint and follow-up workflow.
7. Use persistent notification table + email service integration.

---

## 16. Quick Commands Cheat Sheet

Backend:
```bash
cd Backend
npm install
npm run dev
```

Frontend:
```bash
cd Frontend
npm install
npm run dev
```

Frontend production build:
```bash
cd Frontend
npm run build
```

---

## 17. Final 1-Minute Closing Statement

"AppointMate solves real scheduling pain using strict backend validation, role-based governance, and a clean full-stack architecture. The strongest part of this system is not only the UI but the server-side safeguards that prevent invalid booking, enforce doctor approval, and preserve data integrity in PostgreSQL. I also designed extension-ready components for notifications, audit trails, and payment hardening, so this MVP can scale into production-grade healthcare operations."

