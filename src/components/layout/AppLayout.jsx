import { useState } from "react";
import { Outlet, ScrollRestoration } from "react-router-dom";
import ToastRegion from "../common/ToastRegion";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      <main className="main-area">
        <Topbar onMenuClick={() => setSidebarOpen(current => !current)} />
        <div className="content">
          <Outlet />
        </div>
      </main>
      <ToastRegion />
      <ScrollRestoration />
    </div>
  );
}
