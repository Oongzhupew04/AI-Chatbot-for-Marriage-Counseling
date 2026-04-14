import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Home from './pages/Home';
import Analysis from './pages/Analysis';

// Components
import Sidebar from './components/Sidebar';
import AdminSidebar from './components/admin/AdminSidebar';
import AdminHome from './pages/admin/AdminHome';

// ==========================================
// --- THE ROUTE GUARDS (LAYOUT COMPONENTS) ---
// ==========================================

// --- 1. USER GUARD ---
const ProtectedLayout = () => {
  const isAuthenticated = localStorage.getItem('token') !== null;
  const role = localStorage.getItem('userRole');

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (String(role).toLowerCase() === 'admin') {
    return <Navigate to="/admin-home" replace />;
  }
  
  // Return the Sidebar, and inject the requested page inside using <Outlet />
  return (
    <Sidebar>
      <Outlet />
    </Sidebar>
  );
};

// --- 2. ADMIN GUARD ---
const AdminLayout = () => {
  const isAuthenticated = localStorage.getItem('token') !== null;
  const role = localStorage.getItem('userRole');

  // THE THEME INJECTOR
  useEffect(() => {
    document.body.setAttribute('data-theme', 'admin');
    return () => {
      document.body.removeAttribute('data-theme');
    };
  }, []); 

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  if (String(role).toLowerCase() !== 'admin') {
    return <Navigate to="/" replace />; 
  }

  return (
    <AdminSidebar>
      <Outlet />
    </AdminSidebar>
  );
};

// ==========================================
// --- MAIN APP ROUTER ---
// ==========================================

export default function App(): JSX.Element {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        
        {/* --- Public Routes (Anyone can see these) --- */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* --- SECURE ZONE: USERS --- */}
        {/* Every route inside this block gets the Sidebar and User Auth checks automatically */}
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} /> {/* Added explicit /home path */}
          <Route path="/analysis" element={<Analysis />} />
        </Route>

        {/* --- SECURE ZONE: ADMINS --- */}
        {/* Every route inside this block gets the AdminSidebar, Theme, and Admin Auth checks automatically */}
        <Route element={<AdminLayout />}>
          <Route path="/admin-home" element={<AdminHome />} />
          {/* Example of adding future admin routes: */}
          {/* <Route path="/admin-users" element={<AdminUsers />} /> */}
        </Route>

        {/* --- Catch-All (If they type a random URL, send them to login) --- */}
        <Route path="*" element={<Navigate to="/login" replace />} />
        
      </Routes>
    </Router>
  );
}