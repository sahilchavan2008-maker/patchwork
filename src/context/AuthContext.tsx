'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  UserCredential,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

export interface DemoUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
}

export interface AuthContextType {
  user: User | DemoUser | null;
  loading: boolean;
  loginWithGoogle: () => Promise<UserCredential>;
  loginWithEmail: (email: string, password: string) => Promise<UserCredential>;
  signUpWithEmail: (email: string, password: string) => Promise<UserCredential>;
  loginAsDemo: (name?: string, email?: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | DemoUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if demo user is stored in localStorage
    if (typeof window !== 'undefined') {
      const savedDemo = localStorage.getItem('patchwork_demo_user');
      if (savedDemo) {
        try {
          setUser(JSON.parse(savedDemo));
          setLoading(false);
          return;
        } catch {
          localStorage.removeItem('patchwork_demo_user');
        }
      }
    }

    // Subscribe to Firebase real-time authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // Don't overwrite if demo session is active
      if (typeof window !== 'undefined' && localStorage.getItem('patchwork_demo_user')) {
        return;
      }
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async (): Promise<UserCredential> => {
    setLoading(true);
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('patchwork_demo_user');
      }
      return await signInWithPopup(auth, googleProvider);
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email: string, password: string): Promise<UserCredential> => {
    setLoading(true);
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('patchwork_demo_user');
      }
      return await signInWithEmailAndPassword(auth, email, password);
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string): Promise<UserCredential> => {
    setLoading(true);
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('patchwork_demo_user');
      }
      return await createUserWithEmailAndPassword(auth, email, password);
    } finally {
      setLoading(false);
    }
  };

  const loginAsDemo = (name = 'Lead QA Architect', email = 'engineer@patchwork.dev') => {
    const demoUser: DemoUser = {
      uid: 'demo-user-123',
      email,
      displayName: name,
      photoURL: null,
      isAnonymous: false,
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('patchwork_demo_user', JSON.stringify(demoUser));
    }
    setUser(demoUser);
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('patchwork_demo_user');
      }
      await signOut(auth);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithGoogle,
        loginWithEmail,
        signUpWithEmail,
        loginAsDemo,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
