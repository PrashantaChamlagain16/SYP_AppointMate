import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../utils/api.js";
import { useAuth } from "../state/AuthContext.jsx";
import { DEFAULT_DOCTOR_IMAGE } from "../constants/defaultImages.js";

export function DoctorProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [doctor, setDoctor] = useState(null);
  const [reviewSummary, setReviewSummary] = useState({
    average_rating: 0,
    review_count: 0,
    reviews: [],
  });
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/doctors/${id}`)
      .then((data) => setDoctor(data))
      .catch((e) => setError(e.message));

    api.get(`/reviews/doctor/${id}`)
      .then((data) => setReviewSummary(data))
      .catch(() => {});
  }, [id]);

  if (!doctor) {
    return (
      <div className="discovery-container" style={{ textAlign: 'center', padding: 'var(--spacing-20)' }}>
        {error ? <p className="err-text">{error}</p> : <p className="eyebrow">Initializing Specialist Profile...</p>}
      </div>
    );
  }

  return (
    <div className="discovery-container">
      <div className="profile-grid">
        <aside>
          <div className="profile-image-container">
            <img src={doctor.profile_image_url || DEFAULT_DOCTOR_IMAGE} alt={doctor.name} />
            <div className="profile-glass-info">
               <p className="eyebrow" style={{ fontSize: '0.7rem' }}>Specialist Badge</p>
               <p style={{ fontWeight: 600, color: 'var(--primary)' }}>ID: #{doctor.license_number?.slice(-4) || 'VERIFIED'}</p>
            </div>
          </div>
          
          <div className="tonal-card" style={{ marginTop: 'var(--spacing-6)' }}>
             <h4 className="eyebrow" style={{ marginBottom: 'var(--spacing-2)' }}>Consultation Fee</h4>
             <p className="headline-sm" style={{ color: 'var(--primary)' }}>{doctor.consultation_fee ? `NPR ${doctor.consultation_fee}` : "Complimentary"}</p>
          </div>
        </aside>

        <main>
          <header style={{ marginBottom: 'var(--spacing-8)' }}>
            <p className="eyebrow" style={{ color: 'var(--primary)' }}>{doctor.specialization}</p>
            <h1 className="display-lg">Dr. {doctor.name}</h1>
            <p style={{ fontSize: '1.25rem', color: 'var(--on-surface-variant)', marginTop: 'var(--spacing-2)' }}>
              {doctor.qualification || "Senior Medical Consultant"}
            </p>
          </header>

          <section className="glass-card" style={{ marginBottom: 'var(--spacing-8)', padding: 'var(--spacing-8)' }}>
             <h3 className="headline-sm" style={{ marginBottom: 'var(--spacing-4)' }}>Professional Bio</h3>
             <p style={{ lineWeight: 1.6, color: 'var(--on-surface-variant)' }}>
               {doctor.bio || "This specialist is recognized for their commitment to evidence-based clinical practices and patient-centered therapeutic interventions."}
             </p>
          </section>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-6)', marginBottom: 'var(--spacing-8)' }}>
             <div className="tonal-card">
                <p className="eyebrow">Experience</p>
                <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>{doctor.experience || 0} Years in Practice</p>
             </div>
             <div className="tonal-card">
                <p className="eyebrow">Facility</p>
                <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>{doctor.hospital || "Central Medical Hub"}</p>
             </div>
          </div>

          <section className="glass-card" style={{ padding: 'var(--spacing-8)' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
                <h3 className="headline-sm">Patient Testimony</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                   <strong style={{ fontSize: '1.25rem' }}>{reviewSummary.average_rating || '5.0'}</strong>
                   <span style={{ color: 'var(--on-surface-variant)' }}>({reviewSummary.review_count || 0} Reviews)</span>
                </div>
             </div>

             {reviewSummary.reviews?.length > 0 ? (
               <div style={{ display: 'grid', gap: 'var(--spacing-4)' }}>
                 {reviewSummary.reviews.map((r) => (
                   <div key={r.id} className="review-card">
                      <p style={{ fontWeight: 600 }}>Rating: {r.rating}/5</p>
                      <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.95rem' }}>"{r.comment || "The consultation was professional and informative."}"</p>
                   </div>
                 ))}
               </div>
             ) : (
               <p style={{ textAlign: 'center', color: 'var(--on-surface-variant)', padding: 'var(--spacing-8)' }}>Our specialist is currently building their testimony portfolio.</p>
             )}
          </section>

          {user?.role === "patient" && (
            <button 
              className="jewel-btn" 
              style={{ width: '100%', marginTop: 'var(--spacing-8)', height: '64px', fontSize: '1.1rem', justifyContent: 'center' }} 
              onClick={() => navigate(`/doctors/${id}/book`)}
            >
              Request Consultation
            </button>
          )}
        </main>
      </div>
    </div>
  );
}
