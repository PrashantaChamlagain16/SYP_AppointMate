import { useEffect, useState } from "react";
import { api } from "../utils/api.js";
import { useAuth } from "../state/AuthContext.jsx";
import { useUiFeedback } from "../state/UiFeedbackContext.jsx";

export function AdminDoctorApprovalPage() {
  const { token } = useAuth();
  const { showMessage } = useUiFeedback();
  const [pendingDoctors, setPendingDoctors] = useState([]);

  const load = async () => {
    try {
      const data = await api.get("/admin/doctors/pending", token);
      setPendingDoctors(data);
    } catch (e) {
      showMessage({ type: "error", title: "Load Failed", message: e.message });
    }
  };

  useEffect(() => { load(); }, []);

  const approveDoctor = async (doctorId) => {
    try {
      await api.put(`/admin/doctors/approve/${doctorId}`, {}, token);
      showMessage({
        type: "success",
        title: "Doctor Approved",
        message: "Doctor approved successfully.",
      });
      await load();
    } catch (e) {
      showMessage({ type: "error", title: "Approval Failed", message: e.message });
    }
  };

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Medical Governance</p>
          <h1 className="display-lg">Doctor Verification</h1>
          <p style={{ color: 'var(--on-surface-variant)' }}>Review and authorize new specialist credentials.</p>
        </div>
        <div className="stats-item" style={{ minWidth: '160px' }}>
          <strong>{pendingDoctors.length}</strong>
          <span>In Queue</span>
        </div>
      </header>

      <section className="admin-grid">
        {pendingDoctors.map((d) => (
          <div key={d.id} className="approval-card">
            <div className="approval-card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-4)' }}>
                <div>
                  <h3 className="headline-sm" style={{ fontSize: '1.25rem' }}>{d.name}</h3>
                  <p style={{ fontSize: 'var(--label-md)', color: 'var(--on-surface-variant)' }}>{d.email}</p>
                </div>
                <span className="status-pill status-pending">Pending Review</span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)', marginTop: 'var(--spacing-4)' }}>
                <div className="tonal-card" style={{ padding: 'var(--spacing-3)' }}>
                  <p className="eyebrow" style={{ fontSize: '0.65rem' }}>Specialization</p>
                  <p style={{ fontWeight: 600 }}>{d.specialization}</p>
                </div>
                <div className="tonal-card" style={{ padding: 'var(--spacing-3)' }}>
                  <p className="eyebrow" style={{ fontSize: '0.65rem' }}>Experience</p>
                  <p style={{ fontWeight: 600 }}>{d.experience || 'Not set'} Years</p>
                </div>
              </div>

              <div style={{ marginTop: 'var(--spacing-4)', fontSize: '0.9rem' }}>
                <p><strong>License:</strong> {d.license_number}</p>
                <p><strong>Qualification:</strong> {d.qualification}</p>
                {d.hospital && <p><strong>Facility:</strong> {d.hospital}</p>}
              </div>
            </div>
            
            <div className="approval-card-footer">
              <button className="jewel-btn" style={{ width: '100%', justifyContent: 'center' }} onClick={() => approveDoctor(d.id)}>
                Authorize Specialist
              </button>
              <button className="nav-link" style={{ background: 'var(--surface-container-high)' }}>
                View PDF
              </button>
            </div>
          </div>
        ))}

        {pendingDoctors.length === 0 && (
          <div className="glass-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--spacing-16)' }}>
            <p className="eyebrow">All Clear</p>
            <h2 className="headline-sm">No pending approvals</h2>
            <p style={{ color: 'var(--on-surface-variant)' }}>The verification queue is currently empty.</p>
          </div>
        )}
      </section>
    </div>
  );
}
