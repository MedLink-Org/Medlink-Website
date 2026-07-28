import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import AppointmentsPage from "./pages/AppointmentsPage";
import BillingPage from "./pages/BillingPage";
import DashboardPage from "./pages/DashboardPage";
import NotFoundPage from "./pages/NotFoundPage";
import PatientsPage from "./pages/PatientsPage";
import ReportsPage from "./pages/ReportsPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
        handle: { title: "Dashboard" }
      },
      {
        path: "patients",
        element: <PatientsPage />,
        handle: { title: "Patients" }
      },
      {
        path: "appointments",
        element: <AppointmentsPage />,
        handle: { title: "Appointments" }
      },
      {
        path: "billing",
        element: <BillingPage />,
        handle: { title: "Billing" }
      },
      {
        path: "reports",
        element: <ReportsPage />,
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
