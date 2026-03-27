import { useEffect, useState } from "react";
import { api } from "../utils/api.js";
import { useUiFeedback } from "../state/UiFeedbackContext.jsx";

export function ContactPage() {
  const { showMessage } = useUiFeedback();
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [sending, setSending] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post("/feedback", form);
      setSent(true);
      setForm({ name: "", email: "", message: "" });
    } catch (error) {
      showMessage({ type: "error", title: "Send Failed", message: error.message });
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (!sent) return undefined;
    const timer = setTimeout(() => setSent(false), 5000);
    return () => clearTimeout(timer);
  }, [sent]);

  return (
    <div className="discovery-container">
      <header style={{ marginBottom: 'var(--spacing-12)' }}>
        <p className="eyebrow" style={{ color: 'var(--primary)' }}>Support & Inquiries</p>
        <h1 className="display-lg">Connect With Our Team</h1>
        <p style={{ color: 'var(--on-surface-variant)' }}>Our dedicated clinical support officers are ready to assist with your operational needs.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.25fr', gap: 'var(--spacing-12)' }}>
        <aside>
           <div className="glass-card" style={{ overflow: 'hidden', padding: 0 }}>
              <img 
                src="https://images.pexels.com/photos/1170979/pexels-photo-1170979.jpeg?auto=compress&cs=tinysrgb&w=1200" 
                style={{ width: '100%', height: '240px', objectFit: 'cover' }} 
              />
              <div style={{ padding: 'var(--spacing-8)' }}>
                 <h3 className="headline-sm" style={{ marginBottom: 'var(--spacing-4)' }}>Contact Directory</h3>
                 <div style={{ display: 'grid', gap: 'var(--spacing-4)' }}>
                    <div className="tonal-card" style={{ padding: 'var(--spacing-4)' }}>
                       <p className="eyebrow" style={{ fontSize: '0.65rem' }}>Electronic Mail</p>
                       <p style={{ fontWeight: 600 }}>concierge@appointmate.med</p>
                    </div>
                    <div className="tonal-card" style={{ padding: 'var(--spacing-4)' }}>
                       <p className="eyebrow" style={{ fontSize: '0.65rem' }}>Specialist Line</p>
                       <p style={{ fontWeight: 600 }}>+977 984-XXXXXXX</p>
                    </div>
                 </div>
                 <p style={{ marginTop: 'var(--spacing-6)', fontSize: 'var(--label-md)', color: 'var(--on-surface-variant)' }}>
                    Available Weekdays: 09:00 - 18:00 (NPT)
                 </p>
              </div>
           </div>
        </aside>

        <main>
           <div className="glass-card" style={{ padding: 'var(--spacing-8)' }}>
              <h3 className="headline-sm" style={{ marginBottom: 'var(--spacing-6)' }}>Electronic Correspondence</h3>
              <form onSubmit={onSubmit} style={{ display: 'grid', gap: 'var(--spacing-4)' }}>
                 <label className="eyebrow">Your Full Name
                   <input
                     className="input-ethereal"
                     value={form.name}
                     onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                     required
                   />
                 </label>
                 <label className="eyebrow">Professional Email
                   <input
                     className="input-ethereal"
                     type="email"
                     value={form.email}
                     onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                     required
                   />
                 </label>
                 <label className="eyebrow">Message Content
                   <textarea
                     className="input-ethereal"
                     rows={5}
                     required
                     placeholder="State your inquiry or feedback with clinical clarity..."
                     value={form.message}
                     onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                   />
                 </label>
                 <button className="jewel-btn" style={{ height: '56px', justifyContent: 'center' }} type="submit" disabled={sending}>
                   {sending ? "Transmitting..." : "Transmit Message"}
                 </button>
              </form>
              {sent && <div className="glass-card" style={{ marginTop: 'var(--spacing-6)', background: '#e8f5e9', borderLeft: '4px solid #2e7d32' }}>Transmission verified. Our team will respond shortly.</div>}
           </div>
        </main>
      </div>
    </div>
  );
}
