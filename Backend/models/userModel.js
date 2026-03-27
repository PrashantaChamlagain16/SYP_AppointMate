const pool = require("../config/db");

const createUserTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password TEXT NOT NULL,
      phone VARCHAR(20),
      gender VARCHAR(20),
      dob DATE,
      address TEXT,
      profile_image_url TEXT,
      role VARCHAR(20)
        CHECK (role IN ('admin', 'doctor', 'patient'))
        NOT NULL DEFAULT 'patient',
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(query);
    await pool.query(
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20), ADD COLUMN IF NOT EXISTS gender VARCHAR(20), ADD COLUMN IF NOT EXISTS dob DATE, ADD COLUMN IF NOT EXISTS address TEXT, ADD COLUMN IF NOT EXISTS profile_image_url TEXT",
    );
    console.log("Users table ready");
  } catch (error) {
    console.error("Error creating users table:", error);
  }
};

module.exports = createUserTable;
