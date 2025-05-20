
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
        console.log(`User ${firebaseUser.uid} not found in Firestore. Creating new document.`);
        const newAppUser: AuthUserType = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          avatarUrl: firebaseUser.photoURL || undefined,
          roles: ['customer'],
          wishlist: [],
        };
        await setDoc(userDocRef, {
          // id: newAppUser.id, // Not needed, doc ID is the UID
          email: newAppUser.email,
          name: newAppUser.name,
          avatarUrl: newAppUser.avatarUrl || null, // Ensure null if undefined for Firestore
          roles: newAppUser.roles,
          wishlist: newAppUser.wishlist,
          createdAt: new Date().toISOString(), 
          updatedAt: new Date().toISOString(),
        });
        console.log(`New user document created in Firestore for ${firebaseUser.uid}`);
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
        setIsLoading(true); // Set loading true while fetching app user
        console.log("Firebase auth state changed, user:", firebaseUser.uid);
        const appUser = await fetchAppUser(firebaseUser);
        setUser(appUser);
        console.log("App user set in context:", appUser);
        setIsLoading(false);
      } else {
        console.log("Firebase auth state changed, no user.");
        setUser(null);
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, [fetchAppUser]);

  const login = useCallback(async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      // Auth state change will be handled by onAuthStateChanged, which calls fetchAppUser
      const redirectPath = searchParams.get('redirect') || '/account/dashboard';
      router.push(redirectPath);
      router.refresh(); 
      return { success: true };
    } catch (error: any) {
      console.error("Firebase login error:", error);
      setIsLoading(false);
      return { success: false, error: error.message || "Login failed. Please check your credentials." };
    }
  }, [router, searchParams]); // fetchAppUser is not directly called here, but onAuthStateChanged handles it

  const register = useCallback(async (name: string, email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName: name });
        // Fetch/create user in Firestore. onAuthStateChanged will also trigger this, but doing it here ensures
        // the user document might be ready sooner or displayName is reflected if Firestore doc is created here.
        await fetchAppUser(userCredential.user); // This will create the Firestore doc if it doesn't exist
      }
      // onAuthStateChanged will handle setting the user state and final isLoading=false
      router.push('/account/dashboard');
      router.refresh();
      return { success: true };
    } catch (error: any) { // Corrected: Added opening curly brace
        setIsLoading(false);
        return { success: false, error: error.message || "Registration failed. Please try again." };
      }
    }, [router, fetchAppUser]);

    const logout = useCallback(async () => {
      setIsLoading(true);
      try {
        await firebaseSignOut(auth);
        // setUser(null) will be handled by onAuthStateChanged
        router.push('/login');
        router.refresh();
      } catch (error) {
        console.error("Firebase logout error:", error);
        // setUser(null); // Ensure user is cleared even if signout fails for some reason
        setIsLoading(false); // Explicitly set loading to false on error here
      }
    }, [router]);

    const isAuthenticated = !!user && !isLoading; 

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

    