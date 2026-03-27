const express = require("express");
const router = express.Router();

const {
  getAllUsers,
  blockUser,
  unblockUser,
  deleteUser,
  getAllAppointments,
  getPendingDoctors,
  approveDoctor,
  getAllFeedbacks,
} = require("../controllers/adminController");

const { verifyToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

// get all users
router.get("/users", verifyToken, authorizeRoles("admin"), getAllUsers);

// block user
router.put("/block/:id", verifyToken, authorizeRoles("admin"), blockUser);

// unblock user
router.put("/unblock/:id", verifyToken, authorizeRoles("admin"), unblockUser);

// delete user
router.delete("/users/:id", verifyToken, authorizeRoles("admin"), deleteUser);

// view all appointments
router.get("/appointments", verifyToken, authorizeRoles("admin"), getAllAppointments);

// pending doctor approvals
router.get("/doctors/pending", verifyToken, authorizeRoles("admin"), getPendingDoctors);

// approve doctor profile
router.put("/doctors/approve/:doctorId", verifyToken, authorizeRoles("admin"), approveDoctor);

// view all feedbacks
router.get("/feedbacks", verifyToken, authorizeRoles("admin"), getAllFeedbacks);

module.exports = router;
