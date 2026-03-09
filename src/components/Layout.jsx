import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const pageTitles = {
  '/': 'Dashboard',
  '/notes': 'Notes Sharing',
  '/events': 'Events Hub',
  '/lost-found': 'Lost & Found',
  '/complaints': 'Hostel Complaints',
  '/budget': 'Budget Tracker',
  '/feed': 'Campus Feed',
  '/admin': 'Admin Dashboard'
};

export default function Layout() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'CampusOS';

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Navbar title={title} />
        <div className="page">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
