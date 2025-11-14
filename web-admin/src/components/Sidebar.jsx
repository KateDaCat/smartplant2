// src/components/Sidebar.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./Sidebar.css";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import SensorsIcon from "@mui/icons-material/Sensors";
import MapIcon from "@mui/icons-material/Map";
import FlagIcon from "@mui/icons-material/Flag";
import LogoutIcon from "@mui/icons-material/Logout";

export default function Sidebar({ onLogout }) {
  const location = useLocation();

  const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: <DashboardIcon /> },
    { path: "/users", label: "User Directory", icon: <PeopleIcon /> },
    { path: "/flags", label: "Flagged Plants", icon: <FlagIcon /> },
    { path: "/heatmap", label: "Heatmap", icon: <MapIcon /> },
    { path: "/iot", label: "IoT Monitoring", icon: <SensorsIcon /> },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-title">Smart Plant</h2>
        <p className="sidebar-subtitle">Admin Portal</p>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`sidebar-item ${
              location.pathname === item.path ? "sidebar-item-active" : ""
            }`}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button 
          className="sidebar-logout-btn"
          onClick={onLogout}
        >
          <span className="sidebar-icon"><LogoutIcon /></span>
          <span className="sidebar-label">Logout</span>
        </button>
      </div>
    </div>
  );
}