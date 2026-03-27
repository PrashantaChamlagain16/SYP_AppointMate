import { useEffect, useMemo, useState } from "react";
import { api } from "../utils/api.js";
import { useAuth } from "../state/AuthContext.jsx";
import { useUiFeedback } from "../state/UiFeedbackContext.jsx";

export function DoctorDashboard() {
  const { token, user } = useAuth();
  const { showMessage } = useUiFeedback();
  const [pending, setPending] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [historyFilter, setHistoryFilter] = useState("all");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const [pendingData, allData, rescheduledNotifications] = await Promise.all([
        api.get("/appointment-confirmation/pending", token),
        api.get("/appointments/my?type=all", token),
        api.get("/appointments/reschedule-notifications", token),
      ]);
      setPending(pendingData);
      setAllAppointments(allData);
      rescheduledNotifications.forEach((item) => {
        showMessage({
          type: "info",
          title: "Appointment Rescheduled",
          message: `${item.patient_name} rescheduled for ${item.appointment_date} at ${item.appointment_time}.`,
        });
      });
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => { load(); }, []);

  const getAppointmentDateTime = (appointment) => {
    const parsed = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const filteredAppointments = useMemo(() => {
    const now = new Date();
    const query = searchTerm.trim().toLowerCase();
    return allAppointments.filter((appointment) => {
      const appointmentDateTime = getAppointmentDateTime(appointment);
      const isPast = appointmentDateTime ? appointmentDateTime < now : false;
      if (historyFilter === "past" && !isPast) return false;
      if (historyFilter === "upcoming" && isPast) return false;
      if (!query) return true;
      const searchable = [
        appointment.patient_name,
        appointment.patient_email,
        appointment.appointment_date,
        appointment.appointment_time,
        appointment.status,
      ].filter(Boolean).join(" ").toLowerCase();
      return searchable.includes(query);
    });
  }, [allAppointments, historyFilter, searchTerm]);

  const quickStats = useMemo(() => {
    const now = new Date();
    const upcoming = allAppointments.filter((appointment) => {
      const dateTime = getAppointmentDateTime(appointment);
      return dateTime ? dateTime >= now : false;
    }).length;
    const history = allAppointments.length - upcoming;
    return { pending: pending.length, upcoming, history };
  }, [allAppointments, pending]);

  const handleDecision = async (id, action) => {
    setError("");
    try {
      await api.put(`/appointment-confirmation/${action}/${id}`, {}, token);
      showMessage({
        type: "success",
        title: "Appointment Updated",
        message: `Appointment ${action === "confirm" ? "accepted" : "rejected"} successfully.`,
      });
      await load();
    } catch (e) { setError(e.message); }
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
        <p className="eyebrow">Medical Staff Portal</p>
        <h1 className="display-lg" style={{ marginBottom: 'var(--spacing-2)' }}>Welcome, Dr. {user?.name}</h1>
        <p style={{ color: 'var(--on-surface-variant)' }}>Monitor your clinical schedule and patient requests.</p>
      </header>
      {error && (
        <div className="glass-card" style={{ marginBottom: 'var(--spacing-6)', borderLeft: '4px solid #c62828' }}>
          {error}
        </div>
      )}

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-6)', marginBottom: 'var(--spacing-12)' }}>
        <div className="tonal-card">
          <p className="eyebrow" style={{ color: 'var(--primary)' }}>Pending</p>
          <h2 style={{ fontSize: '2.5rem' }}>{quickStats.pending}</h2>
          <p style={{ fontSize: 'var(--label-md)', color: 'var(--on-surface-variant)' }}>New requests</p>
        </div>
        <div className="tonal-card">
          <p className="eyebrow" style={{ color: 'var(--secondary)' }}>Upcoming</p>
          <h2 style={{ fontSize: '2.5rem' }}>{quickStats.upcoming}</h2>
          <p style={{ fontSize: 'var(--label-md)', color: 'var(--on-surface-variant)' }}>Next 7 days</p>
        </div>
        <div className="tonal-card">
          <p className="eyebrow" style={{ color: 'var(--tertiary)' }}>History</p>
          <h2 style={{ fontSize: '2.5rem' }}>{quickStats.history}</h2>
          <p style={{ fontSize: 'var(--label-md)', color: 'var(--on-surface-variant)' }}>Total consultations</p>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 'var(--spacing-12)' }}>
        <div className="requests-panel">
          <h3 className="headline-sm" style={{ marginBottom: 'var(--spacing-6)' }}>Action Required</h3>
          <div style={{ display: 'grid', gap: 'var(--spacing-4)' }}>
            {pending.map((a) => (
              <div key={a.id} className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
                <strong>{a.patient_name}</strong>
                <p style={{ fontSize: 'var(--label-md)', margin: 'var(--spacing-1) 0 var(--spacing-4)' }}>{a.appointment_date} at {a.appointment_time}</p>
                <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                  <button className="jewel-btn" style={{ padding: 'var(--spacing-2) var(--spacing-4)', fontSize: '0.9rem' }} onClick={() => handleDecision(a.id, "confirm")}>Accept</button>
                  <button className="nav-link" style={{ background: 'var(--surface-container-high)' }} onClick={() => handleDecision(a.id, "reject")}>Decline</button>
                </div>
              </div>
            ))}
            {pending.length === 0 && <p style={{ color: 'var(--on-surface-variant)' }}>No active requests waiting for review.</p>}
          </div>
        </div>

        <div className="timeline-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
            <h3 className="headline-sm">Timeline</h3>
            <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
               <input 
                 className="input-ethereal" 
                 style={{ marginBottom: 0, width: '240px' }} 
                 placeholder="Filter timeline..." 
                 value={searchTerm} 
                 onChange={(e) => setSearchTerm(e.target.value)} 
               />
               <select className="input-ethereal" style={{ marginBottom: 0, width: 'auto' }} value={historyFilter} onChange={(e) => setHistoryFilter(e.target.value)}>
                <option value="all">All</option>
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
               </select>
            </div>
          </div>

          <table className="data-table-ethereal">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Schedule</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map((a) => (
                <tr key={a.id}>
                  <td><strong>{a.patient_name}</strong></td>
                  <td>{a.appointment_date} • {a.appointment_time}</td>
                  <td><span className={`status-pill ${getStatusClass(a.status)}`}>{a.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredAppointments.length === 0 && <p style={{ textAlign: 'center', padding: 'var(--spacing-8)' }}>No matching timeline events.</p>}
        </div>
      </section>
    </div>
  );
}
