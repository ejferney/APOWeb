import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Layout from './layouts/Layout';
import OfficerDashboard from './pages/OfficerDashboard';
import MemberDashboard from './pages/MemberDashboard';
import ServiceLogs from './pages/ServiceLogs';
import Calendar from './pages/Calendar';
import Directory from './pages/Directory';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import PaintAvailability from './pages/PaintAvailability';
import AvailabilityHeatmap from './pages/AvailabilityHeatmap';
import CreateEvent from './pages/CreateEvent';
import KanbanBoard from './pages/KanbanBoard';
import RequirementsReport from './pages/RequirementsReport';
import Profile from './pages/Profile';
import FamilyTree from './pages/FamilyTree';
import FamilyManager from './pages/FamilyManager';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Unified Dashboard (Everyone lands here) */}
        <Route element={
          <ProtectedRoute requiredRole="member"> {/* Now allows officers too */}
            <Layout />
          </ProtectedRoute>
        }>
          <Route path="/" element={<MemberDashboard />} />
          <Route path="/member-dashboard" element={<Navigate to="/" replace />} /> {/* Redirect old path */}
          <Route path="/service-logs" element={<ServiceLogs />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/directory" element={<Directory />} />
          <Route path="/paint-availability" element={<PaintAvailability />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/family-tree" element={<FamilyTree />} />
        </Route>

        {/* Officer Routes */}
        <Route element={
          <ProtectedRoute requiredRole="officer">
            <Layout />
          </ProtectedRoute>
        }>
          <Route path="/officer-portal" element={<OfficerDashboard />} />
          <Route path="/kanban" element={<KanbanBoard />} />
          <Route path="/heatmap" element={<AvailabilityHeatmap />} />
          <Route path="/create-event" element={<CreateEvent />} />
          <Route path="/reports" element={<RequirementsReport />} />
          <Route path="/family-manager" element={<FamilyManager />} />
        </Route>

        {/* Catch all - redirect based on auth status (handled by ProtectedRoute logic or simple redirect) */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
