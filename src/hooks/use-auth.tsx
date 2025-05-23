
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

  // Merge roles from Supabase profile if they exist and are valid
  if (supaProfile?.roles && Array.isArray(supaProfile.roles) && supaProfile.roles.length > 0) {
    mergedRoles = [...new Set([...supaProfile.roles, ...defaultRoles])];
  }
  
  // Specific admin role assignment based on email
  if (firebaseUser.email === 'sagarrana@gmail.com' || firebaseUser.email === 'sagarbikramrana7@gmail.com') {
    if (!mergedRoles.includes('admin')) {
        mergedRoles.push('admin');
    }
  }
  // Ensure 'customer' role is always present
  if (!mergedRoles.includes('customer')) {
    mergedRoles.push('customer');
  }
  // Remove duplicates just in case
  mergedRoles = [...new Set(mergedRoles)];

  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    name: supaProfile?.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'New User',
    avatarUrl: supaProfile?.avatarUrl || firebaseUser.photoURL || undefined,
    roles: mergedRoles,
    wishlist: (supaProfile?.wishlist && Array.isArray(supaProfile.wishlist)) ? supaProfile.wishlist : [],
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
    console.log(`[AuthContext] API Call URL: ${fetchUrl}`);

    try {
      profileResponse = await fetch(fetchUrl);
      console.log(`[AuthContext] Profile API response status for ${firebaseUser.uid}: ${profileResponse.status}`);

      if (!profileResponse.ok) {
        let errorDetail = `[AuthContext] Error fetching Supabase profile for ${firebaseUser.uid}. Status: ${profileResponse.status}`;
        let apiMessage = 'Profile fetch failed.';
        let rawSupaErrorObject = {}; // Initialize as empty object

        try {
          const errorData = await profileResponse.json();
          apiMessage = errorData.message || apiMessage;
          if (errorData.rawSupabaseError) {
            rawSupaErrorObject = errorData.rawSupabaseError; // Store the whole object
            const supaMsg = errorData.rawSupabaseError.message || 'Unknown Supabase error';
            const supaDetails = errorData.rawSupabaseError.details || '';
            const supaHint = errorData.rawSupabaseError.hint || '';
            const supaCode = errorData.rawSupabaseError.code || '';
            apiMessage += ` Supabase Error: ${supaMsg}${supaDetails ? ' Details: ' + supaDetails : ''}${supaHint ? ' Hint: ' + supaHint : ''}${supaCode ? ' Code: ' + supaCode : ''}`;
          }
        } catch (e) {
          try {
            const responseBodyText = await profileResponse.text();
            apiMessage += ` (Could not fully parse error response body. Raw text might be: ${responseBodyText.substring(0,200) || 'N/A'}).`;
          } catch (textErr) {
            apiMessage += ` (Could not fully parse error response body and response body not readable).`;
          }
        }
        
        errorDetail += ` . API Message: ${apiMessage}`;
        
        if (profileResponse.status === 404) {
          console.log(errorDetail + " (This is expected for a new user, attempting to create profile.)");
          // If profile not found (404), attempt to create it
          console.log(`[AuthContext] No Supabase profile for ${firebaseUser.uid}. Attempting to create initial profile.`);
          
          const initialRoles = (firebaseUser.email === 'sagarrana@gmail.com' || firebaseUser.email === 'sagarbikramrana7@gmail.com')
            ? ['admin', 'customer']
            : ['customer'];
          
          const initialProfileData = {
            id: firebaseUser.uid, // Changed from uid to id
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'New User',
            avatarUrl: firebaseUser.photoURL || null, // Send null if no photoURL
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
              if (newSupaProfileResponse.user) {
                console.log(`[AuthContext] Successfully created initial Supabase profile for ${firebaseUser.uid}:`, newSupaProfileResponse.user);
                return mapFirebaseUserToAppUser(firebaseUser, newSupaProfileResponse.user);
              } else {
                console.error(`[AuthContext] Profile creation API call succeeded but response did not contain user object for ${firebaseUser.uid}. Response:`, newSupaProfileResponse);
                return mapFirebaseUserToAppUser(firebaseUser); // Fallback to Firebase data only
              }
            } else {
               let createErrorMsg = `Failed to create profile, status ${createResponse.status}`;
               let createErrorDetails = {};
               try {
                   const errorData = await createResponse.json();
                   createErrorMsg = errorData.message || createErrorMsg;
                   createErrorDetails = errorData.rawSupabaseError || errorData;
                   if (errorData.rawSupabaseError && errorData.rawSupabaseError.message) {
                     createErrorMsg += `. Supabase Error: ${errorData.rawSupabaseError.message}`;
                   }
               } catch(e) {/* ignore if createResponse body is not json */}
               console.error(`[AuthContext] Failed to create initial Supabase profile for ${firebaseUser.uid}. Status: ${createResponse.status}. API Message: ${createErrorMsg}`, createErrorDetails);
               return mapFirebaseUserToAppUser(firebaseUser); // Fallback to Firebase user data on creation failure
            }
          } catch (createError: any) {
            console.error(`[AuthContext] Network error creating initial Supabase profile for ${firebaseUser.uid}:`, createError.message, createError);
            return mapFirebaseUserToAppUser(firebaseUser); // Fallback
          }
        } else {
          // For non-404 errors during GET profile
          console.error(errorDetail, rawSupaErrorObject);
          return mapFirebaseUserToAppUser(firebaseUser); // Fallback to Firebase data only
        }
      }

      // This part is reached if profileResponse.ok was true
      const supaProfile = await profileResponse.json();
      console.log(`[AuthContext] Supabase profile found for ${firebaseUser.uid}. Merging with Firebase Auth data.`);
      return mapFirebaseUserToAppUser(firebaseUser, supaProfile);

    } catch (error: any) { // Catch for network errors during the initial GET profile fetch
      console.error(`[AuthContext] Network or other unhandled error in fetchAppUserProfile for ${firebaseUser.uid}:`, error.message, error);
      return mapFirebaseUserToAppUser(firebaseUser); // Fallback
    }
  }, []);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log(`[AuthContext] Firebase auth state changed, user found: ${firebaseUser?.uid}`);
      setIsLoading(true);
      if (firebaseUser) {
        const appUser = await fetchAppUserProfile(firebaseUser);
        setUser(currentAppUser => {
            if (!appUser) return currentAppUser; // Should not happen if firebaseUser is present

            // More robust check for actual changes
            const rolesChanged = JSON.stringify(currentAppUser?.roles?.sort()) !== JSON.stringify(appUser?.roles?.sort());
            const wishlistChanged = JSON.stringify(currentAppUser?.wishlist?.sort()) !== JSON.stringify(appUser?.wishlist?.sort());

            if (currentAppUser?.id !== appUser.id ||
                currentAppUser?.name !== appUser.name ||
                currentAppUser?.email !== appUser.email ||
                currentAppUser?.avatarUrl !== appUser.avatarUrl || // Handles undefined vs null correctly
                rolesChanged || wishlistChanged) {
                console.log("[AuthContext] App user state updated in context:", appUser);
                return appUser;
            }
            console.log("[AuthContext] App user state unchanged, no update to context needed for user:", appUser.id);
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
    // setIsLoading(true); // Local loading state for form should be in LoginPage
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      // onAuthStateChanged will handle setting user and global isLoading
      return { success: true };
    } catch (error: any) {
      console.error("Firebase login error:", error);
      return { success: false, error: error.message || "Login failed. Please check your credentials." };
    } finally {
      // setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (name: string, email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    // setIsLoading(true); // Local loading state for form should be in RegisterPage
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      if (userCredential.user) {
        await updateFirebaseProfile(userCredential.user, { displayName: name });
        // onAuthStateChanged will call fetchAppUserProfile which handles Supabase profile creation.
      }
      return { success: true };
    } catch (error: any) {
      console.error("Firebase registration error:", error);
      return { success: false, error: error.message || "Registration failed. Please try again." };
    } finally {
      // setIsLoading(false);
    }
  }, []); // Removed router and fetchAppUserProfile from deps as onAuthStateChanged handles it

  const logout = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null); 
      // Optionally, redirect after logout if needed, e.g., router.push('/');
      // However, redirecting here might cause issues if logout is called from multiple places.
      // It's often better to handle post-logout redirect in the component initiating logout.
      if (pathname?.startsWith('/account') || pathname?.startsWith('/admin')) {
         router.push('/'); // Redirect to home if logging out from account/admin area
      } else {
        router.refresh(); // Refresh current page for other cases
      }
    } catch (error) {
      console.error("Firebase logout error:", error);
    }
  }, [router, pathname]);

  const refreshUserProfile = useCallback(async () => {
    const currentFirebaseUser = auth.currentUser;
    if (currentFirebaseUser) {
      console.log("[AuthContext] Refreshing user profile via refreshUserProfile()...");
      setIsLoading(true);
      const appUser = await fetchAppUserProfile(currentFirebaseUser);
      setUser(appUser);
      setIsLoading(false);
      console.log("[AuthContext] User profile refreshed via refreshUserProfile(). New state:", appUser);
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
