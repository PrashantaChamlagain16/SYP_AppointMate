import { useEffect, useState } from "react";
import { api } from "../utils/api.js";
import { useAuth } from "../state/AuthContext.jsx";
import { useUiFeedback } from "../state/UiFeedbackContext.jsx";

export function AdminUserManagementPage() {
  const { token } = useAuth();
  const { showMessage, showConfirm } = useUiFeedback();
  const [users, setUsers] = useState([]);
  const patients = users.filter((u) => u.role === "patient");
  const doctors = users.filter((u) => u.role === "doctor");

  const load = async () => {
    try {
      const data = await api.get("/admin/users", token);
      setUsers(data);
    } catch (e) {
      showMessage({ type: "error", title: "Load Failed", message: e.message });
    }
  };

  useEffect(() => { load(); }, []);

  const blockToggle = async (id, active) => {
    try {
      await api.put(`/admin/${active ? "block" : "unblock"}/${id}`, {}, token);
      showMessage({
        type: "success",
        title: "User Updated",
        message: `User ${active ? "blocked" : "unblocked"} successfully.`,
      });
      await load();
    } catch (e) {
      showMessage({ type: "error", title: "Action Failed", message: e.message });
    }
  };

  const deleteUser = async (id, name) => {
    const confirmed = await showConfirm({
      title: "Delete User",
      message: `Delete ${name}? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
    });
    if (!confirmed) return;
    try {
      await api.delete(`/admin/users/${id}`, token);
      showMessage({ type: "success", title: "User Deleted", message: `${name} was deleted.` });
      await load();
    } catch (e) {
      showMessage({ type: "error", title: "Delete Failed", message: e.message });
    }
  };

  const UserTable = ({ title, data }) => (
    <div className="glass-card" style={{ padding: 'var(--spacing-6)' }}>
      <h3 className="headline-sm">{title}</h3>
      <table className="data-table-ethereal">
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((u) => (
            <tr key={u.id}>
              <td>
                <strong>{u.name}</strong>
                <p style={{ fontSize: 'var(--label-md)', color: 'var(--on-surface-variant)' }}>{u.email}</p>
              </td>
              <td>
                <span className={`status-pill ${u.is_active ? 'status-approved' : 'status-cancelled'}`}>
                  {u.is_active ? 'Active' : 'Blocked'}
                </span>
              </td>
              <td style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', gap: 'var(--spacing-2)', justifyContent: 'flex-end' }}>
                  <button className="nav-link" style={{ fontSize: '0.8rem', background: 'var(--surface-container)' }} onClick={() => blockToggle(u.id, u.is_active)}>
                    {u.is_active ? 'Block' : 'Unblock'}
                  </button>
                  <button className="nav-link" style={{ fontSize: '0.8rem', color: '#c62828' }} onClick={() => deleteUser(u.id, u.name)}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && <p style={{ textAlign: 'center', padding: 'var(--spacing-8)' }}>No {title.toLowerCase()} found.</p>}
    </div>
  );

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Governance Portal</p>
          <h1 className="display-lg">User Registry</h1>
          <p style={{ color: 'var(--on-surface-variant)' }}>Audit and manage all active accounts across the platform.</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-4)' }}>
           <div className="stats-item">
              <strong>{patients.length}</strong>
              <span>Patients</span>
           </div>
           <div className="stats-item">
              <strong>{doctors.length}</strong>
              <span>Doctors</span>
           </div>
        </div>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-8)' }}>
        <UserTable title="Patients" data={patients} />
        <UserTable title="Doctors" data={doctors} />
      </section>
    </div>
  );
}
