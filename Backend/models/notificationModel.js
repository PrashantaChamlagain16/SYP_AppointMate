const pool = require("../config/db");

const createNotificationTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      appointment_id INTEGER REFERENCES appointments(id) ON DELETE CASCADE,
      type VARCHAR(30) NOT NULL,
      title VARCHAR(150) NOT NULL,
      message TEXT NOT NULL,
      channel VARCHAR(20) DEFAULT 'in_app'
        CHECK (channel IN ('in_app', 'email', 'sms')),
      is_read BOOLEAN DEFAULT FALSE,
      sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(query);
    console.log("Notifications table ready");
  } catch (error) {
    console.error("Error creating notifications table:", error);
  }
};

module.exports = createNotificationTable;
