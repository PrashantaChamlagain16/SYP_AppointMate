# AppointMate ERD Walkthrough

## 1. Confirm Database and Tables
Use pgAdmin Query Tool on database `appointmate`:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Expected core tables:
- `users`
- `doctors`
- `doctor_availability`
- `appointments`
- `appointment_status_history`
- `notifications`
- `payments`

## 2. Identify Keys (PK/FK)

### Primary Keys
- `users.id`
- `doctors.id`
- `doctor_availability.id`
- `appointments.id`
- `appointment_status_history.id`
- `notifications.id`
- `payments.id`

### Foreign Keys
- `doctors.user_id -> users.id`
- `doctor_availability.doctor_id -> doctors.id`
- `appointments.patient_id -> users.id`
- `appointments.doctor_id -> doctors.id`
- `appointment_status_history.appointment_id -> appointments.id`
- `appointment_status_history.changed_by_user_id -> users.id`
- `notifications.user_id -> users.id`
- `notifications.appointment_id -> appointments.id`
- `payments.appointment_id -> appointments.id`
- `payments.patient_id -> users.id`
- `payments.doctor_id -> doctors.id`

## 3. Create ERD in pgAdmin
1. Open pgAdmin.
2. Go to `Databases > appointmate > Schemas > public`.
3. Right-click `public` (or `Tables`) and choose ERD/Generate ERD tool.
4. Add all 7 tables.
5. Make sure relation lines appear automatically from FKs.
6. Rearrange layout:
   - Put `users` at center/top.
   - Put `doctors` near `users`.
   - Put `appointments` at center.
   - Put `appointment_status_history`, `notifications`, `payments` around `appointments`.
   - Put `doctor_availability` near `doctors`.
7. Export as PNG/PDF and keep it in project docs for submission.

## 4. Relationship Cardinality (for report)
- `users (1) -> (0..1) doctors`
- `doctors (1) -> (0..*) doctor_availability`
- `users (1) -> (0..*) appointments` (as patient)
- `doctors (1) -> (0..*) appointments`
- `appointments (1) -> (0..*) appointment_status_history`
- `users (1) -> (0..*) appointment_status_history` (changed_by)
- `users (1) -> (0..*) notifications`
- `appointments (1) -> (0..*) notifications`
- `appointments (1) -> (0..1) payments` (because `payments.appointment_id` is UNIQUE)
- `users (1) -> (0..*) payments` (patient)
- `doctors (1) -> (0..*) payments`

## 5. Optional: Verify FK Metadata in SQL
```sql
SELECT
  conrelid::regclass AS table_name,
  conname AS fk_name
FROM pg_constraint
WHERE contype = 'f'
  AND connamespace = 'public'::regnamespace
ORDER BY conrelid::regclass::text, conname;
```

## 6. What to Share with Teacher
- ERD image (`.png`/`.pdf`)
- This walkthrough file
- Backend code with table models in `Backend/models`
- SQL backup file (`pg_dump`) if data snapshot is required
