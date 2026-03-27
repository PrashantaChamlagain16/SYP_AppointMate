import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../state/AuthContext.jsx";
import { api } from "../utils/api.js";
import { DEFAULT_DOCTOR_IMAGE } from "../constants/defaultImages.js";

export function LandingPage() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [doctorError, setDoctorError] = useState("");

  const primaryCta = user?.role === "patient" ? "/doctors" : "/auth";

  useEffect(() => {
    let mounted = true;
    const loadDoctors = async () => {
      try {
        setLoadingDoctors(true);
        const data = await api.get("/doctors");
        if (!mounted) return;
        setDoctors(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!mounted) return;
        setDoctorError(error.message || "Could not load featured doctors.");
      } finally {
        if (mounted) setLoadingDoctors(false);
      }
    };
    loadDoctors();
    return () => { mounted = false; };
  }, []);

  const featuredDoctors = useMemo(() => {
    return [...doctors]
      .sort((a, b) => (Number(b.experience) || 0) - (Number(a.experience) || 0))
      .slice(0, 4);
  }, [doctors]);

  return (
    <div className="landing-page">
      <section className="hero-section">
        <div className="hero-content">
          <p className="eyebrow">The Ethereal Clinic</p>
          <h1 className="display-lg">Care Defined by Serenity.</h1>
          <p className="body-text">
            Professional appointment management for patient at any time from anywhere.
          </p>
          <div className="hero-actions" style={{ marginTop: 'var(--spacing-8)', display: 'flex', gap: 'var(--spacing-4)' }}>
            <Link to={primaryCta} className="jewel-btn">
              Book a Consultation
            </Link>
            <Link to="/doctors" className="nav-link" style={{ background: 'var(--surface-container)', padding: 'var(--spacing-4) var(--spacing-6)' }}>
              Meet Our Doctors
            </Link>
          </div>
        </div>
        <div className="hero-visual">
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden', height: '500px' }}>
            <img 
              src="https://images.pexels.com/photos/7089401/pexels-photo-7089401.jpeg?auto=compress&cs=tinysrgb&w=1600" 
              alt="Care" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </div>
      </section>

      <section className="featured-section" style={{ marginTop: 'var(--spacing-16)' }}>
        <div className="section-header" style={{ textAlign: 'center', marginBottom: 'var(--spacing-12)' }}>
          <p className="eyebrow">Experts</p>
          <h2 className="headline-sm" style={{ fontSize: '2.5rem' }}>Top Rated Specialists</h2>
        </div>

        {loadingDoctors && <p style={{ textAlign: 'center' }}>Optimizing doctor profiles...</p>}
        {doctorError && <p className="err-text">{doctorError}</p>}

        <div className="doctor-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-8)' }}>
          {featuredDoctors.map((doctor) => (
            <Link key={doctor.id} to={`/doctors/${doctor.id}`} className="doctor-card-ethereal">
              <div className="doctor-card-image">
                 <img src={doctor.profile_image_url || DEFAULT_DOCTOR_IMAGE} alt={doctor.name} />
              </div>
              <div className="doctor-card-info">
                <h3>Dr. {doctor.name}</h3>
                <p>{doctor.specialization}</p>
                <div className="availability-tag">Next Available: Today</div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
