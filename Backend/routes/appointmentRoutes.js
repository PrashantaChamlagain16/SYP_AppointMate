const express = require("express");
const router = express.Router();

const {
  bookAppointment,
  getMyAppointments,
  cancelAppointment,
  rescheduleAppointment,
  getRescheduleNotifications,
} = require("../controllers/appointmentController");

const { verifyToken } = require("../middleware/authMiddleware");

// book appointment
router.post("/book", verifyToken, bookAppointment);

// view my appointments (patient/doctor)
router.get("/my", verifyToken, getMyAppointments);

// one-time reschedule notifications for doctor dashboard
router.get("/reschedule-notifications", verifyToken, getRescheduleNotifications);

// reschedule appointment (patient)
router.put("/reschedule/:id", verifyToken, rescheduleAppointment);

// cancel appointment
router.put("/cancel/:id", verifyToken, cancelAppointment);

module.exports = router;
