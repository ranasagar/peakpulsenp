
// /src/app/api/account/profile/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient.ts'; // Relative path
import type { User as AuthUserType } from '@/types';

export const dynamic = 'force-dynamic';

interface ProfileUpdateRequestBody {
  id?: string; // Firebase UID
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
      const isNotFound = fetchError.code === 'PGRST116'; // Standard PostgREST code for "0 rows"
      console.error(`[API /api/account/profile GET] Supabase error fetching profile for uid ${uidFromQuery}${isNotFound ? ' (Profile not found)' : ''}:`, JSON.stringify(fetchError, null, 2));
      
      return NextResponse.json({ 
        message: isNotFound ? 'Profile not found' : 'Error fetching profile from database.', 
        rawSupabaseError: { message: fetchError.message, details: fetchError.details, hint: fetchError.hint, code: fetchError.code }
      }, { status: isNotFound ? 404 : 500 });
    }
    
    console.log(`[API /api/account/profile GET] Profile found for ${uidFromQuery} in Supabase.`);
    const responseProfile = { ...profile, wishlist: profile.wishlist || [] };
    return NextResponse.json(responseProfile);

  } catch (catchError: any) {
    console.error(`[API /api/account/profile GET] Unhandled exception fetching profile for uid ${uidFromQuery}:`, catchError);
    return NextResponse.json({ 
        message: 'Server error fetching profile.', 
        error: catchError.message,
        rawSupabaseError: { message: catchError.message, code: catchError.code || 'UNKNOWN', details: catchError.details, hint: catchError.hint }
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
  
  const userIdToProcess = requestBody.id; // Expect 'id' directly now
  const { name, avatarUrl, email, roles, wishlist } = requestBody;

  if (!userIdToProcess) {
    console.warn("[API /api/account/profile POST] User ID (from requestBody.id) is required in request body.");
    return NextResponse.json({ message: 'User ID (id) is required for update/create' }, { status: 400 });
  }
  console.log(`[API /api/account/profile POST] Processing for user ID: ${userIdToProcess}`);

  try {
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userIdToProcess)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
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
      if (avatarUrl !== undefined) profileDataToUpdate["avatarUrl"] = avatarUrl; // Allows setting to null
      // IMPORTANT: Do not allow users to update their own roles here unless they are admin.
      // This should be handled by more sophisticated logic if non-admins can update profiles.
      // For now, we assume only admins or specific flows would update roles.
      // If `roles` is part of requestBody, it might be from an admin action or initial creation.
      if (roles !== undefined) profileDataToUpdate.roles = roles; 
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
        const errorCode = updateError.code || 'UNKNOWN_DB_ERROR';
        const specificMessage = errorCode === '42501' 
          ? 'Database Row Level Security (RLS) policy violation prevents profile update. Please check UPDATE policy for the authenticated user on "users" table in Supabase.'
          : `Failed to update profile in database.`;
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
        email: email,
        name: name || email.split('@')[0] || 'New User',
        "avatarUrl": avatarUrl === undefined ? null : avatarUrl, // Ensure null if undefined
        roles: roles || ['customer'], // Rely on DB default or ensure this is correct from client
        wishlist: wishlist || [],     // Rely on DB default or ensure this is correct from client
        "createdAt": new Date().toISOString(),
        "updatedAt": new Date().toISOString()
      };
      
      console.log(`[API /api/account/profile POST] Data for insert for UID ${userIdToProcess}:`, JSON.stringify(profileDataToInsert, null, 2));
      
      const { data: insertedUser, error: insertError } = await supabase
        .from('users')
        .insert(profileDataToInsert) 
        .select()
        .single();

      if (insertError) {
        console.error(`[API /api/account/profile POST] Supabase error inserting profile for UID ${userIdToProcess}:`, JSON.stringify(insertError, null, 2)); // Log the full error
        const errorCode = insertError.code || 'UNKNOWN_DB_ERROR';
        const specificMessage = errorCode === '42501' 
          ? 'Database Row Level Security (RLS) policy violation prevents profile creation. Please check INSERT policy for "anon" role on "users" table in Supabase.'
          : `Failed to create profile in database.`;

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
        rawSupabaseError: { message: error.message, code: error.code || 'UNKNOWN_SERVER_ERROR' }
    }, { status: 500 });
  }
}

