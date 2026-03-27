const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userResult = await pool.query(
      "SELECT id, role, is_active FROM users WHERE id = $1",
      [decoded.id],
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    if (!userResult.rows[0].is_active) {
      return res.status(403).json({ message: "Account is blocked by admin" });
    }

    req.user = { id: userResult.rows[0].id, role: userResult.rows[0].role };
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token invalid" });
  }
};

module.exports = { protect, verifyToken: protect };
