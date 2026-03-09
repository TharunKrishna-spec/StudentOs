import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LostFound from './pages/LostFound';
import Notes from './pages/Notes';
import Events from './pages/Events';
import AdminComplaints from './pages/AdminComplaints';
import Complaints from './pages/Complaints';
import Budget from './pages/Budget';
import Feed from './pages/Feed';
import AdminDashboard from './pages/AdminDashboard';
import './index.css';

const ADMIN_ROUTE_PATH = 'ops-core-9x7';
const ADMIN_COMPLAINTS_PATH = 'ops-core-9x7-complaints';
const ADMIN_NOTES_PATH = 'ops-core-9x7-notes';
const ADMIN_EVENTS_PATH = 'ops-core-9x7-events';
const ADMIN_LOST_FOUND_PATH = 'ops-core-9x7-lost-found';

function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
}

function AdminPasswordRoute({ children }) {
  const { currentUser, isAdmin } = useAuth();
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.sessionStorage.getItem('admin_unlocked') === '1';
  });
  const expectedPassword = useMemo(() => import.meta.env.VITE_ADMIN_PANEL_PASSWORD || 'admin123', []);

  useEffect(() => {
    if (!currentUser && typeof window !== 'undefined') {
      window.sessionStorage.removeItem('admin_unlocked');
      setVerified(false);
    }
  }, [currentUser]);

  if (!currentUser || !isAdmin) return <Navigate to="/" />;
  if (verified) return children;

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <h2>Admin Verification</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: '0.9rem' }}>
            Enter admin password to open control panel.
          </p>
          {error && <div className="auth-error">{error}</div>}
          <form onSubmit={(e) => {
            e.preventDefault();
            if (input === expectedPassword) {
              if (typeof window !== 'undefined') {
                window.sessionStorage.setItem('admin_unlocked', '1');
              }
              setVerified(true);
              setError('');
            } else {
              setError('Incorrect admin password');
            }
          }}>
            <div className="form-group">
              <label>Password</label>
              <input className="form-input" type="password" value={input} onChange={e => setInput(e.target.value)} required />
            </div>
            <button className="btn btn-primary" type="submit">Unlock Admin</button>
          </form>
        </div>
      </div>
    </div>
  );
}

function PublicRoute({ children }) {
  const { currentUser } = useAuth();
  return !currentUser ? children : <Navigate to="/" />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="lost-found" element={<LostFound />} />
        <Route path="notes" element={<Notes />} />
        <Route path="events" element={<Events />} />
        <Route path="complaints" element={<Complaints />} />
        <Route path="budget" element={<Budget />} />
        <Route path="feed" element={<Feed />} />
        <Route path={ADMIN_ROUTE_PATH} element={<AdminPasswordRoute><AdminDashboard /></AdminPasswordRoute>} />
        <Route path={ADMIN_COMPLAINTS_PATH} element={<AdminPasswordRoute><AdminComplaints /></AdminPasswordRoute>} />
        <Route path={ADMIN_NOTES_PATH} element={<AdminPasswordRoute><Notes /></AdminPasswordRoute>} />
        <Route path={ADMIN_EVENTS_PATH} element={<AdminPasswordRoute><Events /></AdminPasswordRoute>} />
        <Route path={ADMIN_LOST_FOUND_PATH} element={<AdminPasswordRoute><LostFound /></AdminPasswordRoute>} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
