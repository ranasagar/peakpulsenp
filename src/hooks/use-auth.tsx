
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User as AuthUserType } from '@/types';
import { auth, db } from '@/firebase/config'; // Assuming db is for Firestore
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile as updateFirebaseProfile,
  type User as FirebaseUser,
} from 'firebase/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUserType | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapFirebaseUserToAppUser = (
  firebaseUser: FirebaseUser,
  supaProfile?: Partial<AuthUserType>
): AuthUserType => {
  const defaultRoles = ['customer'];
  // Special handling for sagarrana@gmail.com to be an admin
  if (firebaseUser.email === 'sagarrana@gmail.com') {
    defaultRoles.push('admin');
  }

  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    name: supaProfile?.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
    avatarUrl: supaProfile?.avatarUrl || firebaseUser.photoURL || undefined,
    roles: supaProfile?.roles && supaProfile.roles.length > 0 ? supaProfile.roles : defaultRoles,
    wishlist: supaProfile?.wishlist || [],
  };
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchAppUserProfile = useCallback(async (firebaseUser: FirebaseUser | null): Promise<AuthUserType | null> => {
    if (!firebaseUser || !firebaseUser.uid) {
      console.warn("[AuthContext] fetchAppUserProfile called with null or invalid firebaseUser.");
      return null;
    }
    console.log(`[AuthContext] Fetching Supabase profile for Firebase UID: ${firebaseUser.uid}`);
    try {
      const profileResponse = await fetch(`/api/account/profile?uid=${firebaseUser.uid}`);
      console.log(`[AuthContext] Profile API response status for ${firebaseUser.uid}: ${profileResponse.status}`);

      if (profileResponse.ok) {
        const supaProfile = await profileResponse.json();
        console.log(`[AuthContext] Supabase profile found for ${firebaseUser.uid}:`, supaProfile);
        return mapFirebaseUserToAppUser(firebaseUser, supaProfile);
      } else {
        // Handle error responses more thoroughly
        let errorDetail = `[AuthContext] Error fetching Supabase profile for ${firebaseUser.uid}. Status: ${profileResponse.status} ${profileResponse.statusText || ''}.`;
        let responseBodyText = '';
        try {
          responseBodyText = await profileResponse.text(); // Get raw text first
          const errorData = JSON.parse(responseBodyText); // Then try to parse as JSON
          if (errorData.rawSupabaseError) {
            errorDetail += ` Supabase Error: ${errorData.rawSupabaseError.message || ''}. Details: ${errorData.rawSupabaseError.details || ''}. Hint: ${errorData.rawSupabaseError.hint || ''}. Code: ${errorData.rawSupabaseError.code || ''}.`;
          } else if (errorData.message) {
            errorDetail += ` API Message: ${errorData.message}.`;
          } else {
            errorDetail += ` Response Body: ${responseBodyText.substring(0, 500)}.`; // Show part of raw body if not structured error
          }
        } catch (e) { // Catch if .text() or JSON.parse() fails
          errorDetail += ` (Could not fully parse error response body. Raw text might be: ${responseBodyText.substring(0,200) || 'N/A'}).`;
        }
        console.error(errorDetail); // This is the log the user is seeing.
        
        // If profile not found (404), attempt to create it
        if (profileResponse.status === 404) {
          console.log(`[AuthContext] No Supabase profile for ${firebaseUser.uid}. Attempting to create initial profile.`);
          const initialRoles = firebaseUser.email === 'sagarrana@gmail.com' ? ['admin', 'customer'] : ['customer'];
          const initialProfileData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
            avatarUrl: firebaseUser.photoURL || null,
            roles: initialRoles,
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
               const createErrorData = await createResponse.json().catch(() => ({ message: `Failed to create profile, status ${createResponse.status}`}));
               console.error(`[AuthContext] Failed to create initial Supabase profile for ${firebaseUser.uid}. API Message: ${createErrorData.message}`);
            }
          } catch (createError: any) {
            console.error(`[AuthContext] Network error creating initial Supabase profile for ${firebaseUser.uid}:`, createError.message);
          }
        }
        return mapFirebaseUserToAppUser(firebaseUser); // Fallback to Firebase data only after logging error
      }
    } catch (error: any) {
      console.error(`[AuthContext] Network or other unhandled error in fetchAppUserProfile for ${firebaseUser.uid}:`, error.message, error.stack);
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
      // onAuthStateChanged will handle setting user and isLoading, and redirect will be handled by page
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
        // onAuthStateChanged will call fetchAppUserProfile which will create the Supabase profile.
      }
      return { success: true };
    } catch (error: any) {
      console.error("Firebase registration error:", error);
      return { success: false, error: error.message || "Registration failed. Please try again." };
    }
  }, []); // Removed fetchAppUserProfile and router from dependencies here as they are not directly used.

  const logout = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      const publicRoutes = ['/', '/products', '/categories', '/our-story', '/contact', '/shipping-returns', '/privacy-policy', '/terms-of-service', '/accessibility', '/careers', '/community/create-post'];
      const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');
      
      let onPublicOrAuthPage = isAuthPage;
      if (!onPublicOrAuthPage) {
        onPublicOrAuthPage = publicRoutes.some(route => {
          if (route.endsWith('/[slug]')) { // crude check for dynamic routes like products/[slug]
            return pathname.startsWith(route.substring(0, route.lastIndexOf('/')));
          }
          return pathname === route || pathname.startsWith(route + '/');
        });
      }

      if (!onPublicOrAuthPage) {
          console.log("[AuthContext] Logging out, redirecting to /login from protected page:", pathname);
          router.push('/login');
      } else {
          console.log("[AuthContext] Logging out from public/auth page, refreshing:", pathname);
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
      console.log("[AuthContext] Refreshing user profile via refreshUserProfile()...");
      const appUser = await fetchAppUserProfile(currentFirebaseUser);
      setUser(appUser);
      setIsLoading(false);
      console.log("[AuthContext] User profile refreshed via refreshUserProfile().");
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

    