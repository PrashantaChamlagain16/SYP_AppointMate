const pool = require("../config/db");

// GET ALL USERS
exports.getAllUsers = async (req, res) => {
  try {
    const users = await pool.query(`
      SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.is_active,
        d.id AS doctor_profile_id,
        d.is_approved AS doctor_is_approved
      FROM users u
      LEFT JOIN doctors d ON d.user_id = u.id
      ORDER BY u.id ASC
    `);

    res.status(200).json(users.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// BLOCK USER
exports.blockUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (Number(id) === req.user.id) {
      return res.status(400).json({ message: "Admin cannot block own account" });
    }

    const result = await pool.query(
      "UPDATE users SET is_active = FALSE WHERE id = $1 RETURNING id, name, email, role, is_active",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User blocked successfully", user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UNBLOCK USER
exports.unblockUser = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "UPDATE users SET is_active = TRUE WHERE id = $1 RETURNING id, name, email, role, is_active",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User unblocked successfully", user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE USER
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (Number(id) === req.user.id) {
      return res.status(400).json({ message: "Admin cannot delete own account" });
    }

    const result = await pool.query(
      "DELETE FROM users WHERE id = $1 RETURNING id, name, email, role",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "User deleted successfully",
      user: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// VIEW ALL APPOINTMENTS
exports.getAllAppointments = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        a.id,
        p.name AS patient_name,
        p.email AS patient_email,
        du.name AS doctor_name,
        du.email AS doctor_email,
        d.id AS doctor_id,
        d.specialization,
        a.appointment_date,
        a.appointment_time,
        a.status,
        a.reason,
        a.cancelled_by,
        a.cancellation_reason
      FROM appointments a
      JOIN users p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users du ON d.user_id = du.id
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `);

    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET PENDING DOCTOR APPROVALS
exports.getPendingDoctors = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.id, d.user_id, u.name, u.email, d.specialization, d.experience, d.hospital, d.qualification, d.license_number, d.phone, d.bio, d.consultation_fee, d.created_at
       FROM doctors d
       JOIN users u ON d.user_id = u.id
       WHERE d.is_approved = FALSE
       ORDER BY d.created_at ASC`,
    );
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// APPROVE DOCTOR PROFILE
exports.approveDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const result = await pool.query(
      `UPDATE doctors
       SET is_approved = TRUE, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [doctorId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    res.status(200).json({
      message: "Doctor profile approved successfully",
      doctor: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL FEEDBACKS (REVIEWS)
exports.getAllFeedbacks = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM (
        SELECT
          CONCAT('review-', r.id) AS entry_id,
          'review' AS source,
          r.created_at,
          u.name AS patient_name,
          du.name AS doctor_name,
          r.rating,
          COALESCE(NULLIF(TRIM(r.comment), ''), CONCAT('Rating: ', r.rating, '/5')) AS comment
        FROM reviews r
        JOIN users u ON u.id = r.patient_id
        JOIN doctors d ON d.id = r.doctor_id
        JOIN users du ON du.id = d.user_id

        UNION ALL

        SELECT
          CONCAT('contact-', f.id) AS entry_id,
          'contact' AS source,
          f.created_at,
          COALESCE(NULLIF(TRIM(f.name), ''), 'Anonymous') AS patient_name,
          NULL::text AS doctor_name,
          NULL::int AS rating,
          f.message AS comment
        FROM feedbacks f
      ) all_feedbacks
      ORDER BY created_at DESC
    `);

    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
