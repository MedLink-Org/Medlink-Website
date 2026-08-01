import { CircleAlert, LoaderCircle, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Outlet, ScrollRestoration } from "react-router-dom";
import { useMedLink } from "../../context/MedLinkContext";
import ToastRegion from "../common/ToastRegion";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { loading, error, reload } = useMedLink();

  let content = <Outlet />;
  if (loading) {
    content = (
      <div className="data-state" role="status" aria-live="polite">
        <LoaderCircle className="data-state-spinner" />
        <strong>Loading clinic records</strong>
        <p>Connecting to the MedLink API.</p>
      </div>
    );
  } else if (error) {
    content = (
      <div className="data-state data-state-error" role="alert">
        <CircleAlert />
        <strong>Clinic records could not be loaded</strong>
        <p>{error}</p>
        <button className="button button-secondary" type="button" onClick={reload}>
          <RefreshCw />
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      <main className="main-area">
        <Topbar onMenuClick={() => setSidebarOpen(current => !current)} />
        <div className="content">
          {content}
        </div>
      </main>
      <ToastRegion />
      <ScrollRestoration />
    </div>
  );
}
