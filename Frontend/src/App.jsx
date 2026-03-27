import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./state/AuthContext.jsx";
import { AppLayout } from "./components/AppLayout.jsx";
import { LandingPage } from "./pages/LandingPage.jsx";
import { AllDoctorsPage } from "./pages/AllDoctorsPage.jsx";
import { AboutPage } from "./pages/AboutPage.jsx";
import { ContactPage } from "./pages/ContactPage.jsx";
import { AuthPage } from "./pages/AuthPage.jsx";
import { MyProfilePage } from "./pages/MyProfilePage.jsx";
import { PatientDashboard } from "./pages/PatientDashboard.jsx";
import { DoctorBookingPage } from "./pages/DoctorBookingPage.jsx";
import { DoctorProfilePage } from "./pages/DoctorProfilePage.jsx";
import { DoctorDashboard } from "./pages/DoctorDashboard.jsx";
import { AdminDoctorApprovalPage } from "./pages/AdminDoctorApprovalPage.jsx";
import { AdminUserManagementPage } from "./pages/AdminUserManagementPage.jsx";
import { AdminAppointmentMonitorPage } from "./pages/AdminAppointmentMonitorPage.jsx";
import { AdminFeedbacksPage } from "./pages/AdminFeedbacksPage.jsx";

function PrivateRoute({ children, allow }) {
  const { user, token } = useAuth();

  if (!token || !user) return <Navigate to="/auth" replace />;
  if (allow && !allow.includes(user.role)) return <Navigate to="/" replace />;

  return children;
}

export default function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/doctors" element={<AllDoctorsPage />} />
        <Route path="/doctors/:id" element={<DoctorProfilePage />} />
        <Route
          path="/doctors/:id/book"
          element={
            <PrivateRoute allow={["patient"]}>
              <DoctorBookingPage />
            </PrivateRoute>
          }
        />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/my-profile"
          element={
            <PrivateRoute allow={["patient", "doctor", "admin"]}>
              <MyProfilePage />
            </PrivateRoute>
          }
        />

        <Route
          path="/patient"
          element={
            <PrivateRoute allow={["patient"]}>
              <PatientDashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/doctor"
          element={
            <PrivateRoute allow={["doctor"]}>
              <DoctorDashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <PrivateRoute allow={["admin"]}>
              <Navigate to="/admin/doctor-approvals" replace />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/doctor-approvals"
          element={
            <PrivateRoute allow={["admin"]}>
              <AdminDoctorApprovalPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <PrivateRoute allow={["admin"]}>
              <AdminUserManagementPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/appointments"
          element={
            <PrivateRoute allow={["admin"]}>
              <AdminAppointmentMonitorPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/feedbacks"
          element={
            <PrivateRoute allow={["admin"]}>
              <AdminFeedbacksPage />
            </PrivateRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}
