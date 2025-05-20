
// /src/app/api/account/profile/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient.ts'; // Changed to relative path
import type { User as AuthUserType } from '@/types';

interface ProfileUpdateRequest {
  uid: string;
  name?: string;
  avatarUrl?: string;
  // Email changes are complex and should be handled via Firebase Auth SDK, not directly here
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get('uid');
  console.log(`[API /api/account/profile] GET request for uid: ${uid}`);

  if (!uid) {
    console.warn("[API /api/account/profile] User ID (uid) is required for GET, but not provided.");
    return NextResponse.json({ message: 'User ID (uid) is required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', uid)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.warn(`[API /api/account/profile] Profile not found in Supabase users table for uid: ${uid}. Supabase error:`, error);
        return NextResponse.json({ message: 'Profile not found in Supabase users table' }, { status: 404 });
      }
      console.error('[API /api/account/profile] Supabase error fetching user profile:', error);
      return NextResponse.json({ message: 'Error fetching user profile from Supabase', error: error.message, details: error.details }, { status: 500 });
    }

    if (data) {
      console.log(`[API /api/account/profile] Successfully fetched profile for uid: ${uid}`);
      return NextResponse.json(data as AuthUserType);
    } else {
      console.warn(`[API /api/account/profile] Profile not found (data was null) for uid: ${uid}, though no Supabase error.`);
      return NextResponse.json({ message: 'Profile not found in Supabase users table (data was null)' }, { status: 404 });
    }
  } catch (error) {
    console.error('[API /api/account/profile] Unhandled error fetching user profile:', error);
    return NextResponse.json({ message: 'Error fetching user profile', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  console.log("[API /api/account/profile] POST request received.");
  try {
    const body = (await request.json()) as ProfileUpdateRequest;
    const { uid, ...profileDataToUpdate } = body;

    if (!uid) {
      console.warn("[API /api/account/profile] User ID (uid) is required for POST update, but not provided.");
      return NextResponse.json({ message: 'User ID (uid) is required for update' }, { status: 400 });
    }

    const dataForSupabase: Partial<AuthUserType> & { updatedAt: string } = {
      name: profileDataToUpdate.name,
      avatarUrl: profileDataToUpdate.avatarUrl,
      updatedAt: new Date().toISOString(),
    };

    // Remove undefined fields before sending to Supabase
    Object.keys(dataForSupabase).forEach(key =>
      (dataForSupabase as any)[key] === undefined && delete (dataForSupabase as any)[key]
    );
    
    console.log(`[API /api/account/profile] Data for Supabase update/insert for uid ${uid}:`, dataForSupabase);

    // Upsert logic: update if exists, insert if not.
    // Supabase's .upsert() is ideal here.
    // We must provide the 'id' for the ON CONFLICT target.
    const { data: savedData, error: opError } = await supabase
      .from('users')
      .upsert({ id: uid, ...dataForSupabase }, { onConflict: 'id' })
      .select()
      .single();

    if (opError) {
      console.error('[API /api/account/profile] Supabase error saving user profile (upsert):', opError);
      return NextResponse.json({ message: 'Error saving user profile to Supabase', error: opError.message, details: opError.details }, { status: 500 });
    }

    if (!savedData) {
        console.error('[API /api/account/profile] User profile was not saved/returned after Supabase upsert, but no explicit error.');
        return NextResponse.json({ message: 'Profile operation completed but no data returned from Supabase.' }, { status: 500 });
    }

    console.log(`[API /api/account/profile] Profile updated/created successfully for uid ${uid}:`, savedData);
    return NextResponse.json({ message: 'Profile updated successfully', user: savedData });
  } catch (error) {
    console.error('[API /api/account/profile] Unhandled error processing profile update:', error);
    return NextResponse.json({ message: 'Error updating user profile', error: (error as Error).message }, { status: 500 });
  }
}
