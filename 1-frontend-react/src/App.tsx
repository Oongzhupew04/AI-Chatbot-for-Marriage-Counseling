import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Home from './pages/Home';
import Analysis from './pages/Analysis';

// Components
import Sidebar from './components/Sidebar';
import AdminSidebar from './components/admin/AdminSidebar';
import AdminHome from './pages/admin/AdminHome';

// --- THE ROUTE GUARD ---
// --- 1. USER GUARD ---
// This checks if you are logged in before showing the page
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // Check if a token exists in the browser's memory
  const isAuthenticated = localStorage.getItem('token') !== null;
  const role = localStorage.getItem('userRole');

  if (!isAuthenticated) {
    // If there is no token, immediately redirect to the login page
    return <Navigate to="/login" replace />;
  }

  // If an admin tries to go to a user page, kick them to the admin dashboard!
  if (String(role).toLowerCase() === 'admin') {
    return <Navigate to="/admin-home" replace />;
  }
  
  // If they DO have a token, show them the Sidebar and the page they requested
  return (
    <Sidebar>
      {children}
    </Sidebar>
  );
};

// --- 2. ADMIN GUARD ---
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = localStorage.getItem('token') !== null;
  const role = localStorage.getItem('userRole');

  // 1. THE THEME INJECTOR
  useEffect(() => {
    // When this component loads, attach the admin theme to the whole webpage
    document.body.setAttribute('data-theme', 'admin');
    
    // When the component unmounts (user logs out or leaves), clean it up!
    return () => {
      document.body.removeAttribute('data-theme');
    };
  }, []); // The empty array [] means this only runs once when the page loads

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  // If a normal user tries to sneak into the admin page, kick them out!
  if (String(role).toLowerCase() !== 'admin') {
    return <Navigate to="/" replace />; 
  }

  return (
    <AdminSidebar>
      {children}
    </AdminSidebar>
  );
};

export default function App(): JSX.Element {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* --- Public Routes (Anyone can see these) --- */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* --- Protected Routes (Must be logged in) --- */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/analysis" 
          element={
            <ProtectedRoute>
              <Analysis />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/admin-home" 
          element={
            <AdminRoute>
              <AdminHome />
            </AdminRoute>
          } 
        />

        {/* --- Catch-All (If they type a random URL, send them to login) --- */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}