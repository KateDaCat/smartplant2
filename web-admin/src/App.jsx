import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Flags from "./pages/Flags";
import Heatmap from "./pages/Heatmap";
import IoT from "./pages/IoT";
import IotAnalytics from "./pages/IotAnalytics";
import Login from "./pages/Login";

const ProtectedRoute = ({ user, onLogout, children }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return (
    <AdminLayout user={user} onLogout={onLogout}>
      {children}
    </AdminLayout>
  );
};

const AdminRoute = ({ user, onLogout, children }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  const roleName = typeof user.role_name === "string" ? user.role_name.toLowerCase() : "";
  const role = typeof user.role === "string" ? user.role.toLowerCase() : "";
  const isAdmin = roleName === "admin" || role === "admin" || user.role_id === 1;

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AdminLayout user={user} onLogout={onLogout}>
      {children}
    </AdminLayout>
  );
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const storedUser = localStorage.getItem("adminUser");
    if (token && storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setCurrentUser(parsed);
      } catch (error) {
        console.warn("Failed to parse cached adminUser:", error);
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setCurrentUser(userData);
    localStorage.setItem("adminUser", JSON.stringify(userData));
    localStorage.setItem("adminToken", "mock-token-here");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("adminUser");
    localStorage.removeItem("adminToken");
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "16px",
          color: "#6B7280",
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            currentUser ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute user={currentUser} onLogout={handleLogout}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <AdminRoute user={currentUser} onLogout={handleLogout}>
              <Users />
            </AdminRoute>
          }
        />

        <Route
          path="/flags"
          element={
            <ProtectedRoute user={currentUser} onLogout={handleLogout}>
              <Flags />
            </ProtectedRoute>
          }
        />

        <Route
          path="/heatmap"
          element={
            <ProtectedRoute user={currentUser} onLogout={handleLogout}>
              <Heatmap />
            </ProtectedRoute>
          }
        />

        <Route
          path="/iot"
          element={
            <ProtectedRoute user={currentUser} onLogout={handleLogout}>
              <IoT />
            </ProtectedRoute>
          }
        />

        <Route
          path="/iot-analytics"
          element={
            <ProtectedRoute user={currentUser} onLogout={handleLogout}>
              <IotAnalytics />
            </ProtectedRoute>
          }
        />

        <Route
          path="/"
          element={
            currentUser ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="*"
          element={
            currentUser ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
