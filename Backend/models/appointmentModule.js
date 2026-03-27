const pool = require("../config/db");

const createAppointmentTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS appointments (
      id SERIAL PRIMARY KEY,
      patient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
      appointment_date DATE NOT NULL,
      appointment_time TIME NOT NULL,
      reason TEXT,
      status VARCHAR(20)
        CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed'))
        DEFAULT 'pending',
      cancelled_by VARCHAR(20),
      cancellation_reason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(query);
    await pool.query(
      "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reason TEXT, ADD COLUMN IF NOT EXISTS cancelled_by VARCHAR(20), ADD COLUMN IF NOT EXISTS cancellation_reason TEXT, ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, ADD COLUMN IF NOT EXISTS rescheduled_by_patient BOOLEAN DEFAULT FALSE, ADD COLUMN IF NOT EXISTS doctor_reschedule_notified_at TIMESTAMP",
    );
    await pool.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS unique_active_doctor_slot
       ON appointments (doctor_id, appointment_date, appointment_time)
       WHERE status IN ('pending', 'confirmed')`,
    );
    console.log("Appointments table ready");
  } catch (error) {
    console.error("Error creating appointments table:", error);
  }
};

module.exports = createAppointmentTable;
