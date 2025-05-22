
// /src/app/api/account/profile/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient.ts'; // Relative path
import type { User as AuthUserType } from '@/types';

export const dynamic = 'force-dynamic';

// GET user profile
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
    const { data: profile, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', uid)
      .single(); // Use single() as ID should be unique

    if (fetchError) {
      if (fetchError.code === 'PGRST116') { // Row not found
        console.log(`[API /api/account/profile GET] Profile not found in Supabase for uid ${uid}.`);
        return NextResponse.json({ message: 'Profile not found' }, { status: 404 });
      }
      console.error(`[API /api/account/profile GET] Supabase error fetching profile for uid ${uid}:`, JSON.stringify(fetchError, null, 2));
      return NextResponse.json({ 
        message: 'Error fetching profile from database.', 
        rawSupabaseError: {
          message: fetchError.message,
          details: fetchError.details,
          hint: fetchError.hint,
          code: fetchError.code
        }
      }, { status: 500 });
    }

    // No 'if (profile)' check needed because .single() would have thrown PGRST116 if not found
    console.log(`[API /api/account/profile GET] Found profile for ${uid} in Supabase.`);
    const responseProfile = { ...profile, wishlist: profile.wishlist || [] };
    return NextResponse.json(responseProfile);

  } catch (catchError: any) {
    console.error(`[API /api/account/profile GET] Unhandled exception fetching profile for uid ${uid}:`, catchError);
    let errorMessage = 'Server error fetching profile.';
    if (catchError.message && catchError.message.includes("uuid") && catchError.message.includes("type text")) {
        errorMessage += " Check if the 'id' column in the 'users' table is of type TEXT to store Firebase UIDs, not UUID.";
    }
    return NextResponse.json({ message: errorMessage, error: catchError.message, code: catchError.code }, { status: 500 });
  }
}


interface ProfileUpdateRequestBody {
  id: string; // Firebase UID
  name?: string;
  avatarUrl?: string | null;
  email?: string; // Should be from Firebase Auth, generally not updated here
  roles?: string[];
  wishlist?: string[];
}

// POST to create or update user profile
export async function POST(request: NextRequest) {
  console.log("[API /api/account/profile POST] Request received.");

  if (!supabase) {
    console.error('[API /api/account/profile POST] Supabase client is not initialized. Check environment variables and server restart.');
    return NextResponse.json({ 
        message: 'Database client not configured. Please check server logs and .env file.',
        rawSupabaseError: { message: 'Supabase client not initialized.' } 
    }, { status: 503 });
  }

  let requestBody: ProfileUpdateRequestBody;
  try {
    requestBody = (await request.json()) as ProfileUpdateRequestBody;
    console.log("[API /api/account/profile POST] Parsed request body:", requestBody);
  } catch (e) {
    console.error('[API /api/account/profile POST] Error parsing request JSON:', e);
    return NextResponse.json({ message: 'Invalid request body. Expected JSON.', error: (e as Error).message }, { status: 400 });
  }
  
  const { id: uid, name, avatarUrl, email, roles, wishlist } = requestBody;

  if (!uid) {
    console.warn("[API /api/account/profile POST] User ID (uid) is required in request body.");
    return NextResponse.json({ message: 'User ID (uid) is required for update/create' }, { status: 400 });
  }

  try {
    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id, "createdAt", roles, wishlist') // Select existing roles/wishlist for merging
      .eq('id', uid)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
        console.error(`[API /api/account/profile POST] Supabase error checking for existing user ${uid}:`, JSON.stringify(fetchError, null, 2));
        return NextResponse.json({ 
          message: 'Error accessing user data from database.', 
          rawSupabaseError: { message: fetchError.message, details: fetchError.details, hint: fetchError.hint, code: fetchError.code }
        }, { status: 500 });
    }

    let finalUserData;

    if (existingUser) {
      console.log(`[API /api/account/profile POST] Updating existing profile for UID: ${uid}`);
      const profileDataToUpdate: Partial<AuthUserType> = {
        updatedAt: new Date().toISOString(),
      };
      if (name !== undefined) profileDataToUpdate.name = name;
      if (avatarUrl !== undefined) profileDataToUpdate.avatarUrl = avatarUrl === null ? undefined : avatarUrl; // Handle null to clear
      // Roles & wishlist are typically managed by specific endpoints or admin actions,
      // but if they are sent, merge them. User shouldn't update their own roles.
      // For this endpoint, we generally expect only name and avatarUrl to be updated by the user.
      // If 'roles' or 'wishlist' are sent here, it's likely from an initial profile creation.
      if (roles !== undefined) profileDataToUpdate.roles = roles;
      if (wishlist !== undefined) profileDataToUpdate.wishlist = wishlist;


      console.log(`[API /api/account/profile POST] Data for update for UID ${uid}:`, profileDataToUpdate);
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update(profileDataToUpdate)
        .eq('id', uid)
        .select()
        .single();
      
      if (updateError) {
        console.error(`[API /api/account/profile POST] Supabase error updating profile for UID ${uid}:`, JSON.stringify(updateError, null, 2));
        return NextResponse.json({ 
          message: 'Failed to update profile in database.', 
          rawSupabaseError: { message: updateError.message, details: updateError.details, hint: updateError.hint, code: updateError.code }
        }, { status: 500 });
      }
      finalUserData = updatedUser;
      console.log(`[API /api/account/profile POST] Profile updated successfully for UID ${uid}.`);
    } else {
      console.log(`[API /api/account/profile POST] Creating new profile for UID: ${uid}`);
      const defaultRoles = (uid === 'q7hmdfhYAReLqvux1Zw5PbuZ2XD2' && email === 'sagarrana@gmail.com') ? ['admin', 'customer'] : ['customer'];
      const profileDataToInsert: AuthUserType = {
        id: uid,
        email: email || '', // Email should be present from auth
        name: name || email?.split('@')[0] || 'New User',
        avatarUrl: avatarUrl === null ? undefined : avatarUrl,
        roles: roles && roles.length > 0 ? [...new Set([...roles, ...defaultRoles])] : defaultRoles, // Merge roles, ensure defaults
        wishlist: wishlist || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log(`[API /api/account/profile POST] Data for insert for UID ${uid}:`, profileDataToInsert);
      const { data: insertedUser, error: insertError } = await supabase
        .from('users')
        .insert(profileDataToInsert)
        .select()
        .single();

      if (insertError) {
        console.error(`[API /api/account/profile POST] Supabase error inserting profile for UID ${uid}:`, JSON.stringify(insertError, null, 2));
        return NextResponse.json({ 
          message: 'Failed to create profile in database.', 
          rawSupabaseError: { message: insertError.message, details: insertError.details, hint: insertError.hint, code: insertError.code }
        }, { status: 500 });
      }
      finalUserData = insertedUser;
      console.log(`[API /api/account/profile POST] Profile created successfully for UID ${uid}.`);
    }
    
    const responseUser = { ...finalUserData, wishlist: finalUserData?.wishlist || [] };
    return NextResponse.json({ message: 'Profile operation successful', user: responseUser });

  } catch (error: any) {
    console.error(`[API /api/account/profile POST] Unhandled error processing profile update for UID ${uid}:`, error);
    return NextResponse.json({ 
        message: 'Server error processing profile update.', 
        error: error.message,
        stack: error.stack // Include stack for better debugging if available
    }, { status: 500 });
  }
}
