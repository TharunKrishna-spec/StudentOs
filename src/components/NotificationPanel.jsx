import { useState, useEffect } from 'react';
import { X, BookOpen, Search, Calendar, Home, Wallet, Bell } from 'lucide-react';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';

export default function NotificationPanel({ open, onClose }) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    try {
      const notifRef = ref(db, 'notifications');
      const unsub = onValue(notifRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const arr = Object.entries(data).map(([id, val]) => ({ id, ...val }));
          arr.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          setNotifications(arr.slice(0, 20));
        } else {
          setNotifications([]);
        }
      }, (error) => {
        console.warn('Notifications listener error:', error);
        setNotifications([]);
      });
      return () => unsub();
    } catch (err) {
      console.warn('Error setting up notifications:', err);
    }
  }, []);

  const iconMap = {
    notes: BookOpen,
    'lost-found': Search,
    events: Calendar,
    complaints: Home,
    budget: Wallet
  };

  const colorMap = {
    notes: 'var(--info)',
    'lost-found': 'var(--warning)',
    events: 'var(--accent-primary)',
    complaints: 'var(--danger)',
    budget: 'var(--success)'
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <>
      {open && <div className="modal-overlay" onClick={onClose} style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'none' }} />}
      <div className={`notification-panel ${open ? 'open' : ''}`}>
        <div className="notification-panel-header">
          <h3>🔔 Notifications</h3>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="notification-list">
          {notifications.length === 0 && (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <Bell size={40} style={{ opacity: 0.2, margin: '0 auto 12px', display: 'block' }} />
              <p>No notifications yet</p>
            </div>
          )}
          {notifications.map(n => {
            const Icon = iconMap[n.type] || Bell;
            return (
              <div className="notification-item unread" key={n.id}>
                <span className="notification-dot" style={{ background: colorMap[n.type] || 'var(--accent-primary)' }}></span>
                <div className="notification-text">
                  <p>{n.message}</p>
                  <span>{formatTime(n.createdAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
