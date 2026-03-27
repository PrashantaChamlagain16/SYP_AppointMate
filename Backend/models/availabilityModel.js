const pool = require("../config/db");

const createAvailabilityTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS doctor_availability (
      id SERIAL PRIMARY KEY,
      doctor_id INTEGER UNIQUE REFERENCES doctors(id) ON DELETE CASCADE,
      available_days VARCHAR(50),
      start_time TIME,
      end_time TIME,
      slot_duration INTEGER DEFAULT 30,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(query);
    await pool.query(
      "ALTER TABLE doctor_availability ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
    );
    console.log("Doctor availability table ready");
  } catch (error) {
    console.error("Error creating availability table:", error);
  }
};

module.exports = createAvailabilityTable;
