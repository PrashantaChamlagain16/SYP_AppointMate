import { useEffect, useMemo, useState } from "react";
import { api } from "../utils/api.js";
import { useAuth } from "../state/AuthContext.jsx";
import { BookingSlotPicker } from "../components/BookingSlotPicker.jsx";

export function PatientDashboard() {
  const { token, user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [rescheduleId, setRescheduleId] = useState(null);
  const [ratingId, setRatingId] = useState(null);
  const [ratingForm, setRatingForm] = useState({ rating: 5, comment: "" });
  const [rescheduleForm, setRescheduleForm] = useState({
    appointment_date: "",
    appointment_time: "",
  });

  const loadAppointments = async () => {
    try {
      const [appointmentData, pendingReviewData] = await Promise.all([
        api.get("/appointments/my?type=all", token),
        api.get("/reviews/my-pending", token),
      ]);
      setAppointments(appointmentData);
      setPendingReviews(pendingReviewData);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const stats = useMemo(() => {
    const upcoming = appointments.filter((a) => ["pending", "confirmed"].includes(a.status)).length;
    const cancelled = appointments.filter((a) => a.status === "cancelled").length;
    return { total: appointments.length, upcoming, cancelled };
  }, [appointments]);

  const onCancel = async (id) => {
    try {
      await api.put(`/appointments/cancel/${id}`, { reason: "Cancelled by patient" }, token);
      setMessage("Appointment cancelled.");
      await loadAppointments();
    } catch (err) { setError(err.message); }
  };

  const onReschedule = async (id) => {
    if (!rescheduleForm.appointment_date || !rescheduleForm.appointment_time) {
      setError("Please select both new date and time for reschedule.");
      return;
    }
    try {
      await api.put(`/appointments/reschedule/${id}`, rescheduleForm, token);
      setMessage("Appointment rescheduled.");
      setRescheduleId(null);
      setRescheduleForm({ appointment_date: "", appointment_time: "" });
      await loadAppointments();
    } catch (err) { setError(err.message); }
  };

  const onSubmitReview = async (appointmentId) => {
    if (!ratingForm.rating) {
      setError("Please select a rating before submitting.");
      return;
    }
    try {
      await api.post("/reviews", {
        appointment_id: appointmentId,
        rating: Number(ratingForm.rating),
        comment: ratingForm.comment,
      }, token);
      setMessage("Thank you. Your rating was submitted.");
      setRatingId(null);
      setRatingForm({ rating: 5, comment: "" });
      await loadAppointments();
    } catch (err) { setError(err.message); }
  };

  const getStatusClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('pending')) return 'status-pending';
    if (s.includes('confirm') || s.includes('approved')) return 'status-approved';
    if (s.includes('complete')) return 'status-completed';
    if (s.includes('cancel') || s.includes('reject')) return 'status-cancelled';
    return '';
  };

  return (
    <div className="dashboard-container">
      <header style={{ marginBottom: 'var(--spacing-12)' }}>
        <p className="eyebrow">Patient Dashboard</p>
        <h1 className="display-lg" style={{ marginBottom: 'var(--spacing-2)' }}>Hello, {user?.name}</h1>
        <p style={{ color: 'var(--on-surface-variant)' }}>Track your health journey and upcoming consultations.</p>
        
        <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--spacing-4)', marginTop: 'var(--spacing-8)' }}>
          <div className="stats-item">
            <strong>{stats.total}</strong>
            <span>Total Visits</span>
          </div>
          <div className="stats-item">
            <strong>{stats.upcoming}</strong>
            <span>Upcoming</span>
          </div>
          <div className="stats-item">
            <strong>{stats.cancelled}</strong>
            <span>Cancelled</span>
          </div>
        </div>
      </header>

      {pendingReviews.length > 0 && (
        <section style={{ marginBottom: 'var(--spacing-12)' }}>
          <h3 className="headline-sm" style={{ marginBottom: 'var(--spacing-4)' }}>Feedback Requested</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-4)' }}>
            {pendingReviews.map((item) => (
              <div key={item.appointment_id} className="glass-card">
                 <div style={{ borderBottom: '1px solid var(--outline-variant)', paddingBottom: 'var(--spacing-4)', marginBottom: 'var(--spacing-4)' }}>
                    <strong>Dr. {item.doctor_name}</strong>
                    <p style={{ fontSize: 'var(--label-md)', color: 'var(--on-surface-variant)' }}>{item.specialization} • {item.appointment_date}</p>
                 </div>
                 {ratingId === item.appointment_id ? (
                   <div style={{ display: 'grid', gap: 'var(--spacing-3)' }}>
                      <select className="input-ethereal" value={ratingForm.rating} onChange={(e) => setRatingForm(p => ({ ...p, rating: Number(e.target.value) }))}>
                        <option value={5}>5 - Excellent</option>
                        <option value={4}>4 - Very Good</option>
                        <option value={3}>3 - Good</option>
                        <option value={2}>2 - Fair</option>
                        <option value={1}>1 - Poor</option>
                      </select>
                      <textarea className="input-ethereal" placeholder="Share your experience (optional)" rows={3} value={ratingForm.comment} onChange={(e) => setRatingForm(p => ({ ...p, comment: e.target.value }))} />
                      <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                        <button className="jewel-btn" onClick={() => onSubmitReview(item.appointment_id)}>Submit</button>
                        <button
                          className="nav-link"
                          onClick={() => {
                            setRatingId(null);
                            setRatingForm({ rating: 5, comment: "" });
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                   </div>
                 ) : (
                   <button className="jewel-btn" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setRatingId(item.appointment_id)}>Rate Consultation</button>
                 )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="glass-card" style={{ padding: 'var(--spacing-8)' }}>
        <h3 className="headline-sm" style={{ marginBottom: 'var(--spacing-6)' }}>Appointment History</h3>
        {message && <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: 'var(--spacing-3)', borderRadius: '12px', marginBottom: 'var(--spacing-4)' }}>{message}</div>}
        {error && <div style={{ background: '#ffebee', color: '#c62828', padding: 'var(--spacing-3)', borderRadius: '12px', marginBottom: 'var(--spacing-4)' }}>{error}</div>}
        
        <table className="data-table-ethereal">
          <thead>
            <tr>
              <th>Specialist</th>
              <th>Schedule</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((a) => (
              <tr key={a.id}>
                <td><strong>Dr. {a.doctor_name}</strong></td>
                <td>{a.appointment_date} • {a.appointment_time}</td>
                <td><span className={`status-pill ${getStatusClass(a.status)}`}>{a.status}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                    {a.status !== "cancelled" && a.status !== "completed" && (
                      <button className="nav-link" style={{ color: '#c62828', fontSize: '0.85rem' }} onClick={() => onCancel(a.id)}>Cancel</button>
                    )}
                    {["pending", "confirmed"].includes(a.status) && (
                      <button className="nav-link" style={{ fontSize: '0.85rem', background: 'var(--surface-container)' }} onClick={() => setRescheduleId(a.id)}>Reschedule</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {rescheduleId && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', zIndex: 2000 }}>
             <div className="glass-card" style={{ width: 'min(500px, 94vw)', background: 'white' }}>
                <h3 className="headline-sm">Reschedule Appointment</h3>
                <p style={{ marginBottom: 'var(--spacing-6)' }}>Select a new slot for your consultation.</p>
                <BookingSlotPicker 
                  doctorId={appointments.find(a => a.id === rescheduleId)?.doctor_id} 
                  selectedDate={rescheduleForm.appointment_date}
                  selectedTime={rescheduleForm.appointment_time}
                  onSelect={(date, time) => setRescheduleForm(p => ({ ...p, appointment_date: date, appointment_time: time }))} 
                />
                <div style={{ display: 'flex', gap: 'var(--spacing-4)', marginTop: 'var(--spacing-6)' }}>
                  <button className="jewel-btn" onClick={() => onReschedule(rescheduleId)}>Update Appointment</button>
                  <button
                    className="nav-link"
                    onClick={() => {
                      setRescheduleId(null);
                      setRescheduleForm({ appointment_date: "", appointment_time: "" });
                    }}
                  >
                    Close
                  </button>
                </div>
             </div>
          </div>
        )}

        {appointments.length === 0 && <p style={{ textAlign: 'center', padding: 'var(--spacing-8)' }}>No appointment history found.</p>}
      </section>
    </div>
  );
}
