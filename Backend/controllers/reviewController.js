const pool = require("../config/db");

const reviewEligibilityClause = `
  (
    a.status = 'completed'
    OR (
      a.status = 'confirmed'
      AND (a.appointment_date + a.appointment_time) <= CURRENT_TIMESTAMP
    )
  )
`;

exports.createReview = async (req, res) => {
  try {
    if (req.user.role !== "patient") {
      return res.status(403).json({ message: "Only patients can submit reviews" });
    }

    const { appointment_id, rating, comment } = req.body;
    const parsedAppointmentId = Number(appointment_id);
    const parsedRating = Number(rating);

    if (!Number.isInteger(parsedAppointmentId) || parsedAppointmentId <= 0) {
      return res.status(400).json({ message: "Valid appointment_id is required" });
    }
    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ message: "Rating must be an integer between 1 and 5" });
    }

    const appointmentResult = await pool.query(
      `SELECT a.id, a.doctor_id, a.patient_id, a.status, a.appointment_date, a.appointment_time
       FROM appointments a
       WHERE a.id = $1`,
      [parsedAppointmentId],
    );

    if (appointmentResult.rows.length === 0) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const appointment = appointmentResult.rows[0];

    if (appointment.patient_id !== req.user.id) {
      return res.status(403).json({ message: "You can rate only your own appointments" });
    }

    const eligibilityResult = await pool.query(
      `SELECT a.id
       FROM appointments a
       WHERE a.id = $1 AND ${reviewEligibilityClause}`,
      [parsedAppointmentId],
    );
    if (eligibilityResult.rows.length === 0) {
      return res.status(400).json({
        message:
          "Review can be submitted only after appointment completion time (or when status is completed)",
      });
    }

    const existingReview = await pool.query(
      "SELECT id FROM reviews WHERE appointment_id = $1",
      [parsedAppointmentId],
    );
    if (existingReview.rows.length > 0) {
      return res.status(400).json({ message: "This appointment has already been reviewed" });
    }

    const created = await pool.query(
      `INSERT INTO reviews (appointment_id, doctor_id, patient_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        parsedAppointmentId,
        appointment.doctor_id,
        req.user.id,
        parsedRating,
        typeof comment === "string" && comment.trim() ? comment.trim() : null,
      ],
    );

    return res.status(201).json({
      message: "Review submitted successfully",
      review: created.rows[0],
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getDoctorReviews = async (req, res) => {
  try {
    const doctorId = Number(req.params.doctorId);
    if (!Number.isInteger(doctorId) || doctorId <= 0) {
      return res.status(400).json({ message: "Invalid doctor id" });
    }

    const summaryResult = await pool.query(
      `SELECT
        ROUND(AVG(r.rating)::numeric, 2) AS average_rating,
        COUNT(*)::int AS review_count
       FROM reviews r
       WHERE r.doctor_id = $1`,
      [doctorId],
    );

    const reviewsResult = await pool.query(
      `SELECT
        r.id,
        r.rating,
        r.comment,
        r.created_at,
        u.name AS patient_name
       FROM reviews r
       JOIN users u ON u.id = r.patient_id
       WHERE r.doctor_id = $1
       ORDER BY r.created_at DESC
       LIMIT 30`,
      [doctorId],
    );

    return res.status(200).json({
      average_rating: Number(summaryResult.rows[0]?.average_rating || 0),
      review_count: Number(summaryResult.rows[0]?.review_count || 0),
      reviews: reviewsResult.rows,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getMyPendingReviews = async (req, res) => {
  try {
    if (req.user.role !== "patient") {
      return res.status(403).json({ message: "Only patients can access pending reviews" });
    }

    const result = await pool.query(
      `SELECT
         a.id AS appointment_id,
         a.appointment_date,
         a.appointment_time,
         a.status,
         a.doctor_id,
         du.name AS doctor_name,
         d.specialization
       FROM appointments a
       JOIN doctors d ON d.id = a.doctor_id
       JOIN users du ON du.id = d.user_id
       LEFT JOIN reviews r ON r.appointment_id = a.id
       WHERE a.patient_id = $1
         AND r.id IS NULL
         AND ${reviewEligibilityClause}
       ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
      [req.user.id],
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
