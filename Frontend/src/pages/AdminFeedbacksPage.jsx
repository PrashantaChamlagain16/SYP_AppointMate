import { useEffect, useMemo, useState } from "react";
import { api } from "../utils/api.js";
import { useAuth } from "../state/AuthContext.jsx";
import { useUiFeedback } from "../state/UiFeedbackContext.jsx";

function formatDateTime(value) {
  if (!value) return "Unknown date";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return String(value);
  return dt.toLocaleString();
}

export function AdminFeedbacksPage() {
  const { token } = useAuth();
  const { showMessage } = useUiFeedback();
  const [feedbacks, setFeedbacks] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await api.get("/admin/feedbacks", token);
        setFeedbacks(data);
        if (data.length > 0) setSelectedId(data[0].entry_id);
      } catch (error) {
        showMessage({ type: "error", title: "Load Failed", message: error.message });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token]);

  const selectedFeedback = useMemo(
    () => feedbacks.find((item) => item.entry_id === selectedId) || null,
    [feedbacks, selectedId],
  );

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Quality Insights</p>
          <h1 className="display-lg">Patient Feedbacks</h1>
          <p style={{ color: "var(--on-surface-variant)" }}>
            Click a patient name to open and read full feedback.
          </p>
        </div>
        <div className="stats-item" style={{ minWidth: "160px" }}>
          <strong>{feedbacks.length}</strong>
          <span>Total Feedbacks</span>
        </div>
      </header>

      <section className="admin-feedback-layout">
        <div className="glass-card" style={{ padding: "var(--spacing-4)" }}>
          <h3 className="headline-sm" style={{ marginBottom: "var(--spacing-3)" }}>
            Names
          </h3>
          {loading && <p>Loading feedbacks...</p>}
          {!loading && feedbacks.length === 0 && (
            <p style={{ color: "var(--on-surface-variant)" }}>No feedbacks found yet.</p>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-2)" }}>
            {feedbacks.map((item) => {
              const isActive = item.entry_id === selectedId;
              return (
                <button
                  key={item.entry_id}
                  onClick={() => setSelectedId(item.entry_id)}
                  className="nav-link"
                  style={{
                    justifyContent: "flex-start",
                    width: "100%",
                    background: isActive
                      ? "linear-gradient(135deg, rgba(31,120,180,0.2), rgba(31,120,180,0.05))"
                      : "var(--surface-container-high)",
                    border: isActive ? "1px solid rgba(31,120,180,0.35)" : "1px solid transparent",
                  }}
                >
                  {item.patient_name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="glass-card" style={{ padding: "var(--spacing-6)" }}>
          {!selectedFeedback && (
            <p style={{ color: "var(--on-surface-variant)" }}>
              Select a patient from the left list to read the full feedback.
            </p>
          )}

          {selectedFeedback && (
            <>
              <div style={{ marginBottom: "var(--spacing-4)" }}>
                <h3 className="headline-sm" style={{ marginBottom: "var(--spacing-2)" }}>
                  {selectedFeedback.patient_name}
                </h3>
                <p style={{ color: "var(--on-surface-variant)" }}>
                  {selectedFeedback.source === "contact"
                    ? "Contact Form Feedback"
                    : `For Dr. ${selectedFeedback.doctor_name} | Rating: ${selectedFeedback.rating}/5`}
                </p>
                <p style={{ color: "var(--on-surface-variant)", fontSize: "0.9rem" }}>
                  {formatDateTime(selectedFeedback.created_at)}
                </p>
              </div>

              <div
                className="tonal-card"
                style={{
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.65,
                  minHeight: "180px",
                  padding: "var(--spacing-5)",
                }}
              >
                {selectedFeedback.comment?.trim()
                  ? selectedFeedback.comment
                  : "No written feedback was provided for this rating."}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
