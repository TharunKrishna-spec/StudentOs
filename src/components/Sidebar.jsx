import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Search, BookOpen, Calendar,
  Home, Wallet, Rss, LogOut
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const navSections = [
  {
    label: 'Overview',
    links: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/feed', icon: Rss, label: 'Campus Feed' },
    ]
  },
  {
    label: 'Student Life',
    links: [
      { to: '/notes', icon: BookOpen, label: 'Notes' },
      { to: '/events', icon: Calendar, label: 'Events' },
    ]
  },
  {
    label: 'Campus Utilities',
    links: [
      { to: '/lost-found', icon: Search, label: 'Lost & Found' },
      { to: '/complaints', icon: Home, label: 'Hostel Complaints' },
    ]
  },
  {
    label: 'Personal Tools',
    links: [
      { to: '/budget', icon: Wallet, label: 'Budget Tracker' },
    ]
  },
];

export default function Sidebar() {
  const { currentUser, userProfile, isAdmin, logout } = useAuth();

  const getInitials = () => {
    const name = currentUser?.displayName || userProfile?.displayName || 'S';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h1>CampusOS</h1>
        <span>Student Platform</span>
      </div>

      <nav className="sidebar-nav">
        {navSections.map(section => (
          <div className="sidebar-section" key={section.label}>
            <div className="sidebar-section-label">{section.label}</div>
            {section.links.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <link.icon className="icon" size={20} />
                {link.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        {/* Admin access hidden — only visible to admin emails, looks like a subtle footer link */}
        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            style={{ fontSize: '0.75rem', padding: '6px 12px', marginBottom: 8, opacity: 0.5 }}
          >
            🛡️ Admin Panel
          </NavLink>
        )}
        <div className="sidebar-user" onClick={logout}>
          <div className="sidebar-avatar">{getInitials()}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{currentUser?.displayName || 'Student'}</div>
            <div className="sidebar-user-role">🎓 Student</div>
          </div>
          <LogOut size={16} style={{ color: 'var(--text-muted)' }} />
        </div>
      </div>
    </aside>
  );
}
