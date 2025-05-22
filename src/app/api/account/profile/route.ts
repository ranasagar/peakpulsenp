
// /src/app/api/account/profile/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient.ts';
import type { User as AuthUserType } from '@/types';

export const dynamic = 'force-dynamic';

interface ProfileUpdateRequestBody {
  id?: string; // Firebase UID is expected as 'id'
  name?: string;
  avatarUrl?: string | null;
  email?: string; // Email is crucial for new profiles
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
      .eq('id', uidFromQuery)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116' || fetchError.message.includes('Results contain 0 rows')) {
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
    const responseProfile = { ...profile, wishlist: profile.wishlist || [] };
    return NextResponse.json(responseProfile);

  } catch (catchError: any) {
    console.error(`[API /api/account/profile GET] Unhandled exception fetching profile for uid ${uidFromQuery}:`, catchError);
    return NextResponse.json({ 
        message: 'Server error fetching profile.', 
        error: catchError.message,
        rawSupabaseError: { message: catchError.message, code: catchError.code }
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
  
  console.log("[API /api/account/profile POST] Parsed request body (rawBody):", JSON.stringify(rawBody, null, 2));
  const requestBody = rawBody as ProfileUpdateRequestBody;
  
  const userIdToProcess = requestBody.id; // Expect 'id' from client now
  const { name, avatarUrl, email, roles, wishlist } = requestBody;

  if (!userIdToProcess) {
    console.warn("[API /api/account/profile POST] User ID (id from requestBody.id) is required.");
    return NextResponse.json({ message: "User ID (id) is required for update/create" }, { status: 400 });
  }
  console.log(`[API /api/account/profile POST] Processing for user ID: ${userIdToProcess}`);

  try {
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id, "createdAt", roles, wishlist')
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
      console.log(`[API /api/account/profile POST] Updating existing profile for UID: ${userIdToProcess}`);
      const profileDataToUpdate: Partial<Omit<AuthUserType, 'id' | 'email' | 'createdAt' | 'roles' | 'wishlist'>> & { updatedAt: string } = {
        updatedAt: new Date().toISOString(),
      };
      if (name !== undefined) profileDataToUpdate.name = name;
      if (avatarUrl !== undefined) profileDataToUpdate.avatarUrl = avatarUrl === null ? undefined : avatarUrl;
      // Roles and wishlist are typically managed by dedicated endpoints or admin actions by authorized users.
      // Users should not update their own roles here. Wishlist is updated via wishlist APIs.

      console.log(`[API /api/account/profile POST] Data for update for UID ${userIdToProcess}:`, JSON.stringify(profileDataToUpdate, null, 2));
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
      if (!email) {
        console.warn(`[API /api/account/profile POST] Email is required for new profile creation for UID ${userIdToProcess}.`);
        return NextResponse.json({ message: 'Email is required for new profile creation.' }, { status: 400 });
      }

      // Simplified payload for initial insert, relying on DB defaults for roles and wishlist
      const profileDataToInsert = {
        id: userIdToProcess,
        email: email,
        name: name || email.split('@')[0] || 'New User',
        "avatarUrl": avatarUrl === null ? undefined : avatarUrl, // Match Supabase column name
        // roles and wishlist will use DB defaults: {'customer'} and {}
        // createdAt and updatedAt will use DB defaults: now()
      };
      
      console.log(`[API /api/account/profile POST] Data for insert for UID ${userIdToProcess}:`, JSON.stringify(profileDataToInsert, null, 2));
      
      // Explicitly type what we are inserting to match a subset of AuthUserType
      const insertPayload: Pick<AuthUserType, 'id' | 'email' | 'name'> & { avatarUrl?: string } = profileDataToInsert;

      const { data: insertedUser, error: insertError } = await supabase
        .from('users')
        .insert(insertPayload) 
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
    console.error(`[API /api/account/profile POST] Unhandled error processing profile for UID ${userIdToProcess}:`, JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return NextResponse.json({ 
        message: 'Server error processing profile operation.', 
        error: error.message,
        rawSupabaseError: { message: error.message, code: error.code, details: error.details, hint: error.hint }
    }, { status: 500 });
  }
}
    