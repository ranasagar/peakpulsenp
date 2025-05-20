
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { User as AuthUserType } from '@/types';
import { auth, db } from '@/firebase/config'; // Import db
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'; // Import Firestore functions
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
  const pathname = usePathname(); // Get current pathname

  const fetchAppUser = useCallback(async (firebaseUser: FirebaseUser): Promise<AuthUserType | null> => {
    if (!firebaseUser) return null;
    try {
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const dbUser = userDocSnap.data() as AuthUserType;
        return {
          id: firebaseUser.uid,
          email: firebaseUser.email || dbUser.email,
          name: firebaseUser.displayName || dbUser.name,
          avatarUrl: firebaseUser.photoURL || dbUser.avatarUrl,
          roles: dbUser.roles || ['customer'],
          wishlist: dbUser.wishlist || [],
        };
      } else {
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
          email: newAppUser.email,
          name: newAppUser.name,
          avatarUrl: newAppUser.avatarUrl || null,
          roles: newAppUser.roles,
          wishlist: newAppUser.wishlist,
          createdAt: serverTimestamp(), 
          updatedAt: serverTimestamp(),
        });
        console.log(`New user document created in Firestore for ${firebaseUser.uid}`);
        return newAppUser;
      }
    } catch (error) {
      console.error("Error fetching or creating user document in Firestore:", error);
      return mapFirebaseUserToInitialAppUser(firebaseUser);
    }
  }, []);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true); // Always set loading true when auth state might change
      if (firebaseUser) {
        console.log("Firebase auth state changed, user found:", firebaseUser.uid);
        const appUser = await fetchAppUser(firebaseUser);
        setUser(appUser);
        console.log("App user set in context:", appUser);
      } else {
        console.log("Firebase auth state changed, no user.");
        setUser(null);
      }
      setIsLoading(false); // Set loading false after processing
    });
    return () => unsubscribe();
  }, [fetchAppUser]);

  const login = useCallback(async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    // Global isLoading is handled by onAuthStateChanged
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      // Success! onAuthStateChanged will handle setting user state and isLoading.
      // Redirect will be handled by the LoginPage component based on isAuthenticated.
      return { success: true };
    } catch (error: any) {
      console.error("Firebase login error:", error);
      return { success: false, error: error.message || "Login failed. Please check your credentials." };
    }
  }, []);

  const register = useCallback(async (name: string, email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    // Global isLoading is handled by onAuthStateChanged
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName: name });
        await fetchAppUser(userCredential.user); // This will create the Firestore doc
      }
      // Success! onAuthStateChanged will handle setting user state and isLoading.
      // Redirect will be handled by the RegisterPage component based on isAuthenticated.
      return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || "Registration failed. Please try again." };
      }
    }, [fetchAppUser]);

    const logout = useCallback(async () => {
      // setIsLoading(true); // Optional: can set loading here if preferred for immediate UI feedback
      try {
        await firebaseSignOut(auth);
        // setUser(null) and isLoading will be handled by onAuthStateChanged
        if (pathname.startsWith('/account') || pathname.startsWith('/admin')) {
          router.push('/login'); // Redirect if logging out from a protected area
        } else {
          router.push('/'); // Or to homepage
        }
        router.refresh(); // Refresh to ensure server components reflect logout
      } catch (error) {
        console.error("Firebase logout error:", error);
        // setIsLoading(false); // Ensure loading is false if it was set true at start of logout
      }
    }, [router, pathname]);

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
