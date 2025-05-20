
// /src/app/api/account/profile/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient.ts'; // Relative path
import type { User as AuthUserType } from '@/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get('uid');
  console.log(`[API /api/account/profile] GET request for uid: ${uid}`);

  if (!supabase) {
    console.error('[API /api/account/profile] Supabase client is not initialized for GET.');
    return NextResponse.json({ message: 'Database client not configured.' }, { status: 503 });
  }

  if (!uid) {
    return NextResponse.json({ message: 'User ID (uid) is required' }, { status: 400 });
  }

  try {
    const { data: profile, error } = await supabase
      .from('users')
      .select('*') // Select all columns for the profile
      .eq('id', uid)
      .single(); // Expects a single row

    if (error) {
      if (error.code === 'PGRST116') { // PGRST116: "Fetched result consists of 0 rows"
        console.log(`[API /api/account/profile] Profile not found for uid ${uid}.`);
        return NextResponse.json({ message: 'Profile not found' }, { status: 404 });
      }
      console.error(`[API /api/account/profile] Supabase error fetching profile for uid ${uid}:`, error);
      return NextResponse.json({ message: 'Error fetching profile from database.', rawError: error.message }, { status: 500 });
    }

    if (profile) {
      console.log(`[API /api/account/profile] Found profile for ${uid}:`, profile);
      // Ensure wishlist is an array, even if null in DB
      const responseProfile = { ...profile, wishlist: profile.wishlist || [] };
      return NextResponse.json(responseProfile);
    } else {
      // This case should ideally be caught by error.code === 'PGRST116'
      console.log(`[API /api/account/profile] Profile not found for uid ${uid} (data was null).`);
      return NextResponse.json({ message: 'Profile not found' }, { status: 404 });
    }
  } catch (catchError) {
    console.error(`[API /api/account/profile] Unhandled exception fetching profile for uid ${uid}:`, catchError);
    return NextResponse.json({ message: 'Server error fetching profile.', error: (catchError as Error).message }, { status: 500 });
  }
}

interface ProfileUpdateRequest {
  uid: string;
  name?: string;
  avatarUrl?: string | null; // Allow null to clear avatar
  email?: string; // Email is usually managed by Firebase Auth, not directly here
  roles?: string[];
  wishlist?: string[];
}

export async function POST(request: NextRequest) {
  console.log("[API /api/account/profile] POST request received.");
  if (!supabase) {
    console.error('[API /api/account/profile] Supabase client is not initialized for POST.');
    return NextResponse.json({ message: 'Database client not configured.' }, { status: 503 });
  }
  try {
    const body = (await request.json()) as ProfileUpdateRequest;
    const { uid, name, avatarUrl, email, roles, wishlist } = body;

    if (!uid) {
      return NextResponse.json({ message: 'User ID (uid) is required for update/create' }, { status: 400 });
    }

    const profileDataToUpsert: Partial<AuthUserType> & { id: string } = {
      id: uid, // Firebase UID as the primary key
      email: email, // Store email, though auth is Firebase
    };

    if (name !== undefined) profileDataToUpsert.name = name;
    if (avatarUrl !== undefined) profileDataToUpsert.avatarUrl = avatarUrl === null ? undefined : avatarUrl; // Handle null for clearing
    if (roles !== undefined) profileDataToUpsert.roles = roles;
    if (wishlist !== undefined) profileDataToUpsert.wishlist = wishlist;
    
    // Ensure updatedAt is set
    // @ts-ignore - Supabase types might not perfectly align for direct update
    profileDataToUpsert.updatedAt = new Date().toISOString();


    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id, "createdAt"') // Also fetch createdAt
      .eq('id', uid)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows, which is fine for insert
        console.error(`[API /api/account/profile] Error checking for existing user ${uid}:`, fetchError);
        return NextResponse.json({ message: 'Error accessing user data.', rawError: fetchError.message }, { status: 500 });
    }

    let finalUserData;

    if (existingUser) {
      // User exists, update
      console.log(`[API /api/account/profile] Updating existing profile for ${uid}`);
      const { error: updateError, data: updatedUser } = await supabase
        .from('users')
        .update(profileDataToUpsert)
        .eq('id', uid)
        .select()
        .single();
      
      if (updateError) {
        console.error(`[API /api/account/profile] Supabase error updating profile for ${uid}:`, updateError);
        return NextResponse.json({ message: 'Failed to update profile in database.', rawError: updateError.message }, { status: 500 });
      }
      finalUserData = updatedUser;
      console.log(`[API /api/account/profile] Profile updated for ${uid}:`, finalUserData);
    } else {
      // User does not exist, insert
      console.log(`[API /api/account/profile] Creating new profile for ${uid}`);
      // @ts-ignore
      profileDataToUpsert.createdAt = new Date().toISOString(); // Set createdAt for new users
      const { error: insertError, data: insertedUser } = await supabase
        .from('users')
        .insert(profileDataToUpsert)
        .select()
        .single();

      if (insertError) {
        console.error(`[API /api/account/profile] Supabase error inserting profile for ${uid}:`, insertError);
        return NextResponse.json({ message: 'Failed to create profile in database.', rawError: insertError.message }, { status: 500 });
      }
      finalUserData = insertedUser;
      console.log(`[API /api/account/profile] Profile created for ${uid}:`, finalUserData);
    }
    
    // Ensure wishlist is an array in the response
    const responseUser = { ...finalUserData, wishlist: finalUserData.wishlist || [] };
    return NextResponse.json({ message: 'Profile updated successfully', user: responseUser });

  } catch (error) {
    console.error('[API /api/account/profile] Unhandled error processing profile update:', error);
    return NextResponse.json({ message: 'Error updating user profile', error: (error as Error).message }, { status: 500 });
  }
}
