// src/components/Topbar.jsx
import React from "react";
import "./Topbar.css";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import MenuIcon from "@mui/icons-material/Menu";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";

export default function Topbar({ onLogout, onToggleSidebar, sidebarHidden }) {
  return (
    <div className="topbar">
      <div className="topbar-left">
        {onToggleSidebar && (
          <button
            className="topbar-menu-btn"
            onClick={onToggleSidebar}
            aria-label={sidebarHidden ? "Show navigation" : "Hide navigation"}
          >
            {sidebarHidden ? <MenuIcon /> : <MenuOpenIcon />}
          </button>
        )}
        <h1 className="topbar-title">Admin Dashboard</h1>
      </div>
      
      <div className="topbar-right">
        <div className="topbar-user">
          <span className="user-avatar"><AccountCircleIcon /></span>
          <span className="user-name">Administrator</span>
        </div>
        
        <button 
          className="topbar-logout-btn"
          onClick={onLogout}
        >
          Logout
        </button>
      </div>
    </div>
  );
}