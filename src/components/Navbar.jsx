import { useState } from 'react';
import { Bell } from 'lucide-react';
import NotificationPanel from './NotificationPanel';

export default function Navbar({ title }) {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <>
      <header className="navbar">
        <h2 className="navbar-title">{title}</h2>
        <div className="navbar-actions">
          <button
            className="notification-btn"
            onClick={() => setShowNotifications(true)}
          >
            <Bell size={20} />
            <span className="notification-badge"></span>
          </button>
        </div>
      </header>
      <NotificationPanel
        open={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </>
  );
}
