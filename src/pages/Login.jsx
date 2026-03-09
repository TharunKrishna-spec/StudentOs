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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup, loginWithGoogle } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignup) {
        await signup(email, password, name, department, year);
      } else {
        await login(email, password);
      }
    } catch (err) {
      const code = err.code || '';
      const messages = {
        'auth/user-not-found': 'No account found with this email. Click "Create Account" to sign up.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/invalid-credential': 'Invalid email or password. If new, click "Create Account".',
        'auth/email-already-in-use': 'This email is already registered. Try signing in.',
        'auth/weak-password': 'Password should be at least 6 characters.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/too-many-requests': 'Too many attempts. Please wait and try again.',
      };
      setError(messages[code] || err.message || 'Something went wrong');
    }
    setLoading(false);
  }

  async function handleGoogle() {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err.message || 'Google sign-in failed. Try again.');
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

          <div className="auth-divider">or continue with</div>

          <button className="btn btn-google" onClick={handleGoogle} disabled={loading}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google Sign In
          </button>

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
