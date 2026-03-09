import { useState } from 'react';
import { Mail, Lock, User, GraduationCap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [year, setYear] = useState('2nd Year');
  const [residenceType, setResidenceType] = useState('Day Scholar');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignup) {
        await signup(email, password, name, department, year, residenceType);
      } else {
        await login(email, password);
      }
    } catch (err) {
      const code = err.code || '';
      const messages = {
        'auth/user-not-found': 'No account found with this email. Click "Create Account" to sign up.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/invalid-credential': 'Invalid email or password. If new, click "Create Account".',
        'auth/invalid-login-credentials': 'Invalid email or password. Please check and try again.',
        'auth/email-already-in-use': 'This email is already registered. Try signing in.',
        'auth/weak-password': 'Password should be at least 6 characters.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/too-many-requests': 'Too many attempts. Please wait and try again.',
        'auth/operation-not-allowed': 'Email/Password sign-in is disabled in Firebase console.',
        'auth/network-request-failed': 'Network error. Check your internet and try again.',
      };
      setError(messages[code] || err.message || 'Something went wrong');
    }
    setLoading(false);
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-logo">
          <h1>🎓 CampusOS</h1>
          <p>Your Unified Student Platform</p>
        </div>
        <div className="auth-card">
          <h2>{isSignup ? 'Create Account' : 'Welcome Back'}</h2>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            {isSignup && (
              <>
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="Tharun Krishna"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Department</label>
                    <select className="form-select" value={department} onChange={e => setDepartment(e.target.value)}>
                      <option>Computer Science</option>
                      <option>Electronics</option>
                      <option>Mechanical</option>
                      <option>Civil</option>
                      <option>Electrical</option>
                      <option>Information Technology</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Year</label>
                    <select className="form-select" value={year} onChange={e => setYear(e.target.value)}>
                      <option>1st Year</option>
                      <option>2nd Year</option>
                      <option>3rd Year</option>
                      <option>4th Year</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Residence</label>
                  <select className="form-select" value={residenceType} onChange={e => setResidenceType(e.target.value)}>
                    <option>Day Scholar</option>
                    <option>Hosteler</option>
                  </select>
                </div>
              </>
            )}
            <div className="form-group">
              <label>Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="you@campus.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Please wait...' : isSignup ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="auth-toggle">
            {isSignup ? 'Already have an account? ' : "Don't have an account? "}
            <button onClick={() => { setIsSignup(!isSignup); setError(''); }}>
              {isSignup ? 'Sign In' : 'Create Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
