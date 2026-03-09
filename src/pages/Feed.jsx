import { useState, useEffect } from 'react';
import { BookOpen, Search, Calendar, Home, Wallet, Rss, ThumbsUp, Heart, Flame, Star } from 'lucide-react';
import { db } from '../firebase';
import { ref, onValue, update, get } from 'firebase/database';
import { useAuth } from '../contexts/AuthContext';

const REACTIONS = [
  { key: 'like', emoji: '👍' },
  { key: 'love', emoji: '❤️' },
  { key: 'fire', emoji: '🔥' },
  { key: 'star', emoji: '⭐' },
];

export default function Feed() {
  const { currentUser } = useAuth();
  const [feedItems, setFeedItems] = useState([]);

  useEffect(() => {
    const unsub = onValue(ref(db, 'feed'), snap => {
      if (snap.exists()) {
        const arr = Object.entries(snap.val()).map(([id, val]) => ({ id, ...val }));
        arr.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setFeedItems(arr);
      } else setFeedItems([]);
    }, e => console.warn('Feed listener:', e));
    return () => unsub();
  }, []);

  async function handleReaction(itemId, reactionKey) {
    const snap = await get(ref(db, `feed/${itemId}/reactions`));
    const reactions = snap.exists() ? snap.val() : {};
    if (!reactions[reactionKey]) reactions[reactionKey] = {};
    if (reactions[reactionKey][currentUser.uid]) {
      delete reactions[reactionKey][currentUser.uid];
    } else {
      // Remove user from other reactions first
      REACTIONS.forEach(r => { if (reactions[r.key]?.[currentUser.uid]) delete reactions[r.key][currentUser.uid]; });
      reactions[reactionKey][currentUser.uid] = true;
    }
    await update(ref(db, `feed/${itemId}`), { reactions });
  }

  const icons = {
    notes: { icon: BookOpen, bg: 'var(--info-bg)', color: 'var(--info)' },
    'lost-found': { icon: Search, bg: 'var(--warning-bg)', color: 'var(--warning)' },
    events: { icon: Calendar, bg: 'rgba(139,92,246,0.12)', color: '#a78bfa' },
    complaints: { icon: Home, bg: 'var(--danger-bg)', color: 'var(--danger)' },
    budget: { icon: Wallet, bg: 'var(--success-bg)', color: 'var(--success)' }
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
      <div className="page-header"><h1>📰 Campus Feed</h1><p>Live activity across the campus — react and engage!</p></div>

      {/* Feed Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {Object.entries(icons).map(([type, cfg]) => {
          const Icon = cfg.icon;
          const count = feedItems.filter(i => i.type === type).length;
          return (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 'var(--radius)', background: cfg.bg, fontSize: '0.82rem' }}>
              <Icon size={14} style={{ color: cfg.color }} />
              <span style={{ fontWeight: 600 }}>{count}</span>
              <span style={{ color: 'var(--text-muted)' }}>{type.replace('-', ' ')}</span>
            </div>
          );
        })}
      </div>

      {feedItems.map(item => {
        const ft = icons[item.type] || icons.notes;
        const Icon = ft.icon;
        const reactions = item.reactions || {};
        return (
          <div className="feed-item" key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="feed-icon" style={{ background: ft.bg, color: ft.color }}><Icon size={18} /></div>
              <div className="feed-content" style={{ flex: 1 }}>
                <h4>{item.title}</h4>
                <p>{item.description}</p>
                <div className="feed-time">{formatTime(item.createdAt)}</div>
              </div>
            </div>
            {/* Emoji Reactions */}
            <div style={{ display: 'flex', gap: 6, marginLeft: 48 }}>
              {REACTIONS.map(r => {
                const users = reactions[r.key] || {};
                const count = Object.keys(users).length;
                const active = users[currentUser.uid];
                return (
                  <button key={r.key} onClick={() => handleReaction(item.id, r.key)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px',
                      borderRadius: 20, border: `1px solid ${active ? 'var(--accent-primary)' : 'rgba(255,255,255,0.06)'}`,
                      background: active ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)',
                      cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-secondary)',
                      transition: 'all 0.2s'
                    }}>
                    <span>{r.emoji}</span>
                    {count > 0 && <span style={{ fontWeight: 600 }}>{count}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      {feedItems.length === 0 && (
        <div className="empty-state"><Rss size={48} style={{ opacity: 0.2, margin: '0 auto 16px', display: 'block' }} /><h3>No activity yet</h3><p>Start using CampusOS modules to see activity here</p></div>
      )}
    </>
  );
}
