
// /src/app/api/account/profile/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db, auth } from '@/firebase/config'; // Assuming auth is exported for potential server-side verification if needed
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { User as AuthUserType } from '@/types';

// IMPORTANT: For production, you MUST verify the user's identity on the server.
// This typically involves passing an ID token from the client and verifying it using the Firebase Admin SDK.
// For simplicity in this prototype, we are trusting the UID sent from the client,
// but this is NOT secure for a real application without token verification.

interface ProfileUpdateRequest {
  uid: string;
  name?: string;
  email?: string; // Email updates require re-authentication and are complex, usually handled separately.
  avatarUrl?: string;
  // Add any other profile fields you want to manage, e.g., phone, bio
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get('uid');

  if (!uid) {
    return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
  }

  try {
    const userDocRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      const userData = docSnap.data() as AuthUserType;
      return NextResponse.json(userData);
    } else {
      // User document doesn't exist in Firestore, might be a new user or only Auth entry exists.
      // You could return a default structure or a 404.
      // For now, let's indicate not found, client can create it on first save.
      return NextResponse.json({ message: 'Profile not found in Firestore' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ message: 'Error fetching user profile', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ProfileUpdateRequest;
    const { uid, ...profileData } = body;

    if (!uid) {
      return NextResponse.json({ message: 'User ID is required for update' }, { status: 400 });
    }

    const userDocRef = doc(db, 'users', uid);

    // Check if document exists to decide between set (with merge) or update
    const docSnap = await getDoc(userDocRef);

    const dataToSave: Partial<AuthUserType> & { updatedAt: any } = { // Use any for serverTimestamp
      ...profileData,
      updatedAt: serverTimestamp(), // Update timestamp
    };
    
    if (profileData.email) {
        // WARNING: Updating email directly in Firestore doesn't update Firebase Auth email.
        // This needs a more robust flow involving re-authentication and `updateEmail` from `firebase/auth`.
        // For this prototype, we'll store it, but be aware of this discrepancy.
        // Ideally, email updates should trigger a Firebase Auth email update flow.
        console.warn("Updating email in Firestore profile, but Firebase Auth email needs separate handling.");
    }


    if (docSnap.exists()) {
      // Document exists, update it
      await updateDoc(userDocRef, dataToSave);
    } else {
      // Document doesn't exist, create it
      // Include createdAt timestamp if creating for the first time
      const dataToCreate = {
        ...dataToSave,
        createdAt: serverTimestamp(),
        id: uid, // ensure the ID is stored in the document too
        // roles: ['customer'] // Default role for new profiles
      };
      if (!profileData.email) {
        // If email wasn't in profileData (e.g., user only updated name), fetch from auth
        // This part is tricky without Admin SDK. For now, we assume client ensures email exists from auth.
        // For a real app, get user from token with Admin SDK to ensure correct email.
      }
      await setDoc(userDocRef, dataToCreate);
    }

    return NextResponse.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ message: 'Error updating user profile', error: (error as Error).message }, { status: 500 });
  }
}
