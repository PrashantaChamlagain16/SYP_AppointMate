import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext.jsx";
import { useUiFeedback } from "../state/UiFeedbackContext.jsx";

export function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const { showConfirm } = useUiFeedback();
  const navigate = useNavigate();
  const location = useLocation();
  const showPublicLinks = !user || user.role === "patient";
  const showFooterQuickLinks = showPublicLinks && location.pathname !== "/auth";

  const onLogout = async () => {
    const confirmed = await showConfirm({
      title: "Log Out",
      message: "Are you sure you want to log out?",
      confirmText: "Log Out",
      cancelText: "Stay Logged In",
    });
    if (!confirmed) return;
    logout();
    navigate("/");
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/" className="brand-link">
          <div className="brand-logo" aria-hidden="true">
            <span className="brand-logo-cross-v" />
            <span className="brand-logo-cross-h" />
          </div>
          <span>AppointMate</span>
        </NavLink>
        <nav className="nav">
          {showPublicLinks && (
            <>
              <NavLink to="/" className="nav-link">
                Home
              </NavLink>
              <NavLink to="/doctors" className="nav-link">
                Doctors
              </NavLink>
              <NavLink to="/about" className="nav-link">
                About
              </NavLink>
              <NavLink to="/contact" className="nav-link">
                Contact
              </NavLink>
            </>
          )}

          {!user && (
            <NavLink to="/auth" className="nav-link login-trigger">
              Login
            </NavLink>
          )}

          {user?.role === "doctor" && (
            <NavLink to="/doctor" className="nav-link">
              Appointments
            </NavLink>
          )}

          {user && (
            <NavLink to="/my-profile" className="nav-link">
              Profile
            </NavLink>
          )}

          {user?.role === "patient" && (
            <NavLink to="/patient" className="nav-link">
              Dashboard
            </NavLink>
          )}
          {user?.role === "admin" && (
            <>
              <NavLink to="/admin/doctor-approvals" className="nav-link">
                Approvals
              </NavLink>
              <NavLink to="/admin/users" className="nav-link">
                Users
              </NavLink>
              <NavLink to="/admin/appointments" className="nav-link">
                Monitor
              </NavLink>
              <NavLink to="/admin/feedbacks" className="nav-link">
                Feedbacks
              </NavLink>
            </>
          )}
          {user && (
            <button className="logout-btn" onClick={onLogout}>
              Logout
            </button>
          )}
        </nav>
      </header>
      <main className="main-content">{children}</main>
      <footer className="site-footer">
        <div className="site-footer-inner">
          <div className="site-footer-brand">
            <strong>AppointMate</strong>
            <p>Professional appointment management for patient at any time from anywhere.</p>
          </div>
          <div className="site-footer-contact">
            <p className="site-footer-title">Contact Info</p>
            <p>Email: appointmate@gmail.com</p>
            <p>Phone: +9779749223478</p>
          </div>
          {showFooterQuickLinks && (
            <div className="site-footer-nav">
              <p className="site-footer-title">Quick Links</p>
              <div className="site-footer-links">
                <NavLink to="/" className="footer-link">
                  Home
                </NavLink>
                <NavLink to="/doctors" className="footer-link">
                  All Doctors
                </NavLink>
                <NavLink to="/about" className="footer-link">
                  About Us
                </NavLink>
                <NavLink to="/contact" className="footer-link">
                  Contact
                </NavLink>
              </div>
            </div>
          )}
        </div>
        <p className="site-footer-copy">© {new Date().getFullYear()} AppointMate. All rights reserved.</p>
      </footer>
    </div>
  );
}
