import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../utils/api.js";
import { useAuth } from "../state/AuthContext.jsx";
import { DEFAULT_DOCTOR_IMAGE } from "../constants/defaultImages.js";
import { BookingSlotPicker } from "../components/BookingSlotPicker.jsx";

export function DoctorBookingPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [booking, setBooking] = useState({
    appointment_date: "",
    appointment_time: "",
    reason: "",
  });
  const [payment, setPayment] = useState({
    method: "khalti",
    transaction_ref: "",
  });

  useEffect(() => {
    api.get(`/doctors/${id}`)
      .then((data) => setDoctor(data))
      .catch((e) => setError(e.message));
  }, [id]);

  const onBook = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    if (!booking.appointment_date || !booking.appointment_time) {
      setError("Please select a clinical slot to proceed.");
      setLoading(false);
      return;
    }
    if (!payment.transaction_ref.trim()) {
      setError("A valid transaction reference is required for verification.");
      setLoading(false);
      return;
    }
    try {
      await api.post("/appointments/book", {
        doctor_id: Number(id),
        appointment_date: booking.appointment_date,
        appointment_time: booking.appointment_time,
        reason: booking.reason,
        payment: {
          method: payment.method,
          transaction_ref: payment.transaction_ref.trim(),
          amount: Number(doctor.consultation_fee),
        },
      }, token);
      setMessage("Booking request submitted successfully.");
      setBooking({
        appointment_date: "",
        appointment_time: "",
        reason: "",
      });
      setPayment({
        method: "khalti",
        transaction_ref: "",
      });
      setTimeout(() => navigate("/patient"), 1200);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  if (!doctor) {
    return (
      <div className="discovery-container" style={{ textAlign: 'center', padding: 'var(--spacing-20)' }}>
        <p className="eyebrow">Initializing Secure Booking Terminal...</p>
      </div>
    );
  }

  return (
    <div className="discovery-container">
      <header style={{ marginBottom: 'var(--spacing-12)' }}>
        <p className="eyebrow" style={{ color: 'var(--primary)' }}>Secure Consultation Booking</p>
        <h1 className="display-lg">Reserve Your Appointment</h1>
        <p style={{ color: 'var(--on-surface-variant)' }}>Confirm your schedule and complete the clinical authorization.</p>
      </header>

      <div className="booking-container">
        <main>
          <section className="glass-card" style={{ padding: 'var(--spacing-8)', marginBottom: 'var(--spacing-8)' }}>
            <h3 className="headline-sm" style={{ marginBottom: 'var(--spacing-6)' }}>1. Select Clinical Slot</h3>
            <BookingSlotPicker 
              doctorId={id} 
              selectedDate={booking.appointment_date}
              selectedTime={booking.appointment_time}
              onSelect={(date, time) => setBooking(p => ({ ...p, appointment_date: date, appointment_time: time }))} 
            />
          </section>

          <section className="glass-card" style={{ padding: 'var(--spacing-8)' }}>
            <h3 className="headline-sm" style={{ marginBottom: 'var(--spacing-6)' }}>2. Consultation Details</h3>
            <label className="eyebrow" style={{ marginBottom: 'var(--spacing-2)', display: 'block' }}>Primary Reason for Visit</label>
            <textarea 
              className="input-ethereal" 
              style={{ minHeight: '120px' }}
              placeholder="Briefly describe your symptoms or reason for the consultation (optional)..."
              value={booking.reason}
              onChange={(e) => setBooking(p => ({ ...p, reason: e.target.value }))}
            />
          </section>
        </main>

        <aside>
          <div className="payment-summary">
            <div style={{ display: 'flex', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-6)' }}>
              <img 
                src={doctor.profile_image_url || DEFAULT_DOCTOR_IMAGE} 
                style={{ width: '64px', height: '64px', borderRadius: '12px', objectFit: 'cover' }} 
              />
              <div>
                <p style={{ fontWeight: 600 }}>Dr. {doctor.name}</p>
                <p style={{ fontSize: 'var(--label-md)', color: 'var(--on-surface-variant)' }}>{doctor.specialization}</p>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--outline-variant)', borderBottom: '1px solid var(--outline-variant)', padding: 'var(--spacing-4) 0', marginBottom: 'var(--spacing-6)' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-2)' }}>
                  <span>Consultation Fee</span>
                  <span style={{ fontWeight: 600 }}>NPR {doctor.consultation_fee || '0.00'}</span>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--label-md)', color: 'var(--on-surface-variant)' }}>
                  <span>Service Tax</span>
                  <span>Included</span>
               </div>
            </div>

            <div style={{ marginBottom: 'var(--spacing-6)' }}>
              <p className="eyebrow" style={{ marginBottom: 'var(--spacing-2)' }}>Select Payment Gateway</p>
              <div className="payment-method-grid">
                {['khalti', 'esewa', 'card', 'bank'].map(m => (
                  <div key={m} className={`method-chip ${payment.method === m ? 'active' : ''}`} onClick={() => setPayment(p => ({ ...p, method: m }))}>
                    {m.toUpperCase()}
                  </div>
                ))}
              </div>
              <input 
                className="input-ethereal"
                style={{ fontSize: '0.9rem', marginBottom: 0 }}
                placeholder="Transaction Reference ID"
                value={payment.transaction_ref}
                onChange={(e) => setPayment(p => ({ ...p, transaction_ref: e.target.value }))}
              />
            </div>

            <button 
              className="jewel-btn" 
              style={{ width: '100%', justifyContent: 'center', height: '56px' }}
              disabled={loading}
              onClick={onBook}
            >
              {loading ? "Authorizing..." : "Confirm & Pay"}
            </button>
            
            {error && <p className="err-text" style={{ marginTop: 'var(--spacing-4)', textAlign: 'center' }}>{error}</p>}
            {message && <p className="ok-text" style={{ marginTop: 'var(--spacing-4)', textAlign: 'center' }}>{message}</p>}
          </div>
        </aside>
      </div>
    </div>
  );
}
