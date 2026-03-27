const pool = require("../config/db");

const createReviewTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      appointment_id INTEGER UNIQUE NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
      doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
      patient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      comment TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(query);
    await pool.query(
      "ALTER TABLE reviews ADD COLUMN IF NOT EXISTS comment TEXT, ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
    );
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_reviews_doctor_created
       ON reviews (doctor_id, created_at DESC)`,
    );
    console.log("Reviews table ready");
  } catch (error) {
    console.error("Error creating reviews table:", error);
  }
};

module.exports = createReviewTable;
