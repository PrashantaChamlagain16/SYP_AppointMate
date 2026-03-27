import { useEffect, useState } from "react";
import { api } from "../utils/api.js";
import { useAuth } from "../state/AuthContext.jsx";

export function AdminAppointmentMonitorPage() {
  const { token } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/admin/appointments", token)
      .then((data) => setAppointments(data))
      .catch((e) => setError(e.message));
  }, []);

  const getStatusClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('pending')) return 'status-pending';
    if (s.includes('confirm') || s.includes('approved')) return 'status-approved';
    if (s.includes('complete')) return 'status-completed';
    if (s.includes('cancel') || s.includes('reject')) return 'status-cancelled';
    return '';
  };

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Operational Monitor</p>
          <h1 className="display-lg">Consultation Archive</h1>
          <p style={{ color: 'var(--on-surface-variant)' }}>Real-time visibility into all clinical appointments system-wide.</p>
        </div>
        <div className="stats-item" style={{ minWidth: '160px' }}>
          <strong>{appointments.length}</strong>
          <span>Total Records</span>
        </div>
      </header>

      {error && <div className="glass-card" style={{ background: '#ffebee', color: '#c62828', marginBottom: 'var(--spacing-8)' }}>{error}</div>}

      <section className="glass-card" style={{ padding: 'var(--spacing-8)' }}>
        <table className="data-table-ethereal">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Specialist</th>
              <th>Schedule</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((a) => (
              <tr key={a.id}>
                <td><strong>{a.patient_name}</strong></td>
                <td>Dr. {a.doctor_name}</td>
                <td>{a.appointment_date} • {a.appointment_time}</td>
                <td>
                  <span className={`status-pill ${getStatusClass(a.status)}`}>
                    {a.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {appointments.length === 0 && (
          <p style={{ textAlign: 'center', padding: 'var(--spacing-12)', color: 'var(--on-surface-variant)' }}>
            No clinical records found in the database.
          </p>
        )}
      </section>
    </div>
  );
}
