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
  '/ops-core-9x7': 'Admin Dashboard',
  '/ops-core-9x7-complaints': 'Admin Complaints',
  '/ops-core-9x7-notes': 'Admin Notes',
  '/ops-core-9x7-events': 'Admin Events',
  '/ops-core-9x7-lost-found': 'Admin Lost & Found'
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
