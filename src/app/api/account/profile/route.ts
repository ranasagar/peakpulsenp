// /src/app/api/account/profile/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase, supabaseAdmin } from '../../../../lib/supabaseClient.ts';
import type { User as AuthUserType } from '@/types';

export const dynamic = 'force-dynamic';

interface ProfileUpdateRequestBody {
  id: string; // Firebase UID
  name?: string;
  avatarUrl?: string | null;
  email: string; // Required for new profiles
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
      .single();

    if (fetchError) {
      const isNotFound = fetchError.code === 'PGRST116';
      const errorMessage = isNotFound ? 'Profile not found' : 'Error fetching profile from database.';
      const specificMessage = isNotFound
          ? `Profile not found. Supabase: ${fetchError.message}. Details: ${fetchError.details || 'N/A'}. Hint: ${fetchError.hint || 'N/A'}. Code: ${fetchError.code}.`
          : `Error fetching profile. Supabase: ${fetchError.message}. Details: ${fetchError.details || 'N/A'}. Hint: ${fetchError.hint || 'N/A'}. Code: ${fetchError.code}.`;
      
      console.error(`[API /api/account/profile GET] Supabase error fetching profile for uid ${uidFromQuery}${isNotFound ? ' (Profile not found)' : ''}:`, specificMessage, fetchError);
      
      return NextResponse.json({
        message: errorMessage,
        rawSupabaseError: { message: fetchError.message, details: fetchError.details, hint: fetchError.hint, code: fetchError.code }
      }, { status: isNotFound ? 404 : 500 });
    }
    
    if (!profile) {
      console.warn(`[API /api/account/profile GET] Profile not found for ${uidFromQuery} (data was null after query).`);
      return NextResponse.json({
        message: 'Profile not found',
        rawSupabaseError: { message: 'No profile data returned from database (PGRST116 implied).', code: 'PGRST116_MANUAL' }
      }, { status: 404 });
    }

    console.log(`[API /api/account/profile GET] Profile found for ${uidFromQuery} in Supabase.`);
    const responseProfile = { ...profile, wishlist: profile.wishlist || [] };
    return NextResponse.json(responseProfile);

  } catch (catchError: any) {
    console.error(`[API /api/account/profile GET] Unhandled exception fetching profile for uid ${uidFromQuery}:`, catchError);
    return NextResponse.json({
        message: 'Server error fetching profile.',
        errorDetails: catchError.message,
        rawSupabaseError: { message: catchError.message, code: catchError.code || 'UNKNOWN_SERVER_ERROR_PROFILE_GET', details: catchError.details, hint: catchError.hint }
    }, { status: 500 });
  }
}

