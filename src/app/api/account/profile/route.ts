
// /src/app/api/account/profile/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient.ts'; // Relative path
import type { User as AuthUserType } from '@/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get('uid');
  
  console.log(`[API /api/account/profile GET] Request URL: ${request.url}`);
  console.log(`[API /api/account/profile GET] Extracted UID from searchParams: ${uid}`);

  if (!supabase) {
    console.error('[API /api/account/profile GET] Supabase client is not initialized. Check environment variables and server restart.');
    return NextResponse.json({ message: 'Database client not configured. Please check server logs and .env file.' }, { status: 503 });
  }

  if (!uid) {
    console.warn("[API /api/account/profile GET] User ID (uid) is required in query parameters.");
    return NextResponse.json({ message: 'User ID (uid) is required' }, { status: 400 });
  }

  try {
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', uid)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`[API /api/account/profile GET] Profile not found in Supabase for uid ${uid}.`);
        return NextResponse.json({ message: 'Profile not found' }, { status: 404 });
      }
      console.error(`[API /api/account/profile GET] Supabase error fetching profile for uid ${uid}:`, JSON.stringify(error, null, 2));
      return NextResponse.json({ 
        message: 'Error fetching profile from database.', 
        rawSupabaseError: {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        }
      }, { status: 500 });
    }

    if (profile) {
      console.log(`[API /api/account/profile GET] Found profile for ${uid} in Supabase.`);
      const responseProfile = { ...profile, wishlist: profile.wishlist || [] };
      return NextResponse.json(responseProfile);
    } else {
      // This case should also be caught by error.code === 'PGRST116' if .single() is used
      console.log(`[API /api/account/profile GET] Profile not found for uid ${uid} (data was null) after Supabase query.`);
      return NextResponse.json({ message: 'Profile not found (data null)' }, { status: 404 });
    }
  } catch (catchError: any) {
    console.error(`[API /api/account/profile GET] Unhandled exception fetching profile for uid ${uid}:`, catchError);
    return NextResponse.json({ message: 'Server error fetching profile.', error: catchError.message }, { status: 500 });
  }
}

interface ProfileUpdateRequest {
  uid: string;
  name?: string;
  avatarUrl?: string | null;
  email?: string; 
  roles?: string[];
  wishlist?: string[];
}

export async function POST(request: NextRequest) {
  console.log("[API /api/account/profile POST] Request received.");
  if (!supabase) {
    console.error('[API /api/account/profile POST] Supabase client is not initialized. Check environment variables and server restart.');
    return NextResponse.json({ message: 'Database client not configured. Please check server logs and .env file.' }, { status: 503 });
  }
  try {
    const body = (await request.json()) as ProfileUpdateRequest;
    const { uid, name, avatarUrl, email, roles, wishlist } = body;

    if (!uid) {
      return NextResponse.json({ message: 'User ID (uid) is required for update/create' }, { status: 400 });
    }

    const profileDataToUpsert: Partial<AuthUserType> & { id: string } = {
      id: uid,
      email: email,
    };

    if (name !== undefined) profileDataToUpsert.name = name;
    if (avatarUrl !== undefined) profileDataToUpsert.avatarUrl = avatarUrl === null ? undefined : avatarUrl;
    if (roles !== undefined) profileDataToUpsert.roles = roles;
    if (wishlist !== undefined) profileDataToUpsert.wishlist = wishlist;
    
    // @ts-ignore
    profileDataToUpsert.updatedAt = new Date().toISOString();

    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id, "createdAt"')
      .eq('id', uid)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
        console.error(`[API /api/account/profile POST] Error checking for existing user ${uid}:`, JSON.stringify(fetchError, null, 2));
        return NextResponse.json({ 
          message: 'Error accessing user data.', 
          rawSupabaseError: {
            message: fetchError.message,
            details: fetchError.details,
            hint: fetchError.hint,
            code: fetchError.code
          }
        }, { status: 500 });
    }

    let finalUserData;

    if (existingUser) {
      console.log(`[API /api/account/profile POST] Updating existing profile for ${uid}`);
      const { error: updateError, data: updatedUser } = await supabase
        .from('users')
        .update(profileDataToUpsert)
        .eq('id', uid)
        .select()
        .single();
      
      if (updateError) {
        console.error(`[API /api/account/profile POST] Supabase error updating profile for ${uid}:`, JSON.stringify(updateError, null, 2));
        return NextResponse.json({ 
          message: 'Failed to update profile in database.', 
          rawSupabaseError: {
            message: updateError.message,
            details: updateError.details,
            hint: updateError.hint,
            code: updateError.code
          }
        }, { status: 500 });
      }
      finalUserData = updatedUser;
      console.log(`[API /api/account/profile POST] Profile updated for ${uid}.`);
    } else {
      console.log(`[API /api/account/profile POST] Creating new profile for ${uid}`);
      // @ts-ignore
      profileDataToUpsert.createdAt = new Date().toISOString();
      const { error: insertError, data: insertedUser } = await supabase
        .from('users')
        .insert(profileDataToUpsert)
        .select()
        .single();

      if (insertError) {
        console.error(`[API /api/account/profile POST] Supabase error inserting profile for ${uid}:`, JSON.stringify(insertError, null, 2));
        return NextResponse.json({ 
          message: 'Failed to create profile in database.', 
          rawSupabaseError: {
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint,
            code: insertError.code
          }
        }, { status: 500 });
      }
      finalUserData = insertedUser;
      console.log(`[API /api/account/profile POST] Profile created for ${uid}.`);
    }
    
    const responseUser = { ...finalUserData, wishlist: finalUserData.wishlist || [] };
    return NextResponse.json({ message: 'Profile updated successfully', user: responseUser });

  } catch (error: any) {
    console.error('[API /api/account/profile POST] Unhandled error processing profile update:', error);
    return NextResponse.json({ message: 'Error updating user profile', error: error.message }, { status: 500 });
  }
}
