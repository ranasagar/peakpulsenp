// /src/app/api/account/profile/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase, supabaseAdmin } from '../../../../lib/supabaseClient.ts'; // Import both clients
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

// GET user profile (uses public anon client)
export async function GET(request: NextRequest) {
  if (!supabase) {
    console.error('[API /api/account/profile GET] Public Supabase client is not initialized. Check environment variables and server restart.');
    return NextResponse.json({
        message: 'Database client (public) not configured. Please check server logs and .env file for NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
        rawSupabaseError: { message: 'Public Supabase client not initialized on server for GET.' }
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
      .eq('id', uidFromQuery)
      .single();

    if (fetchError) {
      const isNotFound = fetchError.code === 'PGRST116';
      const errorMessage = isNotFound ? 'Profile not found' : 'Error fetching profile from database.';
      const specificMessage = isNotFound
          ? `Profile not found Supabase Error: ${fetchError.message}. Details: ${fetchError.details || 'N/A'}. Hint: ${fetchError.hint || 'N/A'}. Code: ${fetchError.code}.`
          : `Error fetching profile from database. Supabase Error: ${fetchError.message}. Details: ${fetchError.details || 'N/A'}. Hint: ${fetchError.hint || 'N/A'}. Code: ${fetchError.code}.`;

      console.error(`[API /api/account/profile GET] Supabase error fetching profile for uid ${uidFromQuery}${isNotFound ? ' (Profile not found)' : ''}:`, specificMessage, fetchError);

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
  const clientForWrite = supabaseAdmin || supabase; // Prefer admin client for writes, fallback to public if admin not init (will likely fail on RLS)

  if (!clientForWrite) {
     const errorMsg = supabaseAdmin ? '[API /api/account/profile POST] Public Supabase client (fallback) is not initialized.' : '[API /api/account/profile POST] Admin Supabase client is not initialized.';
     console.error(errorMsg + ' Check environment variables and server restart, especially SUPABASE_SERVICE_ROLE_KEY.');
     return NextResponse.json({
         message: 'Database client (for write) not configured. Please check server logs and .env file for SUPABASE_SERVICE_ROLE_KEY.',
         rawSupabaseError: { message: 'Supabase client for write operations not initialized.' }
     }, { status: 503 });
  }
  if (!supabaseAdmin) {
    console.warn("[API /api/account/profile POST] WARNING: Using public anon key for profile creation/update because SUPABASE_SERVICE_ROLE_KEY is likely not set. RLS policies for 'anon' role on 'users' table will apply for INSERT/UPDATE.");
  }


  let rawBody;
  try {
    rawBody = await request.json();
  } catch (e) {
    console.error('[API /api/account/profile POST] Error parsing request JSON:', e);
    return NextResponse.json({ message: 'Invalid request body. Expected JSON.', error: (e as Error).message }, { status: 400 });
  }

  const requestBody = rawBody as ProfileUpdateRequestBody;
  console.log("[API /api/account/profile POST] Parsed request body (rawBody):", JSON.stringify(rawBody, null, 2));

  const userIdToProcess = requestBody.id; // Expect 'id' from client
  const { name, avatarUrl, email: emailFromRequest, roles: rolesFromRequest, wishlist: wishlistFromRequest } = requestBody;

  if (!userIdToProcess) {
    console.warn("[API /api/account/profile POST] User ID (id) is required in request body for update/create.");
    return NextResponse.json({ message: 'User ID (id) is required for update/create' }, { status: 400 });
  }
  console.log(`[API /api/account/profile POST] Processing for user ID: ${userIdToProcess}`);

  try {
    // Check if user already exists using the public client (RLS for SELECT should allow this if user is querying their own)
    // Or, if using service_role for everything, this check is fine too.
    const { data: existingUser, error: fetchError } = await (supabase || clientForWrite) // Use public client for this read if available
      .from('users')
      .select('id, roles, wishlist')
      .eq('id', userIdToProcess)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means 0 rows, which is fine for create
        console.error(`[API /api/account/profile POST] Supabase error checking for existing user ${userIdToProcess}:`, JSON.stringify(fetchError, null, 2));
        return NextResponse.json({
          message: 'Error accessing user data from database during pre-check.',
          rawSupabaseError: { message: fetchError.message, details: fetchError.details, hint: fetchError.hint, code: fetchError.code }
        }, { status: 500 });
    }

    let finalUserData;
    let operation: 'INSERT' | 'UPDATE';

    if (existingUser) {
      operation = 'UPDATE';
      console.log(`[API /api/account/profile POST] Updating existing profile for UID: ${userIdToProcess}`);
      const profileDataToUpdate: Partial<AuthUserType> & { updatedAt: string } = {
        updatedAt: new Date().toISOString(),
      };
      if (name !== undefined) profileDataToUpdate.name = name;
      if (avatarUrl !== undefined) profileDataToUpdate.avatarUrl = avatarUrl; // Handles null to clear
      // IMPORTANT: Roles updates should ideally be handled by an admin-only endpoint or specific logic
      // For self-update, client should not send 'roles'. If it does, service_role will update it, anon key will be blocked by RLS on 'roles' column.
      if (rolesFromRequest !== undefined && supabaseAdmin) { // Only allow role update if service key is used & roles sent
         profileDataToUpdate.roles = rolesFromRequest;
      }
      if (wishlistFromRequest !== undefined) profileDataToUpdate.wishlist = wishlistFromRequest;

      console.log(`[API /api/account/profile POST] Data for Supabase UPDATE for UID ${userIdToProcess}:`, JSON.stringify(profileDataToUpdate, null, 2));
      const { data: updatedUser, error: updateError } = await clientForWrite // Use admin or public client
        .from('users')
        .update(profileDataToUpdate)
        .eq('id', userIdToProcess)
        .select()
        .single();

      if (updateError) {
        const specificMessage = updateError.code === '42501'
          ? 'Database Row Level Security (RLS) policy violation prevents profile update. Please check UPDATE policy on "users" table in Supabase.'
          : `Failed to update profile in database.`;
        console.error(`[API /api/account/profile POST] Supabase error updating profile for UID ${userIdToProcess}:`, JSON.stringify(updateError, null, 2));
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
      if (!emailFromRequest) {
        console.warn(`[API /api/account/profile POST] Email is required for new profile creation (UID ${userIdToProcess}).`);
        return NextResponse.json({ message: 'Email is required for new profile creation.' }, { status: 400 });
      }

      // For INSERT, rely on database defaults for roles, wishlist, createdAt, updatedAt where possible.
      // Explicitly set only what's necessary from the request.
      const profileDataToInsert = {
        id: userIdToProcess,
        email: emailFromRequest,
        name: name || emailFromRequest.split('@')[0] || 'New User',
        "avatarUrl": avatarUrl === undefined ? null : avatarUrl, // Use "avatarUrl" to match DB column if cased
        // Let DB defaults handle roles to '{"customer"}' and wishlist to '{}'
        // roles: rolesFromRequest || ['customer'], // Default to customer if not provided
        // wishlist: wishlistFromRequest || [],
      };
      // Assign admin role if email matches
      if (emailFromRequest === 'sagarrana@gmail.com' || emailFromRequest === 'sagarbikramrana7@gmail.com') {
        // @ts-ignore
        profileDataToInsert.roles = ['admin', 'customer'];
      }


      console.log(`[API /api/account/profile POST] Data for insert for UID ${userIdToProcess} using ${supabaseAdmin ? 'ADMIN client' : 'PUBLIC client'}:`, JSON.stringify(profileDataToInsert, null, 2));

      const { data: insertedUser, error: insertError } = await clientForWrite // Use admin or public client
        .from('users')
        .insert(profileDataToInsert as any)
        .select()
        .single();

      if (insertError) {
        const specificMessage = insertError.code === '42501'
          ? 'Database Row Level Security (RLS) policy violation prevents profile creation. Please check INSERT policy for "anon" role on "users" table in Supabase.'
          : `Failed to create profile in database.`;
        console.error(`[API /api/account/profile POST] Supabase error inserting profile for UID ${userIdToProcess}:`, JSON.stringify(insertError, null, 2));
        return NextResponse.json({
          message: specificMessage,
          rawSupabaseError: { message: insertError.message, details: insertError.details, hint: insertError.hint, code: insertError.code }
        }, { status: 500 });
      }
      finalUserData = insertedUser;
      console.log(`[API /api/account/profile POST] Profile created successfully for UID ${userIdToProcess}.`);
    }

    const responseUser = { ...finalUserData, wishlist: finalUserData?.wishlist || [] };
    return NextResponse.json({ message: `Profile ${operation === 'INSERT' ? 'created' : 'updated'} successfully`, user: responseUser });

  } catch (error: any) {
    console.error(`[API /api/account/profile POST] Unhandled error during profile operation for user ID ${userIdToProcess || 'unknown'}:`, error);
    return NextResponse.json({
        message: 'Server error processing profile operation.',
        error: error.message,
        rawSupabaseError: { message: error.message, code: error.code || 'UNKNOWN_SERVER_ERROR_PROFILE_POST' }
    }, { status: 500 });
  }
}
