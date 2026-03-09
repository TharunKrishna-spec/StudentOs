import { useEffect, useState } from 'react';
import { Trash2, AlertTriangle, CheckCircle, Clock, Eye } from 'lucide-react';
import { db } from '../firebase';
import { ref, onValue, remove, update, push } from 'firebase/database';

const STATUSES = ['submitted', 'under-review', 'in-progress', 'resolved'];
const STATUS_LABELS = {
  submitted: 'Submitted',
  'under-review': 'Under Review',
  'in-progress': 'In Progress',
  resolved: 'Resolved'
};
const CATEGORIES = ['All', 'Water', 'Electricity', 'Food', 'Cleanliness', 'Maintenance', 'Internet', 'Security', 'Other'];

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const unsub = onValue(ref(db, 'complaints'), snap => {
      if (!snap.exists()) {
        setComplaints([]);
        return;
      }
      const arr = Object.entries(snap.val()).map(([id, val]) => ({ id, ...val }));
      arr.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
      setComplaints(arr);
    }, e => console.warn('Admin complaints listener:', e));
    return () => unsub();
  }, []);

  function getAge(ts) {
    const hrs = Math.floor((Date.now() - (ts || 0)) / 3600000);
    if (hrs < 1) return 'Just now';
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  async function updateStatus(id, status) {
    await update(ref(db, `complaints/${id}`), {
      status,
      ...(status === 'resolved' ? { resolvedAt: Date.now() } : {})
    });
    if (status === 'resolved') {
      await push(ref(db, 'feed'), {
        type: 'complaints',
        title: 'Complaint resolved',
        description: 'Admin resolved a hostel complaint',
        createdAt: Date.now()
      });
    }
  }

  const filtered = complaints.filter(c => {
    if (filter !== 'All' && c.category !== filter) return false;
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    return true;
  });

  return (
    <>
      <div className="page-header">
        <h1>Admin Complaints Control</h1>
        <p>Only admin can update status or delete complaints.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-card-header"><div className="stat-card-icon red"><AlertTriangle size={22} /></div></div><div className="stat-card-value">{complaints.length}</div><div className="stat-card-label">Total Complaints</div></div>
        <div className="stat-card"><div className="stat-card-header"><div className="stat-card-icon orange"><Clock size={22} /></div></div><div className="stat-card-value">{complaints.filter(c => c.status === 'submitted').length}</div><div className="stat-card-label">Pending</div></div>
        <div className="stat-card"><div className="stat-card-header"><div className="stat-card-icon blue"><Eye size={22} /></div></div><div className="stat-card-value">{complaints.filter(c => c.status === 'in-progress').length}</div><div className="stat-card-label">In Progress</div></div>
        <div className="stat-card"><div className="stat-card-header"><div className="stat-card-icon green"><CheckCircle size={22} /></div></div><div className="stat-card-value">{complaints.filter(c => c.status === 'resolved').length}</div><div className="stat-card-label">Resolved</div></div>
      </div>

      <div className="filter-bar" style={{ flexWrap: 'wrap' }}>
        {CATEGORIES.map(c => <button key={c} className={`filter-btn ${filter === c ? 'active' : ''}`} onClick={() => setFilter(c)}>{c}</button>)}
      </div>
      <div className="filter-bar">
        <button className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => setStatusFilter('all')}>All Status</button>
        {STATUSES.map(s => <button key={s} className={`filter-btn ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>{STATUS_LABELS[s]}</button>)}
      </div>

      <div className="cards-grid">
        {filtered.map(c => (
          <div className="card" key={c.id}>
            <div className="card-header">
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span className={`badge ${c.status === 'submitted' ? 'badge-pending' : c.status === 'under-review' ? 'badge-review' : c.status === 'in-progress' ? 'badge-progress' : 'badge-resolved'}`}>{STATUS_LABELS[c.status]}</span>
                <span className="badge badge-category">{c.category}</span>
              </div>
              <button className="btn-icon" onClick={() => remove(ref(db, `complaints/${c.id}`))}><Trash2 size={16} /></button>
            </div>
            <div className="card-title">{c.title}</div>
            <div className="card-body">{c.description}</div>
            <div style={{ marginTop: 10, fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: 12 }}>
              <span>{c.hostelBlock}</span>
              <span>{getAge(c.createdAt)}</span>
              <span>by {c.userName}</span>
            </div>

            <div className="card-footer">
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{c.upvotes || 0} affected</span>
              {c.status !== 'resolved' && (
                <select className="form-select" style={{ width: 160, padding: '6px 10px', fontSize: '0.78rem' }} value={c.status} onChange={e => updateStatus(c.id, e.target.value)}>
                  {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="empty-state" style={{ gridColumn: '1/-1' }}><h3>No complaints</h3></div>}
      </div>
    </>
  );
}
