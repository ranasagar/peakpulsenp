
// /src/app/api/account/profile/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient.ts'; // Relative path
import type { User as AuthUserType } from '@/types';

export const dynamic = 'force-dynamic';

interface ProfileUpdateRequestBody {
  id?: string; // Firebase UID
  uid?: string; // Legacy, if client sends this
  name?: string;
  avatarUrl?: string | null;
  email?: string; // Required for new profiles
  roles?: string[];
  wishlist?: string[];
}

// GET user profile
export async function GET(request: NextRequest) {
  if (!supabase) {
    console.error('[API /api/account/profile GET] Supabase client is not initialized. Check environment variables and server restart.');
    return NextResponse.json({ 
        message: 'Database client not configured. Please check server logs and .env file.',
        rawSupabaseError: { message: 'Supabase client not initialized on server for GET.' } 
    }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const uidFromQuery = searchParams.get('uid');
  
  console.log(`[API /api/account/profile GET] Request URL: ${request.url}`);
  console.log(`[API /api/account/profile GET] Extracted UID from searchParams: ${uidFromQuery}`);

  if (!uidFromQuery) {
    console.warn("[API /api/account/profile GET] User ID (uid) is required in query parameters.");
    return NextResponse.json({ message: 'User ID (uid) is required' }, { status: 400 });
  }

  try {
    const { data: profile, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', uidFromQuery) // 'id' column in Supabase users table should store Firebase UID
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') { // Standard PostgREST code for "0 rows"
        console.log(`[API /api/account/profile GET] Profile not found in Supabase for uid ${uidFromQuery}.`);
        return NextResponse.json({ message: 'Profile not found' }, { status: 404 });
      }
      console.error(`[API /api/account/profile GET] Supabase error fetching profile for uid ${uidFromQuery}:`, JSON.stringify(fetchError, null, 2));
      return NextResponse.json({ 
        message: 'Error fetching profile from database.', 
        rawSupabaseError: { message: fetchError.message, details: fetchError.details, hint: fetchError.hint, code: fetchError.code }
      }, { status: 500 });
    }
    
    console.log(`[API /api/account/profile GET] Profile found for ${uidFromQuery} in Supabase.`);
    // Ensure wishlist is always an array, even if null in DB
    const responseProfile = { ...profile, wishlist: profile.wishlist || [] };
    return NextResponse.json(responseProfile);

  } catch (catchError: any) {
    console.error(`[API /api/account/profile GET] Unhandled exception fetching profile for uid ${uidFromQuery}:`, catchError);
    return NextResponse.json({ 
        message: 'Server error fetching profile.', 
        error: catchError.message,
        rawSupabaseError: { message: catchError.message, code: catchError.code, details: catchError.details, hint: catchError.hint }
    }, { status: 500 });
  }
}

// POST to create or update user profile
export async function POST(request: NextRequest) {
  if (!supabase) {
    console.error('[API /api/account/profile POST] Supabase client is not initialized. Check environment variables and server restart.');
    return NextResponse.json({ 
        message: 'Database client not configured. Please check server logs and .env file.',
        rawSupabaseError: { message: 'Supabase client not initialized on server for POST.' } 
    }, { status: 503 });
  }

  let rawBody;
  try {
    rawBody = await request.json();
  } catch (e) {
    console.error('[API /api/account/profile POST] Error parsing request JSON:', e);
    return NextResponse.json({ message: 'Invalid request body. Expected JSON.', error: (e as Error).message }, { status: 400 });
  }
  
  const requestBody = rawBody as ProfileUpdateRequestBody;
  console.log("[API /api/account/profile POST] Parsed request body (rawBody):", JSON.stringify(requestBody, null, 2));
  
  const userIdToProcess = requestBody.id || requestBody.uid; // Prefer 'id', fallback to 'uid' if sent
  const { name, avatarUrl, email, roles, wishlist } = requestBody;

  if (!userIdToProcess) {
    console.warn("[API /api/account/profile POST] User ID (id or uid) is required in request body.");
    return NextResponse.json({ message: 'User ID (id or uid) is required for update/create' }, { status: 400 });
  }
  console.log(`[API /api/account/profile POST] Processing for user ID: ${userIdToProcess}`);

  try {
    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userIdToProcess)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means 0 rows, which is fine for a potential insert
        console.error(`[API /api/account/profile POST] Supabase error checking for existing user ${userIdToProcess}:`, JSON.stringify(fetchError, null, 2));
        return NextResponse.json({ 
          message: 'Error accessing user data from database.', 
          rawSupabaseError: { message: fetchError.message, details: fetchError.details, hint: fetchError.hint, code: fetchError.code }
        }, { status: 500 });
    }

    let finalUserData;

    if (existingUser) {
      // Update existing profile
      console.log(`[API /api/account/profile POST] Updating existing profile for UID: ${userIdToProcess}`);
      const profileDataToUpdate: { name?: string; "avatarUrl"?: string | null; roles?: string[]; wishlist?: string[]; "updatedAt": string } = {
        "updatedAt": new Date().toISOString(),
      };
      if (name !== undefined) profileDataToUpdate.name = name;
      // Only update avatarUrl if explicitly provided (even if null to clear it)
      if (avatarUrl !== undefined) profileDataToUpdate["avatarUrl"] = avatarUrl;
      if (roles !== undefined) profileDataToUpdate.roles = roles; // API should validate if user is allowed to change roles
      if (wishlist !== undefined) profileDataToUpdate.wishlist = wishlist;

      console.log(`[API /api/account/profile POST] Data for Supabase UPDATE for UID ${userIdToProcess}:`, JSON.stringify(profileDataToUpdate, null, 2));
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update(profileDataToUpdate)
        .eq('id', userIdToProcess)
        .select()
        .single();
      
      if (updateError) {
        console.error(`[API /api/account/profile POST] Supabase error updating profile for UID ${userIdToProcess}:`, JSON.stringify(updateError, null, 2));
        let specificMessage = 'Failed to update profile in database.';
        if (updateError.code === '42501') { // RLS violation
            specificMessage = 'Database Row Level Security (RLS) policy violation prevents profile update. Please check UPDATE policy for the authenticated user on "users" table in Supabase.';
        } else if (updateError.code === '23505') { // Unique constraint violation (e.g. email)
            specificMessage = `Failed to update profile: ${updateError.message}. This could be due to a duplicate email.`;
        }
        return NextResponse.json({ 
          message: specificMessage, 
          rawSupabaseError: { message: updateError.message, details: updateError.details, hint: updateError.hint, code: updateError.code }
        }, { status: 500 });
      }
      finalUserData = updatedUser;
      console.log(`[API /api/account/profile POST] Profile updated successfully for UID ${userIdToProcess}.`);
    } else {
      // Create new profile
      console.log(`[API /api/account/profile POST] Creating new profile for UID: ${userIdToProcess}`);
      if (!email) { 
        console.warn(`[API /api/account/profile POST] Email is required for new profile creation (UID ${userIdToProcess}).`);
        return NextResponse.json({ message: 'Email is required for new profile creation.' }, { status: 400 });
      }

      const profileDataToInsert = {
        id: userIdToProcess, 
        email: email, // Required
        name: name || email.split('@')[0] || 'New User', // Default name if not provided
        "avatarUrl": avatarUrl, // Can be null
        // roles and wishlist will use database defaults if not explicitly sent or handled by API based on user type
        roles: roles || ['customer'], // Default roles from client
        wishlist: wishlist || [],     // Default wishlist from client
        "createdAt": new Date().toISOString(), // Explicitly set
        "updatedAt": new Date().toISOString()  // Explicitly set
      };
      
      console.log(`[API /api/account/profile POST] Data for insert for UID ${userIdToProcess}:`, JSON.stringify(profileDataToInsert, null, 2));
      
      const { data: insertedUser, error: insertError } = await supabase
        .from('users')
        .insert(profileDataToInsert) 
        .select()
        .single();

      if (insertError) {
        console.error(`[API /api/account/profile POST] Supabase error inserting profile for UID ${userIdToProcess}:`, JSON.stringify(insertError, null, 2));
        let specificMessage = 'Failed to create profile in database.';
        if (insertError.code === '42501') { // RLS violation
            specificMessage = 'Database Row Level Security (RLS) policy violation prevents profile creation. Please check INSERT policy for "anon" role on "users" table in Supabase.';
        } else if (insertError.code === '23505') { // Unique constraint violation (e.g. email or id)
            specificMessage = `Failed to create profile: ${insertError.message}. This could be due to a duplicate email or ID.`;
        }
        return NextResponse.json({ 
          message: specificMessage, 
          rawSupabaseError: { message: insertError.message, details: insertError.details, hint: insertError.hint, code: insertError.code }
        }, { status: 500 });
      }
      finalUserData = insertedUser;
      console.log(`[API /api/account/profile POST] Profile created successfully for UID ${userIdToProcess}.`);
    }
    
    const responseUser = { ...finalUserData, wishlist: finalUserData?.wishlist || [] };
    return NextResponse.json({ message: 'Profile operation successful', user: responseUser });

  } catch (error: any) {
    console.error(`[API /api/account/profile POST] Unhandled error during profile operation for UID ${userIdToProcess || 'unknown'}:`, error);
    return NextResponse.json({ 
        message: 'Server error processing profile operation.', 
        error: error.message,
        rawSupabaseError: { message: error.message, code: error.code }
    }, { status: 500 });
  }
}