// POST to create or update user profile
export async function POST(request: NextRequest) {
  const clientForWrite = supabaseAdmin || supabase; // Prefer admin client for writes to bypass RLS for this system op

  if (!clientForWrite) {
     const errorMsg = supabaseAdmin ? '[API /api/account/profile POST] Admin Supabase client (service_role) is not initialized.' : '[API /api/account/profile POST] Public Supabase client (fallback) is not initialized.';
     console.error(errorMsg + ' Check environment variables, especially SUPABASE_SERVICE_ROLE_KEY, and server restart.');
     return NextResponse.json({
         message: 'Database client (for write) not configured. Please check server logs and .env file.',
         rawSupabaseError: { message: 'Supabase client for write operations not initialized.' }
     }, { status: 503 });
  }
  if (!supabaseAdmin) {
    console.warn("[API /api/account/profile POST] WARNING: Using public anon key for profile creation/update because SUPABASE_SERVICE_ROLE_KEY is likely not set. RLS policies for 'anon' role on 'users' table will apply.");
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
    console.warn("[API /api/account/profile POST] User ID ('id' field) is required in request body.");
    return NextResponse.json({ message: "User ID ('id' field) is required for update/create" }, { status: 400 });
  }
  if (!email) {
      console.warn(`[API /api/account/profile POST] Email is required for profile creation/update (UID ${userIdToProcess}).`);
      return NextResponse.json({ message: 'Email is required for profile.', rawSupabaseError: {message: 'Email is required.'} }, { status: 400 });
  }
  console.log(`[API /api/account/profile POST] Processing request for user ID: ${userIdToProcess}. Using ${clientForWrite === supabaseAdmin ? "ADMIN client" : "PUBLIC client"}.`);

  try {
    // Check if user already exists
    const { data: existingUser, error: selectError } = await clientForWrite
      .from('users')
      .select('id, roles, wishlist') // Select only what's needed for merging logic
      .eq('id', userIdToProcess)
      .maybeSingle();

    if (selectError && selectError.code !== 'PGRST116') { // PGRST116 means 0 rows, which is fine for a new user
      console.error(`[API /api/account/profile POST] Supabase error selecting existing user ${userIdToProcess}:`, selectError);
      return NextResponse.json({
        message: 'Error checking existing user profile.',
        rawSupabaseError: { message: selectError.message, details: selectError.details, hint: selectError.hint, code: selectError.code }
      }, { status: 500 });
    }

    let finalUserData;
    let operationType = '';

    if (existingUser) {
      // User exists, prepare for update
      operationType = 'UPDATE';
      const dataToUpdate: Partial<AuthUserType> & { updatedAt: string } = {
        name: name || existingUser.name || email.split('@')[0],
        "avatarUrl": avatarUrl === undefined ? existingUser.avatarUrl : avatarUrl, // Use existing if undefined, allow null to clear
        email: email, // Keep email consistent, Firebase Auth is source of truth for email
        // Retain existing roles and wishlist if not explicitly provided for update,
        // or merge if new ones are provided (though client form doesn't send these for update)
        roles: roles || existingUser.roles || ['customer'],
        wishlist: wishlist || existingUser.wishlist || [],
        updatedAt: new Date().toISOString(),
      };
      // Special handling for admin assignment
      if (email === 'sagarrana@gmail.com' || email === 'sagarbikramrana7@gmail.com') {
        dataToUpdate.roles = Array.from(new Set([...(dataToUpdate.roles || ['customer']), 'admin']));
      }


      console.log(`[API /api/account/profile POST] Data for update for UID ${userIdToProcess}:`, JSON.stringify(dataToUpdate, null, 2));
      const { data: updatedUser, error: updateError } = await clientForWrite
        .from('users')
        .update(dataToUpdate)
        .eq('id', userIdToProcess)
        .select()
        .single();
      
      if (updateError) throw updateError;
      finalUserData = updatedUser;

    } else {
      // User does not exist, prepare for insert
      operationType = 'INSERT';
      let initialRoles = roles || ['customer'];
      if (email === 'sagarrana@gmail.com' || email === 'sagarbikramrana7@gmail.com') {
        initialRoles = Array.from(new Set([...initialRoles, 'admin']));
      }

      const dataToInsert: Omit<AuthUserType, 'wishlist'> & { wishlist: string[], createdAt: string, updatedAt: string } = {
        id: userIdToProcess,
        email: email,
        name: name || email.split('@')[0] || 'New User',
        "avatarUrl": avatarUrl === undefined ? null : avatarUrl,
        roles: initialRoles,
        wishlist: wishlist || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      console.log(`[API /api/account/profile POST] Data for insert for UID ${userIdToProcess}:`, JSON.stringify(dataToInsert, null, 2));
      const { data: insertedUser, error: insertError } = await clientForWrite
        .from('users')
        .insert(dataToInsert)
        .select()
        .single();
      
      if (insertError) throw insertError;
      finalUserData = insertedUser;
    }

    if (!finalUserData) {
        console.error(`[API /api/account/profile POST] Supabase ${operationType} operation for UID ${userIdToProcess} returned no data and no error. This is unexpected.`);
        return NextResponse.json({ message: `Profile ${operationType.toLowerCase()} operation returned no data.`}, {status: 500});
    }
    
    console.log(`[API /api/account/profile POST] Profile ${operationType.toLowerCase()}d successfully for UID ${userIdToProcess}.`);
    const responseUser = { ...finalUserData, wishlist: finalUserData.wishlist || [] };
    return NextResponse.json({ message: `Profile ${operationType.toLowerCase()}d successfully`, user: responseUser });

  } catch (error: any) {
    console.error(`[API /api/account/profile POST] Error during profile ${requestBody.id ? 'update' : 'creation'} for user ID ${userIdToProcess}:`, error);
    let errorMessage = 'Failed to create profile in database.';
    let errorDetails = {};

    if (error.code) { // Likely a Supabase error
      errorMessage = `Supabase error: ${error.message}`;
      errorDetails = { message: error.message, details: error.details, hint: error.hint, code: error.code };
      if (error.code === '42501') { // RLS violation
        errorMessage = 'Database Row Level Security (RLS) policy violation prevents profile creation. Please check INSERT policy for "anon" role on "users" table in Supabase.';
      } else if (error.code === '23505' && error.message.includes('users_email_key')) { // Unique constraint on email
        errorMessage = `Error: The email address '${email}' is already registered.`;
      } else if (error.code === '23505' && error.message.includes('users_pkey')) { // Unique constraint on id (PK)
        errorMessage = `Error: A profile for this user ID already exists.`;
      }
    } else {
      errorMessage = error.message || errorMessage;
    }
    
    return NextResponse.json({
        message: errorMessage,
        rawSupabaseError: errorDetails
    }, { status: 500 });
  }
}
