// /src/app/api/account/profile/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase, supabaseAdmin } from '../../../../lib/supabaseClient.ts';
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
      .single(); // .single() expects one row or zero, throws error if multiple

    if (fetchError) {
      const isNotFound = fetchError.code === 'PGRST116'; // PostgREST code for "Fetched result consists of 0 rows"
      const errorMessage = isNotFound ? 'Profile not found' : 'Error fetching profile from database.';
      const specificMessage = isNotFound
          ? `Profile not found. Supabase: ${fetchError.message}. Details: ${fetchError.details || 'N/A'}. Hint: ${fetchError.hint || 'N/A'}. Code: ${fetchError.code}.`
          : `Error fetching profile. Supabase: ${fetchError.message}. Details: ${fetchError.details || 'N/A'}. Hint: ${fetchError.hint || 'N/A'}. Code: ${fetchError.code}.`;
      
      console.error(`[API /api/account/profile GET] Supabase error fetching profile for uid ${uidFromQuery}${isNotFound ? ' (Profile not found)' : ''}:`, specificMessage);
      
      return NextResponse.json({
        message: errorMessage,
        rawSupabaseError: { message: fetchError.message, details: fetchError.details, hint: fetchError.hint, code: fetchError.code }
      }, { status: isNotFound ? 404 : 500 });
    }
    
    // If profile is null but no error (should be caught by .single() as PGRST116), treat as not found.
    if (!profile) {
      console.warn(`[API /api/account/profile GET] Profile not found for ${uidFromQuery} (data was null after query).`);
      return NextResponse.json({
        message: 'Profile not found',
        rawSupabaseError: { message: 'No profile data returned from database.', code: 'PGRST116_MANUAL' } // Custom code
      }, { status: 404 });
    }

    console.log(`[API /api/account/profile GET] Profile found for ${uidFromQuery} in Supabase.`);
    const responseProfile = { ...profile, wishlist: profile.wishlist || [] };
    return NextResponse.json(responseProfile);

  } catch (catchError: any) {
    console.error(`[API /api/account/profile GET] Unhandled exception fetching profile for uid ${uidFromQuery}:`, catchError);
    return NextResponse.json({
        message: 'Server error fetching profile.',
        errorDetails: catchError.message, // Changed from 'error' to 'errorDetails' for clarity
        rawSupabaseError: { message: catchError.message, code: catchError.code || 'UNKNOWN_SERVER_ERROR_PROFILE_GET', details: catchError.details, hint: catchError.hint }
    }, { status: 500 });
  }
}


