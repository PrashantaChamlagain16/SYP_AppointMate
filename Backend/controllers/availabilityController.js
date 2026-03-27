const pool = require("../config/db");

// SET DOCTOR AVAILABILITY
exports.setAvailability = async (req, res) => {
  try {
    const { available_days, start_time, end_time, slot_duration } = req.body;

    if (!available_days || !start_time || !end_time) {
      return res.status(400).json({ message: "All fields required" });
    }

    const doctorResult = await pool.query(
      "SELECT id FROM doctors WHERE user_id = $1",
      [req.user.id],
    );

    if (doctorResult.rows.length === 0) {
      return res.status(400).json({ message: "Doctor profile not found" });
    }

    const doctor_id = doctorResult.rows[0].id;

    const existing = await pool.query(
      "SELECT * FROM doctor_availability WHERE doctor_id = $1",
      [doctor_id],
    );

    let result;
    if (existing.rows.length > 0) {
      // Update existing
      result = await pool.query(
        `UPDATE doctor_availability 
         SET available_days=$2, start_time=$3, end_time=$4, slot_duration=$5, updated_at=CURRENT_TIMESTAMP
         WHERE doctor_id=$1 RETURNING *`,
        [doctor_id, available_days, start_time, end_time, slot_duration || 30],
      );
    } else {
      // Create new
      result = await pool.query(
        `INSERT INTO doctor_availability (doctor_id, available_days, start_time, end_time, slot_duration)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [doctor_id, available_days, start_time, end_time, slot_duration || 30],
      );
    }

    res.status(201).json({
      message: "Availability set successfully",
      availability: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET DOCTOR AVAILABILITY
exports.getAvailability = async (req, res) => {
  try {
    const { doctor_id } = req.params;

    const availability = await pool.query(
      "SELECT * FROM doctor_availability WHERE doctor_id = $1",
      [doctor_id],
    );

    if (availability.rows.length === 0) {
      return res.status(404).json({ message: "Availability not set" });
    }

    res.status(200).json(availability.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// GET OWN AVAILABILITY (for doctor profile)
exports.getMyAvailability = async (req, res) => {
  try {
    const doctorResult = await pool.query(
      "SELECT id FROM doctors WHERE user_id = $1",
      [req.user.id],
    );

    if (doctorResult.rows.length === 0) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    const doctor_id = doctorResult.rows[0].id;
    const availability = await pool.query(
      "SELECT * FROM doctor_availability WHERE doctor_id = $1",
      [doctor_id],
    );

    if (availability.rows.length === 0) {
      return res.status(200).json(null); // Return null if not set yet
    }

    res.status(200).json(availability.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
