import { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider, db } from '../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { ref, set, get } from 'firebase/database';

const AuthContext = createContext();

// Add admin emails here
const ADMIN_EMAILS = ['dinesh@vit.com', 'admin@campusos.com', 'admin@vit.com'];

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  function checkAdmin(email) {
    return ADMIN_EMAILS.includes(email?.toLowerCase());
  }

  async function ensureProfile(user) {
    try {
      const snapshot = await get(ref(db, `users/${user.uid}`));
      if (snapshot.exists()) {
        setUserProfile(snapshot.val());
      } else {
        const profile = {
          displayName: user.displayName || user.email?.split('@')[0] || 'Student',
          email: user.email,
          photoURL: user.photoURL || null,
          department: 'Computer Science',
          year: '2nd Year',
          role: checkAdmin(user.email) ? 'admin' : 'student',
          createdAt: Date.now()
        };
        await set(ref(db, `users/${user.uid}`), profile);
        setUserProfile(profile);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setUserProfile({
        displayName: user.displayName || user.email?.split('@')[0] || 'Student',
        email: user.email,
        department: 'Computer Science',
        year: '2nd Year',
        role: checkAdmin(user.email) ? 'admin' : 'student'
      });
    }
    setIsAdmin(checkAdmin(user.email));
  }

  async function signup(email, password, displayName, department, year) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
    const profile = {
      displayName,
      email,
      department: department || 'Computer Science',
      year: year || '2nd Year',
      role: checkAdmin(email) ? 'admin' : 'student',
      createdAt: Date.now()
    };
    await set(ref(db, `users/${cred.user.uid}`), profile);
    setUserProfile(profile);
    setIsAdmin(checkAdmin(email));
    return cred;
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function loginWithGoogle() {
    const cred = await signInWithPopup(auth, googleProvider);
    await ensureProfile(cred.user);
    return cred;
  }

  function logout() {
    setUserProfile(null);
    setIsAdmin(false);
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
    loginWithGoogle,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
