import { useState, useEffect } from 'react';
import { Plus, X, Trash2, ThumbsUp, Search, BookOpen, Link2, MessageSquare, Bookmark, Send, ExternalLink, Eye } from 'lucide-react';
import { db } from '../firebase';
import { ref, push, onValue, remove, update, get } from 'firebase/database';
import { useAuth } from '../contexts/AuthContext';

const SUBJECTS = ['All', 'DSA', 'Java', 'Python', 'DBMS', 'OS', 'CN', 'MPMC', 'CAO', 'Maths', 'Physics', 'Other'];

export default function Notes() {
  const { currentUser, isAdmin } = useAuth();
  const [notes, setNotes] = useState([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [commentModal, setCommentModal] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [form, setForm] = useState({ title: '', description: '', subject: 'DSA', fileType: 'PDF', content: '', driveLink: '' });

  useEffect(() => {
    const unsub = onValue(ref(db, 'notes'), snap => {
      if (snap.exists()) {
        const arr = Object.entries(snap.val()).map(([id, val]) => ({ id, ...val }));
        arr.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
        setNotes(arr);
      } else setNotes([]);
    }, e => console.warn('Notes listener:', e));
    return () => unsub();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const noteData = {
      ...form, upvotes: 0, upvotedBy: {}, bookmarkedBy: {}, comments: {}, views: 0,
      userId: currentUser.uid,
      userName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Anonymous',
      createdAt: Date.now()
    };
    await push(ref(db, 'notes'), noteData);
    await push(ref(db, 'feed'), { type: 'notes', title: `📚 ${noteData.userName} shared notes`, description: form.title, createdAt: Date.now() });
    await push(ref(db, 'notifications'), { type: 'notes', message: `New notes: ${form.title} (${form.subject})`, createdAt: Date.now() });
    setForm({ title: '', description: '', subject: 'DSA', fileType: 'PDF', content: '', driveLink: '' });
    setShowModal(false);
  }

  async function handleUpvote(id) {
    const snap = await get(ref(db, `notes/${id}`));
    if (!snap.exists()) return;
    const n = snap.val();
    const ub = n.upvotedBy || {};
    if (ub[currentUser.uid]) { delete ub[currentUser.uid]; await update(ref(db, `notes/${id}`), { upvotes: Math.max((n.upvotes || 0) - 1, 0), upvotedBy: ub }); }
    else { ub[currentUser.uid] = true; await update(ref(db, `notes/${id}`), { upvotes: (n.upvotes || 0) + 1, upvotedBy: ub }); }
  }

  async function handleBookmark(id) {
    const snap = await get(ref(db, `notes/${id}/bookmarkedBy`));
    const bb = snap.exists() ? snap.val() : {};
    if (bb[currentUser.uid]) { delete bb[currentUser.uid]; } else { bb[currentUser.uid] = true; }
    await update(ref(db, `notes/${id}`), { bookmarkedBy: bb });
  }

  async function handleComment(noteId) {
    if (!commentText.trim()) return;
    await push(ref(db, `notes/${noteId}/comments`), {
      text: commentText, userName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Anon',
      userId: currentUser.uid, createdAt: Date.now()
    });
    setCommentText('');
  }

  async function handleView(id) {
    const snap = await get(ref(db, `notes/${id}/views`));
    await update(ref(db, `notes/${id}`), { views: (snap.exists() ? snap.val() : 0) + 1 });
  }

  const filtered = notes.filter(n => {
    if (filter !== 'All' && n.subject !== filter) return false;
    if (search && !n.title.toLowerCase().includes(search.toLowerCase()) && !n.description?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const fileTypeIcon = { PDF: '📄', PPT: '📊', DOC: '📝', Link: '🔗' };
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
      <div className="page-header"><h1>Notes Sharing</h1><p>Share and discover academic resources</p></div>

      <div className="filter-bar">
        <div className="search-box"><Search size={16} /><input placeholder="Search notes..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        {SUBJECTS.map(s => <button key={s} className={`filter-btn ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>{s}</button>)}
        <button className="btn btn-primary" style={{ width: 'auto', marginLeft: 'auto' }} onClick={() => setShowModal(true)}><Plus size={18} /> Upload Notes</button>
      </div>

      <div className="cards-grid">
        {filtered.map(n => {
          const comments = n.comments ? Object.entries(n.comments).map(([id, v]) => ({ id, ...v })) : [];
          comments.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
          return (
            <div className="card" key={n.id}>
              <div className="card-header">
                <div style={{ display: 'flex', gap: 6 }}>
                  <span className="badge badge-category">{n.subject}</span>
                  <span className="badge badge-review">{fileTypeIcon[n.fileType]} {n.fileType}</span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className={`btn-icon ${n.bookmarkedBy?.[currentUser.uid] ? 'active' : ''}`} onClick={() => handleBookmark(n.id)} title="Bookmark" style={{ color: n.bookmarkedBy?.[currentUser.uid] ? 'var(--warning)' : undefined }}>
                    <Bookmark size={16} fill={n.bookmarkedBy?.[currentUser.uid] ? 'var(--warning)' : 'none'} />
                  </button>
                  {isAdmin && <button className="btn-icon" onClick={() => remove(ref(db, `notes/${n.id}`))}><Trash2 size={16} /></button>}
                </div>
              </div>
              <div className="card-title">{n.title}</div>
              <div className="card-body">{n.description}</div>

              {/* Drive Link */}
              {n.driveLink && (
                <a href={n.driveLink} target="_blank" rel="noopener noreferrer" className="drive-link" onClick={() => handleView(n.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '10px 0', padding: '10px 14px', borderRadius: 'var(--radius)', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: 'var(--accent-primary)', textDecoration: 'none', fontSize: '0.82rem', transition: 'all 0.2s' }}>
                  <ExternalLink size={14} /> Open in Google Drive / Link
                </a>
              )}

              {/* Content preview */}
              {n.content && !n.driveLink && (
                <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 'var(--radius)', background: 'rgba(255,255,255,0.03)', fontSize: '0.82rem', color: 'var(--text-secondary)', borderLeft: '3px solid var(--accent-primary)', maxHeight: 80, overflow: 'hidden' }}>
                  {n.content}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>by {n.userName}</span>
                <span>•</span>
                <span>{formatTime(n.createdAt)}</span>
                {n.views > 0 && <><span>•</span><span><Eye size={12} /> {n.views}</span></>}
              </div>

              <div className="card-footer">
                <button className={`upvote-btn ${n.upvotedBy?.[currentUser.uid] ? 'active' : ''}`} onClick={() => handleUpvote(n.id)}>
                  <ThumbsUp size={14} /> {n.upvotes || 0}
                </button>
                <button className="btn-icon" onClick={() => setCommentModal(commentModal === n.id ? null : n.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}>
                  <MessageSquare size={14} /> {comments.length}
                </button>
                {Object.keys(n.bookmarkedBy || {}).length > 0 && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}><Bookmark size={12} /> {Object.keys(n.bookmarkedBy || {}).length} saved</span>
                )}
              </div>

              {/* Comments Section */}
              {commentModal === n.id && (
                <div style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
                  <div style={{ maxHeight: 150, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                    {comments.length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No comments yet. Start the discussion!</p>}
                    {comments.map(c => (
                      <div key={c.id} style={{ display: 'flex', gap: 8, fontSize: '0.8rem' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>{c.userName?.[0]?.toUpperCase()}</div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{c.userName} <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.72rem' }}>{formatTime(c.createdAt)}</span></div>
                          <div style={{ color: 'var(--text-secondary)', marginTop: 2 }}>{c.text}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input className="form-input" placeholder="Write a comment..." value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleComment(n.id)} style={{ flex: 1, padding: '8px 12px', fontSize: '0.82rem' }} />
                    <button className="btn btn-primary" style={{ width: 'auto', padding: '8px 14px' }} onClick={() => handleComment(n.id)}><Send size={14} /></button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && <div className="empty-state" style={{ gridColumn: '1/-1' }}><BookOpen size={48} style={{ opacity: 0.2, margin: '0 auto 16px', display: 'block' }} /><h3>No notes found</h3></div>}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Share Notes</h2><button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button></div>
            <form onSubmit={handleSubmit}>
              <div className="form-group"><label>Title</label><input className="form-input" placeholder="e.g. DSA Unit 3 - Trees" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
              <div className="form-group"><label>Description</label><textarea className="form-textarea" placeholder="Brief summary of the notes..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required /></div>
              <div className="form-row">
                <div className="form-group"><label>Subject</label><select className="form-select" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}>{SUBJECTS.filter(s => s !== 'All').map(s => <option key={s}>{s}</option>)}</select></div>
                <div className="form-group"><label>Type</label><select className="form-select" value={form.fileType} onChange={e => setForm({ ...form, fileType: e.target.value })}><option>PDF</option><option>PPT</option><option>DOC</option><option>Link</option></select></div>
              </div>

              {/* Drive Link Input */}
              <div className="form-group">
                <label><Link2 size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Google Drive / Resource Link</label>
                <input className="form-input" type="url" placeholder="https://drive.google.com/file/d/..." value={form.driveLink} onChange={e => setForm({ ...form, driveLink: e.target.value })} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>Paste a Google Drive, OneDrive, or any resource link</span>
              </div>

              <div className="form-group"><label>Notes Content (optional preview)</label><textarea className="form-textarea" placeholder="Paste key content for preview..." value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} style={{ minHeight: 80 }} /></div>
              <button className="btn btn-primary" type="submit">Share Notes</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
