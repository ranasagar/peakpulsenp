
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { User as AuthUserType } from '@/types';
import { auth, db } from '@/firebase/config';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
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
    roles: ['customer'],
    wishlist: [],
  };
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const fetchAppUser = useCallback(async (firebaseUser: FirebaseUser): Promise<AuthUserType | null> => {
    if (!firebaseUser) return null;
    try {
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const dbUser = userDocSnap.data() as AuthUserType;
        // Combine Firebase Auth data (source of truth for email/name/avatar if recently updated there)
        // with Firestore data (source of truth for roles/wishlist/etc.)
        return {
          id: firebaseUser.uid,
          email: firebaseUser.email || dbUser.email || '', // Prioritize Firebase, then DB, then empty
          name: firebaseUser.displayName || dbUser.name || firebaseUser.email?.split('@')[0] || 'User', // Similar priority
          avatarUrl: firebaseUser.photoURL || dbUser.avatarUrl || undefined,
          roles: dbUser.roles && dbUser.roles.length > 0 ? dbUser.roles : ['customer'],
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
          // id is not needed in the doc data itself as it's the doc ID
          email: newAppUser.email,
          name: newAppUser.name,
          avatarUrl: newAppUser.avatarUrl || null, // Ensure null if undefined for Firestore
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
      // Fallback to a user object derived purely from Firebase Auth if DB interaction fails
      return mapFirebaseUserToInitialAppUser(firebaseUser);
    }
  }, []);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);
      if (firebaseUser) {
        console.log("Firebase auth state changed, user found:", firebaseUser.uid);
        const newAppUser = await fetchAppUser(firebaseUser);
        
        setUser(currentUser => {
          // Only update if newAppUser is meaningfully different from currentUser
          // This helps prevent unnecessary re-renders for consumers of useAuth
          if (JSON.stringify(currentUser) !== JSON.stringify(newAppUser)) {
            console.log("App user state updated in context:", newAppUser);
            return newAppUser;
          }
          console.log("App user state unchanged in context:", currentUser);
          return currentUser;
        });

      } else {
        console.log("Firebase auth state changed, no user.");
        setUser(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [fetchAppUser]);

  const login = useCallback(async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    // Local loading state should be handled by the LoginPage component
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      // onAuthStateChanged will handle setting global user state and isLoading.
      // LoginPage will handle redirect based on isAuthenticated.
      return { success: true };
    } catch (error: any) {
      console.error("Firebase login error:", error);
      return { success: false, error: error.message || "Login failed. Please check your credentials." };
    }
  }, []);

  const register = useCallback(async (name: string, email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    // Local loading state should be handled by the RegisterPage component
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName: name });
        // fetchAppUser will be called by onAuthStateChanged, ensuring Firestore doc is created/synced.
      }
      // onAuthStateChanged will handle setting global user state and isLoading.
      // RegisterPage will handle redirect.
      return { success: true };
    } catch (error: any) {
      console.error("Firebase registration error:", error);
      return { success: false, error: error.message || "Registration failed. Please try again." };
    }
  }, []); // Removed fetchAppUser from here as onAuthStateChanged handles it

    const logout = useCallback(async () => {
      try {
        await firebaseSignOut(auth);
        // setUser(null) and isLoading will be handled by onAuthStateChanged.
        // Redirect logic:
        const publicRoutes = ['/', '/products', '/our-story', '/contact', '/faq', '/shipping-returns', '/privacy-policy', '/terms-of-service', '/accessibility'];
        const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');

        if (!publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/')) && !isAuthPage) {
             // If on a protected page (e.g., /account/*, /admin/*) or other non-public, non-auth page
            router.push('/login');
        } else {
            // If on a public page or auth page, might refresh or push to home.
            // Refreshing current page is often fine for public pages.
            router.refresh();
        }
        // Consider a general toast or notification for logout.
      } catch (error) {
        console.error("Firebase logout error:", error);
        // Potentially show an error toast to the user.
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
