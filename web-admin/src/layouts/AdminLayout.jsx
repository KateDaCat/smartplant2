// src/layouts/AdminLayout.jsx
import React, { useState, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import "./AdminLayout.css";

export default function AdminLayout({ children, onLogout }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  return (
    <div className={`admin-layout ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      {/* LEFT SIDEBAR */}
      <Sidebar onLogout={onLogout} collapsed={sidebarCollapsed} onToggle={toggleSidebar} />

      {/* RIGHT CONTENT AREA */}
      <div className="admin-main">
        <Topbar onLogout={onLogout} />
        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}

