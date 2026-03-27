const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middleware/authMiddleware");
const {
  createReview,
  getDoctorReviews,
  getMyPendingReviews,
} = require("../controllers/reviewController");

router.get("/doctor/:doctorId", getDoctorReviews);
router.get("/my-pending", verifyToken, getMyPendingReviews);
router.post("/", verifyToken, createReview);

module.exports = router;
