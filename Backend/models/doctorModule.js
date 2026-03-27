const pool = require("../config/db");

const createDoctorTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS doctors (
      id SERIAL PRIMARY KEY,
      user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      specialization VARCHAR(100) NOT NULL,
      experience INTEGER,
      hospital VARCHAR(150),
      qualification VARCHAR(150),
      license_number VARCHAR(120),
      phone VARCHAR(20),
      profile_image_url TEXT,
      bio TEXT,
      consultation_fee NUMERIC(10,2),
      is_approved BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(query);
    await pool.query(
      "ALTER TABLE doctors ADD COLUMN IF NOT EXISTS qualification VARCHAR(150), ADD COLUMN IF NOT EXISTS license_number VARCHAR(120), ADD COLUMN IF NOT EXISTS phone VARCHAR(20), ADD COLUMN IF NOT EXISTS profile_image_url TEXT, ADD COLUMN IF NOT EXISTS bio TEXT, ADD COLUMN IF NOT EXISTS consultation_fee NUMERIC(10,2), ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE, ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
    );
    console.log("Doctors table ready");
  } catch (error) {
    console.error("Error creating doctors table:", error);
  }
};

module.exports = createDoctorTable;
