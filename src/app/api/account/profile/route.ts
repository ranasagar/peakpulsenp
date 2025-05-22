
// /src/app/api/account/profile/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient.ts'; // Relative path
import type { User as AuthUserType } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get('uid');
  
  console.log(`[API /api/account/profile GET] Request URL: ${request.url}`);
  console.log(`[API /api/account/profile GET] Extracted UID from searchParams: ${uid}`);

  if (!supabase) {
    console.error('[API /api/account/profile GET] Supabase client is not initialized. Check environment variables and server restart.');
    return NextResponse.json({ 
        message: 'Database client not configured. Please check server logs and .env file.',
        rawSupabaseError: { message: 'Supabase client not initialized due to server configuration problem.'} 
    }, { status: 503 });
  }

  if (!uid) {
    console.warn("[API /api/account/profile GET] User ID (uid) is required in query parameters.");
    return NextResponse.json({ message: 'User ID (uid) is required' }, { status: 400 });
  }

  try {
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', uid) // This query will fail if users.id is uuid and uid is a non-uuid string
      .single();

    if (error) {
      // Log the full error for server-side debugging
      console.error(`[API /api/account/profile GET] Supabase error fetching profile for uid ${uid}:`, JSON.stringify(error, null, 2));
      if (error.code === 'PGRST116') { // Row not found
        console.log(`[API /api/account/profile GET] Profile not found in Supabase for uid ${uid}.`);
        return NextResponse.json({ message: 'Profile not found' }, { status: 404 });
      }
      // For other errors, return a structured error
      return NextResponse.json({ 
        message: 'Error fetching profile from database.', 
        rawSupabaseError: {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        }
      }, { status: 500 });
    }

    if (profile) {
      console.log(`[API /api/account/profile GET] Found profile for ${uid} in Supabase.`);
      const responseProfile = { ...profile, wishlist: profile.wishlist || [] };
      return NextResponse.json(responseProfile);
    } else {
      console.log(`[API /api/account/profile GET] Profile not found for uid ${uid} (data was null) after Supabase query - this should have been caught by error.code PGRST116.`);
      return NextResponse.json({ message: 'Profile not found (data null)' }, { status: 404 });
    }
  } catch (catchError: any) {
    console.error(`[API /api/account/profile GET] Unhandled exception fetching profile for uid ${uid}:`, catchError);
    // It's good practice to include a hint about checking the database schema if a UUID format error is suspected.
    let errorMessage = 'Server error fetching profile.';
    if (catchError.message && catchError.message.includes("uuid")) {
        errorMessage += " Check if the 'id' column in the 'users' table is of type TEXT to store Firebase UIDs, not UUID.";
    }
    return NextResponse.json({ message: errorMessage, error: catchError.message, code: catchError.code }, { status: 500 });
  }
}

interface ProfileUpdateRequest {
  uid: string;
  name?: string;
  avatarUrl?: string | null;
  email?: string; 
  roles?: string[];
  wishlist?: string[];
}

export async function POST(request: NextRequest) {
  console.log("[API /api/account/profile POST] Request received.");
  if (!supabase) {
    console.error('[API /api/account/profile POST] Supabase client is not initialized. Check environment variables and server restart.');
    return NextResponse.json({ 
        message: 'Database client not configured. Please check server logs and .env file.',
        rawSupabaseError: { message: 'Supabase client not initialized due to server configuration problem.'} 
    }, { status: 503 });
  }
  try {
    const body = (await request.json()) as ProfileUpdateRequest;
    const { uid, name, avatarUrl, email, roles, wishlist } = body;

    if (!uid) {
      return NextResponse.json({ message: 'User ID (uid) is required for update/create' }, { status: 400 });
    }

    // Ensure the 'id' column in your Supabase 'users' table is of type TEXT, not UUID,
    // to correctly store Firebase UIDs.
    const profileDataToUpsert: Partial<AuthUserType> & { id: string } = {
      id: uid, // Firebase UID is a string
      email: email, // Email from Firebase Auth
    };

    if (name !== undefined) profileDataToUpsert.name = name;
    if (avatarUrl !== undefined) profileDataToUpsert.avatarUrl = avatarUrl === null ? undefined : avatarUrl; // Store null as undefined or Supabase handles it
    if (roles !== undefined) profileDataToUpsert.roles = roles;
    if (wishlist !== undefined) profileDataToUpsert.wishlist = wishlist;
    
    // @ts-ignore - Supabase types might not perfectly align if we use Partial, but it's for db interaction
    profileDataToUpsert.updatedAt = new Date().toISOString();

    // Check if user exists to determine if it's an insert or update
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id, "createdAt"') // only select minimal fields
      .eq('id', uid)
      .maybeSingle(); // Use maybeSingle to handle user not existing without it being a hard error

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means 0 rows, not an error for maybeSingle
        console.error(`[API /api/account/profile POST] Error checking for existing user ${uid}:`, JSON.stringify(fetchError, null, 2));
        return NextResponse.json({ 
          message: 'Error accessing user data.', 
          rawSupabaseError: { message: fetchError.message, details: fetchError.details, hint: fetchError.hint, code: fetchError.code }
        }, { status: 500 });
    }

    let finalUserData;

    if (existingUser) {
      console.log(`[API /api/account/profile POST] Updating existing profile for ${uid}`);
      // @ts-ignore
      delete profileDataToUpsert.createdAt; // Don't try to update createdAt
      const { error: updateError, data: updatedUser } = await supabase
        .from('users')
        .update(profileDataToUpsert)
        .eq('id', uid)
        .select() // Select all columns after update
        .single(); // Expect a single row to be updated
      
      if (updateError) {
        console.error(`[API /api/account/profile POST] Supabase error updating profile for ${uid}:`, JSON.stringify(updateError, null, 2));
        return NextResponse.json({ 
          message: 'Failed to update profile in database.', 
          rawSupabaseError: { message: updateError.message, details: updateError.details, hint: updateError.hint, code: updateError.code }
        }, { status: 500 });
      }
      finalUserData = updatedUser;
      console.log(`[API /api/account/profile POST] Profile updated for ${uid}.`);
    } else {
      console.log(`[API /api/account/profile POST] Creating new profile for ${uid}`);
      // @ts-ignore
      profileDataToUpsert.createdAt = new Date().toISOString(); // Set createdAt for new user
      const { error: insertError, data: insertedUser } = await supabase
        .from('users')
        .insert(profileDataToUpsert)
        .select()
        .single(); // Expect a single row to be inserted

      if (insertError) {
        console.error(`[API /api/account/profile POST] Supabase error inserting profile for ${uid}:`, JSON.stringify(insertError, null, 2));
        return NextResponse.json({ 
          message: 'Failed to create profile in database.', 
          rawSupabaseError: { message: insertError.message, details: insertError.details, hint: insertError.hint, code: insertError.code }
        }, { status: 500 });
      }
      finalUserData = insertedUser;
      console.log(`[API /api/account/profile POST] Profile created for ${uid}.`);
    }
    
    // Ensure wishlist is always an array in the response
    const responseUser = { ...finalUserData, wishlist: finalUserData.wishlist || [] };
    return NextResponse.json({ message: 'Profile updated successfully', user: responseUser });

  } catch (error: any) {
    console.error('[API /api/account/profile POST] Unhandled error processing profile update:', error);
    return NextResponse.json({ message: 'Error updating user profile', error: error.message }, { status: 500 });
  }
}
