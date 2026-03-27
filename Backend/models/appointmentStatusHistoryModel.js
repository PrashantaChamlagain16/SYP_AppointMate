const pool = require("../config/db");

const createAppointmentStatusHistoryTable = async () => {
  const repairMalformedTableQuery = `
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'appointment_status_history'
      )
      AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'appointment_status_history'
      ) THEN
        DROP TABLE appointment_status_history;
      END IF;
    END $$;
  `;

  const query = `
    CREATE TABLE IF NOT EXISTS appointment_status_history (
      id SERIAL PRIMARY KEY,
      appointment_id INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
      old_status VARCHAR(20),
      new_status VARCHAR(20) NOT NULL,
      changed_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      note TEXT,
      changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(repairMalformedTableQuery);
    await pool.query(query);
    await pool.query(
      "ALTER TABLE appointment_status_history ADD COLUMN IF NOT EXISTS old_status VARCHAR(20), ADD COLUMN IF NOT EXISTS new_status VARCHAR(20), ADD COLUMN IF NOT EXISTS note TEXT, ADD COLUMN IF NOT EXISTS changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
    );
    await pool.query(
      "ALTER TABLE appointment_status_history ADD COLUMN IF NOT EXISTS appointment_id INTEGER, ADD COLUMN IF NOT EXISTS changed_by_user_id INTEGER",
    );
    await pool.query(
      `DO $$
       BEGIN
         IF NOT EXISTS (
           SELECT 1
           FROM pg_constraint
           WHERE conname = 'appointment_status_history_appointment_id_fkey'
         ) THEN
           ALTER TABLE appointment_status_history
           ADD CONSTRAINT appointment_status_history_appointment_id_fkey
           FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE;
         END IF;
       END $$;`,
    );
    await pool.query(
      `DO $$
       BEGIN
         IF NOT EXISTS (
           SELECT 1
           FROM pg_constraint
           WHERE conname = 'appointment_status_history_changed_by_user_id_fkey'
         ) THEN
           ALTER TABLE appointment_status_history
           ADD CONSTRAINT appointment_status_history_changed_by_user_id_fkey
           FOREIGN KEY (changed_by_user_id) REFERENCES users(id) ON DELETE SET NULL;
         END IF;
       END $$;`,
    );
    console.log("Appointment status history table ready");
  } catch (error) {
    console.error("Error creating appointment_status_history table:", error);
  }
};

module.exports = createAppointmentStatusHistoryTable;
