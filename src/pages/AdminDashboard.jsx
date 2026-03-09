import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle, Calendar, BookOpen, Search, Users, Brain, TrendingUp, Database, Loader } from 'lucide-react';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { seedDemoData } from '../utils/seedData';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ complaints: 0, resolved: 0, events: 0, notes: 0, lostItems: 0, users: 0, hostellers: 0, dayScholars: 0 });
  const [userList, setUserList] = useState([]);
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState('');

  useEffect(() => {
    const errH = (e) => console.warn('Admin listener:', e);
    onValue(ref(db, 'complaints'), snap => {
      if (snap.exists()) {
        const arr = Object.values(snap.val());
        setStats(p => ({ ...p, complaints: arr.length, resolved: arr.filter(c => c.status === 'resolved').length }));
      }
    }, errH);
    onValue(ref(db, 'events'), snap => setStats(p => ({ ...p, events: snap.exists() ? Object.keys(snap.val()).length : 0 })), errH);
    onValue(ref(db, 'notes'), snap => setStats(p => ({ ...p, notes: snap.exists() ? Object.keys(snap.val()).length : 0 })), errH);
    onValue(ref(db, 'items'), snap => {
      if (snap.exists()) {
        const items = Object.values(snap.val());
        setStats(p => ({ ...p, lostItems: items.filter(i => i.status !== 'resolved').length }));
      }
    }, errH);
    onValue(ref(db, 'users'), snap => {
      if (!snap.exists()) {
        setStats(p => ({ ...p, users: 0, hostellers: 0, dayScholars: 0 }));
        setUserList([]);
        return;
      }
      const arr = Object.entries(snap.val()).map(([id, val]) => ({ id, ...val }));
      const hostellers = arr.filter(u => (u.residenceType || '').toLowerCase().includes('hostel')).length;
      const dayScholars = arr.filter(u => (u.residenceType || '').toLowerCase().includes('day')).length;
      setStats(p => ({ ...p, users: arr.length, hostellers, dayScholars }));
      arr.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
      setUserList(arr);
    }, errH);
  }, []);

  async function handleSeed() {
    setSeeding(true);
    setSeedMsg('');
    try {
      await seedDemoData();
      setSeedMsg('✅ Demo data seeded successfully! Refresh to see changes.');
    } catch (err) {
      setSeedMsg('❌ Error: ' + err.message);
    }
    setSeeding(false);
  }

  return (
    <>
      <div className="page-header"><h1>🛡️ Admin Dashboard</h1><p>Campus overview and analytics</p></div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-card-header"><div className="stat-card-icon red"><AlertTriangle size={22} /></div></div><div className="stat-card-value">{stats.complaints}</div><div className="stat-card-label">Total Complaints</div></div>
        <div className="stat-card"><div className="stat-card-header"><div className="stat-card-icon green"><CheckCircle size={22} /></div></div><div className="stat-card-value">{stats.resolved}</div><div className="stat-card-label">Resolved</div></div>
        <div className="stat-card"><div className="stat-card-header"><div className="stat-card-icon purple"><Calendar size={22} /></div></div><div className="stat-card-value">{stats.events}</div><div className="stat-card-label">Active Events</div></div>
        <div className="stat-card"><div className="stat-card-header"><div className="stat-card-icon blue"><BookOpen size={22} /></div></div><div className="stat-card-value">{stats.notes}</div><div className="stat-card-label">Notes Uploaded</div></div>
        <div className="stat-card"><div className="stat-card-header"><div className="stat-card-icon orange"><Search size={22} /></div></div><div className="stat-card-value">{stats.lostItems}</div><div className="stat-card-label">Lost Items Pending</div></div>
        <div className="stat-card"><div className="stat-card-header"><div className="stat-card-icon green"><Users size={22} /></div></div><div className="stat-card-value">{stats.users}</div><div className="stat-card-label">Registered Users</div></div>
        <div className="stat-card"><div className="stat-card-header"><div className="stat-card-icon purple"><Users size={22} /></div></div><div className="stat-card-value">{stats.hostellers}</div><div className="stat-card-label">Hostellers</div></div>
        <div className="stat-card"><div className="stat-card-header"><div className="stat-card-icon blue"><Users size={22} /></div></div><div className="stat-card-value">{stats.dayScholars}</div><div className="stat-card-label">Day Scholars</div></div>
      </div>

      <div className="dashboard-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><TrendingUp size={18} /> Resolution Rate</h3>
            <div style={{ textAlign: 'center', padding: 20 }}>
              <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--success)' }}>
                {stats.complaints > 0 ? Math.round((stats.resolved / stats.complaints) * 100) : 0}%
              </div>
              <div style={{ color: 'var(--text-secondary)', marginTop: 4 }}>Complaints Resolved</div>
              <div className="progress-bar" style={{ marginTop: 16 }}>
                <div className="progress-fill" style={{ width: `${stats.complaints > 0 ? (stats.resolved / stats.complaints) * 100 : 0}%` }} />
              </div>
            </div>
            <button className="btn btn-secondary" style={{ width: '100%', marginTop: 10 }} onClick={() => navigate('/ops-core-9x7-complaints')}>
              Open Complaints Control
            </button>
            <button className="btn btn-secondary" style={{ width: '100%', marginTop: 8 }} onClick={() => navigate('/ops-core-9x7-notes')}>
              Open Notes Control
            </button>
            <button className="btn btn-secondary" style={{ width: '100%', marginTop: 8 }} onClick={() => navigate('/ops-core-9x7-events')}>
              Open Events Control
            </button>
            <button className="btn btn-secondary" style={{ width: '100%', marginTop: 8 }} onClick={() => navigate('/ops-core-9x7-lost-found')}>
              Open Lost & Found Control
            </button>
          </div>

          {/* Seed Demo Data */}
          <div className="card">
            <h3 style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><Database size={18} /> Demo Data</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
              Populate the database with realistic demo data for your hackathon presentation.
            </p>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleSeed} disabled={seeding}>
              {seeding ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Seeding...</> : <><Database size={16} /> Seed Demo Data</>}
            </button>
            {seedMsg && <div style={{ marginTop: 12, fontSize: '0.85rem', padding: '10px 14px', borderRadius: 'var(--radius)', background: seedMsg.includes('✅') ? 'var(--success-bg)' : 'var(--danger-bg)', color: seedMsg.includes('✅') ? 'var(--success)' : 'var(--danger)' }}>{seedMsg}</div>}
          </div>
        </div>

        <div className="insights-panel">
          <h3><Brain size={18} /> Smart Overview</h3>
          <div className="insight-item"><span className="insight-dot" style={{ background: 'var(--danger)' }}></span>{stats.complaints - stats.resolved} complaints need attention</div>
          <div className="insight-item"><span className="insight-dot" style={{ background: 'var(--info)' }}></span>{stats.notes} academic notes available</div>
          <div className="insight-item"><span className="insight-dot" style={{ background: 'var(--warning)' }}></span>{stats.lostItems} lost items unresolved</div>
          <div className="insight-item"><span className="insight-dot" style={{ background: 'var(--accent-primary)' }}></span>{stats.events} events active on campus</div>
          <div className="insight-item"><span className="insight-dot" style={{ background: 'var(--success)' }}></span>{stats.users} students on platform</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3 style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={18} /> Student Directory
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1.2fr 1fr', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>
          <div>Name</div><div>Email</div><div>Dept</div><div>Year</div><div>Residence</div><div>Role</div>
        </div>
        <div style={{ maxHeight: 320, overflowY: 'auto' }}>
          {userList.map(u => (
            <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1.2fr 1fr', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.8rem' }}>
              <div>{u.displayName || '-'}</div>
              <div style={{ color: 'var(--text-secondary)' }}>{u.email || '-'}</div>
              <div>{u.department || '-'}</div>
              <div>{u.year || '-'}</div>
              <div>{u.residenceType || 'Day Scholar'}</div>
              <div>{u.role || 'student'}</div>
            </div>
          ))}
          {userList.length === 0 && <p style={{ color: 'var(--text-muted)', padding: '14px 0' }}>No users found.</p>}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
