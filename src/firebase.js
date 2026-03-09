import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAh8Di_gmznvVbyNrX8qChLrXUxV0vfoKE",
  authDomain: "studentos-42af1.firebaseapp.com",
  databaseURL: "https://studentos-42af1-default-rtdb.firebaseio.com",
  projectId: "studentos-42af1",
  storageBucket: "studentos-42af1.firebasestorage.app",
  messagingSenderId: "288777972722",
  appId: "1:288777972722:web:f5168c62e875a14a80d96b",
  measurementId: "G-HCL0Y61KCF"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getDatabase(app);
export default app;
