const express = require("express");
const router = express.Router();

const {
  createDoctorProfile,
  updateDoctorProfile,
  getMyDoctorProfile,
  getAllDoctors,
  getDoctorById,
} = require("../controllers/doctorController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

router.post("/create", protect, authorizeRoles("doctor"), createDoctorProfile);
router.put("/me", protect, authorizeRoles("doctor"), updateDoctorProfile);
router.get("/me", protect, authorizeRoles("doctor"), getMyDoctorProfile);

router.get("/", getAllDoctors);

router.get("/:id", getDoctorById);

module.exports = router;
