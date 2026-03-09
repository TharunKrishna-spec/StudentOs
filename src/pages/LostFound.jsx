import { useState, useEffect } from 'react';
import { Plus, X, Trash2, Search, MapPin, CheckCircle, MessageCircle, Zap, Eye, Clock } from 'lucide-react';
import { db } from '../firebase';
import { ref, push, onValue, remove, update, get } from 'firebase/database';
import { useAuth } from '../contexts/AuthContext';

const LOCATIONS = ['Library', 'Canteen', 'Lab', 'Parking', 'Block A', 'Block B', 'Block C', 'Block D', 'Ground', 'Auditorium', 'Other'];

export default function LostFound() {
  const { currentUser, isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [contactModal, setContactModal] = useState(null);
  const [contactMsg, setContactMsg] = useState('');
  const [form, setForm] = useState({ title: '', description: '', type: 'lost', location: 'Library', contactInfo: '', imageUrl: '' });

  useEffect(() => {
    const unsub = onValue(ref(db, 'items'), snap => {
      if (snap.exists()) {
        const arr = Object.entries(snap.val()).map(([id, val]) => ({ id, ...val }));
        arr.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setItems(arr);
      } else setItems([]);
    }, e => console.warn('Items listener:', e));
    return () => unsub();
  }, []);

  // Smart Match Algorithm — weighted keyword + location matching
  function getMatchScore(lostItem, foundItem) {
    if (lostItem.type === foundItem.type) return 0;
    let score = 0;
    const lostWords = (lostItem.title + ' ' + lostItem.description).toLowerCase().split(/\s+/);
    const foundWords = (foundItem.title + ' ' + foundItem.description).toLowerCase().split(/\s+/);
    const stopWords = new Set(['a', 'an', 'the', 'is', 'in', 'at', 'of', 'my', 'near', 'and', 'i', 'was', 'with', 'found', 'lost']);
    const lostKeywords = lostWords.filter(w => w.length > 2 && !stopWords.has(w));
    const foundKeywords = foundWords.filter(w => w.length > 2 && !stopWords.has(w));
    const matches = lostKeywords.filter(w => foundKeywords.some(fw => fw.includes(w) || w.includes(fw)));
    score += matches.length * 20;
    if (lostItem.location === foundItem.location) score += 30;
    // Time proximity bonus (within 24hrs)
    const timeDiff = Math.abs((lostItem.createdAt || 0) - (foundItem.createdAt || 0));
    if (timeDiff < 86400000) score += 15;
    return Math.min(score, 100);
  }

  function getMatches(item) {
    return items
      .filter(i => i.type !== item.type && i.status !== 'resolved')
      .map(i => ({ ...i, score: getMatchScore(item, i) }))
      .filter(i => i.score > 20)
      .sort((a, b) => b.score - a.score);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const itemData = {
      ...form, status: 'active',
      userId: currentUser.uid,
      userName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Anonymous',
      createdAt: Date.now()
    };
    const newRef = await push(ref(db, 'items'), itemData);
    await push(ref(db, 'feed'), { type: 'lost-found', title: `${form.type === 'lost' ? '🔎 Lost' : '✅ Found'}: ${form.title}`, description: `${form.location} — ${form.description.slice(0, 50)}`, createdAt: Date.now() });
    await push(ref(db, 'notifications'), { type: 'lost-found', message: `${form.type === 'lost' ? 'Lost' : 'Found'}: ${form.title} at ${form.location}`, createdAt: Date.now() });

    // Auto-check for matches and notify
    const matches = items.filter(i => i.type !== form.type && i.status !== 'resolved' && getMatchScore(itemData, i) > 30);
    if (matches.length > 0) {
      await push(ref(db, 'notifications'), { type: 'lost-found', message: `🎯 Potential match found for "${form.title}"! Check Lost & Found.`, createdAt: Date.now() });
    }

    setForm({ title: '', description: '', type: 'lost', location: 'Library', contactInfo: '', imageUrl: '' });
    setShowModal(false);
  }

  async function handleResolve(id) {
    await update(ref(db, `items/${id}`), { status: 'resolved', resolvedAt: Date.now() });
  }

  async function handleContact(itemId) {
    if (!contactMsg.trim()) return;
    await push(ref(db, `items/${itemId}/messages`), {
      text: contactMsg,
      userName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Anon',
      userId: currentUser.uid,
      createdAt: Date.now()
    });
    setContactMsg('');
  }

  const filtered = items.filter(i => {
    if (filter !== 'all' && i.type !== filter && !(filter === 'matched' && i.status === 'resolved')) return false;
    if (search && !i.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const formatTime = (ts) => {
    if (!ts) return '';
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <>
      <div className="page-header"><h1>Lost & Found</h1><p>Report lost items or help reunite found items with their owners</p></div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-card-header"><div className="stat-card-icon red"><Search size={22} /></div></div><div className="stat-card-value">{items.filter(i => i.type === 'lost' && i.status !== 'resolved').length}</div><div className="stat-card-label">Items Lost</div></div>
        <div className="stat-card"><div className="stat-card-header"><div className="stat-card-icon green"><CheckCircle size={22} /></div></div><div className="stat-card-value">{items.filter(i => i.type === 'found' && i.status !== 'resolved').length}</div><div className="stat-card-label">Items Found</div></div>
        <div className="stat-card"><div className="stat-card-header"><div className="stat-card-icon purple"><Zap size={22} /></div></div><div className="stat-card-value">{items.filter(i => i.status !== 'resolved').filter(i => getMatches(i).length > 0).length}</div><div className="stat-card-label">Smart Matches</div></div>
        <div className="stat-card"><div className="stat-card-header"><div className="stat-card-icon blue"><CheckCircle size={22} /></div></div><div className="stat-card-value">{items.filter(i => i.status === 'resolved').length}</div><div className="stat-card-label">Resolved</div></div>
      </div>

      <div className="filter-bar">
        <div className="search-box"><Search size={16} /><input placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        {['all', 'lost', 'found'].map(f => <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}</button>)}
        <button className="btn btn-primary" style={{ width: 'auto', marginLeft: 'auto' }} onClick={() => setShowModal(true)}><Plus size={18} /> Report Item</button>
      </div>

      <div className="cards-grid">
        {filtered.map(item => {
          const matches = item.status !== 'resolved' ? getMatches(item) : [];
          const msgs = item.messages ? Object.entries(item.messages).map(([id, v]) => ({ id, ...v })).sort((a, b) => a.createdAt - b.createdAt) : [];
          return (
            <div className="card" key={item.id} style={{ borderLeft: `3px solid ${item.type === 'lost' ? 'var(--danger)' : 'var(--success)'}` }}>
              <div className="card-header">
                <span className={`badge ${item.type === 'lost' ? 'badge-lost' : 'badge-found'}`}>{item.type === 'lost' ? '🔴 Lost' : '🟢 Found'}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {item.status === 'resolved' && <span className="badge badge-resolved">✅ Resolved</span>}
                  {isAdmin && <button className="btn-icon" onClick={() => remove(ref(db, `items/${item.id}`))}><Trash2 size={16} /></button>}
                </div>
              </div>
              <div className="card-title">{item.title}</div>
              <div className="card-body">{item.description}</div>
              {item.imageUrl && (
                <div style={{ marginTop: 10, borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    loading="lazy"
                    style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }}
                  />
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <span><MapPin size={12} /> {item.location}</span>
                <span><Clock size={12} /> {formatTime(item.createdAt)}</span>
                <span>by {item.userName}</span>
              </div>
              {item.contactInfo && (
                <div style={{ marginTop: 6, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Contact: {item.contactInfo}
                </div>
              )}

              {/* Smart Match Results with Score */}
              {matches.length > 0 && (
                <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 'var(--radius)', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--success)', marginBottom: 6 }}>🎯 Potential Matches</div>
                  {matches.slice(0, 2).map(m => (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', padding: '6px 0' }}>
                      <span>{m.title} ({m.location})</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button
                          className="btn-icon"
                          onClick={() => setContactModal(m.id)}
                          title="Contact owner"
                          style={{ fontSize: '0.72rem', padding: '4px 8px', borderRadius: 12, border: '1px solid rgba(99,102,241,0.35)', color: 'var(--accent-primary)' }}
                        >
                          Contact
                        </button>
                        <span style={{ fontWeight: 700, color: m.score >= 60 ? 'var(--success)' : 'var(--warning)', padding: '2px 8px', borderRadius: 12, background: m.score >= 60 ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)' }}>{m.score}% match</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="card-footer" style={{ flexWrap: 'wrap', gap: 8 }}>
                {item.status !== 'resolved' && isAdmin && (
                  <button className="btn btn-primary" style={{ width: 'auto', padding: '6px 16px', fontSize: '0.8rem' }} onClick={() => handleResolve(item.id)}>✅ Mark Resolved</button>
                )}
                <button className="btn-icon" onClick={() => setContactModal(contactModal === item.id ? null : item.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}>
                  <MessageCircle size={14} /> {msgs.length > 0 ? `${msgs.length} messages` : 'Contact'}
                </button>
              </div>

              {/* In-App Contact */}
              {contactModal === item.id && (
                <div style={{ marginTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
                <div style={{ maxHeight: 120, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                    {msgs.length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Send a message to the owner/finder</p>}
                    {msgs.map(m => (
                      <div key={m.id} style={{ fontSize: '0.8rem', padding: '6px 10px', borderRadius: 8, background: m.userId === currentUser.uid ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.04)' }}>
                        <strong>{m.userName}:</strong> {m.text}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input className="form-input" placeholder="Type a message..." value={contactMsg} onChange={e => setContactMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleContact(item.id)} style={{ flex: 1, padding: '8px 12px', fontSize: '0.82rem' }} />
                    <button className="btn btn-primary" style={{ width: 'auto', padding: '8px 14px' }} onClick={() => handleContact(item.id)}>Send</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && <div className="empty-state" style={{ gridColumn: '1/-1' }}><h3>No items found</h3></div>}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Report Item</h2><button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button></div>
            <form onSubmit={handleSubmit}>
              <div className="form-group"><label>Type</label><select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="lost">🔴 I Lost Something</option><option value="found">🟢 I Found Something</option></select></div>
              <div className="form-group"><label>Title</label><input className="form-input" placeholder="e.g. Black Leather Wallet" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
              <div className="form-group"><label>Description</label><textarea className="form-textarea" placeholder="Describe the item in detail..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required /></div>
              <div className="form-row">
                <div className="form-group"><label><MapPin size={14} style={{ verticalAlign: 'middle' }} /> Location</label><select className="form-select" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}>{LOCATIONS.map(l => <option key={l}>{l}</option>)}</select></div>
                <div className="form-group"><label>Contact Info (optional)</label><input className="form-input" placeholder="Phone / WhatsApp" value={form.contactInfo} onChange={e => setForm({ ...form, contactInfo: e.target.value })} /></div>
              </div>
              <div className="form-group">
                <label>Image URL (optional)</label>
                <input
                  className="form-input"
                  type="url"
                  placeholder="https://..."
                  value={form.imageUrl}
                  onChange={e => setForm({ ...form, imageUrl: e.target.value })}
                />
              </div>
              <button className="btn btn-primary" type="submit">Submit Report</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
