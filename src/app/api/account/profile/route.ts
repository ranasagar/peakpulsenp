
// /src/app/api/account/profile/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient'; // Relative path
import type { User as AuthUserType } from '@/types';

export const dynamic = 'force-dynamic';

interface ProfileUpdateRequestBody {
  id?: string; // Firebase UID, now correctly named 'id' from client
  uid?: string; // Keep for backward compatibility if some client still sends 'uid'
  name?: string;
  avatarUrl?: string | null;
  email?: string; 
  roles?: string[];
  wishlist?: string[];
}


// GET user profile
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const uidFromQuery = searchParams.get('uid'); // Firebase UID from query
  
  console.log(`[API /api/account/profile GET] Request URL: ${request.url}`);
  console.log(`[API /api/account/profile GET] Extracted UID from searchParams: ${uidFromQuery}`);

  if (!supabase) {
    console.error('[API /api/account/profile GET] Supabase client is not initialized. Check environment variables and server restart.');
    return NextResponse.json({ 
        message: 'Database client not configured. Please check server logs and .env file.',
        rawSupabaseError: { message: 'Supabase client not initialized on server for GET.' } 
    }, { status: 503 });
  }

  if (!uidFromQuery) {
    console.warn("[API /api/account/profile GET] User ID (uid) is required in query parameters.");
    return NextResponse.json({ message: 'User ID (uid) is required' }, { status: 400 });
  }

  try {
    const { data: profile, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', uidFromQuery) // Compare with 'id' column in Supabase, which should store Firebase UID
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') { // Row not found
        console.log(`[API /api/account/profile GET] Profile not found in Supabase for uid ${uidFromQuery}.`);
        return NextResponse.json({ message: 'Profile not found' }, { status: 404 });
      }
      console.error(`[API /api/account/profile GET] Supabase error fetching profile for uid ${uidFromQuery}:`, JSON.stringify(fetchError, null, 2));
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
    
    console.log(`[API /api/account/profile GET] Found profile for ${uidFromQuery} in Supabase.`);
    const responseProfile = { ...profile, wishlist: profile.wishlist || [] };
    return NextResponse.json(responseProfile);

  } catch (catchError: any) {
    console.error(`[API /api/account/profile GET] Unhandled exception fetching profile for uid ${uidFromQuery}:`, catchError);
    let errorMessage = 'Server error fetching profile.';
    if (catchError.message && catchError.message.includes("uuid") && catchError.message.includes("type text")) {
        errorMessage += " Check if the 'id' column in the 'users' table is of type TEXT to store Firebase UIDs, not UUID.";
    }
    return NextResponse.json({ message: errorMessage, error: catchError.message, code: catchError.code }, { status: 500 });
  }
}


