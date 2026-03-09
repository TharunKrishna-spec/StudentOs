import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { ref, set, get } from 'firebase/database';

const AuthContext = createContext();

const ADMIN_EMAILS = ['dinesh@vit.com', 'admin@campusos.com', 'admin@vit.com'];

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  function checkAdmin(role, email) {
    const normalized = (email || '').toLowerCase().trim();
    return role === 'admin' || ADMIN_EMAILS.includes(normalized);
  }

  async function ensureProfile(user) {
    try {
      const snapshot = await get(ref(db, `users/${user.uid}`));
      if (snapshot.exists()) {
        const profile = snapshot.val();
        setUserProfile(profile);
        setIsAdmin(checkAdmin(profile?.role, user?.email));
      } else {
        const profile = {
          displayName: user.displayName || user.email?.split('@')[0] || 'Student',
          email: user.email,
          photoURL: user.photoURL || null,
          department: 'Computer Science',
          year: '2nd Year',
          role: ADMIN_EMAILS.includes((user.email || '').toLowerCase()) ? 'admin' : 'student',
          createdAt: Date.now()
        };
        await set(ref(db, `users/${user.uid}`), profile);
        setUserProfile(profile);
        setIsAdmin(checkAdmin(profile.role, user?.email));
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setUserProfile({
        displayName: user.displayName || user.email?.split('@')[0] || 'Student',
        email: user.email,
        department: 'Computer Science',
        year: '2nd Year',
        role: 'student'
      });
      setIsAdmin(ADMIN_EMAILS.includes((user?.email || '').toLowerCase()));
    }
  }

  async function signup(email, password, displayName, department, year) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
    const profile = {
      displayName,
      email,
      department: department || 'Computer Science',
      year: year || '2nd Year',
      role: ADMIN_EMAILS.includes((email || '').toLowerCase()) ? 'admin' : 'student',
      createdAt: Date.now()
    };
    await set(ref(db, `users/${cred.user.uid}`), profile);
    setUserProfile(profile);
    setIsAdmin(checkAdmin(profile.role, email));
    return cred;
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    setUserProfile(null);
    setIsAdmin(false);
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('admin_unlocked');
    }
    return signOut(auth);
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await ensureProfile(user);
      } else {
        setUserProfile(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const value = {
    currentUser,
    userProfile,
    isAdmin,
    signup,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
