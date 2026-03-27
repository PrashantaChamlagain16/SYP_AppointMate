const express = require("express");
const router = express.Router();

const {
  confirmAppointment,
  rejectAppointment,
  getPendingAppointments,
} = require("../controllers/appointmentConfirmationController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const { requireApprovedDoctor } = require("../middleware/doctorApprovalMiddleware");

// Get pending appointments - doctors only
router.get(
  "/pending",
  protect,
  authorizeRoles("doctor"),
  requireApprovedDoctor,
  getPendingAppointments,
);

// Confirm appointment - doctors only
router.put(
  "/confirm/:id",
  protect,
  authorizeRoles("doctor"),
  requireApprovedDoctor,
  confirmAppointment,
);

// Reject appointment - doctors only
router.put(
  "/reject/:id",
  protect,
  authorizeRoles("doctor"),
  requireApprovedDoctor,
  rejectAppointment,
);

module.exports = router;
