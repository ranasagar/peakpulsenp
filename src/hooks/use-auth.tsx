
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User as AuthUserType } from '@/types';
import { auth } from '@/firebase/config'; // db removed as it's not used directly here
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
  let mergedRoles = defaultRoles;

  if (supaProfile?.roles && supaProfile.roles.length > 0) {
    mergedRoles = [...new Set([...supaProfile.roles, ...defaultRoles])];
  }
  
  // Specific admin role assignment
  if (firebaseUser.email === 'sagarrana@gmail.com' && !mergedRoles.includes('admin')) {
    mergedRoles.push('admin');
    mergedRoles = [...new Set(mergedRoles)]; // Ensure uniqueness again
  }
  if (!mergedRoles.includes('customer')) {
    mergedRoles.push('customer');
    mergedRoles = [...new Set(mergedRoles)];
  }

  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    name: supaProfile?.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
    avatarUrl: supaProfile?.avatarUrl || firebaseUser.photoURL || undefined,
    roles: mergedRoles,
    wishlist: supaProfile?.wishlist && Array.isArray(supaProfile.wishlist) ? supaProfile.wishlist : [],
  };
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchAppUserProfile = useCallback(async (firebaseUser: FirebaseUser | null): Promise<AuthUserType | null> => {
    if (!firebaseUser?.uid) {
      console.warn("[AuthContext] fetchAppUserProfile called with null or invalid firebaseUser.");
      return null;
    }
    console.log(`[AuthContext] Fetching Supabase profile for Firebase UID: ${firebaseUser.uid}`);
    
    let profileResponse;
    try {
      console.log(`[AuthContext] API Call URL: /api/account/profile?uid=${firebaseUser.uid}`);
      profileResponse = await fetch(`/api/account/profile?uid=${firebaseUser.uid}`);
      console.log(`[AuthContext] Profile API response status for ${firebaseUser.uid}: ${profileResponse.status}`);

      if (!profileResponse.ok) {
        let errorDetail = `[AuthContext] Error fetching Supabase profile for ${firebaseUser.uid}. Status: ${profileResponse.status}`;
        let responseBodyText = '';
        try {
          responseBodyText = await profileResponse.text(); // Get raw text first
          const errorData = JSON.parse(responseBodyText); // Then try to parse
          
          if (errorData.rawSupabaseError) {
            errorDetail += ` . Supabase Error: ${errorData.rawSupabaseError.message || ''}. Details: ${errorData.rawSupabaseError.details || ''}. Hint: ${errorData.rawSupabaseError.hint || ''}. Code: ${errorData.rawSupabaseError.code || ''}.`;
          } else if (errorData.message) {
            errorDetail += ` . API Message: ${errorData.message}`;
          } else {
             errorDetail += ` . Raw Response: ${responseBodyText.substring(0, 500)}`;
          }
        } catch (e) {
          errorDetail += ` (Could not fully parse error response body. Raw text might be: ${responseBodyText.substring(0,200) || 'N/A'}).`;
        }
        
        if (profileResponse.status === 404) {
          console.log(errorDetail + " (This is expected for a new user, attempting to create profile.)");
        } else {
          console.error(errorDetail);
        }
        
        if (profileResponse.status === 404) {
          console.log(`[AuthContext] No Supabase profile for ${firebaseUser.uid}. Attempting to create initial profile.`);
          const initialRoles = firebaseUser.email === 'sagarrana@gmail.com' ? ['admin', 'customer'] : ['customer'];
          
          const initialProfileData = {
            id: firebaseUser.uid, // Ensure this is 'id'
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'New User',
            avatarUrl: firebaseUser.photoURL || null,
            roles: initialRoles,
            wishlist: [] as string[] // Explicitly typed empty array
          };
          console.log("[AuthContext] Initial profile data to POST:", JSON.stringify(initialProfileData, null, 2)); // Log the exact data being sent

          try {
            const createResponse = await fetch('/api/account/profile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(initialProfileData),
            });
            if (createResponse.ok) {
              const newSupaProfileResponse = await createResponse.json();
              console.log(`[AuthContext] Successfully created initial Supabase profile for ${firebaseUser.uid}:`, newSupaProfileResponse.user);
              return mapFirebaseUserToAppUser(firebaseUser, newSupaProfileResponse.user);
            } else {
               const createErrorData = await createResponse.json().catch(() => ({ message: `Failed to create profile, status ${createResponse.status}`}));
               console.error(`[AuthContext] Failed to create initial Supabase profile for ${firebaseUser.uid}. Status: ${createResponse.status}. API Message: ${createErrorData.message}`, createErrorData);
            }
          } catch (createError: any) {
            console.error(`[AuthContext] Network error creating initial Supabase profile for ${firebaseUser.uid}:`, createError.message);
          }
        }
        // If fetch failed (not 404) or creation failed, fallback to Firebase data
        return mapFirebaseUserToAppUser(firebaseUser); 
      }

      const supaProfile = await profileResponse.json();
      console.log(`[AuthContext] Supabase profile found for ${firebaseUser.uid}. Merging with Firebase Auth data.`);
      return mapFirebaseUserToAppUser(firebaseUser, supaProfile);

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
      // onAuthStateChanged will handle setting the user, loading state, and subsequent redirects from login/register pages
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
        // onAuthStateChanged will call fetchAppUserProfile, which will handle Firestore doc creation.
      }
      return { success: true };
    } catch (error: any) {
        console.error("Firebase registration error:", error);
        return { success: false, error: error.message || "Registration failed. Please try again." };
      }
    }, []); // Removed router and fetchAppUserProfile from dependencies as they are stable or handled by onAuthStateChanged

  const logout = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null); // Explicitly set user to null
      router.refresh(); 
      // No direct router.push here; let pages handle redirects if they are protected and user is logged out.
    } catch (error) {
      console.error("Firebase logout error:", error);
    }
  }, [router]);

  const refreshUserProfile = useCallback(async () => {
    const currentFirebaseUser = auth.currentUser;
    if (currentFirebaseUser) {
      setIsLoading(true);
      console.log("[AuthContext] Refreshing user profile via refreshUserProfile()...");
      const appUser = await fetchAppUserProfile(currentFirebaseUser);
      setUser(appUser);
      setIsLoading(false);
      console.log("[AuthContext] User profile refreshed via refreshUserProfile().");
    } else {
      console.log("[AuthContext] refreshUserProfile called but no Firebase user found.");
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
