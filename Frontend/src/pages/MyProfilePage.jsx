import { useEffect, useState } from "react";
import { api } from "../utils/api.js";
import { useAuth } from "../state/AuthContext.jsx";
import { DEFAULT_DOCTOR_IMAGE } from "../constants/defaultImages.js";

const DR_WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const toTimeInputValue = (value, fallback = "10:00") => {
  if (!value) return fallback;
  const text = String(value).trim();
  if (text.length >= 5) return text.slice(0, 5);
  return fallback;
};

export function MyProfilePage() {
  const { token, user, setUser } = useAuth();
  const isDoctor = user?.role === "doctor";
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "",
    dob: "",
    address: "",
    profile_image_url: "",
  });
  const [doctorProfile, setDoctorProfile] = useState({
    specialization: "",
    experience: "",
    hospital: "",
    qualification: "",
    license_number: "",
    phone: "",
    profile_image_url: "",
    bio: "",
    consultation_fee: "",
  });
  const [availability, setAvailability] = useState({
    available_days: [],
    start_time: "10:00",
    end_time: "16:00",
    slot_duration: 30,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
    });

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await api.get("/auth/me", token);
      setProfile({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        gender: data.gender || "",
        dob: data.dob ? String(data.dob).slice(0, 10) : "",
        address: data.address || "",
        profile_image_url: data.profile_image_url || "",
      });
      if (isDoctor) {
        const doctorData = await api.get("/doctors/me", token);
        setDoctorProfile({
          specialization: doctorData.specialization || "",
          experience: doctorData.experience || "",
          hospital: doctorData.hospital || "",
          qualification: doctorData.qualification || "",
          license_number: doctorData.license_number || "",
          phone: doctorData.phone || "",
          profile_image_url: doctorData.profile_image_url || "",
          bio: doctorData.bio || "",
          consultation_fee: doctorData.consultation_fee || "",
        });
        const availData = await api.get("/availability/me", token);
        if (availData) {
          const selectedDays = String(availData.available_days || "")
            .split(",")
            .map((d) => d.trim())
            .filter(Boolean);
          setAvailability({
            available_days: selectedDays,
            start_time: toTimeInputValue(availData.start_time, "10:00"),
            end_time: toTimeInputValue(availData.end_time, "16:00"),
            slot_duration: availData.slot_duration || 30,
          });
        }
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const onImageUpload = async (e, target) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await toBase64(file);
      if (target === "doctor")
        setDoctorProfile((p) => ({ ...p, profile_image_url: String(base64) }));
      else setProfile((p) => ({ ...p, profile_image_url: String(base64) }));
      setMessage("Image selected successfully.");
      setTimeout(() => setMessage(""), 5000);
    } catch {
      setError("Image processing failed.");
      setTimeout(() => setError(""), 5000);
    }
  };

  const onSave = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);
    try {
      const data = await api.put("/auth/me", profile, token);
      if (isDoctor) {
        const doctorData = {
          ...doctorProfile,
          profile_image_url:
            doctorProfile.profile_image_url || DEFAULT_DOCTOR_IMAGE,
          consultation_fee: doctorProfile.consultation_fee
            ? Number(doctorProfile.consultation_fee)
            : null,
        };
        await api.put("/doctors/me", doctorData, token);
      }
      setMessage("Account profile synchronized.");
      setUser({ ...user, ...data.user });
      setTimeout(() => setMessage(""), 5000);
    } catch (e) {
      setError(e.message);
      setTimeout(() => setError(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  const onSaveAvailability = async () => {
    setMessage("");
    setError("");
    if (availability.available_days.length === 0) {
      setError("Please select at least one clinical day.");
      setTimeout(() => setError(""), 5000);
      return;
    }
    if (availability.start_time >= availability.end_time) {
      setError("End time must follow start time.");
      setTimeout(() => setError(""), 5000);
      return;
    }
    setLoading(true);
    try {
      await api.post(
        "/availability/set",
        {
          ...availability,
          available_days: availability.available_days.join(", "),
          slot_duration: Number(availability.slot_duration),
        },
        token,
      );
      setMessage("Clinical availability updated.");
      setTimeout(() => setMessage(""), 5000);
    } catch (e) {
      setError(e.message);
      setTimeout(() => setError(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day) => {
    setAvailability((p) => ({
      ...p,
      available_days: p.available_days.includes(day)
        ? p.available_days.filter((d) => d !== day)
        : [...p.available_days, day],
    }));
  };

  return (
    <div className="discovery-container">
      <header style={{ marginBottom: "var(--spacing-12)" }}>
        <p className="eyebrow">Identity Management</p>
        <h1 className="display-lg">Profile Settings</h1>
        <p style={{ color: "var(--on-surface-variant)" }}>
          Manage your personal credentials and professional clinical profile.
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.5fr",
          gap: "var(--spacing-12)",
        }}
      >
        <aside>
          <div
            className="glass-card"
            style={{ textAlign: "center", padding: "var(--spacing-10)" }}
          >
            <div
              style={{
                position: "relative",
                width: "160px",
                height: "160px",
                margin: "0 auto var(--spacing-6)",
              }}
            >
              <img
                src={
                  (isDoctor
                    ? doctorProfile.profile_image_url
                    : profile.profile_image_url) || DEFAULT_DOCTOR_IMAGE
                }
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "4px solid white",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
                }}
              />
              <label
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  width: "40px",
                  height: "40px",
                  background: "var(--primary)",
                  borderRadius: "50%",
                  color: "white",
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                }}
              >
                +
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) =>
                    onImageUpload(e, isDoctor ? "doctor" : "patient")
                  }
                />
              </label>
            </div>
            <h2 className="headline-sm">{profile.name || "User Name"}</h2>
            <p
              className="status-pill status-approved"
              style={{ marginTop: "var(--spacing-2)", display: "inline-block" }}
            >
              {user?.role.toUpperCase()}
            </p>

            <div style={{ marginTop: "var(--spacing-8)", textAlign: "left" }}>
              <p className="eyebrow" style={{ fontSize: "0.65rem" }}>
                Core Credentials
              </p>
              <div
                style={{
                  display: "grid",
                  gap: "var(--spacing-3)",
                  marginTop: "var(--spacing-2)",
                }}
              >
                <div
                  className="tonal-card"
                  style={{ padding: "var(--spacing-3)" }}
                >
                  <span
                    style={{
                      fontSize: "var(--label-md)",
                      color: "var(--on-surface-variant)",
                    }}
                  >
                    Primary Email
                  </span>
                  <p style={{ fontWeight: 600 }}>{profile.email}</p>
                </div>
                {isDoctor && (
                  <div
                    className="tonal-card"
                    style={{ padding: "var(--spacing-3)" }}
                  >
                    <span
                      style={{
                        fontSize: "var(--label-md)",
                        color: "var(--on-surface-variant)",
                      }}
                    >
                      Specialization
                    </span>
                    <p style={{ fontWeight: 600 }}>
                      {doctorProfile.specialization || "Not set"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

        <main>
          <form
            onSubmit={onSave}
            style={{ display: "grid", gap: "var(--spacing-8)" }}
          >
            <section
              className="glass-card"
              style={{ padding: "var(--spacing-8)" }}
            >
              <h3
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  marginBottom: "var(--spacing-6)",
                  color: "var(--primary)",
                }}
              >
                Personal Identity
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "var(--spacing-4)",
                }}
              >
                <label style={{ display: "block" }}>
                  <p
                    style={{
                      textTransform: "uppercase",
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      color: "var(--on-surface-variant)",
                      marginBottom: "var(--spacing-2)",
                    }}
                  >
                    Full Name
                  </p>
                  <input
                    className="input-ethereal"
                    value={profile.name}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, name: e.target.value }))
                    }
                    required
                  />
                </label>
                <label style={{ display: "block" }}>
                  <p
                    style={{
                      textTransform: "uppercase",
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      color: "var(--on-surface-variant)",
                      marginBottom: "var(--spacing-2)",
                    }}
                  >
                    Contact Phone
                  </p>
                  <input
                    className="input-ethereal"
                    value={profile.phone}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, phone: e.target.value }))
                    }
                  />
                </label>
                <label style={{ display: "block" }}>
                  <p
                    style={{
                      textTransform: "uppercase",
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      color: "var(--on-surface-variant)",
                      marginBottom: "var(--spacing-2)",
                    }}
                  >
                    Biological Gender
                  </p>
                  <select
                    className="input-ethereal"
                    value={profile.gender}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, gender: e.target.value }))
                    }
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
                <label style={{ display: "block" }}>
                  <p
                    style={{
                      textTransform: "uppercase",
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      color: "var(--on-surface-variant)",
                      marginBottom: "var(--spacing-2)",
                    }}
                  >
                    Birth Registry
                  </p>
                  <input
                    className="input-ethereal"
                    type="date"
                    value={profile.dob}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, dob: e.target.value }))
                    }
                  />
                </label>
              </div>
              <label
                style={{ display: "block", marginTop: "var(--spacing-4)" }}
              >
                <p
                  style={{
                    textTransform: "uppercase",
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    color: "var(--on-surface-variant)",
                    marginBottom: "var(--spacing-2)",
                  }}
                >
                  Residential Address
                </p>
                <textarea
                  className="input-ethereal"
                  rows={2}
                  value={profile.address}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, address: e.target.value }))
                  }
                />
              </label>
            </section>

            {isDoctor && (
              <section
                className="glass-card"
                style={{ padding: "var(--spacing-8)" }}
              >
                <h3
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    marginBottom: "var(--spacing-6)",
                    color: "var(--primary)",
                  }}
                >
                  Professional Credentials
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "var(--spacing-4)",
                  }}
                >
                  <label style={{ display: "block" }}>
                    <p
                      style={{
                        textTransform: "uppercase",
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        color: "var(--on-surface-variant)",
                        marginBottom: "var(--spacing-2)",
                        margin: 0,
                      }}
                    >
                      Medical Specialization
                    </p>
                    <input
                      className="input-ethereal"
                      value={doctorProfile.specialization}
                      onChange={(e) =>
                        setDoctorProfile((p) => ({
                          ...p,
                          specialization: e.target.value,
                        }))
                      }
                      required
                    />
                  </label>
                  <label style={{ display: "block" }}>
                    <p
                      style={{
                        textTransform: "uppercase",
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        color: "var(--on-surface-variant)",
                        marginBottom: "var(--spacing-2)",
                        margin: 0,
                      }}
                    >
                      Clinical Experience (Years)
                    </p>
                    <input
                      className="input-ethereal"
                      type="number"
                      value={doctorProfile.experience}
                      onChange={(e) =>
                        setDoctorProfile((p) => ({
                          ...p,
                          experience: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <label style={{ display: "block" }}>
                    <p
                      style={{
                        textTransform: "uppercase",
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        color: "var(--on-surface-variant)",
                        marginBottom: "var(--spacing-2)",
                        margin: 0,
                      }}
                    >
                      Primary Hospital/Clinic
                    </p>
                    <input
                      className="input-ethereal"
                      value={doctorProfile.hospital}
                      onChange={(e) =>
                        setDoctorProfile((p) => ({
                          ...p,
                          hospital: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <label style={{ display: "block" }}>
                    <p
                      style={{
                        textTransform: "uppercase",
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        color: "var(--on-surface-variant)",
                        marginBottom: "var(--spacing-2)",
                        margin: 0,
                      }}
                    >
                      Medical License Number
                    </p>
                    <input
                      className="input-ethereal"
                      value={doctorProfile.license_number}
                      onChange={(e) =>
                        setDoctorProfile((p) => ({
                          ...p,
                          license_number: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <label style={{ display: "block" }}>
                    <p
                      style={{
                        textTransform: "uppercase",
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        color: "var(--on-surface-variant)",
                        marginBottom: "var(--spacing-2)",
                        margin: 0,
                      }}
                    >
                      Highest Qualification
                    </p>
                    <input
                      className="input-ethereal"
                      value={doctorProfile.qualification}
                      onChange={(e) =>
                        setDoctorProfile((p) => ({
                          ...p,
                          qualification: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <label style={{ display: "block" }}>
                    <p
                      style={{
                        textTransform: "uppercase",
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        color: "var(--on-surface-variant)",
                        marginBottom: "var(--spacing-2)",
                        margin: 0,
                      }}
                    >
                      Consultation Fee (NPR)
                    </p>
                    <input
                      className="input-ethereal"
                      type="number"
                      value={doctorProfile.consultation_fee}
                      onChange={(e) =>
                        setDoctorProfile((p) => ({
                          ...p,
                          consultation_fee: e.target.value,
                        }))
                      }
                    />
                  </label>
                </div>
                <label
                  style={{ marginTop: "var(--spacing-4)", display: "block" }}
                >
                  <p
                    style={{
                      textTransform: "uppercase",
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      color: "var(--on-surface-variant)",
                      marginBottom: "var(--spacing-2)",
                      margin: 0,
                    }}
                  >
                    Professional Biography
                  </p>
                  <textarea
                    className="input-ethereal"
                    rows={3}
                    value={doctorProfile.bio}
                    onChange={(e) =>
                      setDoctorProfile((p) => ({ ...p, bio: e.target.value }))
                    }
                  />
                </label>
              </section>
            )}

            {isDoctor && (
              <section
                className="glass-card"
                style={{ padding: "var(--spacing-8)" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "var(--spacing-6)",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      marginBottom: 0,
                      color: "var(--primary)",
                    }}
                  >
                    Clinical Availability
                  </h3>
                  <button
                    type="button"
                    className="nav-link"
                    onClick={onSaveAvailability}
                  >
                    Synchronize Schedule
                  </button>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "var(--spacing-2)",
                    flexWrap: "wrap",
                    marginBottom: "var(--spacing-6)",
                  }}
                >
                  {DR_WEEKDAYS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      className={`day-chip ${availability.available_days.includes(day) ? "active" : ""}`}
                      onClick={() => toggleDay(day)}
                    >
                      <strong>{day.slice(0, 3)}</strong>
                    </button>
                  ))}
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "var(--spacing-4)",
                  }}
                >
                  <label style={{ display: "block" }}>
                    <p
                      style={{
                        textTransform: "uppercase",
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        color: "var(--on-surface-variant)",
                        marginBottom: "var(--spacing-2)",
                        margin: 0,
                      }}
                    >
                      Start Time
                    </p>
                    <input
                      className="input-ethereal"
                      type="time"
                      value={availability.start_time}
                      onChange={(e) =>
                        setAvailability((p) => ({
                          ...p,
                          start_time: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <label style={{ display: "block" }}>
                    <p
                      style={{
                        textTransform: "uppercase",
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        color: "var(--on-surface-variant)",
                        marginBottom: "var(--spacing-2)",
                        margin: 0,
                      }}
                    >
                      End Time
                    </p>
                    <input
                      className="input-ethereal"
                      type="time"
                      value={availability.end_time}
                      onChange={(e) =>
                        setAvailability((p) => ({
                          ...p,
                          end_time: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <label style={{ display: "block" }}>
                    <p
                      style={{
                        textTransform: "uppercase",
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        color: "var(--on-surface-variant)",
                        marginBottom: "var(--spacing-2)",
                        margin: 0,
                      }}
                    >
                      Slot Span (Min)
                    </p>
                    <input
                      className="input-ethereal"
                      type="number"
                      value={availability.slot_duration}
                      onChange={(e) =>
                        setAvailability((p) => ({
                          ...p,
                          slot_duration: e.target.value,
                        }))
                      }
                    />
                  </label>
                </div>
              </section>
            )}

            <div style={{ display: "flex", gap: "var(--spacing-4)" }}>
              <button
                className="jewel-btn"
                type="submit"
                style={{ flex: 1, justifyContent: "center", height: "56px" }}
                disabled={loading}
              >
                {loading ? "Processing..." : "Secure & Save Changes"}
              </button>
            </div>
          </form>

          {message && (
            <div
              className="glass-card"
              style={{
                position: "fixed",
                bottom: "var(--spacing-8)",
                right: "var(--spacing-8)",
                borderLeft: "4px solid #27bb53",
                padding: "var(--spacing-4)",
              }}
            >
              {message}
            </div>
          )}
          {error && (
            <div
              className="glass-card"
              style={{
                position: "fixed",
                bottom: "var(--spacing-8)",
                right: "var(--spacing-8)",
                borderLeft: "4px solid #c62828",
                padding: "var(--spacing-4)",
              }}
            >
              {error}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
