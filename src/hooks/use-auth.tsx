
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User as AuthUserType } from '@/types';
import { auth, db } from '@/firebase/config';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile as updateFirebaseProfile, // Renamed to avoid conflict
  type User as FirebaseUser,
} from 'firebase/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUserType | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUserProfile: () => Promise<void>; // Added to manually refresh user profile
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapFirebaseUserToAppUser = (
  firebaseUser: FirebaseUser,
  supaProfile?: Partial<AuthUserType>
): AuthUserType => {
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    name: supaProfile?.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
    avatarUrl: supaProfile?.avatarUrl || firebaseUser.photoURL || undefined,
    roles: supaProfile?.roles || ['customer'],
    wishlist: supaProfile?.wishlist || [],
  };
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchAppUserProfile = useCallback(async (firebaseUser: FirebaseUser | null): Promise<AuthUserType | null> => {
    if (!firebaseUser) {
      return null;
    }
    try {
      console.log(`[AuthContext] Fetching Supabase profile for Firebase UID: ${firebaseUser.uid}`);
      const profileResponse = await fetch(`/api/account/profile?uid=${firebaseUser.uid}`);
      
      if (profileResponse.ok) {
        const supaProfile = await profileResponse.json();
        console.log(`[AuthContext] Supabase profile found for ${firebaseUser.uid}:`, supaProfile);
        return mapFirebaseUserToAppUser(firebaseUser, supaProfile);
      } else if (profileResponse.status === 404) {
        console.log(`[AuthContext] No Supabase profile found for ${firebaseUser.uid}. Attempting to create one.`);
        // Profile doesn't exist, try to create a basic one
        const initialProfileData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
          avatarUrl: firebaseUser.photoURL || null,
          roles: ['customer'],
          wishlist: []
        };
        try {
          const createResponse = await fetch('/api/account/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(initialProfileData),
          });
          if (createResponse.ok) {
            const newSupaProfile = await createResponse.json();
            console.log(`[AuthContext] Successfully created initial Supabase profile for ${firebaseUser.uid}:`, newSupaProfile.user);
            return mapFirebaseUserToAppUser(firebaseUser, newSupaProfile.user);
          } else {
             console.error(`[AuthContext] Failed to create initial Supabase profile for ${firebaseUser.uid}. Status: ${createResponse.status}`);
          }
        } catch (createError) {
          console.error(`[AuthContext] Error creating initial Supabase profile for ${firebaseUser.uid}:`, createError);
        }
        // Fallback if creation fails or not found
        return mapFirebaseUserToAppUser(firebaseUser);
      } else {
        console.error(`[AuthContext] Error fetching Supabase profile for ${firebaseUser.uid}. Status: ${profileResponse.status}`);
        return mapFirebaseUserToAppUser(firebaseUser); // Fallback to Firebase data only
      }
    } catch (error) {
      console.error(`[AuthContext] Network error fetching/creating Supabase profile for ${firebaseUser.uid}:`, error);
      return mapFirebaseUserToAppUser(firebaseUser); // Fallback
    }
  }, []);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);
      if (firebaseUser) {
        console.log("[AuthContext] Firebase auth state changed, user found:", firebaseUser.uid);
        const appUser = await fetchAppUserProfile(firebaseUser);
        setUser(currentAppUser => {
            if (JSON.stringify(currentAppUser) !== JSON.stringify(appUser)) {
                console.log("[AuthContext] App user state updated in context:", appUser);
                return appUser;
            }
            return currentAppUser;
        });
      } else {
        console.log("[AuthContext] Firebase auth state changed, no user.");
        setUser(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [fetchAppUserProfile]);

  const login = useCallback(async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      // onAuthStateChanged will handle setting user and isLoading
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
        await updateFirebaseProfile(userCredential.user, { displayName: name });
        // The onAuthStateChanged listener will call fetchAppUserProfile which will create the Supabase profile if needed.
      }
      return { success: true };
    } catch (error: any) {
      console.error("Firebase registration error:", error);
      return { success: false, error: error.message || "Registration failed. Please try again." };
    }
  }, []); // Removed fetchAppUserProfile from here, onAuthStateChanged handles it

  const logout = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null); // Clear user immediately
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

  const refreshUserProfile = useCallback(async () => {
    const currentFirebaseUser = auth.currentUser;
    if (currentFirebaseUser) {
      setIsLoading(true);
      console.log("[AuthContext] Refreshing user profile...");
      const appUser = await fetchAppUserProfile(currentFirebaseUser);
      setUser(appUser);
      setIsLoading(false);
      console.log("[AuthContext] User profile refreshed.");
    }
  }, [fetchAppUserProfile]);

  const isAuthenticated = !!user && !isLoading;

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, isLoading, login, register, logout, refreshUserProfile }}>
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
