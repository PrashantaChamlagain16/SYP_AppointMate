import { Activity, ShieldCheck, UserCheck } from "lucide-react";

export function AboutPage() {
  return (
    <div className="discovery-container">
      <header
        style={{ marginBottom: "var(--spacing-12)", textAlign: "center" }}
      >
        <p className="eyebrow">Our Vision</p>
        <h1 className="display-lg">The Appoint-Mate Mission</h1>
        <p
          style={{
            maxWidth: "600px",
            margin: "var(--spacing-4) auto 0",
            color: "var(--on-surface-variant)",
          }}
        >
          A digital-first scheduling ecosystem designed to unify patients and
          practitioners through clinical precision and glassmorphic elegance.
        </p>
      </header>

      <div
        className="feature-grid"
        style={{
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "var(--spacing-8)",
        }}
      >
        <div
          className="glass-card"
          style={{
            padding: "var(--spacing-8)",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              background: "var(--primary-container)",
              color: "var(--on-primary)",
              borderRadius: "14px",
              marginBottom: "var(--spacing-6)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Activity size={24} />
          </div>
          <h3 className="headline-sm">Clinical Agility</h3>
          <p style={{ color: "var(--on-surface-variant)", lineHeight: 1.6 }}>
            Eliminating scheduling friction with real-time availability
            synchronization and automated clinical workflows.
          </p>
        </div>

        <div
          className="glass-card"
          style={{
            padding: "var(--spacing-8)",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              background: "var(--secondary-container)",
              color: "var(--on-secondary-container, #5400ce)",
              borderRadius: "14px",
              marginBottom: "var(--spacing-6)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <ShieldCheck size={24} />
          </div>
          <h3 className="headline-sm">Secure Governance</h3>
          <p style={{ color: "var(--on-surface-variant)", lineHeight: 1.6 }}>
            Rigorous specialist verification and role-based access control
            ensure a trustworthy medical environment.
          </p>
        </div>

        <div
          className="glass-card"
          style={{
            padding: "var(--spacing-8)",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              background: "var(--tertiary-container)",
              color: "#00d2fd",
              borderRadius: "14px",
              marginBottom: "var(--spacing-6)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <UserCheck size={24} />
          </div>
          <h3 className="headline-sm">Patient Autonomy</h3>
          <p style={{ color: "var(--on-surface-variant)", lineHeight: 1.6 }}>
            Empowering users with transparent specialist profiles, digital
            payment integrated booking, and historical visit tracking.
          </p>
        </div>
      </div>

      <section
        className="tonal-card"
        style={{
          marginTop: "var(--spacing-12)",
          padding: "var(--spacing-12)",
          textAlign: "center",
        }}
      >
        <h2 className="headline-sm">The Evolution of Scheduling</h2>
        <p
          style={{
            maxWidth: "800px",
            margin: "var(--spacing-4) auto",
            color: "var(--on-surface-variant)",
          }}
        >
          Founded on the principle of accessibility, Appoint-Mate bridges the
          gap between patient needs and specialist availability. Our platform is
          a testament to modern frontend engineering meeting clinical necessity.
        </p>
      </section>
    </div>
  );
}
