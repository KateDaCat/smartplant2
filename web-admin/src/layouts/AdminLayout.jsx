// src/layouts/AdminLayout.jsx
import React, { useState, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import "./AdminLayout.css";

export default function AdminLayout({ children, user, onLogout }) {
  const [sidebarHidden, setSidebarHidden] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarHidden((prev) => !prev);
  }, []);

  return (
    <div className={`admin-layout ${sidebarHidden ? "sidebar-hidden" : ""}`}>
      <Sidebar user={user} onLogout={onLogout} />
      <div className="admin-main">
        <Topbar
          user={user}
          onLogout={onLogout}
          onToggleSidebar={toggleSidebar}
          sidebarHidden={sidebarHidden}
        />
        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}

