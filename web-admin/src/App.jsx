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

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('adminToken');
      const user = localStorage.getItem('adminUser');

      if (token && user) {
        try {
          const parsed = JSON.parse(user);
          setCurrentUser(parsed);
          setIsAuthenticated(true);
        } catch (err) {
          console.warn("Failed to parse cached adminUser:", err);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogin = (userData) => {
    setIsAuthenticated(true);
    setCurrentUser(userData);
    localStorage.setItem('adminUser', JSON.stringify(userData));
    localStorage.setItem('adminToken', 'mock-token-here'); // Cybersecurity team will replace
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminToken');
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '16px',
        color: '#6B7280'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Login Route - Always accessible */}
        <Route 
          path="/login" 
          element={
            isAuthenticated ? 
            <Navigate to="/dashboard" replace /> : 
            <Login onLogin={handleLogin} />
          } 
        />
        
        {/* Protected Routes - Only accessible when authenticated */}
        <Route 
          path="/dashboard" 
          element={
            isAuthenticated ? 
              <AdminLayout user={currentUser} onLogout={handleLogout}><Dashboard /></AdminLayout> : 
            <Navigate to="/login" replace />
          } 
        />
        
        <Route 
          path="/users" 
          element={
            isAuthenticated ? 
              <AdminLayout user={currentUser} onLogout={handleLogout}><Users /></AdminLayout> : 
            <Navigate to="/login" replace />
          } 
        />
        
        <Route 
          path="/flags" 
          element={
            isAuthenticated ? 
              <AdminLayout user={currentUser} onLogout={handleLogout}><Flags /></AdminLayout> : 
            <Navigate to="/login" replace />
          } 
        />
        
        <Route 
          path="/heatmap" 
          element={
            isAuthenticated ? 
              <AdminLayout user={currentUser} onLogout={handleLogout}><Heatmap /></AdminLayout> : 
            <Navigate to="/login" replace />
          } 
        />
        
        <Route 
          path="/iot" 
          element={
            isAuthenticated ? 
              <AdminLayout user={currentUser} onLogout={handleLogout}><IoT /></AdminLayout> : 
            <Navigate to="/login" replace />
          } 
        />
        
        <Route 
          path="/iot-analytics" 
          element={
            isAuthenticated ? 
              <AdminLayout user={currentUser} onLogout={handleLogout}><IotAnalytics /></AdminLayout> : 
            <Navigate to="/login" replace />
          } 
        />
        
        {/* Redirect root to login or dashboard */}
        <Route 
          path="/" 
          element={
            isAuthenticated ? 
            <Navigate to="/dashboard" replace /> : 
            <Navigate to="/login" replace />
          } 
        />
        
        {/* Catch all route - redirect to login */}
        <Route 
          path="*" 
          element={
            isAuthenticated ? 
            <Navigate to="/dashboard" replace /> : 
            <Navigate to="/login" replace />
          } 
        />
      </Routes>
    </Router>
  );
}
