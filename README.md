# AppointMate

AppointMate is a full-stack medical appointment management system with role-based workflows for patients, doctors, and admins.

## Core Features

## Patient
- Register and login
- Browse approved doctors by name and specialization
- View doctor profile, consultation fee, and ratings
- Book appointments with payment details
- Cancel or reschedule appointments
- Submit post-appointment reviews

## Doctor
- Register with professional credentials
- Wait for admin approval before access
- Manage profile and consultation fee
- Set weekly availability and slot duration
- View and act on pending appointment requests
- Track full appointment timeline and reschedule notifications

## Admin
- Approve pending doctor profiles
- Block, unblock, and delete users
- Monitor all appointments in the system
- View merged feedback stream (contact feedback + reviews)

## Tech Stack

- Frontend: React, React Router, Vite
- Backend: Node.js, Express
- Database: PostgreSQL
- Auth: JWT + role-based middleware
- Security: bcrypt password hashing, parameterized SQL queries

## Project Structure

```text
03 Developments/
  Backend/
    config/
    constants/
    controllers/
    docs/
    middleware/
    models/
    routes/
    utils/
    server.js
  Frontend/
    src/
      components/
      constants/
      pages/
      state/
      utils/
```

## Prerequisites

- Node.js (18+ recommended)
- npm
- PostgreSQL

## Environment Variables

Create `Backend/.env`:

```env
PORT=5000
JWT_SECRET=your_strong_secret

# Option A: full connection URL
DATABASE_URL=postgresql://user:password@localhost:5432/appointmate

# Option B: individual fields (used if DATABASE_URL is not set)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=appointmate

# Optional
DB_SSL=false
```

## Run Locally

## 1) Backend

```bash
cd Backend
npm install
npm run dev
```

Backend runs on `http://localhost:5000`.

## 2) Frontend

```bash
cd Frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

Vite proxy is already configured, so frontend calls `/api` and forwards to backend.

## Build

## Frontend production build

```bash
cd Frontend
npm run build
npm run preview
```

## Backend production start

```bash
cd Backend
npm start
```

## Notes

- Database tables are auto-created on backend startup from model scripts.
- Doctor accounts must be approved by admin before doctor login is allowed.
- Payment in current version is validation + record storage (not gateway callback verification).
- `Backend/utils/emailService.js` is currently a placeholder.

## Important Docs

- Viva guide: [VIVA_WALKTHROUGH.md](./VIVA_WALKTHROUGH.md)
- ERD guide: [Backend/docs/ERD_WALKTHROUGH.md](./Backend/docs/ERD_WALKTHROUGH.md)

