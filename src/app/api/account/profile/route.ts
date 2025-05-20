
// /src/app/api/account/profile/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// File system or database interaction for profiles would go here if not using Supabase directly from useAuth.
// For this rollback, we'll make it a mock API.
import type { User as AuthUserType } from '@/types';

// Mock data store (in-memory for demo, not persistent)
let userProfiles: { [key: string]: AuthUserType } = {};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get('uid');
  console.log(`[API /api/account/profile] (Mock) GET request for uid: ${uid}`);

  if (!uid) {
    return NextResponse.json({ message: 'User ID (uid) is required' }, { status: 400 });
  }

  const profile = userProfiles[uid];

  if (profile) {
    console.log(`[API /api/account/profile] (Mock) Found profile for ${uid}`);
    return NextResponse.json(profile);
  } else {
    console.log(`[API /api/account/profile] (Mock) Profile not found for ${uid}, returning 404.`);
    // Fallback to a default structure if profile doesn't exist, or could return 404.
    // For now, to align with frontend expectation of getting user data,
    // we might return a partial object or what Firebase Auth would give.
    // However, a real system might create the profile on first POST.
    return NextResponse.json({ message: 'Profile not found' }, { status: 404 });
  }
}

interface ProfileUpdateRequest {
  uid: string;
  name?: string;
  avatarUrl?: string;
  email?: string; // Though email changes are complex with Firebase Auth
}

export async function POST(request: NextRequest) {
  console.log("[API /api/account/profile] (Mock) POST request received.");
  try {
    const body = (await request.json()) as ProfileUpdateRequest;
    const { uid, name, avatarUrl, email } = body;

    if (!uid) {
      return NextResponse.json({ message: 'User ID (uid) is required for update' }, { status: 400 });
    }

    if (!userProfiles[uid]) {
        // Simulate creating a new profile if it doesn't exist
        userProfiles[uid] = {
            id: uid,
            email: email || `mock-${uid}@example.com`, // Use provided email or a mock one
            name: name || 'New User',
            avatarUrl: avatarUrl || undefined,
            roles: ['customer'],
            wishlist: [],
        };
        console.log(`[API /api/account/profile] (Mock) Created new profile for ${uid}:`, userProfiles[uid]);
    } else {
        // Update existing profile
        if (name) userProfiles[uid].name = name;
        if (avatarUrl !== undefined) userProfiles[uid].avatarUrl = avatarUrl; // Allow setting to empty string
        // Email changes are usually not done this way directly with Firebase Auth
        console.log(`[API /api/account/profile] (Mock) Updated profile for ${uid}:`, userProfiles[uid]);
    }
    
    return NextResponse.json({ message: 'Profile updated successfully (mock)', user: userProfiles[uid] });

  } catch (error) {
    console.error('[API /api/account/profile] (Mock) Error processing profile update:', error);
    return NextResponse.json({ message: 'Error updating user profile (mock)', error: (error as Error).message }, { status: 500 });
  }
}
