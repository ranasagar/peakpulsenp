
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { User as AuthUserType } from '@/types'; // Renamed to avoid conflict with Firebase User
import { auth } from '@/firebase/config';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User as FirebaseUser, // Firebase's own User type
} from 'firebase/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUserType | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to map FirebaseUser to your app's User type
const mapFirebaseUserToAppUser = (firebaseUser: FirebaseUser | null): AuthUserType | null => {
  if (!firebaseUser) return null;
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
    avatarUrl: firebaseUser.photoURL || undefined,
    // Roles would typically come from a database (e.g., Firestore) linked to the UID
    // For now, all authenticated users get 'customer' role.
    // A more robust solution would involve fetching roles after login.
    roles: ['customer'], 
  };
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      const appUser = mapFirebaseUserToAppUser(firebaseUser);
      setUser(appUser);
      setIsLoading(false);
    });
    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  const login = useCallback(async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      // onAuthStateChanged will handle setting the user state
      const redirectPath = searchParams.get('redirect') || '/account/dashboard';
      router.push(redirectPath);
      return { success: true };
    } catch (error: any) {
      console.error("Firebase login error:", error);
      setIsLoading(false);
      return { success: false, error: error.message || "Login failed. Please check your credentials." };
    }
  }, [router, searchParams]);

  const register = useCallback(async (name: string, email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName: name });
      }
      // onAuthStateChanged will handle setting the user state (which triggers re-map)
      // After successful registration, Firebase automatically signs the user in.
      // You might want to redirect to login or directly to dashboard.
      router.push('/account/dashboard'); // Or '/login' if you want them to login again
      return { success: true };
    } catch (error: any) {
      console.error("Firebase registration error:", error);
      setIsLoading(false);
      return { success: false, error: error.message || "Registration failed. Please try again." };
    }
  }, [router]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await firebaseSignOut(auth);
      // onAuthStateChanged will handle setting user to null
      router.push('/login');
    } catch (error) {
      console.error("Firebase logout error:", error);
      // Still attempt to clear local state
      setUser(null);
      setIsLoading(false);
    }
  }, [router]);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
