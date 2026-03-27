import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext.jsx";

const DOCTOR_SPECIALIZATIONS = [
  "Neurologist",
  "General Physician",
  "Gynecologist",
  "Pediatrician",
  "Dermatologist",
  "Dentist",
  "Orthopedic",
  "Cardiologist",
];

const initialForm = {
  name: "",
  email: "",
  password: "",
  role: "patient",
  specialization: "",
  experience: "",
  hospital: "",
  qualification: "",
  license_number: "",
  phone: "",
};

export function AuthPage() {
  const { login, register, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState(initialForm);

  const update = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const redirectByRole = (role) => {
    if (role === "admin") navigate("/admin");
    else if (role === "doctor") navigate("/doctor");
    else navigate("/patient");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      if (mode === "register") {
        const data = await register(form);
        setMessage(data.message || "Registration complete. Please login.");
        setForm(initialForm);
        setMode("login");
        return;
      }
      const user = await login(form.email, form.password);
      setForm(initialForm);
      redirectByRole(user.role);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-page-container" style={{ display: 'grid', placeItems: 'center', minHeight: '80vh' }}>
      <section className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-8)' }}>
           <h2 className="headline-sm">{mode === 'login' ? 'Welcome Back' : 'Join AppointMate'}</h2>
           <p style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--label-md)' }}>
              {mode === 'login' ? 'Access your clinical dashboard' : 'Start your journey to better health'}
           </p>
        </div>

        <div className="tab-row">
          <button
            className={mode === "login" ? "tab active" : "tab"}
            onClick={() => {
              setMode("login");
              setForm(initialForm);
              setError("");
              setMessage("");
            }}
          >
            Login
          </button>
          <button
            className={mode === "register" ? "tab active" : "tab"}
            onClick={() => {
              setMode("register");
              setForm(initialForm);
              setError("");
              setMessage("");
            }}
          >
            Register
          </button>
        </div>

        <form onSubmit={onSubmit} className="form-ethereal">
          {mode === "register" && (
            <label>
              Name
              <input name="name" className="input-ethereal" value={form.name} onChange={update} placeholder="Full Name" required />
            </label>
          )}

          <label>
            Email
            <input name="email" type="email" className="input-ethereal" value={form.email} onChange={update} placeholder="email@hospital.com" required />
          </label>

          <label>
            Password
            <input
              name="password"
              type="password"
              className="input-ethereal"
              value={form.password}
              onChange={update}
              placeholder="••••••••"
              required
            />
          </label>

          {mode === "register" && (
            <label>
              I am a
              <select name="role" className="input-ethereal" value={form.role} onChange={update}>
                <option value="patient">Patient</option>
                <option value="doctor">Doctor / Specialist</option>
              </select>
            </label>
          )}

          {mode === "register" && form.role === "doctor" && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
              <label>
                Specialization
                <select name="specialization" className="input-ethereal" value={form.specialization} onChange={update} required>
                  <option value="">Select</option>
                  {DOCTOR_SPECIALIZATIONS.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label>
                Experience (yrs)
                <input name="experience" type="number" className="input-ethereal" value={form.experience} onChange={update} />
              </label>
              <label style={{ gridColumn: 'span 2' }}>
                Qualification
                <input name="qualification" className="input-ethereal" value={form.qualification} onChange={update} placeholder="MBBS, MD, etc." required />
              </label>
              <label>
                License No.
                <input name="license_number" className="input-ethereal" value={form.license_number} onChange={update} required />
              </label>
              <label>
                Phone
                <input name="phone" className="input-ethereal" value={form.phone} onChange={update} required />
              </label>
            </div>
          )}

          <button disabled={loading} className="jewel-btn" type="submit" style={{ width: '100%', justifyContent: 'center', marginTop: 'var(--spacing-4)' }}>
            {loading ? "Authorizing..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        {message && <p className="ok-text" style={{ marginTop: 'var(--spacing-4)', textAlign: 'center' }}>{message}</p>}
        {error && <p className="err-text" style={{ marginTop: 'var(--spacing-4)', textAlign: 'center' }}>{error}</p>}
      </section>
    </div>
  );
}
