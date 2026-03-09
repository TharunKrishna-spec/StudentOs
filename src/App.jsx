import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

function AdminRoute({ children }) {
  const { currentUser, isAdmin } = useAuth();
  return currentUser && isAdmin ? children : <Navigate to="/" />;
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
        <Route path={ADMIN_ROUTE_PATH} element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path={ADMIN_COMPLAINTS_PATH} element={<AdminRoute><AdminComplaints /></AdminRoute>} />
        <Route path={ADMIN_NOTES_PATH} element={<AdminRoute><Notes /></AdminRoute>} />
        <Route path={ADMIN_EVENTS_PATH} element={<AdminRoute><Events /></AdminRoute>} />
        <Route path={ADMIN_LOST_FOUND_PATH} element={<AdminRoute><LostFound /></AdminRoute>} />
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
