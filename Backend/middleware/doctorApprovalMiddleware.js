const pool = require("../config/db");

const requireApprovedDoctor = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "doctor") {
      return res.status(403).json({ message: "Doctor access required" });
    }

    const result = await pool.query(
      "SELECT id, is_approved FROM doctors WHERE user_id = $1",
      [req.user.id],
    );

    if (result.rows.length === 0) {
      return res
        .status(400)
        .json({ message: "Create your doctor profile before this action" });
    }

    if (!result.rows[0].is_approved) {
      return res
        .status(403)
        .json({ message: "Doctor profile is pending admin approval" });
    }

    req.doctorProfile = result.rows[0];
    next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { requireApprovedDoctor };
