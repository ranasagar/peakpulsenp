
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

  let displayName = 'New User';
  if (supaProfile?.name && supaProfile.name.trim() !== '') {
    displayName = supaProfile.name;
  } else if (firebaseUser.displayName && firebaseUser.displayName.trim() !== '') {
    displayName = firebaseUser.displayName;
  } else if (firebaseUser.email && firebaseUser.email.trim() !== '') {
    displayName = firebaseUser.email.split('@')[0];
  }

  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    name: displayName,
    avatarUrl: supaProfile?.avatarUrl || firebaseUser.photoURL || undefined,
    bio: supaProfile?.bio || '',
    roles: mergedRoles,
    wishlist: (supaProfile?.wishlist && Array.isArray(supaProfile.wishlist)) ? supaProfile.wishlist : [],
    bookmarked_post_ids: (supaProfile?.bookmarked_post_ids && Array.isArray(supaProfile.bookmarked_post_ids)) ? supaProfile.bookmarked_post_ids : [],
    createdAt: supaProfile?.createdAt || undefined,
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
      return null;
    }

    let profileResponse;
    const fetchUrl = `/api/account/profile?uid=${firebaseUser.uid}`;

    try {
      profileResponse = await fetch(fetchUrl);

      if (!profileResponse.ok) {
        let errorDetail = `Error fetching Supabase profile for ${firebaseUser.uid}. Status: ${profileResponse.status}`;
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
          const initialRoles = (firebaseUser.email === 'sagarrana@gmail.com' || firebaseUser.email === 'sagarbikramrana7@gmail.com')
            ? ['admin', 'customer']
            : ['customer'];

          const initialProfileData = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'New User',
            avatarUrl: firebaseUser.photoURL || null,
            bio: '',
            roles: initialRoles,
            wishlist: [] as string[],
            bookmarked_post_ids: [] as string[],
          };

          try {
            const createResponse = await fetch('/api/account/profile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(initialProfileData),
            });

            if (createResponse.ok) {
              const newSupaProfileResponse = await createResponse.json();
              if (newSupaProfileResponse.user) {
                return mapFirebaseUserToAppUser(firebaseUser, newSupaProfileResponse.user);
              }
            }
            // If creation fails or doesn't return user, fall through to map with just Firebase data
          } catch (createError: any) {
            console.error(`[AuthContext] Network error creating initial Supabase profile for ${firebaseUser.uid}:`, createError.message);
          }
          return mapFirebaseUserToAppUser(firebaseUser); // Fallback if creation fails
        } else {
          console.error(errorDetail, rawSupaErrorObject);
          return mapFirebaseUserToAppUser(firebaseUser); // Fallback on other fetch errors
        }
      }

      const supaProfile = await profileResponse.json();

      // Proactive name sync: If Supabase name is missing but Firebase displayName exists, update Supabase profile.
      if (firebaseUser.displayName && firebaseUser.displayName.trim() !== '' && (!supaProfile.name || supaProfile.name.trim() === '')) {
        console.log(`[AuthContext] Supabase profile for ${firebaseUser.uid} missing name. Firebase displayName available. Attempting sync.`);
        const profileUpdatePayload = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName,
          email: firebaseUser.email || supaProfile.email || '', // Include email for safety, API might need it.
        };
        // Fire-and-forget update. No need to await or block UI.
        fetch('/api/account/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profileUpdatePayload),
        }).then(res => {
          if (res.ok) {
            console.log(`[AuthContext] Proactive name sync for ${firebaseUser.uid} successful.`);
            // Optionally, could trigger another refreshUserProfile here, but mapFirebaseUserToAppUser will already use firebaseUser.displayName
          } else {
            console.warn(`[AuthContext] Proactive name sync for ${firebaseUser.uid} failed. Status: ${res.status}`);
          }
        }).catch(err => console.error(`[AuthContext] Error during proactive name sync for ${firebaseUser.uid}:`, err));
        // Use Firebase displayName immediately for the current session, DB will catch up.
        return mapFirebaseUserToAppUser(firebaseUser, { ...supaProfile, name: firebaseUser.displayName });
      }

      return mapFirebaseUserToAppUser(firebaseUser, supaProfile);

    } catch (error: any) {
      console.error(`[AuthContext] Network or other unhandled error in fetchAppUserProfile for ${firebaseUser.uid}:`, error.message);
      return mapFirebaseUserToAppUser(firebaseUser);
    }
  }, []);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);
      if (firebaseUser) {
        const appUser = await fetchAppUserProfile(firebaseUser);
        setUser(currentAppUser => {
            if (!appUser && !currentAppUser) return null;
            if (!appUser && currentAppUser) return currentAppUser;
            if (appUser && !currentAppUser) return appUser;
            if (!appUser) return null;

            const rolesChanged = JSON.stringify(currentAppUser?.roles?.sort()) !== JSON.stringify(appUser.roles?.sort());
            const wishlistChanged = JSON.stringify(currentAppUser?.wishlist?.sort()) !== JSON.stringify(appUser.wishlist?.sort());
            const bookmarksChanged = JSON.stringify(currentAppUser?.bookmarked_post_ids?.sort()) !== JSON.stringify(appUser.bookmarked_post_ids?.sort());
            const bioChanged = currentAppUser?.bio !== appUser.bio;


            if (currentAppUser?.id !== appUser.id ||
                currentAppUser?.name !== appUser.name ||
                currentAppUser?.email !== appUser.email ||
                currentAppUser?.avatarUrl !== appUser.avatarUrl ||
                bioChanged ||
                rolesChanged || wishlistChanged || bookmarksChanged ) {
                return appUser;
            }
            return currentAppUser;
        });
      } else {
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
      setIsLoading(true);
      const appUser = await fetchAppUserProfile(currentFirebaseUser);
      setUser(appUser);
      setIsLoading(false);
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
