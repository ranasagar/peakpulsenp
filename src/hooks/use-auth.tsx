
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
    mergedRoles = [...new Set(mergedRoles)]; 
  }
  if (firebaseUser.email === 'sagarbikramrana7@gmail.com' && !mergedRoles.includes('admin')) { // Added second admin email
    mergedRoles.push('admin');
    mergedRoles = [...new Set(mergedRoles)];
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
    const fetchUrl = `/api/account/profile?uid=${firebaseUser.uid}`;
    console.log(`[AuthContext] API Call URL: ${fetchUrl}`);

    try {
      profileResponse = await fetch(fetchUrl);
      console.log(`[AuthContext] Profile API response status for ${firebaseUser.uid}: ${profileResponse.status}`);

      if (!profileResponse.ok) {
        let errorDetail = `[AuthContext] Error fetching Supabase profile for ${firebaseUser.uid}. Status: ${profileResponse.status}`;
        let apiMessage = 'Profile fetch failed.';
        let rawSupaErrorObject = null;

        try {
          const errorData = await profileResponse.json(); // Assume it's JSON first
          apiMessage = errorData.message || apiMessage;
          if (errorData.rawSupabaseError) {
            rawSupaErrorObject = errorData.rawSupabaseError;
            apiMessage += ` Supabase Error: ${errorData.rawSupabaseError.message || 'Unknown Supabase error'}.`;
            if (errorData.rawSupabaseError.details) apiMessage += ` Details: ${errorData.rawSupabaseError.details}.`;
            if (errorData.rawSupabaseError.hint) apiMessage += ` Hint: ${errorData.rawSupabaseError.hint}.`;
            if (errorData.rawSupabaseError.code) apiMessage += ` Code: ${errorData.rawSupabaseError.code}.`;
          }
        } catch (e) { // If .json() fails, it means the server response was not valid JSON
          try {
            const responseBodyText = await profileResponse.text(); // Try to get raw text
            apiMessage += ` (Could not parse error as JSON. Raw Response: ${responseBodyText.substring(0,200) || 'N/A'}).`;
          } catch (textErr) {
            apiMessage += ` (Could not parse error as JSON and response body not readable).`;
          }
        }
        
        if (profileResponse.status === 404) {
            console.log(`${errorDetail}. API Message: ${apiMessage} (This is expected for a new user, attempting to create profile.)`);
        } else {
            console.error(`${errorDetail}. API Message: ${apiMessage}`, rawSupaErrorObject || '(No raw Supabase error details in response)');
        }
        
        if (profileResponse.status === 404) {
          console.log(`[AuthContext] No Supabase profile for ${firebaseUser.uid}. Attempting to create initial profile.`);
          const initialRoles = (firebaseUser.email === 'sagarrana@gmail.com' || firebaseUser.email === 'sagarbikramrana7@gmail.com') ? ['admin', 'customer'] : ['customer'];
          
          const initialProfileData = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'New User',
            avatarUrl: firebaseUser.photoURL || null,
            roles: initialRoles,
            wishlist: [] as string[]
          };
          console.log("[AuthContext] Initial profile data to POST:", JSON.stringify(initialProfileData, null, 2));

          try {
            const createResponse = await fetch('/api/account/profile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(initialProfileData),
            });
            console.log(`[AuthContext] Profile creation API response status for ${firebaseUser.uid}: ${createResponse.status}`);

            if (createResponse.ok) {
              const newSupaProfileResponse = await createResponse.json();
              console.log(`[AuthContext] Successfully created initial Supabase profile for ${firebaseUser.uid}:`, newSupaProfileResponse.user);
              return mapFirebaseUserToAppUser(firebaseUser, newSupaProfileResponse.user);
            } else {
               let createErrorMsg = `Failed to create profile, status ${createResponse.status}`;
               let createErrorDetails = {};
               try {
                   const errorData = await createResponse.json();
                   createErrorMsg = errorData.message || createErrorMsg; // Main message from API
                   createErrorDetails = errorData.rawSupabaseError || errorData; // Store the Supabase error or the whole data
                   if (errorData.rawSupabaseError && errorData.rawSupabaseError.message) {
                     createErrorMsg += ` Supabase Error: ${errorData.rawSupabaseError.message}`;
                     if(errorData.rawSupabaseError.hint) createErrorMsg += ` Hint: ${errorData.rawSupabaseError.hint}`;
                   }
               } catch(e) {/* ignore if createResponse body is not json */}
               console.error(`[AuthContext] Failed to create initial Supabase profile for ${firebaseUser.uid}. Status: ${createResponse.status}. API Message: ${createErrorMsg}`, createErrorDetails);
            }
          } catch (createError: any) {
            console.error(`[AuthContext] Network error creating initial Supabase profile for ${firebaseUser.uid}:`, createError.message, createError);
          }
        }
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
            const rolesChanged = JSON.stringify(currentAppUser?.roles) !== JSON.stringify(appUser?.roles);
            const wishlistChanged = JSON.stringify(currentAppUser?.wishlist) !== JSON.stringify(appUser?.wishlist);

            if (currentAppUser?.id !== appUser?.id ||
                currentAppUser?.name !== appUser?.name ||
                currentAppUser?.email !== appUser?.email ||
                currentAppUser?.avatarUrl !== appUser?.avatarUrl ||
                rolesChanged || wishlistChanged) {
                console.log("[AuthContext] App user state updated in context:", appUser);
                return appUser;
            }
            console.log("[AuthContext] App user state unchanged, no update to context needed for user:", appUser?.id);
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
      setUser(null); 
      router.refresh(); 
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

    