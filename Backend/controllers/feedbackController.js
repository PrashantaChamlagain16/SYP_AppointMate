const pool = require("../config/db");

exports.createFeedback = async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    const email = String(req.body?.email || "").trim();
    const message = String(req.body?.message || "").trim();

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    const result = await pool.query(
      `INSERT INTO feedbacks (name, email, message)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, message, created_at`,
      [name || null, email || null, message],
    );

    return res.status(201).json({
      message: "Feedback submitted successfully",
      feedback: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
