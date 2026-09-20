import React, { useEffect, useState, type ReactNode } from 'react';
import { FirebaseError } from 'firebase/app';
import {
  browserLocalPersistence,
  browserSessionPersistence,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { FirestoreService } from '../services/firestoreService';
import { staffAuthProfile } from '../services/staffAuthProfile';
import { StorageService } from '../services/storage';
import type { AuthUser, LoginCredentials } from '../types/auth';
import { AuthContext } from './authContextValue';

class StaffAccessError extends Error {}

function authErrorMessage(error: unknown): string {
  if (error instanceof StaffAccessError) return error.message;
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'auth/invalid-email': return 'Enter a valid email address.';
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found': return 'Incorrect email or password.';
      case 'auth/user-disabled': return 'This Firebase account is disabled. Contact your administrator.';
      case 'auth/too-many-requests': return 'Too many sign-in attempts. Please wait and try again.';
      case 'auth/network-request-failed': return 'Network error. Check your connection and try again.';
      case 'auth/operation-not-allowed': return 'Email/Password sign-in is not enabled for this Firebase project.';
      case 'auth/invalid-api-key': return 'Firebase configuration is invalid. Contact your administrator.';
    }
  }
  return 'Could not verify your account. Check the connection and try again.';
}

async function resolveStaffProfile(firebaseUser: User): Promise<AuthUser> {
  const staff = await FirestoreService.getAllStaff();
  const profile = staffAuthProfile(staff, firebaseUser.email);
  if (!profile) throw new StaffAccessError('No active staff record matches this Firebase account. Contact your administrator.');
  return profile;
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initializing, setInitializing] = useState(Boolean(auth));
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(auth ? null : 'Firebase Authentication is not configured. Contact your administrator.');

  useEffect(() => {
    // The old local session must never grant access after switching to Firebase Auth.
    try { StorageService.saveAuthSession(null); } catch { /* Firebase Auth remains the only session source. */ }
    const firebaseAuth = auth;
    if (!firebaseAuth) return;

    let active = true;
    let revision = 0;
    const unsubscribe = onAuthStateChanged(firebaseAuth, firebaseUser => {
      const currentRevision = ++revision;
      if (!firebaseUser) {
        setUser(null);
        setInitializing(false);
        return;
      }
      void resolveStaffProfile(firebaseUser)
        .then(profile => {
          if (active && currentRevision === revision) {
            setUser(profile);
            setError(null);
          }
        })
        .catch(cause => {
          if (active && currentRevision === revision) {
            setUser(null);
            setError(authErrorMessage(cause));
            void signOut(firebaseAuth).catch(() => {});
          }
        })
        .finally(() => {
          if (active && currentRevision === revision) setInitializing(false);
        });
    }, cause => {
      if (!active) return;
      setUser(null);
      setError(authErrorMessage(cause));
      setInitializing(false);
    });
    return () => { active = false; unsubscribe(); };
  }, []);

  const login = async ({ email, password, rememberMe }: LoginCredentials): Promise<boolean> => {
    if (!auth) {
      setError('Firebase Authentication is not configured. Contact your administrator.');
      return false;
    }
    setSigningIn(true);
    setError(null);
    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const profile = await resolveStaffProfile(credential.user);
      if (auth.currentUser?.uid !== credential.user.uid) return false;
      setUser(profile);
      return true;
    } catch (cause) {
      setUser(null);
      setError(authErrorMessage(cause));
      if (auth.currentUser) await signOut(auth).catch(() => {});
      return false;
    } finally {
      setSigningIn(false);
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    if (!auth) {
      setError('Firebase Authentication is not configured. Contact your administrator.');
      return false;
    }
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return true;
    } catch (cause) {
      setError(authErrorMessage(cause));
      return false;
    }
  };

  const logout = async (): Promise<boolean> => {
    if (!auth) return false;
    try {
      await signOut(auth);
      setUser(null);
      setError(null);
      return true;
    } catch (cause) {
      setError(authErrorMessage(cause));
      return false;
    }
  };

  return <AuthContext.Provider value={{
    user,
    isAuthenticated: !!user,
    isLoading: initializing || signingIn,
    error,
    login,
    resetPassword,
    logout,
  }}>{children}</AuthContext.Provider>;
};
