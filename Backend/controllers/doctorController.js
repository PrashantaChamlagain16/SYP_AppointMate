const pool = require("../config/db");
const { DEFAULT_DOCTOR_IMAGE } = require("../constants/defaultImages");

const normalizeDoctorImage = (input, allowNull = false) => {
  if (input === undefined) return allowNull ? null : DEFAULT_DOCTOR_IMAGE;
  if (typeof input === "string" && input.trim()) return input.trim();
  return DEFAULT_DOCTOR_IMAGE;
};

// CREATE DOCTOR PROFILE
exports.createDoctorProfile = async (req, res) => {
  try {
    const {
      specialization,
      experience,
      hospital,
      qualification,
      license_number,
      phone,
      profile_image_url,
      bio,
      consultation_fee,
    } = req.body;
    const userId = req.user.id; // from auth middleware

    if (!specialization || !qualification || !license_number || !phone) {
      return res.status(400).json({
        message:
          "Specialization, qualification, license number, and phone are required",
      });
    }

    const doctorExists = await pool.query(
      "SELECT * FROM doctors WHERE user_id = $1",
      [userId],
    );

    if (doctorExists.rows.length > 0) {
      return res.status(400).json({
        message:
          "Doctor profile already exists. Use update profile endpoint instead.",
      });
    }

    const result = await pool.query(
      `INSERT INTO doctors (user_id, specialization, experience, hospital, qualification, license_number, phone, profile_image_url, bio, consultation_fee, is_approved)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, FALSE) RETURNING *`,
      [
        userId,
        specialization,
        experience || null,
        hospital || null,
        qualification,
        license_number,
        phone,
        normalizeDoctorImage(profile_image_url),
        bio || null,
        consultation_fee || null,
      ],
    );

    res.status(201).json({
      message: "Doctor profile created and submitted for admin approval",
      doctor: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE DOCTOR PROFILE
exports.updateDoctorProfile = async (req, res) => {
  try {
    const {
      specialization,
      experience,
      hospital,
      qualification,
      license_number,
      phone,
      profile_image_url,
      bio,
      consultation_fee,
    } = req.body;
    const userId = req.user.id;

    const doctorResult = await pool.query(
      "SELECT id FROM doctors WHERE user_id = $1",
      [userId],
    );

    if (doctorResult.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Doctor profile not found. Create it first." });
    }

    const result = await pool.query(
      `UPDATE doctors
       SET specialization = COALESCE($2, specialization),
           experience = COALESCE($3, experience),
           hospital = COALESCE($4, hospital),
           qualification = COALESCE($5, qualification),
           license_number = COALESCE($6, license_number),
           phone = COALESCE($7, phone),
           profile_image_url = COALESCE($8, profile_image_url),
           bio = COALESCE($9, bio),
           consultation_fee = COALESCE($10, consultation_fee),
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1
       RETURNING *`,
      [
        userId,
        specialization || null,
        experience ?? null,
        hospital || null,
        qualification || null,
        license_number || null,
        phone || null,
        normalizeDoctorImage(profile_image_url, true),
        bio || null,
        consultation_fee ?? null,
      ],
    );

    res.status(200).json({
      message: "Doctor profile updated successfully",
      doctor: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET CURRENT DOCTOR PROFILE
exports.getMyDoctorProfile = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.*, u.name, u.email, u.is_active
       FROM doctors d
       JOIN users u ON d.user_id = u.id
       WHERE d.user_id = $1`,
      [req.user.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL DOCTORS
exports.getAllDoctors = async (req, res) => {
  try {
    const { specialization, name } = req.query;

    const filters = ["d.is_approved = TRUE", "u.is_active = TRUE"];
    const params = [];

    if (name) {
      params.push(`%${name}%`);
      filters.push(`u.name ILIKE $${params.length}`);
    }

    if (specialization) {
      params.push(`%${specialization}%`);
      filters.push(`d.specialization ILIKE $${params.length}`);
    }

    const doctors = await pool.query(`
      SELECT
        d.id,
        u.name,
        d.specialization,
        d.experience,
        d.hospital,
        d.qualification,
        d.profile_image_url,
        d.bio,
        d.consultation_fee,
        COALESCE(rv.avg_rating, 0) AS average_rating,
        COALESCE(rv.review_count, 0) AS review_count
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      LEFT JOIN (
        SELECT
          doctor_id,
          ROUND(AVG(rating)::numeric, 2) AS avg_rating,
          COUNT(*)::int AS review_count
        FROM reviews
        GROUP BY doctor_id
      ) rv ON rv.doctor_id = d.id
      WHERE ${filters.join(" AND ")}
      ORDER BY d.created_at DESC
    `, params);

    res.status(200).json(doctors.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET DOCTOR BY ID
exports.getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await pool.query(
      `SELECT
        d.*,
        u.name,
        u.email,
        COALESCE(rv.avg_rating, 0) AS average_rating,
        COALESCE(rv.review_count, 0) AS review_count
       FROM doctors d
       JOIN users u ON d.user_id = u.id
       LEFT JOIN (
         SELECT
           doctor_id,
           ROUND(AVG(rating)::numeric, 2) AS avg_rating,
           COUNT(*)::int AS review_count
         FROM reviews
         GROUP BY doctor_id
       ) rv ON rv.doctor_id = d.id
       WHERE d.id = $1 AND d.is_approved = TRUE AND u.is_active = TRUE`,
      [id],
    );

    if (doctor.rows.length === 0) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.status(200).json(doctor.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
