import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/auth/Login';
import Dashboard from './pages/Dashboard';
import Masters from './pages/Masters';
import Generator from './pages/Generator';
import Approval from './pages/Approval';
import PublicView from './pages/PublicView';
import TimetableDetail from './pages/TimetableDetail';
import Layout from './components/layout/Layout';
import './App.css';

// Protected route component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // If specific role is required, check user role
  if (requiredRole && user?.role !== requiredRole) {
    // Redirect based on role
    if (user?.role === 'scheduler') {
      return <Navigate to="/dashboard" />;
    } else if (user?.role === 'approver') {
      return <Navigate to="/approval" />;
    } else {
      return <Navigate to="/view" />;
    }
  }

  return children;
};

// Main App with Router
const AppWithRouter = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/public/:publicUrl" element={<PublicView />} />
          
          {/* Protected routes with layout */}
          <Route path="/" element={<Layout />}>
            {/* Scheduler routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute requiredRole="scheduler">
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/masters" 
              element={
                <ProtectedRoute requiredRole="scheduler">
                  <Masters />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/generator" 
              element={
                <ProtectedRoute requiredRole="scheduler">
                  <Generator />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/timetables" 
              element={
                <ProtectedRoute requiredRole="scheduler">
                  <Dashboard showAll={true} />
                </ProtectedRoute>
              } 
            />
            
            {/* Approver routes */}
            <Route 
              path="/approval" 
              element={
                <ProtectedRoute requiredRole="approver">
                  <Approval />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/approved" 
              element={
                <ProtectedRoute requiredRole="approver">
                  <Approval showApproved={true} />
                </ProtectedRoute>
              } 
            />
            
            {/* Common protected routes */}
            <Route 
              path="/view" 
              element={
                <ProtectedRoute>
                  <Dashboard readOnly={true} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/timetable/:id" 
              element={
                <ProtectedRoute>
                  <TimetableDetail />
                </ProtectedRoute>
              } 
            />
            
            {/* Default redirect */}
            <Route 
              path="/" 
              element={<Navigate to="/dashboard" replace />} 
            />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default AppWithRouter;
