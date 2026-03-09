import { useState, useEffect } from 'react';
import {
  Search, BookOpen, Calendar, Home, Wallet,
  TrendingUp, Users, AlertTriangle, Brain, ArrowRight
} from 'lucide-react';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { currentUser, userProfile } = useAuth();
  const [stats, setStats] = useState({
    events: 0,
    lostItems: 0,
    notes: 0,
    complaints: 0,
    pendingComplaints: 0,
    totalBudget: 0,
    totalExpense: 0
  });
  const [recentFeed, setRecentFeed] = useState([]);

  useEffect(() => {
    const errHandler = (err) => console.warn('Firebase listener error:', err);

    const unsubEvents = onValue(ref(db, 'events'), snap => {
      setStats(prev => ({ ...prev, events: snap.exists() ? Object.keys(snap.val()).length : 0 }));
    }, errHandler);

    const unsubItems = onValue(ref(db, 'items'), snap => {
      if (snap.exists()) {
        const items = Object.values(snap.val());
        setStats(prev => ({ ...prev, lostItems: items.filter(i => i.type === 'lost' && i.status !== 'resolved').length }));
      }
    }, errHandler);

    const unsubNotes = onValue(ref(db, 'notes'), snap => {
      setStats(prev => ({ ...prev, notes: snap.exists() ? Object.keys(snap.val()).length : 0 }));
    }, errHandler);

    const unsubComplaints = onValue(ref(db, 'complaints'), snap => {
      if (snap.exists()) {
        const items = Object.values(snap.val());
        setStats(prev => ({
          ...prev,
          complaints: items.length,
          pendingComplaints: items.filter(c => c.status !== 'resolved').length
        }));
      }
    }, errHandler);

    const unsubBudget = onValue(ref(db, `budget/${currentUser?.uid}`), snap => {
      if (snap.exists()) {
        const txns = Object.values(snap.val());
        const income = txns.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
        const expense = txns.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
        setStats(prev => ({ ...prev, totalBudget: income, totalExpense: expense }));
      }
    }, errHandler);

    const unsubFeed = onValue(ref(db, 'feed'), snap => {
      if (snap.exists()) {
        const items = Object.entries(snap.val()).map(([id, val]) => ({ id, ...val }));
        items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setRecentFeed(items.slice(0, 5));
      }
    }, errHandler);

    return () => {
      unsubEvents();
      unsubItems();
      unsubNotes();
      unsubComplaints();
      unsubBudget();
      unsubFeed();
    };
  }, [currentUser]);

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

  const feedIcons = {
    notes: { icon: BookOpen, bg: 'var(--info-bg)', color: 'var(--info)' },
    'lost-found': { icon: Search, bg: 'var(--warning-bg)', color: 'var(--warning)' },
    events: { icon: Calendar, bg: 'rgba(139,92,246,0.12)', color: '#a78bfa' },
    complaints: { icon: Home, bg: 'var(--danger-bg)', color: 'var(--danger)' },
    budget: { icon: Wallet, bg: 'var(--success-bg)', color: 'var(--success)' }
  };

  const displayName = currentUser?.displayName || userProfile?.displayName || 'Student';

  return (
    <>
      <div className="page-header">
        <h1>Welcome back, {displayName.split(' ')[0]} 👋</h1>
        <p>Here's what's happening on campus today</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon purple"><Calendar size={22} /></div>
            <span className="badge badge-category">Active</span>
          </div>
          <div className="stat-card-value">{stats.events}</div>
          <div className="stat-card-label">Upcoming Events</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon orange"><Search size={22} /></div>
            <span className="badge badge-pending">Today</span>
          </div>
          <div className="stat-card-value">{stats.lostItems}</div>
          <div className="stat-card-label">Lost Items</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon blue"><BookOpen size={22} /></div>
            <span className="badge badge-review">New</span>
          </div>
          <div className="stat-card-value">{stats.notes}</div>
          <div className="stat-card-label">Notes Uploaded</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon red"><AlertTriangle size={22} /></div>
            <span className="badge badge-lost">Pending</span>
          </div>
          <div className="stat-card-value">{stats.pendingComplaints}</div>
          <div className="stat-card-label">Complaints Pending</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-main">
          {/* Recent Activity */}
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '22px 22px 0' }}>
              <div className="section-header" style={{ marginBottom: 16 }}>
                <h2>📰 Recent Activity</h2>
              </div>
            </div>
            {recentFeed.length === 0 ? (
              <div className="empty-state">
                <p>No activity yet. Start using CampusOS!</p>
              </div>
            ) : (
              recentFeed.map(item => {
                const ft = feedIcons[item.type] || feedIcons.notes;
                const Icon = ft.icon;
                return (
                  <div className="feed-item" key={item.id}>
                    <div className="feed-icon" style={{ background: ft.bg, color: ft.color }}>
                      <Icon size={18} />
                    </div>
                    <div className="feed-content">
                      <h4>{item.title}</h4>
                      <p>{item.description}</p>
                      <div className="feed-time">{formatTime(item.createdAt)}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Budget Overview */}
          <div className="card">
            <div className="section-header">
              <h2>💰 Budget Overview</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--success)' }}>₹{stats.totalBudget}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Income</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--danger)' }}>₹{stats.totalExpense}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Expenses</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-primary)' }}>₹{stats.totalBudget - stats.totalExpense}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Balance</div>
              </div>
            </div>
            {stats.totalBudget > 0 && (
              <div className="progress-bar" style={{ marginTop: 16 }}>
                <div
                  className={`progress-fill ${stats.totalExpense / stats.totalBudget > 0.8 ? 'warning' : ''}`}
                  style={{ width: `${Math.min((stats.totalExpense / stats.totalBudget) * 100, 100)}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Campus Insights */}
        <div>
          <div className="insights-panel">
            <h3><Brain size={18} /> Campus Insights</h3>
            <div className="insight-item">
              <span className="insight-dot" style={{ background: 'var(--danger)' }}></span>
              {stats.pendingComplaints} complaints pending resolution
            </div>
            <div className="insight-item">
              <span className="insight-dot" style={{ background: 'var(--info)' }}></span>
              {stats.notes} notes uploaded for students
            </div>
            <div className="insight-item">
              <span className="insight-dot" style={{ background: 'var(--warning)' }}></span>
              {stats.lostItems} lost items reported
            </div>
            <div className="insight-item">
              <span className="insight-dot" style={{ background: 'var(--accent-primary)' }}></span>
              {stats.events} upcoming campus events
            </div>
            {stats.totalExpense > 0 && (
              <div className="insight-item">
                <span className="insight-dot" style={{ background: 'var(--success)' }}></span>
                You spent ₹{stats.totalExpense} this month
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