// POST to create or update user profile
export async function POST(request: NextRequest) {
  const clientForWrite = supabaseAdmin || supabase;

  if (!clientForWrite) {
     const errorMsg = supabaseAdmin ? '[API /api/account/profile POST] Admin Supabase client (service_role) is not initialized.' : '[API /api/account/profile POST] Public Supabase client (fallback) is not initialized.';
     console.error(errorMsg + ' Check environment variables, especially SUPABASE_SERVICE_ROLE_KEY, and server restart.');
     return NextResponse.json({
         message: 'Database client (for write) not configured. Please check server logs and .env file.',
         rawSupabaseError: { message: 'Supabase client for write operations not initialized.' }
     }, { status: 503 });
  }
  if (!supabaseAdmin) {
    console.warn("[API /api/account/profile POST] WARNING: Using public anon key for profile creation/update because SUPABASE_SERVICE_ROLE_KEY is likely not set. RLS policies for 'anon' role on 'users' table will apply for UPSERT.");
  }

  let requestBody: ProfileUpdateRequestBody;
  try {
    requestBody = await request.json();
  } catch (e) {
    console.error('[API /api/account/profile POST] Error parsing request JSON:', e);
    return NextResponse.json({ message: 'Invalid request body. Expected JSON.', errorDetails: (e as Error).message }, { status: 400 });
  }
  console.log("[API /api/account/profile POST] Parsed request body (rawBody):", JSON.stringify(requestBody, null, 2));
  
  const userIdToProcess = requestBody.id; // Expect 'id' from client (Firebase UID)
  const { name, avatarUrl, email, roles, wishlist } = requestBody;

  if (!userIdToProcess) {
    console.warn("[API /api/account/profile POST] User ID ('id' field) is required in request body for upsert.");
    return NextResponse.json({ message: "User ID ('id' field) is required for upsert" }, { status: 400 });
  }
  if (!email) {
      console.warn(`[API /api/account/profile POST] Email is required for profile creation/update (UID ${userIdToProcess}).`);
      return NextResponse.json({ message: 'Email is required.' }, { status: 400 });
  }
  console.log(`[API /api/account/profile POST] Processing upsert for user ID: ${userIdToProcess}`);

  // Data for upsert. For a new user, these will be the initial values.
  // For an existing user, these will be the fields to update.
  const profileDataToUpsert: Partial<AuthUserType> & { id: string; email: string; updatedAt: string; createdAt?: string } = {
    id: userIdToProcess,
    email: email,
    name: name || email.split('@')[0] || 'New User',
    "avatarUrl": avatarUrl === undefined ? null : avatarUrl, // Ensure null if undefined
    updatedAt: new Date().toISOString(),
  };

  // Only set roles and wishlist if they are provided in the request.
  // For initial creation, 'useAuth' sends default roles and empty wishlist.
  // For updates, the client should send the current roles/wishlist if not changing them,
  // or the new ones if they are changing. RLS should protect role changes for non-admins.
  if (roles !== undefined) {
    profileDataToUpsert.roles = roles;
  }
  if (wishlist !== undefined) {
    profileDataToUpsert.wishlist = wishlist;
  }
  
  // Special handling for admin role assignment based on email during initial creation
  // This is typically done when the profile is first created, so we check if it's 'sagarrana@gmail.com'
  // and ensure 'admin' role is added. This logic might be better if checked against existing roles.
  if ((email === 'sagarrana@gmail.com' || email === 'sagarbikramrana7@gmail.com')) {
    profileDataToUpsert.roles = Array.from(new Set([...(profileDataToUpsert.roles || ['customer']), 'admin']));
  } else if (profileDataToUpsert.roles === undefined) { // Ensure default role if not admin
    profileDataToUpsert.roles = ['customer'];
  }
  if (profileDataToUpsert.wishlist === undefined) {
      profileDataToUpsert.wishlist = [];
  }


  // On conflict on 'id', Supabase will perform an update.
  // Otherwise, it will insert.
  console.log(`[API /api/account/profile POST] Data for Supabase UPSERT for UID ${userIdToProcess} (using ${clientForWrite === supabaseAdmin ? 'ADMIN client' : 'PUBLIC client'}):`, JSON.stringify(profileDataToUpsert, null, 2));

  try {
    const { data: upsertedUser, error: upsertError } = await clientForWrite
      .from('users')
      .upsert(profileDataToUpsert, { onConflict: 'id' }) // Upsert on 'id' (Firebase UID)
      .select()
      .single();

    if (upsertError) {
      let specificMessage = 'Failed to create or update profile in database.';
      if (upsertError.code === '42501') { // RLS violation
        specificMessage = 'Database Row Level Security (RLS) policy violation prevents profile creation/update. Please check INSERT/UPDATE policy for the acting role on "users" table in Supabase.';
      } else if (upsertError.code === '23505') { // Unique constraint violation
          if (upsertError.message.includes('users_email_key')) {
            specificMessage = `Error: Email '${email}' already exists. Please use a different email.`;
          } else if (upsertError.message.includes('users_pkey')) {
            specificMessage = `Error: User ID '${userIdToProcess}' already exists with a different email. This should not happen if UIDs are unique.`;
          } else {
            specificMessage = `Error: A unique value constraint was violated. ${upsertError.message}`;
          }
      } else {
        specificMessage = `Supabase error: ${upsertError.message}`;
      }
      console.error(`[API /api/account/profile POST] Supabase error upserting profile for UID ${userIdToProcess}:`, upsertError);
      return NextResponse.json({
        message: specificMessage,
        rawSupabaseError: { message: upsertError.message, details: upsertError.details, hint: upsertError.hint, code: upsertError.code }
      }, { status: 500 });
    }

    if (!upsertedUser) {
        console.error(`[API /api/account/profile POST] Upsert operation for UID ${userIdToProcess} returned no data and no error. This is unexpected.`);
        return NextResponse.json({ message: 'Profile operation completed but returned no data. Please check server logs.'}, {status: 500});
    }

    console.log(`[API /api/account/profile POST] Profile upserted successfully for UID ${userIdToProcess}.`);
    const responseUser = { ...upsertedUser, wishlist: upsertedUser.wishlist || [] };
    return NextResponse.json({ message: `Profile created/updated successfully`, user: responseUser });

  } catch (error: any) {
    console.error(`[API /api/account/profile POST] Unhandled error during profile upsert operation for user ID ${userIdToProcess}:`, error);
    return NextResponse.json({
        message: 'Server error processing profile operation.',
        errorDetails: error.message,
        rawSupabaseError: { message: error.message, code: error.code || 'UNKNOWN_SERVER_ERROR_PROFILE_POST' }
    }, { status: 500 });
  }
}
