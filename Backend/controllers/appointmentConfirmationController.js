const pool = require("../config/db");

// CONFIRM APPOINTMENT (Doctor accepts)
exports.confirmAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = req.user.id;

    // Check if appointment exists and belongs to this doctor
    const appointment = await pool.query(
      `SELECT a.*, d.user_id FROM appointments a 
       JOIN doctors d ON a.doctor_id = d.id WHERE a.id = $1`,
      [id],
    );

    if (appointment.rows.length === 0) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (appointment.rows[0].user_id !== doctorId) {
      return res
        .status(403)
        .json({ message: "Not authorized to confirm this appointment" });
    }
    if (appointment.rows[0].status !== "pending") {
      return res
        .status(400)
        .json({ message: "Only pending appointments can be confirmed" });
    }

    const result = await pool.query(
      `UPDATE appointments SET status='confirmed', updated_at=CURRENT_TIMESTAMP WHERE id=$1 RETURNING *`,
      [id],
    );

    res.status(200).json({
      message: "Appointment confirmed",
      appointment: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// REJECT APPOINTMENT (Doctor rejects)
exports.rejectAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = req.user.id;

    const appointment = await pool.query(
      `SELECT a.*, d.user_id FROM appointments a 
       JOIN doctors d ON a.doctor_id = d.id WHERE a.id = $1`,
      [id],
    );

    if (appointment.rows.length === 0) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (appointment.rows[0].user_id !== doctorId) {
      return res.status(403).json({ message: "Not authorized" });
    }
    if (appointment.rows[0].status !== "pending") {
      return res
        .status(400)
        .json({ message: "Only pending appointments can be rejected" });
    }

    const result = await pool.query(
      `UPDATE appointments
       SET status='cancelled',
           cancelled_by='doctor',
           updated_at=CURRENT_TIMESTAMP
       WHERE id=$1 RETURNING *`,
      [id],
    );

    res.status(200).json({
      message: "Appointment rejected",
      appointment: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET PENDING APPOINTMENTS (For Doctor)
exports.getPendingAppointments = async (req, res) => {
  try {
    const userId = req.user.id;

    // First get the doctor profile
    const doctorProfile = await pool.query(
      "SELECT id FROM doctors WHERE user_id = $1",
      [userId],
    );

    if (doctorProfile.rows.length === 0) {
      return res
        .status(400)
        .json({ message: "Please create a doctor profile first" });
    }

    const doctorId = doctorProfile.rows[0].id;

    const appointments = await pool.query(
      `SELECT a.*, u.name AS patient_name, u.email
       FROM appointments a
       JOIN users u ON a.patient_id = u.id
       WHERE a.doctor_id = $1 AND a.status = 'pending'`,
      [doctorId],
    );

    res.status(200).json(appointments.rows);
  } catch (error) {
    console.error("Get pending appointments error:", error);
    res
      .status(500)
      .json({ message: error.message || "Error fetching appointments" });
  }
};
