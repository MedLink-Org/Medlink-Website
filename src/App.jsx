import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { PERMISSIONS } from "./auth/accessControl";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import { MedLinkProvider } from "./context/MedLinkContext";
import AppointmentsPage from "./pages/AppointmentsPage";
import BillingPage from "./pages/BillingPage";
import DashboardPage from "./pages/DashboardPage";
import DoctorsPage from "./pages/DoctorsPage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import NursesPage from "./pages/NursesPage";
import PatientsPage from "./pages/PatientsPage";
import ReportsPage from "./pages/ReportsPage";

function ProtectedAppLayout() {
  return (
    <ProtectedRoute>
      <MedLinkProvider>
        <AppLayout />
      </MedLinkProvider>
    </ProtectedRoute>
  );
}

function requirePermission(permission, element) {
  return <ProtectedRoute permission={permission}>{element}</ProtectedRoute>;
}

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
    handle: { title: "Sign In" }
  },
  {
    path: "/",
    element: <ProtectedAppLayout />,
    children: [
      {
        index: true,
        element: requirePermission(PERMISSIONS.DASHBOARD_VIEW, <DashboardPage />),
        handle: { title: "Dashboard" }
      },
      {
        path: "patients",
        element: requirePermission(PERMISSIONS.PATIENTS_VIEW, <PatientsPage />),
        handle: { title: "Patients" }
      },
      {
        path: "doctors",
        element: requirePermission(PERMISSIONS.DOCTORS_VIEW, <DoctorsPage />),
        handle: { title: "Doctors" }
      },
      {
        path: "nurses",
        element: requirePermission(PERMISSIONS.NURSES_VIEW, <NursesPage />),
        handle: { title: "Nurses" }
      },
      {
        path: "appointments",
        element: requirePermission(PERMISSIONS.APPOINTMENTS_VIEW, <AppointmentsPage />),
        handle: { title: "Appointments" }
      },
      {
        path: "billing",
        element: requirePermission(PERMISSIONS.BILLING_VIEW, <BillingPage />),
        handle: { title: "Billing" }
      },
      {
        path: "reports",
        element: requirePermission(PERMISSIONS.REPORTS_VIEW, <ReportsPage />),
        handle: { title: "Reports" }
      },
      {
        path: "*",
        element: <NotFoundPage />,
        handle: { title: "Not Found" }
      }
    ]
  }
]);

export default function App() {
  return <RouterProvider router={router} />;
}
