// src/lib/auth.ts
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import app from './firebase';

const auth = getAuth(app);

export async function login(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function logout() {
  return signOut(auth);
}

export function getCurrentUser(): User | null {
  return auth.currentUser;
}
