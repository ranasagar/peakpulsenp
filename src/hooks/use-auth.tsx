
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { User as AuthUserType } from '@/types';
import { auth, db } from '@/firebase/config'; // Import db
import { doc, getDoc, setDoc } from 'firebase/firestore'; // Import Firestore functions
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUserType | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  fetchAppUser: (firebaseUser: FirebaseUser) => Promise<AuthUserType | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapFirebaseUserToInitialAppUser = (firebaseUser: FirebaseUser | null): AuthUserType | null => {
  if (!firebaseUser) return null;
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
    avatarUrl: firebaseUser.photoURL || undefined,
    roles: ['customer'], // Initial default role, Firestore will be the source of truth
    wishlist: [], // Initial empty wishlist
  };
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  const fetchAppUser = useCallback(async (firebaseUser: FirebaseUser): Promise<AuthUserType | null> => {
    if (!firebaseUser) return null;
    try {
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const dbUser = userDocSnap.data() as AuthUserType;
        // Merge Firebase Auth data (potentially more up-to-date displayName/photoURL) with Firestore data (roles, wishlist)
        return {
          id: firebaseUser.uid,
          email: firebaseUser.email || dbUser.email,
          name: firebaseUser.displayName || dbUser.name,
          avatarUrl: firebaseUser.photoURL || dbUser.avatarUrl,
          roles: dbUser.roles || ['customer'],
          wishlist: dbUser.wishlist || [],
        };
      } else {
        // User exists in Firebase Auth but not in Firestore users collection yet
        // Create a basic profile in Firestore
        const newAppUser: AuthUserType = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          avatarUrl: firebaseUser.photoURL || undefined,
          roles: ['customer'],
          wishlist: [],
          // createdAt will be set by Firestore or serverTimestamp in profile save
        };
        await setDoc(userDocRef, {
          email: newAppUser.email,
          name: newAppUser.name,
          avatarUrl: newAppUser.avatarUrl || null, // Ensure null if undefined for Firestore
          roles: newAppUser.roles,
          wishlist: newAppUser.wishlist,
          createdAt: new Date().toISOString(), // Or use serverTimestamp if called from backend/secure context
          updatedAt: new Date().toISOString(),
        });
        return newAppUser;
      }
    } catch (error) {
      console.error("Error fetching or creating user document in Firestore:", error);
      // Fallback to basic user info from Firebase Auth if Firestore fetch fails
      return mapFirebaseUserToInitialAppUser(firebaseUser);
    }
  }, []);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const appUser = await fetchAppUser(firebaseUser);
        setUser(appUser);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [fetchAppUser]);

  const login = useCallback(async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      if (userCredential.user) {
        const appUser = await fetchAppUser(userCredential.user); // Fetch/ensure Firestore user doc
        setUser(appUser); // Update context user
      }
      const redirectPath = searchParams.get('redirect') || '/account/dashboard';
      router.push(redirectPath);
      router.refresh(); // Force a refresh to ensure layout re-evaluates auth state
      return { success: true };
    } catch (error: any) {
      console.error("Firebase login error:", error);
      setIsLoading(false);
      return { success: false, error: error.message || "Login failed. Please check your credentials." };
    }
  }, [router, searchParams, fetchAppUser]);

  const register = useCallback(async (name: string, email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName: name });
        // fetchAppUser will handle creating the Firestore document if it doesn't exist
        const appUser = await fetchAppUser(userCredential.user);
        setUser(appUser); // Set user in context immediately after registration and profile creation
      }
      router.push('/account/dashboard');
      router.refresh();
      return { success: true };
    } catch (error: any)
        setIsLoading(false);
        return { success: false, error: error.message || "Registration failed. Please try again." };
      }
    }, [router, fetchAppUser]);

    const logout = useCallback(async () => {
      setIsLoading(true);
      try {
        await firebaseSignOut(auth);
        setUser(null); // Clear user state immediately
        router.push('/login');
        router.refresh();
      } catch (error) {
        console.error("Firebase logout error:", error);
        setUser(null); // Still clear local state
        setIsLoading(false);
      }
    }, [router]);

    const isAuthenticated = !!user && !isLoading; // Ensure not loading

    return (
      <AuthContext.Provider value={{ isAuthenticated, user, isLoading, login, register, logout, fetchAppUser }}>
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
  
  