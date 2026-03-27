const pool = require("../config/db");

const dayNames = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const toMinutes = (timeString) => {
  const [hour, minute] = timeString.split(":").map(Number);
  return hour * 60 + minute;
};

const todayYmdLocal = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const currentMinutesLocal = () => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
};

const weekdayNameFromYmd = (ymd) => {
  const date = new Date(`${ymd}T00:00:00`);
  return dayNames[date.getDay()];
};

const validateClinicSlot = (appointmentDate, appointmentTime) => {
  const date = new Date(`${appointmentDate}T00:00:00`);
  const day = date.getDay(); // 0=Sun, 6=Sat
  if (day === 0 || day === 6) {
    return "Appointments are available only on weekdays (Monday to Friday)";
  }

  const mins = toMinutes(appointmentTime);
  const start = 10 * 60; // 10:00
  const end = 16 * 60; // 16:00
  if (mins < start || mins >= end) {
    return "Appointments are allowed only between 10:00 and 16:00";
  }

  if (mins % 30 !== 0) {
    return "Appointments must be in 30-minute intervals";
  }

  if (appointmentDate === todayYmdLocal() && mins < currentMinutesLocal()) {
    return "You cannot book a time earlier than the current time for today";
  }

  return null;
};

// BOOK APPOINTMENT
exports.bookAppointment = async (req, res) => {
  let client;
  try {
    if (req.user.role !== "patient") {
      return res.status(403).json({ message: "Only patients can book appointments" });
    }

    const { doctor_id, appointment_date, appointment_time, reason, payment } = req.body;
    const patientId = req.user.id;
    if (!doctor_id || !appointment_date || !appointment_time) {
      return res.status(400).json({
        message: "doctor_id, appointment_date and appointment_time are required",
      });
    }
    if (!payment || typeof payment !== "object") {
      return res.status(400).json({
        message: "Payment is required before booking the appointment",
      });
    }

    const clinicRuleError = validateClinicSlot(appointment_date, appointment_time);
    if (clinicRuleError) {
      return res.status(400).json({ message: clinicRuleError });
    }

    const parsedMethod = String(payment.method || "").trim().toLowerCase();
    const parsedTransactionRef = String(payment.transaction_ref || "").trim();
    const providedAmount = Number(payment.amount);
    if (!parsedMethod || !parsedTransactionRef || !Number.isFinite(providedAmount)) {
      return res.status(400).json({
        message: "Payment method, transaction_ref and amount are required",
      });
    }

    const doctorResult = await pool.query(
      `SELECT d.id, d.is_approved, d.consultation_fee, u.is_active
       FROM doctors d
       JOIN users u ON d.user_id = u.id
       WHERE d.id = $1`,
      [doctor_id],
    );

    if (doctorResult.rows.length === 0) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    if (!doctorResult.rows[0].is_approved || !doctorResult.rows[0].is_active) {
      return res
        .status(400)
        .json({ message: "Selected doctor is not available for booking" });
    }
    const consultationFee = Number(doctorResult.rows[0].consultation_fee);
    if (!Number.isFinite(consultationFee) || consultationFee <= 0) {
      return res.status(400).json({
        message: "This doctor has no valid consultation fee set for online booking",
      });
    }
    if (Math.abs(providedAmount - consultationFee) > 0.001) {
      return res.status(400).json({
        message: `Payment amount must match consultation fee (NPR ${consultationFee.toFixed(2)})`,
      });
    }

    const availabilityResult = await pool.query(
      "SELECT * FROM doctor_availability WHERE doctor_id = $1",
      [doctor_id],
    );

    if (availabilityResult.rows.length === 0) {
      return res
        .status(400)
        .json({ message: "Doctor has not set availability yet" });
    }

    const availability = availabilityResult.rows[0];
    const dayName = weekdayNameFromYmd(appointment_date);
    const availableDays = String(availability.available_days || "")
      .split(",")
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean);

    if (!availableDays.includes(dayName)) {
      return res
        .status(400)
        .json({ message: "Doctor is unavailable on the selected day" });
    }

    const requestedMins = toMinutes(appointment_time);
    const startMins = toMinutes(availability.start_time);
    const endMins = toMinutes(availability.end_time);
    const slotDuration = availability.slot_duration || 30;

    if (requestedMins < startMins || requestedMins >= endMins) {
      return res.status(400).json({ message: "Selected time is outside availability" });
    }
    if ((requestedMins - startMins) % slotDuration !== 0) {
      return res.status(400).json({ message: "Selected time does not match slot interval" });
    }

    const existing = await pool.query(
      `SELECT id FROM appointments
       WHERE doctor_id = $1
         AND appointment_date = $2
         AND appointment_time = $3
         AND status IN ('pending', 'confirmed')`,
      [doctor_id, appointment_date, appointment_time],
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "Slot already booked" });
    }

    client = await pool.connect();
    await client.query("BEGIN");

    const result = await client.query(
      `INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, reason)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [patientId, doctor_id, appointment_date, appointment_time, reason || null],
    );
    const appointment = result.rows[0];

    await client.query(
      `INSERT INTO payments (
        appointment_id,
        patient_id,
        doctor_id,
        amount,
        currency,
        method,
        payment_status,
        transaction_ref,
        paid_at
      ) VALUES ($1, $2, $3, $4, 'NPR', $5, 'paid', $6, CURRENT_TIMESTAMP)`,
      [
        appointment.id,
        patientId,
        doctor_id,
        consultationFee.toFixed(2),
        parsedMethod,
        parsedTransactionRef,
      ],
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "Payment verified and appointment booked",
      appointment,
    });
  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (_) {}
    }
    res.status(500).json({ message: error.message });
  } finally {
    if (client) {
      client.release();
    }
  }
};

// GET MY APPOINTMENTS
exports.getMyAppointments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type = "all" } = req.query;
    const timeFilter =
      type === "upcoming"
        ? " AND (a.appointment_date > CURRENT_DATE OR (a.appointment_date = CURRENT_DATE AND a.appointment_time >= CURRENT_TIME))"
        : type === "past"
          ? " AND (a.appointment_date < CURRENT_DATE OR (a.appointment_date = CURRENT_DATE AND a.appointment_time < CURRENT_TIME))"
          : "";

    if (req.user.role === "patient") {
      const appointments = await pool.query(
        `SELECT a.*, u.name AS doctor_name, d.specialization
         FROM appointments a
         JOIN doctors d ON a.doctor_id = d.id
         JOIN users u ON d.user_id = u.id
         WHERE a.patient_id = $1 ${timeFilter}
         ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
        [userId],
      );
      return res.status(200).json(appointments.rows);
    }

    if (req.user.role === "doctor") {
      const doctorResult = await pool.query(
        "SELECT id FROM doctors WHERE user_id = $1",
        [userId],
      );
      if (doctorResult.rows.length === 0) {
        return res
          .status(400)
          .json({ message: "Doctor profile missing. Create it first." });
      }

      const appointments = await pool.query(
        `SELECT a.*, p.name AS patient_name, p.email AS patient_email
         FROM appointments a
         JOIN users p ON a.patient_id = p.id
         WHERE a.doctor_id = $1 ${timeFilter}
         ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
        [doctorResult.rows[0].id],
      );
      return res.status(200).json(appointments.rows);
    }

    return res.status(403).json({ message: "Unsupported role for this endpoint" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CANCEL APPOINTMENT
exports.cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const appointmentResult = await pool.query(
      `SELECT a.*, d.user_id AS doctor_user_id
       FROM appointments a
       JOIN doctors d ON a.doctor_id = d.id
       WHERE a.id = $1`,
      [id],
    );

    if (appointmentResult.rows.length === 0) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const appointment = appointmentResult.rows[0];
    const isPatientOwner = req.user.role === "patient" && appointment.patient_id === req.user.id;
    const isDoctorOwner = req.user.role === "doctor" && appointment.doctor_user_id === req.user.id;

    if (!isPatientOwner && !isDoctorOwner && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not allowed to cancel this appointment" });
    }

    if (appointment.status === "cancelled") {
      return res.status(400).json({ message: "Appointment is already cancelled" });
    }

    await pool.query(
      `UPDATE appointments
       SET status = 'cancelled',
           cancelled_by = $2,
           cancellation_reason = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id, req.user.role, reason || null],
    );

    res.status(200).json({ message: "Appointment cancelled" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// RESCHEDULE APPOINTMENT (patient)
exports.rescheduleAppointment = async (req, res) => {
  try {
    if (req.user.role !== "patient") {
      return res.status(403).json({ message: "Only patients can reschedule appointments" });
    }

    const { id } = req.params;
    const { appointment_date, appointment_time } = req.body;
    if (!appointment_date || !appointment_time) {
      return res
        .status(400)
        .json({ message: "appointment_date and appointment_time are required" });
    }

    const clinicRuleError = validateClinicSlot(appointment_date, appointment_time);
    if (clinicRuleError) {
      return res.status(400).json({ message: clinicRuleError });
    }

    const existingAppointment = await pool.query(
      "SELECT * FROM appointments WHERE id = $1 AND patient_id = $2",
      [id, req.user.id],
    );

    if (existingAppointment.rows.length === 0) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const appointment = existingAppointment.rows[0];
    if (!["pending", "confirmed"].includes(appointment.status)) {
      return res
        .status(400)
        .json({ message: "Only pending or confirmed appointments can be rescheduled" });
    }

    const availabilityResult = await pool.query(
      "SELECT * FROM doctor_availability WHERE doctor_id = $1",
      [appointment.doctor_id],
    );

    if (availabilityResult.rows.length === 0) {
      return res
        .status(400)
        .json({ message: "Doctor has not set availability yet" });
    }

    const availability = availabilityResult.rows[0];
    const dayName = weekdayNameFromYmd(appointment_date);
    const availableDays = String(availability.available_days || "")
      .split(",")
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean);

    if (!availableDays.includes(dayName)) {
      return res
        .status(400)
        .json({ message: "Doctor is unavailable on the selected day" });
    }

    const requestedMins = toMinutes(appointment_time);
    const startMins = toMinutes(availability.start_time);
    const endMins = toMinutes(availability.end_time);
    const slotDuration = availability.slot_duration || 30;
    if (requestedMins < startMins || requestedMins >= endMins) {
      return res.status(400).json({ message: "Selected time is outside availability" });
    }
    if ((requestedMins - startMins) % slotDuration !== 0) {
      return res.status(400).json({ message: "Selected time does not match slot interval" });
    }

    const slotConflict = await pool.query(
      `SELECT id FROM appointments
       WHERE doctor_id = $1
         AND appointment_date = $2
         AND appointment_time = $3
         AND status IN ('pending', 'confirmed')
         AND id != $4`,
      [appointment.doctor_id, appointment_date, appointment_time, id],
    );

    if (slotConflict.rows.length > 0) {
      return res.status(400).json({ message: "Requested slot is already booked" });
    }

    const updated = await pool.query(
      `UPDATE appointments
       SET appointment_date = $2,
           appointment_time = $3,
           rescheduled_by_patient = TRUE,
           doctor_reschedule_notified_at = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id, appointment_date, appointment_time],
    );

    return res.status(200).json({
      message: "Appointment rescheduled successfully",
      appointment: updated.rows[0],
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET RESCHEDULE NOTIFICATIONS (doctor, one-time read)
exports.getRescheduleNotifications = async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({ message: "Only doctors can access reschedule notifications" });
    }

    const doctorProfile = await pool.query(
      "SELECT id FROM doctors WHERE user_id = $1",
      [req.user.id],
    );

    if (doctorProfile.rows.length === 0) {
      return res
        .status(400)
        .json({ message: "Doctor profile missing. Create it first." });
    }

    const doctorId = doctorProfile.rows[0].id;

    const result = await pool.query(
      `WITH marked AS (
         UPDATE appointments a
         SET rescheduled_by_patient = FALSE,
             doctor_reschedule_notified_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE a.doctor_id = $1
           AND a.rescheduled_by_patient = TRUE
         RETURNING a.id, a.patient_id, a.appointment_date, a.appointment_time
       )
       SELECT m.id,
              m.appointment_date,
              m.appointment_time,
              u.name AS patient_name
       FROM marked m
       JOIN users u ON u.id = m.patient_id
       ORDER BY m.appointment_date ASC, m.appointment_time ASC`,
      [doctorId],
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
