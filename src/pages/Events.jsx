import { useState, useEffect } from 'react';
import { Plus, X, Trash2, Calendar, MapPin, Clock, Users, ThumbsUp, Star, Timer } from 'lucide-react';
import { db } from '../firebase';
import { ref, push, onValue, remove, update, get } from 'firebase/database';
import { useAuth } from '../contexts/AuthContext';

const CATEGORIES = ['All', 'Workshop', 'Hackathon', 'Seminar', 'Cultural', 'Sports', 'Club', 'Other'];

export default function Events() {
  const { currentUser, isAdmin } = useAuth();
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', date: '', time: '', venue: '', category: 'Workshop' });
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const unsub = onValue(ref(db, 'events'), snap => {
      if (snap.exists()) {
        const arr = Object.entries(snap.val()).map(([id, val]) => ({ id, ...val }));
        arr.sort((a, b) => new Date(a.date + 'T' + (a.time || '00:00')) - new Date(b.date + 'T' + (b.time || '00:00')));
        setEvents(arr);
      } else setEvents([]);
    }, e => console.warn('Events listener:', e));
    return () => unsub();
  }, []);

  // Live countdown timer
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  function getCountdown(date, time) {
    const eventTime = new Date(date + 'T' + (time || '00:00')).getTime();
    const diff = eventTime - now;
    if (diff <= 0) return { text: 'Happening Now! 🔴', live: true };
    const days = Math.floor(diff / 86400000);
    const hrs = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    if (days > 0) return { text: `${days}d ${hrs}h ${mins}m`, live: false };
    if (hrs > 0) return { text: `${hrs}h ${mins}m ${secs}s`, live: false };
    return { text: `${mins}m ${secs}s`, live: false };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await push(ref(db, 'events'), {
      ...form, going: {}, interested: {}, goingCount: 0, interestedCount: 0,
      userId: currentUser.uid,
      userName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Anonymous',
      createdAt: Date.now()
    });
    await push(ref(db, 'feed'), { type: 'events', title: `📅 New event: ${form.title}`, description: `${form.date} at ${form.venue}`, createdAt: Date.now() });
    await push(ref(db, 'notifications'), { type: 'events', message: `New event: ${form.title} on ${form.date}`, createdAt: Date.now() });
    setForm({ title: '', description: '', date: '', time: '', venue: '', category: 'Workshop' });
    setShowModal(false);
  }

  async function handleRSVP(id, type) {
    const snap = await get(ref(db, `events/${id}`));
    if (!snap.exists()) return;
    const ev = snap.val();
    const going = ev.going || {};
    const interested = ev.interested || {};
    if (type === 'going') {
      if (going[currentUser.uid]) { delete going[currentUser.uid]; } else { going[currentUser.uid] = true; delete interested[currentUser.uid]; }
    } else {
      if (interested[currentUser.uid]) { delete interested[currentUser.uid]; } else { interested[currentUser.uid] = true; delete going[currentUser.uid]; }
    }
    await update(ref(db, `events/${id}`), { going, interested, goingCount: Object.keys(going).length, interestedCount: Object.keys(interested).length });
  }

  const filtered = events.filter(ev => filter === 'All' || ev.category === filter);
  const catEmoji = { Workshop: '🔧', Hackathon: '💻', Seminar: '🎤', Cultural: '🎭', Sports: '⚽', Club: '🎯', Other: '📌' };

  // Mini calendar
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const eventDates = new Set(events.map(e => new Date(e.date).getDate()));

  return (
    <>
      <div className="page-header"><h1>Campus Events</h1><p>Discover what's happening on campus</p></div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-card-header"><div className="stat-card-icon purple"><Calendar size={22} /></div></div><div className="stat-card-value">{events.length}</div><div className="stat-card-label">Total Events</div></div>
        <div className="stat-card"><div className="stat-card-header"><div className="stat-card-icon green"><Users size={22} /></div></div><div className="stat-card-value">{events.reduce((s, e) => s + (e.goingCount || 0), 0)}</div><div className="stat-card-label">Total RSVPs</div></div>
        <div className="stat-card"><div className="stat-card-header"><div className="stat-card-icon orange"><Timer size={22} /></div></div><div className="stat-card-value">{events.filter(e => { const cd = getCountdown(e.date, e.time); return cd.live; }).length}</div><div className="stat-card-label">Live Now</div></div>
        <div className="stat-card"><div className="stat-card-header"><div className="stat-card-icon blue"><Star size={22} /></div></div><div className="stat-card-value">{events.filter(e => e.going?.[currentUser.uid] || e.interested?.[currentUser.uid]).length}</div><div className="stat-card-label">My RSVPs</div></div>
      </div>

      <div className="filter-bar">
        {CATEGORIES.map(c => <button key={c} className={`filter-btn ${filter === c ? 'active' : ''}`} onClick={() => setFilter(c)}>{c !== 'All' ? catEmoji[c] + ' ' : ''}{c}</button>)}
        {isAdmin && <button className="btn btn-primary" style={{ width: 'auto', marginLeft: 'auto' }} onClick={() => setShowModal(true)}><Plus size={18} /> Create Event</button>}
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-main">
          <div className="cards-grid">
            {filtered.map(ev => {
              const cd = getCountdown(ev.date, ev.time);
              return (
                <div className="card" key={ev.id} style={cd.live ? { border: '1px solid var(--danger)', boxShadow: '0 0 20px rgba(239,68,68,0.15)' } : {}}>
                  <div className="card-header">
                    <div style={{ display: 'flex', gap: 6 }}>
                      <span className="badge badge-category">{catEmoji[ev.category]} {ev.category}</span>
                      {cd.live && <span className="badge badge-lost" style={{ animation: 'pulse 2s infinite' }}>🔴 LIVE</span>}
                    </div>
                    {(isAdmin || ev.userId === currentUser.uid) && <button className="btn-icon" onClick={() => remove(ref(db, `events/${ev.id}`))}><Trash2 size={16} /></button>}
                  </div>
                  <div className="card-title">{ev.title}</div>
                  <div className="card-body">{ev.description}</div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <span><Calendar size={12} /> {ev.date}</span>
                    <span><Clock size={12} /> {ev.time}</span>
                    <span><MapPin size={12} /> {ev.venue}</span>
                  </div>

                  {/* Countdown Timer */}
                  <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 'var(--radius)', background: cd.live ? 'rgba(239,68,68,0.08)' : 'rgba(99,102,241,0.06)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}><Timer size={12} /> {cd.live ? 'Status' : 'Starts in'}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: cd.live ? 'var(--danger)' : 'var(--accent-primary)', fontFamily: 'monospace' }}>{cd.text}</div>
                  </div>

                  {/* RSVP Buttons */}
                  <div className="card-footer">
                    <button className={`upvote-btn ${ev.going?.[currentUser.uid] ? 'active' : ''}`} onClick={() => handleRSVP(ev.id, 'going')} style={{ flex: 1 }}>
                      ✅ Going ({ev.goingCount || 0})
                    </button>
                    <button className={`upvote-btn ${ev.interested?.[currentUser.uid] ? 'active' : ''}`} onClick={() => handleRSVP(ev.id, 'interested')} style={{ flex: 1 }}>
                      ⭐ Interested ({ev.interestedCount || 0})
                    </button>
                  </div>

                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 8, textAlign: 'right' }}>by {ev.userName}</div>
                </div>
              );
            })}
            {filtered.length === 0 && <div className="empty-state" style={{ gridColumn: '1/-1' }}><h3>No events found</h3></div>}
          </div>
        </div>

        {/* Mini Calendar */}
        <div>
          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ marginBottom: 12, textAlign: 'center' }}>📅 {today.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
            <div className="mini-calendar">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i} className="cal-header">{d}</div>)}
              {Array.from({ length: firstDay }, (_, i) => <div key={'e' + i} />)}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const isToday = day === today.getDate();
                const hasEvent = eventDates.has(day);
                return (
                  <div key={day} className={`cal-day ${isToday ? 'today' : ''} ${hasEvent ? 'has-event' : ''}`}>{day}</div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Create Event</h2><button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button></div>
            <form onSubmit={handleSubmit}>
              <div className="form-group"><label>Title</label><input className="form-input" placeholder="e.g. Web Dev Workshop" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
              <div className="form-group"><label>Description</label><textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required /></div>
              <div className="form-row">
                <div className="form-group"><label>Date</label><input className="form-input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required /></div>
                <div className="form-group"><label>Time</label><input className="form-input" type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} required /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Venue</label><input className="form-input" placeholder="Seminar Hall" value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} required /></div>
                <div className="form-group"><label>Category</label><select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}</select></div>
              </div>
              <button className="btn btn-primary" type="submit">Create Event</button>
            </form>
          </div>
        </div>
      )}

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </>
  );
}
