const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const pool = require("./config/db");

dotenv.config();

const app = express();

const createUserTable = require("./models/userModel");
const createDoctorTable = require("./models/doctorModule");
const createAppointmentTable = require("./models/appointmentModule");
const createAvailabilityTable = require("./models/availabilityModel");
const createAppointmentStatusHistoryTable = require("./models/appointmentStatusHistoryModel");
const createNotificationTable = require("./models/notificationModel");
const createPaymentTable = require("./models/paymentModel");
const createReviewTable = require("./models/reviewModel");
const createFeedbackTable = require("./models/feedbackModel");

app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/doctors", require("./routes/doctorRoutes"));
app.use("/api/appointments", require("./routes/appointmentRoutes"));
app.use("/api/availability", require("./routes/availabilityRoutes"));
app.use(
  "/api/appointment-confirmation",
  require("./routes/appointmentConfirmationRoutes"),
);
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/feedback", require("./routes/feedbackRoutes"));

app.get("/", (req, res) => {
  res.send("API Running...");
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await pool.testConnection();

    // Create tables on server start after DB connectivity is confirmed
    await createUserTable();
    await createDoctorTable();
    await createAppointmentTable();
    await createAvailabilityTable();
    await createAppointmentStatusHistoryTable();
    await createNotificationTable();
    await createPaymentTable();
    await createReviewTable();
    await createFeedbackTable();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
