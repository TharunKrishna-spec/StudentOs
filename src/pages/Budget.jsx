import { useState, useEffect } from 'react';
import { Plus, X, Trash2, PieChart, TrendingDown, TrendingUp, Wallet, Target, AlertCircle, Trophy } from 'lucide-react';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { db } from '../firebase';
import { ref, push, onValue, remove, update, get } from 'firebase/database';
import { useAuth } from '../contexts/AuthContext';

const EXPENSE_CATS = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Fees', 'Stationery', 'Other'];
const INCOME_CATS = ['Pocket Money', 'Freelance', 'Scholarship', 'Part-time', 'Other'];
const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

export default function Budget() {
  const { currentUser } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [budgetGoal, setBudgetGoal] = useState(5000);
  const [savingsGoal, setSavingsGoal] = useState({ target: 10000, name: 'Semester Savings' });
  const [form, setForm] = useState({ title: '', amount: '', type: 'expense', category: 'Food' });

  useEffect(() => {
    const budgetRef = ref(db, `budget/${currentUser.uid}`);
    const unsub = onValue(budgetRef, snap => {
      if (snap.exists()) {
        const data = snap.val();
        // Check for meta (goals)
        if (data._meta) {
          if (data._meta.budgetGoal) setBudgetGoal(data._meta.budgetGoal);
          if (data._meta.savingsGoal) setSavingsGoal(data._meta.savingsGoal);
        }
        const arr = Object.entries(data).filter(([k]) => k !== '_meta').map(([id, val]) => ({ id, ...val }));
        arr.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setTransactions(arr);
      } else setTransactions([]);
    }, e => console.warn('Budget listener:', e));
    return () => unsub();
  }, [currentUser]);

  async function handleSubmit(e) {
    e.preventDefault();
    await push(ref(db, `budget/${currentUser.uid}`), {
      ...form, amount: parseFloat(form.amount), createdAt: Date.now()
    });
    setForm({ title: '', amount: '', type: 'expense', category: 'Food' });
    setShowModal(false);
  }

  async function saveGoals() {
    await update(ref(db, `budget/${currentUser.uid}/_meta`), { budgetGoal, savingsGoal });
    setShowGoalModal(false);
  }

  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
  const balance = income - expense;
  const budgetPercent = budgetGoal > 0 ? (expense / budgetGoal) * 100 : 0;
  const savingsPercent = savingsGoal.target > 0 ? (balance / savingsGoal.target) * 100 : 0;

  // Spending by category
  const catBreakdown = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    catBreakdown[t.category] = (catBreakdown[t.category] || 0) + t.amount;
  });
  const pieData = Object.entries(catBreakdown).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // Daily average
  const dayRange = transactions.length > 0 ? Math.max(1, Math.ceil((Date.now() - Math.min(...transactions.map(t => t.createdAt || Date.now()))) / 86400000)) : 1;
  const dailyAvg = expense / dayRange;

  // Spending alerts
  const alerts = [];
  if (budgetPercent >= 90) alerts.push({ msg: '🚨 You've exceeded 90% of your budget!', color: 'var(--danger)' });
  else if (budgetPercent >= 70) alerts.push({ msg: '⚠️ You've used 70% of your monthly budget', color: 'var(--warning)' });
  if (pieData[0] && pieData[0].value > expense * 0.5) alerts.push({ msg: `💡 ${pieData[0].name} is more than 50% of your spending`, color: 'var(--info)' });
  if (dailyAvg > budgetGoal / 30) alerts.push({ msg: `📊 Daily avg ₹${Math.round(dailyAvg)} exceeds sustainable rate`, color: 'var(--warning)' });

  const catIcons = { Food: '🍔', Transport: '🚗', Entertainment: '🎮', Shopping: '🛍️', Fees: '💳', Stationery: '📎', Other: '📦', 'Pocket Money': '💰', Freelance: '💻', Scholarship: '🎓', 'Part-time': '⏰' };
  const formatTime = (ts) => { if (!ts) return ''; return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }); };

  return (
    <>
      <div className="page-header"><h1>Budget Tracker</h1><p>Track expenses, set goals, and manage your finances</p></div>

      <div className="budget-summary">
        <div className="budget-card"><div className="amount income">₹{income.toLocaleString()}</div><div className="label">Total Income</div></div>
        <div className="budget-card"><div className="amount expense">₹{expense.toLocaleString()}</div><div className="label">Total Expenses</div></div>
        <div className="budget-card"><div className="amount balance" style={{ color: balance >= 0 ? 'var(--success)' : 'var(--danger)' }}>₹{balance.toLocaleString()}</div><div className="label">Balance</div></div>
        <div className="budget-card"><div className="amount" style={{ color: 'var(--info)', fontSize: '1.3rem' }}>₹{Math.round(dailyAvg)}/day</div><div className="label">Daily Average</div></div>
      </div>

      {/* Spending Alerts */}
      {alerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {alerts.map((a, i) => (
            <div key={i} style={{ padding: '10px 16px', borderRadius: 'var(--radius)', background: 'rgba(255,255,255,0.03)', borderLeft: `3px solid ${a.color}`, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={16} style={{ color: a.color, flexShrink: 0 }} /> {a.msg}
            </div>
          ))}
        </div>
      )}

      {/* Budget Goal + Savings Goal */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Target size={18} style={{ color: 'var(--accent-primary)' }} />
              <span style={{ fontWeight: 600 }}>Monthly Budget: ₹{budgetGoal.toLocaleString()}</span>
            </div>
            <span style={{ fontSize: '0.82rem', color: budgetPercent > 80 ? 'var(--danger)' : 'var(--text-muted)' }}>{budgetPercent.toFixed(0)}%</span>
          </div>
          <div className="progress-bar"><div className={`progress-fill ${budgetPercent > 80 ? 'warning' : ''}`} style={{ width: `${Math.min(budgetPercent, 100)}%` }} /></div>
          <div style={{ marginTop: 8, fontSize: '0.78rem', color: 'var(--text-muted)' }}>₹{Math.max(budgetGoal - expense, 0).toLocaleString()} remaining</div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Trophy size={18} style={{ color: 'var(--success)' }} />
              <span style={{ fontWeight: 600 }}>{savingsGoal.name}: ₹{savingsGoal.target.toLocaleString()}</span>
            </div>
            <span style={{ fontSize: '0.82rem', color: savingsPercent >= 100 ? 'var(--success)' : 'var(--text-muted)' }}>{Math.min(savingsPercent, 100).toFixed(0)}%</span>
          </div>
          <div className="progress-bar"><div className="progress-fill" style={{ width: `${Math.min(savingsPercent, 100)}%`, background: 'var(--success)' }} /></div>
          <div style={{ marginTop: 8, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {savingsPercent >= 100 ? '🎉 Goal reached!' : `₹${Math.max(savingsGoal.target - balance, 0).toLocaleString()} to go`}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <button className="btn btn-primary" style={{ width: 'auto', marginRight: 8 }} onClick={() => setShowGoalModal(true)}><Target size={16} /> Set Goals</button>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-main">
          <div className="section-header">
            <h2>Transactions</h2>
            <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => setShowModal(true)}><Plus size={18} /> Add</button>
          </div>
          <div className="transactions-list">
            {transactions.map(t => (
              <div className="transaction-item" key={t.id}>
                <div className="transaction-info">
                  <div className="transaction-icon" style={{ background: t.type === 'income' ? 'var(--success-bg)' : 'var(--danger-bg)' }}>{catIcons[t.category] || '💰'}</div>
                  <div className="transaction-details"><h4>{t.title}</h4><span>{t.category} • {formatTime(t.createdAt)}</span></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={`transaction-amount ${t.type}`}>{t.type === 'income' ? '+' : '-'}₹{t.amount?.toLocaleString()}</span>
                  <button className="btn-icon" onClick={() => remove(ref(db, `budget/${currentUser.uid}/${t.id}`))}><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
            {transactions.length === 0 && <div className="empty-state"><Wallet size={48} style={{ opacity: 0.2, margin: '0 auto 16px', display: 'block' }} /><h3>No transactions</h3><p>Add income or expenses to start tracking</p></div>}
          </div>
        </div>

        <div>
          <div className="chart-card" style={{ marginBottom: 16 }}>
            <h3><PieChart size={18} /> Spending Breakdown</h3>
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <RechartsPie>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} contentStyle={{ background: '#1a1a3a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                  </RechartsPie>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                  {pieData.map((d, i) => (
                    <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length] }}></span>{catIcons[d.name]} {d.name}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>₹{d.value.toLocaleString()} ({Math.round(d.value / expense * 100)}%)</span>
                    </div>
                  ))}
                </div>
              </>
            ) : <div className="empty-state" style={{ padding: 20 }}><p>No expenses yet</p></div>}
          </div>

          <div className="insights-panel">
            <h3>💡 Smart Insights</h3>
            <div className="insight-item"><span className="insight-dot" style={{ background: 'var(--info)' }}></span>Total transactions: {transactions.length}</div>
            {pieData[0] && <div className="insight-item"><span className="insight-dot" style={{ background: 'var(--warning)' }}></span>Top spending: {pieData[0].name} (₹{pieData[0].value.toLocaleString()})</div>}
            <div className="insight-item"><span className="insight-dot" style={{ background: 'var(--accent-primary)' }}></span>Daily average: ₹{Math.round(dailyAvg)}</div>
            {budgetGoal > 0 && <div className="insight-item"><span className="insight-dot" style={{ background: budgetPercent > 80 ? 'var(--danger)' : 'var(--success)' }}></span>Budget usage: {budgetPercent.toFixed(0)}%</div>}
          </div>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Add Transaction</h2><button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button></div>
            <form onSubmit={handleSubmit}>
              <div className="form-group"><label>Type</label><select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value, category: e.target.value === 'income' ? 'Pocket Money' : 'Food' })}><option value="expense">💸 Expense</option><option value="income">💰 Income</option></select></div>
              <div className="form-group"><label>Title</label><input className="form-input" placeholder="e.g. Lunch at canteen" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
              <div className="form-row">
                <div className="form-group"><label>Amount (₹)</label><input className="form-input" type="number" placeholder="100" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required /></div>
                <div className="form-group"><label>Category</label><select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{(form.type === 'income' ? INCOME_CATS : EXPENSE_CATS).map(c => <option key={c}>{c}</option>)}</select></div>
              </div>
              <button className="btn btn-primary" type="submit">Add Transaction</button>
            </form>
          </div>
        </div>
      )}

      {/* Set Goals Modal */}
      {showGoalModal && (
        <div className="modal-overlay" onClick={() => setShowGoalModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Set Financial Goals</h2><button className="modal-close" onClick={() => setShowGoalModal(false)}><X size={20} /></button></div>
            <div className="form-group"><label><Target size={14} style={{ verticalAlign: 'middle' }} /> Monthly Budget Limit (₹)</label><input className="form-input" type="number" value={budgetGoal} onChange={e => setBudgetGoal(Number(e.target.value))} /></div>
            <div className="form-group"><label><Trophy size={14} style={{ verticalAlign: 'middle' }} /> Savings Goal Name</label><input className="form-input" value={savingsGoal.name} onChange={e => setSavingsGoal({ ...savingsGoal, name: e.target.value })} /></div>
            <div className="form-group"><label>Savings Target (₹)</label><input className="form-input" type="number" value={savingsGoal.target} onChange={e => setSavingsGoal({ ...savingsGoal, target: Number(e.target.value) })} /></div>
            <button className="btn btn-primary" onClick={saveGoals}>Save Goals</button>
          </div>
        </div>
      )}
    </>
  );
}
