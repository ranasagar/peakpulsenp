
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // Removed useSearchParams as it's not used here
import type { User as AuthUserType } from '@/types';
import { auth, db } from '@/firebase/config'; // db import might be unused after this rollback for this hook specifically
// Removed Firestore imports (doc, getDoc, setDoc, serverTimestamp) as profile management will be via API
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
  // fetchAppUser is no longer directly needed here for Supabase sync
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Simplified mapping, user profile details (roles, wishlist) will be fetched separately by components if needed
const mapFirebaseUserToAppUser = (firebaseUser: FirebaseUser | null): AuthUserType | null => {
  if (!firebaseUser) return null;
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
    avatarUrl: firebaseUser.photoURL || undefined,
    roles: ['customer'], // Default role, actual roles would be fetched via API
    wishlist: [],      // Default wishlist, actual wishlist fetched via API
  };
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);
      if (firebaseUser) {
        console.log("Firebase auth state changed, user found:", firebaseUser.uid);
        const appUser = mapFirebaseUserToAppUser(firebaseUser);
        // Basic user object from Firebase Auth. Richer profile data (roles, wishlist)
        // should be fetched by components from their respective API endpoints.
        setUser(currentAppUser => {
            if (JSON.stringify(currentAppUser) !== JSON.stringify(appUser)) {
                console.log("App user state updated in context (from Firebase Auth):", appUser);
                return appUser;
            }
            console.log("App user state unchanged in context (from Firebase Auth):", currentAppUser);
            return currentAppUser;
        });
      } else {
        console.log("Firebase auth state changed, no user.");
        setUser(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []); // Removed fetchAppUser dependency

  const login = useCallback(async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      return { success: true };
    } catch (error: any) {
      console.error("Firebase login error:", error);
      return { success: false, error: error.message || "Login failed. Please check your credentials." };
    }
  }, []);

  const register = useCallback(async (name: string, email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName: name });
        // The onAuthStateChanged listener will pick up the new user.
        // Any additional user document creation in a backend (like saving roles)
        // would typically be handled by an API call from the client after registration
        // or a Firebase Function trigger.
      }
      return { success: true };
    } catch (error: any) {
      console.error("Firebase registration error:", error);
      return { success: false, error: error.message || "Registration failed. Please try again." };
    }
  }, []);

    const logout = useCallback(async () => {
      try {
        await firebaseSignOut(auth);
        const publicRoutes = ['/', '/products', '/our-story', '/contact', '/faq', '/shipping-returns', '/privacy-policy', '/terms-of-service', '/accessibility'];
        const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');

        if (!publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/')) && !isAuthPage) {
            router.push('/login');
        } else {
            router.refresh();
        }
      } catch (error) {
        console.error("Firebase logout error:", error);
      }
    }, [router, pathname]);

    const isAuthenticated = !!user && !isLoading;

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
