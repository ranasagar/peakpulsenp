
// /src/app/api/account/profile/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient.ts'; // Relative path
import type { User as AuthUserType } from '@/types';

export const dynamic = 'force-dynamic';

interface ProfileUpdateRequestBody {
  id: string; // Firebase UID, now expected as 'id'
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
      .eq('id', uidFromQuery) // 'id' column in Supabase users table should store Firebase UID (as text)
      .single(); // Use .single() to expect one row or an error if not found (PGRST116)

    if (fetchError) {
      const isNotFound = fetchError.code === 'PGRST116'; 
      const errorMessage = isNotFound ? 'Profile not found' : 'Error fetching profile from database.';
      console.error(`[API /api/account/profile GET] Supabase error fetching profile for uid ${uidFromQuery}${isNotFound ? ' (Profile not found)' : ''}:`, JSON.stringify(fetchError, null, 2));
      
      return NextResponse.json({ 
        message: errorMessage, 
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
        rawSupabaseError: { message: catchError.message, code: catchError.code || 'UNKNOWN_SERVER_ERROR_PROFILE_GET', details: catchError.details, hint: catchError.hint }
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
    return NextResponse.json({ message: 'Invalid request body. Expected JSON.', error: (e as Error).message, rawSupabaseError: { message: (e as Error).message } }, { status: 400 });
  }
  
  const requestBody = rawBody as ProfileUpdateRequestBody;
  console.log("[API /api/account/profile POST] Parsed request body (rawBody):", JSON.stringify(requestBody, null, 2));
  
  // Use 'id' from request body as the primary identifier (Firebase UID)
  const userIdToProcess = requestBody.id; 
  const { name, avatarUrl, email, roles, wishlist } = requestBody;

  if (!userIdToProcess) {
    console.warn("[API /api/account/profile POST] User ID (id) is required in request body for update/create.");
    return NextResponse.json({ message: 'User ID (id) is required for update/create', rawSupabaseError: { message: 'User ID (id) is required for update/create' } }, { status: 400 });
  }
  console.log(`[API /api/account/profile POST] Processing for user ID: ${userIdToProcess}`);

  try {
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id, roles, wishlist') // Select specific fields needed for update logic
      .eq('id', userIdToProcess)
      .maybeSingle(); // Use maybeSingle for update, returns null if not found, no error

    if (fetchError) { // Any error other than user not found (which is fine for create)
        console.error(`[API /api/account/profile POST] Supabase error checking for existing user ${userIdToProcess}:`, JSON.stringify(fetchError, null, 2));
        return NextResponse.json({ 
          message: 'Error accessing user data from database during pre-check.', 
          rawSupabaseError: { message: fetchError.message, details: fetchError.details, hint: fetchError.hint, code: fetchError.code }
        }, { status: 500 });
    }

    let finalUserData;
    let operation: 'INSERT' | 'UPDATE' = 'UPDATE'; // Assume update if user exists

    if (existingUser) {
      // Update existing profile
      console.log(`[API /api/account/profile POST] Updating existing profile for UID: ${userIdToProcess}`);
      const profileDataToUpdate: Partial<AuthUserType> & { updatedAt: string } = {
        updatedAt: new Date().toISOString(),
      };
      if (name !== undefined) profileDataToUpdate.name = name;
      if (avatarUrl !== undefined) profileDataToUpdate.avatarUrl = avatarUrl;
      // IMPORTANT: Roles should only be updatable by an admin.
      // For self-update, roles should not be changed here or should be validated.
      // If 'roles' is sent by a non-admin client, it should ideally be ignored by this API or stripped.
      // The RLS policy for UPDATE on 'users' table should prevent users from changing their own roles.
      if (wishlist !== undefined) profileDataToUpdate.wishlist = wishlist; // Allow user to update their own wishlist

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
        const isRLSViolation = errorCode === '42501';
        const specificMessage = isRLSViolation
          ? 'Database Row Level Security (RLS) policy violation prevents profile update. Please check UPDATE policy for "authenticated" role on "users" table in Supabase.'
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
      operation = 'INSERT';
      console.log(`[API /api/account/profile POST] Creating new profile for UID: ${userIdToProcess}`);
      if (!email) { 
        console.warn(`[API /api/account/profile POST] Email is required for new profile creation (UID ${userIdToProcess}).`);
        return NextResponse.json({ message: 'Email is required for new profile creation.', rawSupabaseError: { message: 'Email is required for new profile creation.' } }, { status: 400 });
      }

      // For INSERT, rely on database defaults for roles and wishlist
      // Only send core information that useAuth provides for new user setup
      const profileDataToInsert = {
        id: userIdToProcess, 
        email: email,
        name: name || email.split('@')[0] || 'New User',
        "avatarUrl": avatarUrl === undefined ? null : avatarUrl, // Explicitly use "avatarUrl" if that's the DB column name
        // roles and wishlist will be handled by database DEFAULT values if not sent, or RLS check might apply to them
        // Or, if useAuth sends specific roles (like admin), include them:
        ...(roles && { roles: roles }), // Conditionally include roles if provided
        ...(wishlist && { wishlist: wishlist }), // Conditionally include wishlist if provided
      };
      
      console.log(`[API /api/account/profile POST] Data for insert for UID ${userIdToProcess}:`, JSON.stringify(profileDataToInsert, null, 2));
      
      const { data: insertedUser, error: insertError } = await supabase
        .from('users')
        .insert(profileDataToInsert) 
        .select()
        .single();

      if (insertError) {
        console.error(`[API /api/account/profile POST] Supabase error inserting profile for UID ${userIdToProcess}:`, JSON.stringify(insertError, null, 2));
        const errorCode = insertError.code || 'UNKNOWN_DB_ERROR';
        const isRLSViolation = errorCode === '42501';
        const specificMessage = isRLSViolation
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
    
    // Ensure wishlist is an array in the response
    const responseUser = { ...finalUserData, wishlist: finalUserData?.wishlist || [] };
    return NextResponse.json({ message: `Profile ${operation === 'INSERT' ? 'created' : 'updated'} successfully`, user: responseUser });

  } catch (error: any) {
    console.error(`[API /api/account/profile POST] Unhandled error during profile ${rawBody?.id ? 'update for ' + rawBody.id : 'creation'}:`, error);
    return NextResponse.json({ 
        message: 'Server error processing profile operation.', 
        error: error.message, // General error message
        rawSupabaseError: { message: error.message, code: error.code || 'UNKNOWN_SERVER_ERROR_PROFILE_POST' }
    }, { status: 500 });
  }
}
