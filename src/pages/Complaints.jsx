import { useState, useEffect } from 'react';
import { Plus, X, ThumbsUp, Trash2, AlertTriangle, CheckCircle, Clock, Eye, EyeOff, Flame, Timer } from 'lucide-react';
import { db } from '../firebase';
import { ref, push, onValue, remove, update, get } from 'firebase/database';
import { useAuth } from '../contexts/AuthContext';

const STATUSES = ['submitted', 'under-review', 'in-progress', 'resolved'];
const STATUS_LABELS = { 'submitted': 'Submitted', 'under-review': 'Under Review', 'in-progress': 'In Progress', 'resolved': 'Resolved' };
const CATEGORIES = ['All', 'Water', 'Electricity', 'Food', 'Cleanliness', 'Maintenance', 'Internet', 'Security', 'Other'];

export default function Complaints() {
  const { currentUser, isAdmin } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'Water', hostelBlock: 'Block A', anonymous: false });

  useEffect(() => {
    const unsub = onValue(ref(db, 'complaints'), snap => {
      if (snap.exists()) {
        const arr = Object.entries(snap.val()).map(([id, val]) => ({ id, ...val }));
        arr.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
        setComplaints(arr);
      } else setComplaints([]);
    }, e => console.warn('Complaints listener:', e));
    return () => unsub();
  }, []);

  // Auto-escalation: calculate urgency based on votes + time
  function getUrgency(c) {
    const votes = c.upvotes || 0;
    const ageHours = (Date.now() - (c.createdAt || 0)) / 3600000;
    const score = votes * 3 + Math.min(ageHours, 72);
    if (score >= 80 || votes >= 20) return { level: 'CRITICAL', color: '#ef4444', bg: 'rgba(239,68,68,0.08)' };
    if (score >= 40 || votes >= 10) return { level: 'HIGH', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' };
    if (score >= 15 || votes >= 5) return { level: 'MEDIUM', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)' };
    return { level: 'LOW', color: 'var(--text-muted)', bg: 'transparent' };
  }

  // Time since complaint
  function getAge(ts) {
    const hrs = Math.floor((Date.now() - (ts || 0)) / 3600000);
    if (hrs < 1) return 'Just now';
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await push(ref(db, 'complaints'), {
      ...form, status: 'submitted', upvotes: 0, upvotedBy: {},
      userId: currentUser.uid,
      userName: form.anonymous ? 'Anonymous Student' : (currentUser.displayName || 'Student'),
      isAnonymous: form.anonymous,
      createdAt: Date.now()
    });
    await push(ref(db, 'feed'), { type: 'complaints', title: `🏠 New complaint: ${form.title}`, description: `${form.category} issue at ${form.hostelBlock}`, createdAt: Date.now() });
    await push(ref(db, 'notifications'), { type: 'complaints', message: `Complaint: ${form.title} (${form.category})`, createdAt: Date.now() });
    setForm({ title: '', description: '', category: 'Water', hostelBlock: 'Block A', anonymous: false });
    setShowModal(false);
  }

  async function handleUpvote(id) {
    const snap = await get(ref(db, `complaints/${id}`));
    if (!snap.exists()) return;
    const c = snap.val();
    const ub = c.upvotedBy || {};
    if (ub[currentUser.uid]) { delete ub[currentUser.uid]; await update(ref(db, `complaints/${id}`), { upvotes: Math.max((c.upvotes || 0) - 1, 0), upvotedBy: ub }); }
    else {
      ub[currentUser.uid] = true;
      const newVotes = (c.upvotes || 0) + 1;
      await update(ref(db, `complaints/${id}`), { upvotes: newVotes, upvotedBy: ub });
      // Auto-escalate if threshold hit
      if (newVotes >= 10 && c.status === 'submitted') {
        await update(ref(db, `complaints/${id}`), { status: 'under-review' });
        await push(ref(db, 'notifications'), { type: 'complaints', message: `⚡ "${c.title}" auto-escalated to Under Review (${newVotes} votes)`, createdAt: Date.now() });
      }
    }
  }

  async function updateStatus(id, status) {
    await update(ref(db, `complaints/${id}`), { status, ...(status === 'resolved' ? { resolvedAt: Date.now() } : {}) });
    if (status === 'resolved') {
      await push(ref(db, 'feed'), { type: 'complaints', title: '✅ Complaint resolved', description: 'Admin resolved a hostel complaint', createdAt: Date.now() });
    }
  }

  const filtered = complaints.filter(c => {
    if (filter !== 'All' && c.category !== filter) return false;
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    return true;
  });

  return (
    <>
      <div className="page-header"><h1>Hostel Complaints</h1><p>Report issues and track resolution — anonymous mode available</p></div>

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
        <button className="btn btn-primary" style={{ width: 'auto', marginLeft: 'auto' }} onClick={() => setShowModal(true)}><Plus size={18} /> New Complaint</button>
      </div>

      <div className="cards-grid">
        {filtered.map(c => {
          const urgency = getUrgency(c);
          const resolutionTime = c.resolvedAt && c.createdAt ? Math.round((c.resolvedAt - c.createdAt) / 3600000) : null;
          return (
            <div className="card" key={c.id} style={{ borderTop: `3px solid ${urgency.color}` }}>
              <div className="card-header">
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span className={`badge ${c.status === 'submitted' ? 'badge-pending' : c.status === 'under-review' ? 'badge-review' : c.status === 'in-progress' ? 'badge-progress' : 'badge-resolved'}`}>{STATUS_LABELS[c.status]}</span>
                  <span className="badge badge-category">{c.category}</span>
                  {c.isAnonymous && <span className="badge" style={{ background: 'rgba(139,92,246,0.12)', color: '#a78bfa' }}><EyeOff size={10} /> Anonymous</span>}
                  {urgency.level !== 'LOW' && <span className="badge" style={{ background: urgency.bg, color: urgency.color, fontWeight: 700 }}><Flame size={10} /> {urgency.level}</span>}
                </div>
                {isAdmin && <button className="btn-icon" onClick={() => remove(ref(db, `complaints/${c.id}`))}><Trash2 size={16} /></button>}
              </div>
              <div className="card-title">{c.title}</div>
              <div className="card-body">{c.description}</div>
              <div style={{ marginTop: 10, fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: 12 }}>
                <span>📍 {c.hostelBlock}</span>
                <span><Timer size={12} /> {getAge(c.createdAt)}</span>
                <span>by {c.userName}</span>
              </div>

              {/* Resolution time badge */}
              {resolutionTime !== null && (
                <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--success)' }}>
                  ⏱️ Resolved in {resolutionTime < 24 ? `${resolutionTime}h` : `${Math.round(resolutionTime / 24)}d`}
                </div>
              )}

              {/* Status Timeline */}
              <div className="status-timeline" style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 4 }}>
                {STATUSES.map((s, i) => {
                  const si = STATUSES.indexOf(c.status);
                  return (
                    <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: i <= si ? (i === si ? urgency.color : 'var(--success)') : 'rgba(255,255,255,0.1)', transition: 'all 0.3s' }}></span>
                      <span style={{ fontSize: '0.65rem', color: i <= si ? 'var(--text-primary)' : 'var(--text-muted)' }}>{STATUS_LABELS[s]}</span>
                      {i < 3 && <span style={{ width: 20, height: 2, background: i < si ? 'var(--success)' : 'rgba(255,255,255,0.08)' }}></span>}
                    </span>
                  );
                })}
              </div>

              <div className="card-footer">
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button className={`upvote-btn ${c.upvotedBy?.[currentUser.uid] ? 'active' : ''}`} onClick={() => handleUpvote(c.id)}>
                    <ThumbsUp size={14} /> {c.upvotes || 0} affected
                  </button>
                </div>
                {isAdmin && c.status !== 'resolved' && (
                  <select className="form-select" style={{ width: 140, padding: '6px 10px', fontSize: '0.78rem' }} value={c.status} onChange={e => updateStatus(c.id, e.target.value)}>
                    {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <div className="empty-state" style={{ gridColumn: '1/-1' }}><h3>No complaints</h3></div>}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>New Complaint</h2><button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button></div>
            <form onSubmit={handleSubmit}>
              {/* Anonymous Toggle */}
              <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 'var(--radius)', background: form.anonymous ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${form.anonymous ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.06)'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setForm({ ...form, anonymous: !form.anonymous })}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {form.anonymous ? <EyeOff size={18} style={{ color: '#a78bfa' }} /> : <Eye size={18} style={{ color: 'var(--text-muted)' }} />}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{form.anonymous ? '🔒 Anonymous Mode ON' : 'Submit with your name'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{form.anonymous ? 'Your identity will be hidden from everyone' : 'Click to enable anonymous submission'}</div>
                  </div>
                </div>
                <div style={{ width: 44, height: 24, borderRadius: 12, background: form.anonymous ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)', position: 'relative', transition: 'all 0.3s' }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: form.anonymous ? 23 : 3, transition: 'all 0.3s' }} />
                </div>
              </div>

              <div className="form-group"><label>Title</label><input className="form-input" placeholder="e.g. Broken fan in Room 204" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
              <div className="form-group"><label>Description</label><textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required /></div>
              <div className="form-row">
                <div className="form-group"><label>Category</label><select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}</select></div>
                <div className="form-group"><label>Block</label><select className="form-select" value={form.hostelBlock} onChange={e => setForm({ ...form, hostelBlock: e.target.value })}>{['Block A', 'Block B', 'Block C', 'Block D', 'Girls Hostel'].map(b => <option key={b}>{b}</option>)}</select></div>
              </div>
              <button className="btn btn-primary" type="submit">Submit Complaint</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
