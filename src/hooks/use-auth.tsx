
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // Added usePathname
import type { User as AuthUserType } from '@/types';
import { auth, db } from '@/firebase/config'; // db is not directly used here now
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
  supaProfile?: Partial<AuthUserType> // Supabase profile can be partial or undefined
): AuthUserType => {
  const defaultRoles = ['customer'];
  let mergedRoles = defaultRoles;

  if (supaProfile?.roles && Array.isArray(supaProfile.roles) && supaProfile.roles.length > 0) {
    mergedRoles = [...new Set([...supaProfile.roles, ...defaultRoles])];
  }
  
  if (firebaseUser.email === 'sagarrana@gmail.com' || firebaseUser.email === 'sagarbikramrana7@gmail.com') {
    if (!mergedRoles.includes('admin')) {
        mergedRoles.push('admin');
    }
  }
  if (!mergedRoles.includes('customer')) {
    mergedRoles.push('customer');
  }
  mergedRoles = [...new Set(mergedRoles)];

  // Prioritize Supabase profile name, then Firebase display name, then email prefix
  let displayName = 'New User';
  if (supaProfile?.name && supaProfile.name.trim() !== '') {
    displayName = supaProfile.name;
  } else if (firebaseUser.displayName && firebaseUser.displayName.trim() !== '') {
    displayName = firebaseUser.displayName;
  } else if (firebaseUser.email) {
    displayName = firebaseUser.email.split('@')[0];
  }


  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    name: displayName,
    avatarUrl: supaProfile?.avatarUrl || firebaseUser.photoURL || undefined,
    roles: mergedRoles,
    wishlist: (supaProfile?.wishlist && Array.isArray(supaProfile.wishlist)) ? supaProfile.wishlist : [],
    bookmarked_post_ids: (supaProfile?.bookmarked_post_ids && Array.isArray(supaProfile.bookmarked_post_ids)) ? supaProfile.bookmarked_post_ids : [],
    createdAt: supaProfile?.createdAt || undefined, // Assuming supaProfile might have these
    updatedAt: supaProfile?.updatedAt || undefined,
  };
};