// POST to create or update user profile
export async function POST(request: NextRequest) {
  console.log("[API /api/account/profile POST] Request received.");

  if (!supabase) {
    console.error('[API /api/account/profile POST] Supabase client is not initialized. Check environment variables and server restart.');
    return NextResponse.json({ 
        message: 'Database client not configured. Please check server logs and .env file.',
        rawSupabaseError: { message: 'Supabase client not initialized on server for POST.' } 
    }, { status: 503 });
  }

  let requestBody: ProfileUpdateRequestBody;
  try {
    const rawBody = await request.json();
    requestBody = rawBody as ProfileUpdateRequestBody;
    console.log("[API /api/account/profile POST] Parsed request body (rawBody):", JSON.stringify(rawBody, null, 2));
    console.log("[API /api/account/profile POST] Parsed request body (destructured target):", JSON.stringify(requestBody, null, 2));
  } catch (e) {
    console.error('[API /api/account/profile POST] Error parsing request JSON:', e);
    return NextResponse.json({ message: 'Invalid request body. Expected JSON.', error: (e as Error).message }, { status: 400 });
  }
  
  // Prefer `id` from body, fallback to `uid` for any old client sending it
  const userIdToProcess = requestBody.id || requestBody.uid; 
  const { name, avatarUrl, email, roles, wishlist } = requestBody;

  if (!userIdToProcess) {
    console.warn("[API /api/account/profile POST] User ID (expected as 'id' or 'uid' in requestBody) is required.");
    return NextResponse.json({ message: "User ID (expected as 'id' or 'uid') is required for update/create" }, { status: 400 });
  }
  console.log(`[API /api/account/profile POST] Processing for user ID: ${userIdToProcess}`);


  try {
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id, "createdAt", roles, wishlist')
      .eq('id', userIdToProcess)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means not found, which is fine for creation
        console.error(`[API /api/account/profile POST] Supabase error checking for existing user ${userIdToProcess}:`, JSON.stringify(fetchError, null, 2));
        return NextResponse.json({ 
          message: 'Error accessing user data from database.', 
          rawSupabaseError: { message: fetchError.message, details: fetchError.details, hint: fetchError.hint, code: fetchError.code }
        }, { status: 500 });
    }

    let finalUserData;

    if (existingUser) {
      console.log(`[API /api/account/profile POST] Updating existing profile for UID: ${userIdToProcess}`);
      const profileDataToUpdate: Partial<Omit<AuthUserType, 'id' | 'email' | 'createdAt'>> & { updatedAt: string } = {
        updatedAt: new Date().toISOString(),
      };
      if (name !== undefined) profileDataToUpdate.name = name;
      if (avatarUrl !== undefined) profileDataToUpdate.avatarUrl = avatarUrl === null ? undefined : avatarUrl;
      // Roles & wishlist are typically managed by specific endpoints or admin actions for existing users.
      // Avoid letting users update their own roles directly here unless explicitly intended and secured.
      // if (roles !== undefined) profileDataToUpdate.roles = roles; // Be cautious with this
      // if (wishlist !== undefined) profileDataToUpdate.wishlist = wishlist; // Wishlist usually has dedicated add/remove APIs

      console.log(`[API /api/account/profile POST] Data for update for UID ${userIdToProcess}:`, profileDataToUpdate);
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update(profileDataToUpdate)
        .eq('id', userIdToProcess)
        .select()
        .single();
      
      if (updateError) {
        console.error(`[API /api/account/profile POST] Supabase error updating profile for UID ${userIdToProcess}:`, JSON.stringify(updateError, null, 2));
        return NextResponse.json({ 
          message: 'Failed to update profile in database.', 
          rawSupabaseError: { message: updateError.message, details: updateError.details, hint: updateError.hint, code: updateError.code }
        }, { status: 500 });
      }
      finalUserData = updatedUser;
      console.log(`[API /api/account/profile POST] Profile updated successfully for UID ${userIdToProcess}.`);
    } else {
      console.log(`[API /api/account/profile POST] Creating new profile for UID: ${userIdToProcess}`);
      // Ensure email is present for new profile creation based on Firebase Auth
      if (!email) {
        console.warn(`[API /api/account/profile POST] Email is required for new profile creation for UID ${userIdToProcess}.`);
        return NextResponse.json({ message: 'Email is required for new profile creation.' }, { status: 400 });
      }
      const defaultRoles = ['customer']; // Base default
      let assignedRoles = roles && roles.length > 0 ? [...new Set([...roles, ...defaultRoles])] : defaultRoles;
      if (email === 'sagarrana@gmail.com' && !assignedRoles.includes('admin')) {
        assignedRoles = [...new Set([...assignedRoles, 'admin'])];
      }


      const profileDataToInsert: Omit<AuthUserType, 'updatedAt' | 'createdAt'> & { createdAt?: string, updatedAt?: string } = {
        id: userIdToProcess,
        email: email,
        name: name || email.split('@')[0] || 'New User',
        avatarUrl: avatarUrl === null ? undefined : avatarUrl,
        roles: assignedRoles,
        wishlist: wishlist || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log(`[API /api/account/profile POST] Data for insert for UID ${userIdToProcess}:`, JSON.stringify(profileDataToInsert, null, 2));
      const { data: insertedUser, error: insertError } = await supabase
        .from('users')
        .insert(profileDataToInsert)
        .select()
        .single();

      if (insertError) {
        console.error(`[API /api/account/profile POST] Supabase error inserting profile for UID ${userIdToProcess}:`, JSON.stringify(insertError, null, 2));
        return NextResponse.json({ 
          message: 'Failed to create profile in database.', 
          rawSupabaseError: { message: insertError.message, details: insertError.details, hint: insertError.hint, code: insertError.code }
        }, { status: 500 });
      }
      finalUserData = insertedUser;
      console.log(`[API /api/account/profile POST] Profile created successfully for UID ${userIdToProcess}.`);
    }
    
    const responseUser = { ...finalUserData, wishlist: finalUserData?.wishlist || [] };
    return NextResponse.json({ message: 'Profile operation successful', user: responseUser });

  } catch (error: any) {
    console.error(`[API /api/account/profile POST] Unhandled error processing profile for UID ${userIdToProcess}:`, error);
    return NextResponse.json({ 
        message: 'Server error processing profile operation.', 
        error: error.message,
        stack: error.stack // Include stack for better debugging if available
    }, { status: 500 });
  }
}
