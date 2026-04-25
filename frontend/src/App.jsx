import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import Header from './components/Header';
import AdminDashboard from './pages/AdminDashboard';
import BookingsOverview from './pages/BookingsOverview';
import IssuesOverview from './pages/IssuesOverview';
import Login from './pages/Login';
import Register from './pages/Register';
import ResourceList from './pages/ResourceList';
import ResourceForm from './components/ResourceForm';
import ResourceDetails from './pages/ResourceDetails';
import UserManagement from './pages/UserManagement';
import UserRoleManagement from './pages/UserRoleManagement';
import ProfileManagement from './pages/ProfileManagement';
import BookingsPage from './pages/BookingsPage';
import CreateTicketPage from './pages/CreateTicketPage';
import TicketsPage from './pages/TicketsPage';
import TicketDetailsPage from './pages/TicketDetailsPage';
import AdminTicketsPage from './pages/AdminTicketsPage';
import { authAPI } from './services/api';
import { NotificationProvider } from './context/NotificationContext';
import { clearUserProfile, fetchCurrentUser, setUserProfile } from './store/userSlice';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  if (!authAPI.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !authAPI.isAdmin()) {
    return <Navigate to="/resources" replace />;
  }

  return children;
};

const HomeRoute = () => {
  if (!authAPI.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={authAPI.isAdmin() ? '/dashboard' : '/resources'} replace />;
};

/**
 * Main App Component - Routes and Layout
 */
function App() {
  const AppContent = () => {
    const location = useLocation();
    const dispatch = useDispatch();

    useEffect(() => {
      if (!authAPI.isAuthenticated()) {
        dispatch(clearUserProfile());
        return;
      }

      dispatch(setUserProfile(authAPI.getProfile()));
      dispatch(fetchCurrentUser());
    }, [dispatch]);

    const hideHeader = ['/resources', '/users', '/dashboard', '/bookings', '/issues', '/profile', '/my-bookings', '/tickets']
      .some((prefix) => location.pathname.startsWith(prefix));

    return (
      <div className="d-flex flex-column min-vh-100">
        {!hideHeader && <Header />}
        <main className="flex-grow-1">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
            <Route path="/bookings" element={<ProtectedRoute adminOnly><BookingsOverview /></ProtectedRoute>} />
            <Route path="/issues" element={<ProtectedRoute adminOnly><IssuesOverview /></ProtectedRoute>} />
            <Route path="/resources" element={<ProtectedRoute><ResourceList /></ProtectedRoute>} />
            <Route path="/resources/add" element={<ProtectedRoute adminOnly><ResourceForm /></ProtectedRoute>} />
            <Route path="/resources/edit/:id" element={<ProtectedRoute adminOnly><ResourceForm /></ProtectedRoute>} />
            <Route path="/resources/:id" element={<ProtectedRoute><ResourceDetails /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute adminOnly><UserManagement /></ProtectedRoute>} />
            <Route path="/users/roles" element={<ProtectedRoute adminOnly><UserRoleManagement /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfileManagement /></ProtectedRoute>} />
            <Route path="/my-bookings" element={<ProtectedRoute><BookingsPage /></ProtectedRoute>} />
            {/* Module C - Maintenance & Incident Ticketing Routes */}
            <Route path="/tickets/create" element={<ProtectedRoute><CreateTicketPage /></ProtectedRoute>} />
            <Route path="/tickets/:id" element={<ProtectedRoute><TicketDetailsPage /></ProtectedRoute>} />
            <Route path="/tickets" element={<ProtectedRoute><TicketsPage /></ProtectedRoute>} />
            <Route path="/admin/tickets" element={<ProtectedRoute adminOnly><AdminTicketsPage /></ProtectedRoute>} />
            <Route path="/" element={<HomeRoute />} />
          </Routes>
        </main>
      </div>
    );
  };

  return (
    <NotificationProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AppContent />
        <ToastContainer
          position="bottom-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </Router>
    </NotificationProvider>
  );
}

export default App;
