import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api.js";
import { useAuth } from "../state/AuthContext.jsx";
import { DEFAULT_DOCTOR_IMAGE } from "../constants/defaultImages.js";

const SPECIALIZATIONS = [
  "All",
  "Neurologist",
  "General Physician",
  "Gynecologist",
  "Pediatrician",
  "Dermatologist",
  "Dentist",
  "Orthopedic",
  "Cardiologist",
];

export function AllDoctorsPage() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [nameSearch, setNameSearch] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [error, setError] = useState("");

  const loadDoctors = async (
    nextName = nameSearch,
    nextSpecialization = specialization,
  ) => {
    const params = new URLSearchParams();
    if (nextName.trim()) params.set("name", nextName.trim());
    if (nextSpecialization.trim()) {
      params.set("specialization", nextSpecialization.trim());
    }
    const query = params.toString() ? `?${params.toString()}` : "";
    const data = await api.get(`/doctors${query}`);
    setDoctors(data);
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDoctors(nameSearch, specialization).catch((e) => setError(e.message));
    }, 200);
    return () => clearTimeout(timer);
  }, [nameSearch, specialization]);

  const beginBooking = (doctorId) => {
    if (!token || !user) {
      setError("Please login first to book an appointment.");
      setTimeout(() => navigate("/auth"), 1200);
      return;
    }
    if (user.role !== "patient") {
      setError("Only patients can book appointments.");
      return;
    }
    setError("");
    navigate(`/doctors/${doctorId}/book`);
  };

  return (
    <div className="discovery-container">
      <header style={{ marginBottom: "var(--spacing-12)" }}>
        <p className="eyebrow">Medical Specialists</p>
        <h1 className="display-lg">Find Your Specialist</h1>
        <p style={{ color: "var(--on-surface-variant)" }}>
          Browse our curated list of world-class medical professionals.
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "260px 1fr",
          gap: "var(--spacing-12)",
          alignItems: "start",
        }}
      >
        <aside className="specialist-sidebar">
          <h3
            className="headline-sm"
            style={{ marginBottom: "var(--spacing-6)", fontSize: "1.2rem" }}
          >
            Specialization
          </h3>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--spacing-2)",
            }}
          >
            {SPECIALIZATIONS.map((item) => (
              <button
                key={item}
                className={`filter-chip ${(item === "All" ? specialization === "" : specialization === item) ? "active" : ""}`}
                onClick={() => {
                  const chosen = item === "All" ? "" : item;
                  setSpecialization(chosen);
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </aside>

        <main>
          <div style={{ marginBottom: "var(--spacing-8)" }}>
            <input
              className="input-ethereal"
              style={{
                height: "56px",
                fontSize: "1.1rem",
                padding: "0 var(--spacing-6)",
              }}
              placeholder="Search by specialist name..."
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
            />
            {error && (
              <p className="err-text" style={{ marginTop: "var(--spacing-2)" }}>
                {error}
              </p>
            )}
          </div>

          <div className="feature-grid">
            {doctors.map((doctor) => (
              <div
                key={doctor.id}
                className="doctor-card-ethereal"
                onClick={() => navigate(`/doctors/${doctor.id}`)}
                style={{ cursor: "pointer" }}
              >
                <div className="doctor-card-image">
                  <img
                    src={doctor.profile_image_url || DEFAULT_DOCTOR_IMAGE}
                    alt={doctor.name}
                  />
                </div>
                <div className="doctor-card-info">
                  <div className="availability-tag">Available</div>
                  <h3>Dr. {doctor.name}</h3>
                  <p>{doctor.specialization}</p>
                </div>
              </div>
            ))}
          </div>

          {doctors.length === 0 && (
            <div
              className="glass-card"
              style={{ textAlign: "center", padding: "var(--spacing-16)" }}
            >
              <h2 className="headline-sm">No specialists found</h2>
              <p style={{ color: "var(--on-surface-variant)" }}>
                Try adjusting your filters or search terms.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
