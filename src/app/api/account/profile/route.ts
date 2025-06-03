
// /src/app/api/account/profile/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase, supabaseAdmin } from '../../../../lib/supabaseClient.ts';
import type { User as AuthUserType } from '@/types';

export const dynamic = 'force-dynamic';

interface ProfileUpdateRequestBody {
  id: string; // Firebase UID
  name?: string;
  avatarUrl?: string | null; // Client sends avatarUrl
  bio?: string | null; // Client sends bio
  email: string; // Required for new profiles
  roles?: string[];
  wishlist?: string[];
  bookmarked_post_ids?: string[];
}

function isValidUUID(str: string | undefined | null): boolean {
  if (!str) return false;
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(str);
}

// GET user profile
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const uidFromQuery = requestUrl.searchParams.get('uid');

  console.log(`[API /api/account/profile GET] Entry point. Request URL: ${requestUrl.toString()}`);
  console.log(`[API /api/account/profile GET] Extracted UID from searchParams: ${uidFromQuery}`);


  if (!supabase) {
    console.error('[API /api/account/profile GET] Public Supabase client is not initialized. Check environment variables and server restart.');
    return NextResponse.json({
        message: 'Database client (public) not configured. Please check server logs and .env file for NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
        rawSupabaseError: { message: 'Public Supabase client not initialized on server for GET.' }
    }, { status: 503 });
  }


  if (!uidFromQuery) {
    console.warn("[API /api/account/profile GET] User ID (uid) is required in query parameters. Responding 400.");
    return NextResponse.json({ message: 'User ID (uid) is required' }, { status: 400 });
  }
  if (!isValidUUID(uidFromQuery)) {
     console.warn(`[API /api/account/profile GET] Invalid UID format received: ${uidFromQuery}`);
     return NextResponse.json({ message: 'Invalid User ID format. Must be a valid UUID.' }, { status: 400 });
  }

  console.log(`[API /api/account/profile GET] Attempting to fetch profile for UID: ${uidFromQuery}`);
  try {
    const baseSelectFields = 'id, email, name, avatar_url, bio, roles, wishlist, bookmarked_post_ids, "createdAt", "updatedAt"';
    
    const { data: profile, error: fetchError } = await supabase
      .from('users')
      .select(baseSelectFields)
      .eq('id', uidFromQuery)
      .single();

    if (fetchError) {
      const isNotFound = fetchError.code === 'PGRST116'; 
      const isUndefinedColumn = fetchError.code === '42703'; 
      
      let errorMessage = 'Error fetching profile from database.';
      if (isNotFound) errorMessage = 'Profile not found.';
      if (isUndefinedColumn) errorMessage = `Database schema mismatch: ${fetchError.message}. Ensure migrations are run.`;
      
      const specificMessage = `Supabase: ${fetchError.message}. Details: ${fetchError.details || 'N/A'}. Hint: ${fetchError.hint || 'N/A'}. Code: ${fetchError.code}.`;
      console.error(`[API /api/account/profile GET] Supabase error fetching profile for uid ${uidFromQuery}${isNotFound ? ' (Profile not found)' : isUndefinedColumn ? ' (Undefined column)' : ''}:`, specificMessage, fetchError);
      
      return NextResponse.json({
        message: errorMessage,
        rawSupabaseError: { message: fetchError.message, details: fetchError.details, hint: fetchError.hint, code: fetchError.code }
      }, { status: isNotFound ? 404 : (isUndefinedColumn ? 500 : 500) });
    }
    
    if (!profile) {
      console.warn(`[API /api/account/profile GET] Profile not found for ${uidFromQuery} (data was null after query). Responding 404.`);
      return NextResponse.json({
        message: 'Profile not found',
        rawSupabaseError: { message: 'No profile data returned from database (PGRST116 implied).', code: 'PGRST116_MANUAL' }
      }, { status: 404 });
    }

    console.log(`[API /api/account/profile GET] Profile found for ${uidFromQuery} in Supabase.`);
    const responseProfile: AuthUserType = {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.avatar_url, 
        bio: profile.bio,             
        roles: profile.roles || ['customer'],
        wishlist: profile.wishlist || [],
        bookmarked_post_ids: profile.bookmarked_post_ids || [],
        createdAt: profile.createdAt || profile.created_at, 
        updatedAt: profile.updatedAt || profile.updated_at,
    };
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
    console.warn("[API /api/account/profile POST] WARNING: Using public anon key for profile creation/update because SUPABASE_SERVICE_ROLE_KEY is likely not set. RLS policies for 'anon' role on 'users' table will apply.");
  }

  let requestBody: ProfileUpdateRequestBody;
  try {
    requestBody = await request.json();
  } catch (e) {
    console.error('[API /api/account/profile POST] Error parsing request JSON:', e);
    return NextResponse.json({ message: 'Invalid request body. Expected JSON.', errorDetails: (e as Error).message }, { status: 400 });
  }
  console.log("[API /api/account/profile POST] Parsed request body:", JSON.stringify(requestBody, null, 2));
  
  const userIdToProcess = requestBody.id; 
  const { name, avatarUrl, bio, email, roles, wishlist, bookmarked_post_ids } = requestBody;

  if (!userIdToProcess || !isValidUUID(userIdToProcess)) {
    console.warn(`[API /api/account/profile POST] User ID ('id' field) is required and must be a valid UUID. Received: ${userIdToProcess}`);
    return NextResponse.json({ message: "User ID ('id' field) is required and must be a valid UUID for update/create" }, { status: 400 });
  }
  if (!email && !requestBody.hasOwnProperty('name')) { 
      console.warn(`[API /api/account/profile POST] Email is required for profile creation if name is not provided (UID ${userIdToProcess}).`);
      return NextResponse.json({ message: 'Email is required for profile creation if name is not set.', rawSupabaseError: {message: 'Email or Name is required.'} }, { status: 400 });
  }
  console.log(`[API /api/account/profile POST] Processing request for user ID: ${userIdToProcess}. Using ${clientForWrite === supabaseAdmin ? "ADMIN client" : "PUBLIC client"}.`);
  
  let operationType = '';
  try {
    const { data: existingUser, error: selectError } = await clientForWrite
      .from('users')
      .select('id, roles, wishlist, bookmarked_post_ids, name, bio, avatar_url, created_at, updated_at') 
      .eq('id', userIdToProcess)
      .maybeSingle();

    if (selectError && selectError.code !== 'PGRST116') { 
      console.error(`[API /api/account/profile POST] Supabase error selecting existing user ${userIdToProcess}:`, selectError);
      return NextResponse.json({
        message: 'Error checking existing user profile.',
        rawSupabaseError: { message: selectError.message, details: selectError.details, hint: selectError.hint, code: selectError.code }
      }, { status: 500 });
    }

    let finalUserData;
    
    if (existingUser) {
      operationType = 'UPDATE';
      const dataToUpdate: Partial<AuthUserType & { avatar_url?: string | null, bookmarked_post_ids?: string[], created_at?: string, updated_at?: string }> = {};

      if (name !== undefined) dataToUpdate.name = name;
      if (avatarUrl !== undefined) dataToUpdate.avatar_url = avatarUrl; 
      if (requestBody.hasOwnProperty('bio')) dataToUpdate.bio = bio; 
      
      if (roles !== undefined) dataToUpdate.roles = roles;
      if (wishlist !== undefined) dataToUpdate.wishlist = wishlist;
      if (bookmarked_post_ids !== undefined) dataToUpdate.bookmarked_post_ids = bookmarked_post_ids;


      if (Object.keys(dataToUpdate).length > 0) {
        dataToUpdate.updated_at = new Date().toISOString(); 
        console.log(`[API /api/account/profile POST] Data for update for UID ${userIdToProcess}:`, JSON.stringify(dataToUpdate, null, 2));
        const { data: updatedUser, error: updateError } = await clientForWrite
          .from('users')
          .update(dataToUpdate)
          .eq('id', userIdToProcess)
          .select('id, email, name, avatar_url, bio, roles, wishlist, bookmarked_post_ids, created_at, updated_at') 
          .single();
        if (updateError) throw updateError;
        finalUserData = updatedUser;
      } else {
        console.log(`[API /api/account/profile POST] No updatable fields sent for existing user ${userIdToProcess}. Returning current profile.`);
        finalUserData = existingUser; 
      }

    } else {
      operationType = 'INSERT';
      let initialRoles = roles || ['customer'];
      if (email && (email === 'sagarrana@gmail.com' || email === 'sagarbikramrana7@gmail.com')) {
        initialRoles = Array.from(new Set([...initialRoles, 'admin']));
      }

      const dataToInsert = {
        id: userIdToProcess,
        email: email, 
        name: name || email?.split('@')[0] || 'New User',
        avatar_url: avatarUrl, 
        bio: bio,
        roles: initialRoles,
        wishlist: wishlist || [],
        bookmarked_post_ids: bookmarked_post_ids || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      console.log(`[API /api/account/profile POST] Data for insert for UID ${userIdToProcess}:`, JSON.stringify(dataToInsert, null, 2));
      const { data: insertedUser, error: insertError } = await clientForWrite
        .from('users')
        .insert(dataToInsert)
        .select('id, email, name, avatar_url, bio, roles, wishlist, bookmarked_post_ids, created_at, updated_at')
        .single();
      
      if (insertError) throw insertError;
      finalUserData = insertedUser;
    }

    if (!finalUserData) {
        console.error(`[API /api/account/profile POST] Supabase ${operationType} operation for UID ${userIdToProcess} returned no data and no error. This is unexpected.`);
        return NextResponse.json({ message: `Profile ${operationType.toLowerCase()} operation returned no data.`}, {status: 500});
    }
    
    console.log(`[API /api/account/profile POST] Profile ${operationType.toLowerCase()}d successfully for UID ${userIdToProcess}.`);
    const responseUser: AuthUserType = {
        id: finalUserData.id,
        email: finalUserData.email,
        name: finalUserData.name,
        avatarUrl: finalUserData.avatar_url,
        bio: finalUserData.bio,
        roles: finalUserData.roles || ['customer'],
        wishlist: finalUserData.wishlist || [],
        bookmarked_post_ids: finalUserData.bookmarked_post_ids || [],
        createdAt: finalUserData.created_at,
        updatedAt: finalUserData.updated_at,
    };
    return NextResponse.json({ message: `Profile ${operationType.toLowerCase()}d successfully`, user: responseUser });

  } catch (error: any) {
    console.error(`[API /api/account/profile POST] Error during profile ${userIdToProcess ? 'update/creation' : 'creation'}:`, error);
    let errorMessage = `Failed to ${operationType ? operationType.toLowerCase() : 'process'} profile.`;
    let errorDetails = { message: error.message, code: error.code, details: error.details, hint: error.hint };

    if (error.code) { 
      errorMessage = `Supabase error: ${error.message}`;
      if (error.code === '42703') { 
          errorMessage = `Database schema error: ${error.message}. A required column might be missing (e.g., 'bio' or 'avatar_url'). Please ensure migrations are run.`;
      } else if (error.code === '42501') { 
        errorMessage = 'Database Row Level Security (RLS) policy violation. Check INSERT/UPDATE policy for "anon" or relevant role on "users" table in Supabase.';
      } else if (error.code === '23505' && error.message.includes('users_email_key')) { 
        errorMessage = `Error: The email address '${email}' is already registered.`;
      } else if (error.code === '23505' && error.message.includes('users_pkey')) { 
        errorMessage = `Error: A profile for user ID '${userIdToProcess}' already exists.`;
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
