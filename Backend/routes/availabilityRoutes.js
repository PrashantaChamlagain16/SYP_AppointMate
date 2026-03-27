const express = require("express");
const router = express.Router();

const {
  setAvailability,
  getAvailability,
  getMyAvailability,
} = require("../controllers/availabilityController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const { requireApprovedDoctor } = require("../middleware/doctorApprovalMiddleware");

// Get logged-in doctor's own availability
router.get("/me", protect, authorizeRoles("doctor"), getMyAvailability);

// Set doctor availability - only doctors
router.post(
  "/set",
  protect,
  authorizeRoles("doctor"),
  requireApprovedDoctor,
  setAvailability,
);

// Get doctor availability - anyone can view
router.get("/:doctor_id", getAvailability);

module.exports = router;
