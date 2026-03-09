import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LostFound from './pages/LostFound';
import Notes from './pages/Notes';
import Events from './pages/Events';
import Complaints from './pages/Complaints';
import Budget from './pages/Budget';
import Feed from './pages/Feed';
import AdminDashboard from './pages/AdminDashboard';
import './index.css';

function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
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
        <Route path="admin" element={<AdminDashboard />} />
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