export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchAppUserProfile = useCallback(async (firebaseUser: FirebaseUser | null): Promise<AuthUserType | null> => {
    if (!firebaseUser?.uid) {
      console.warn("[AuthContext] fetchAppUserProfile called with null or invalid firebaseUser.");
      return null;
    }
    console.log(`[AuthContext] Fetching Supabase profile for Firebase UID: ${firebaseUser.uid}`);
    
    let profileResponse;
    const fetchUrl = `/api/account/profile?uid=${firebaseUser.uid}`;
    // console.log(`[AuthContext] API Call URL: ${fetchUrl}`);

    try {
      profileResponse = await fetch(fetchUrl);
      // console.log(`[AuthContext] Profile API response status for ${firebaseUser.uid}: ${profileResponse.status}`);

      if (!profileResponse.ok) {
        let errorDetail = `[AuthContext] Error fetching Supabase profile for ${firebaseUser.uid}. Status: ${profileResponse.status}`;
        let apiMessage = 'Profile fetch failed.';
        let rawSupaErrorObject = {};

        try {
          const errorData = await profileResponse.json();
          apiMessage = errorData.message || apiMessage;
          if (errorData.rawSupabaseError) {
            rawSupaErrorObject = errorData.rawSupabaseError;
            const supaMsg = errorData.rawSupabaseError.message || 'Unknown Supabase error';
            apiMessage += ` Supabase Error: ${supaMsg}`;
          }
        } catch (e) { /* ignore */ }
        
        errorDetail += ` . API Message: ${apiMessage}`;
        
        if (profileResponse.status === 404) {
          console.log(errorDetail + " (This is expected for a new user, attempting to create profile.)");
          console.log(`[AuthContext] No Supabase profile for ${firebaseUser.uid}. Attempting to create initial profile.`);
          
          const initialRoles = (firebaseUser.email === 'sagarrana@gmail.com' || firebaseUser.email === 'sagarbikramrana7@gmail.com')
            ? ['admin', 'customer']
            : ['customer'];
          
          const initialProfileData = {
            id: firebaseUser.uid, 
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'New User',
            avatarUrl: firebaseUser.photoURL || null, 
            roles: initialRoles,
            wishlist: [] as string[],
            bio: '', // Add default bio
            bookmarked_post_ids: [] as string[], // Add default bookmarks
          };
          // console.log("[AuthContext] Initial profile data to POST:", JSON.stringify(initialProfileData, null, 2));

          try {
            const createResponse = await fetch('/api/account/profile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(initialProfileData),
            });
            // console.log(`[AuthContext] Profile creation API response status for ${firebaseUser.uid}: ${createResponse.status}`);

            if (createResponse.ok) {
              const newSupaProfileResponse = await createResponse.json();
              if (newSupaProfileResponse.user) {
                console.log(`[AuthContext] Successfully created initial Supabase profile for ${firebaseUser.uid}.`);
                return mapFirebaseUserToAppUser(firebaseUser, newSupaProfileResponse.user);
              } else {
                console.error(`[AuthContext] Profile creation API call succeeded but response did not contain user object for ${firebaseUser.uid}.`);
                return mapFirebaseUserToAppUser(firebaseUser); 
              }
            } else {
               let createErrorMsg = `Failed to create profile, status ${createResponse.status}`;
               try {
                   const errorData = await createResponse.json();
                   createErrorMsg = errorData.message || createErrorMsg;
                   if (errorData.rawSupabaseError && errorData.rawSupabaseError.message) {
                     createErrorMsg += `. Supabase Error: ${errorData.rawSupabaseError.message}`;
                   }
               } catch(e) {/* ignore */}
               console.error(`[AuthContext] Failed to create initial Supabase profile for ${firebaseUser.uid}. API Message: ${createErrorMsg}`);
               return mapFirebaseUserToAppUser(firebaseUser); 
            }
          } catch (createError: any) {
            console.error(`[AuthContext] Network error creating initial Supabase profile for ${firebaseUser.uid}:`, createError.message);
            return mapFirebaseUserToAppUser(firebaseUser); 
          }
        } else {
          console.error(errorDetail, rawSupaErrorObject);
          return mapFirebaseUserToAppUser(firebaseUser); 
        }
      }

      const supaProfile = await profileResponse.json();
      // console.log(`[AuthContext] Supabase profile found for ${firebaseUser.uid}. Merging with Firebase Auth data.`);
      return mapFirebaseUserToAppUser(firebaseUser, supaProfile);

    } catch (error: any) { 
      console.error(`[AuthContext] Network or other unhandled error in fetchAppUserProfile for ${firebaseUser.uid}:`, error.message);
      return mapFirebaseUserToAppUser(firebaseUser); 
    }
  }, []);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // console.log(`[AuthContext] Firebase auth state changed, user found: ${firebaseUser?.uid}`);
      setIsLoading(true);
      if (firebaseUser) {
        const appUser = await fetchAppUserProfile(firebaseUser);
        setUser(currentAppUser => {
            if (!appUser) return currentAppUser; 

            const rolesChanged = JSON.stringify(currentAppUser?.roles?.sort()) !== JSON.stringify(appUser?.roles?.sort());
            const wishlistChanged = JSON.stringify(currentAppUser?.wishlist?.sort()) !== JSON.stringify(appUser?.wishlist?.sort());
            const bookmarksChanged = JSON.stringify(currentAppUser?.bookmarked_post_ids?.sort()) !== JSON.stringify(appUser?.bookmarked_post_ids?.sort());


            if (currentAppUser?.id !== appUser.id ||
                currentAppUser?.name !== appUser.name ||
                currentAppUser?.email !== appUser.email ||
                currentAppUser?.avatarUrl !== appUser.avatarUrl || 
                currentAppUser?.bio !== appUser.bio ||
                rolesChanged || wishlistChanged || bookmarksChanged ) {
                // console.log("[AuthContext] App user state updated in context:", appUser);
                return appUser;
            }
            // console.log("[AuthContext] App user state unchanged, no update to context needed for user:", appUser.id);
            return currentAppUser;
        });
      } else {
        // console.log("[AuthContext] Firebase auth state changed, no user.");
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
      if (pathname?.startsWith('/account') || pathname?.startsWith('/admin')) {
         router.push('/'); 
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
      // console.log("[AuthContext] Refreshing user profile via refreshUserProfile()...");
      setIsLoading(true);
      const appUser = await fetchAppUserProfile(currentFirebaseUser);
      setUser(appUser); // This will trigger re-render if appUser is different
      setIsLoading(false);
      // console.log("[AuthContext] User profile refreshed via refreshUserProfile(). New state:", appUser);
    } else {
      // console.log("[AuthContext] refreshUserProfile called but no Firebase user found.");
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
