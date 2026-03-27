const pool = require("../config/db");

const createFeedbackTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS feedbacks (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120),
      email VARCHAR(255),
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(query);
    console.log("Feedbacks table ready");
  } catch (error) {
    console.error("Error creating feedbacks table:", error);
  }
};

module.exports = createFeedbackTable;
