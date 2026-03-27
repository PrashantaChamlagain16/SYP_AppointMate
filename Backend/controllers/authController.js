const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const ALLOWED_ROLES = new Set(["doctor", "patient"]);
const { DEFAULT_DOCTOR_IMAGE } = require("../constants/defaultImages");
const ALLOWED_SPECIALIZATIONS = new Set([
  "Neurologist",
  "General Physician",
  "Gynecologist",
  "Pediatrician",
  "Dermatologist",
  "Dentist",
  "Orthopedic",
  "Cardiologist",
]);

// REGISTER
exports.register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      phone: patientPhone,
      gender,
      dob,
      address,
      profile_image_url: userProfileImage,
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
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required" });
    }

    const userExists = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email],
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    const userRole = role || "patient";
    if (!ALLOWED_ROLES.has(userRole)) {
      return res.status(400).json({ message: "Only patient or doctor can register" });
    }
    if (userRole === "doctor") {
      if (!specialization || !qualification || !license_number || !phone) {
        return res.status(400).json({
          message:
            "Doctor registration requires specialization, qualification, license number, and phone",
        });
      }
      if (!ALLOWED_SPECIALIZATIONS.has(specialization)) {
        return res.status(400).json({
          message: "Please select a valid specialization from the provided list",
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const client = await pool.connect();
    let userResult;
    try {
      await client.query("BEGIN");
      userResult = await client.query(
        `INSERT INTO users
        (name, email, password, role, phone, gender, dob, address, profile_image_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, role, name, email, phone, gender, dob, address, profile_image_url`,
        [
          name.trim(),
          email.trim().toLowerCase(),
          hashedPassword,
          userRole,
          patientPhone || null,
          gender || null,
          dob || null,
          address || null,
          userProfileImage || null,
        ],
      );

      if (userRole === "doctor") {
        await client.query(
          `INSERT INTO doctors
           (user_id, specialization, experience, hospital, qualification, license_number, phone, profile_image_url, bio, consultation_fee, is_approved)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, FALSE)`,
          [
            userResult.rows[0].id,
            specialization,
            experience || null,
            hospital || null,
            qualification,
            license_number,
            phone,
            profile_image_url || DEFAULT_DOCTOR_IMAGE,
            bio || null,
            consultation_fee || null,
          ],
        );
      }

      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }

    const roleMessage = {
      doctor: "Doctor registered. Awaiting admin approval.",
      patient: "Patient registered successfully",
    };

    res
      .status(201)
      .json({
        message: roleMessage[userRole] || "User registered successfully",
        user: userResult.rows[0],
      });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email.trim().toLowerCase(),
    ]);

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ message: "Account blocked by admin" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    let doctorApprovalStatus = null;
    if (user.role === "doctor") {
      const doctorProfile = await pool.query(
        "SELECT id, is_approved FROM doctors WHERE user_id = $1",
        [user.id],
      );
      doctorApprovalStatus =
        doctorProfile.rows.length > 0 ? doctorProfile.rows[0].is_approved : null;

      if (!doctorApprovalStatus) {
        return res
          .status(403)
          .json({ message: "Waiting for admin approval" });
      }
    }

    const loginMessage = {
      admin: "Admin login successful",
      doctor: "Doctor login successful",
      patient: "Patient login successful",
    };

    res.status(200).json({
      message: loginMessage[user.role] || "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        gender: user.gender,
        dob: user.dob,
        address: user.address,
        profile_image_url: user.profile_image_url,
        role: user.role,
        doctorApprovalStatus,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res
      .status(500)
      .json({ message: error.message || "Server error during login" });
  }
};

// GET LOGGED-IN USER PROFILE
exports.getMyProfile = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, phone, gender, dob, address, profile_image_url, is_active
       FROM users WHERE id = $1`,
      [req.user.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// UPDATE LOGGED-IN USER PROFILE
exports.updateMyProfile = async (req, res) => {
  try {
    const { name, phone, gender, dob, address, profile_image_url } = req.body;

    const result = await pool.query(
      `UPDATE users
       SET name = COALESCE($2, name),
           phone = COALESCE($3, phone),
           gender = COALESCE($4, gender),
           dob = COALESCE($5, dob),
           address = COALESCE($6, address),
           profile_image_url = COALESCE($7, profile_image_url)
       WHERE id = $1
       RETURNING id, name, email, role, phone, gender, dob, address, profile_image_url`,
      [
        req.user.id,
        name || null,
        phone || null,
        gender || null,
        dob || null,
        address || null,
        profile_image_url || null,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      user: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
