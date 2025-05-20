
// /src/app/api/account/profile/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import type { User as AuthUserType } from '@/types';

interface ProfileUpdateRequest {
  uid: string; // Firebase UID will be used as the primary key 'id' in Supabase 'users' table
  name?: string;
  avatarUrl?: string;
  // email changes are complex and should be handled via Firebase Auth SDK, not directly here
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get('uid');

  if (!uid) {
    return NextResponse.json({ message: 'User ID (uid) is required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', uid)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // PGRST116: "JSON object requested, but array found" or "0 rows"
        return NextResponse.json({ message: 'Profile not found in Supabase users table' }, { status: 404 });
      }
      console.error('Supabase error fetching user profile:', error);
      // Return a JSON response instead of throwing the error directly
      return NextResponse.json({ message: 'Error fetching user profile from Supabase', error: error.message }, { status: 500 });
    }

    if (data) {
      return NextResponse.json(data as AuthUserType);
    } else {
      // This case should ideally be covered by PGRST116 if .single() returns no rows.
      return NextResponse.json({ message: 'Profile not found in Supabase users table (data was null)' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error fetching user profile from Supabase (outer catch):', error);
    return NextResponse.json({ message: 'Error fetching user profile', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ProfileUpdateRequest;
    const { uid, ...profileDataToUpdate } = body;

    if (!uid) {
      return NextResponse.json({ message: 'User ID (uid) is required for update' }, { status: 400 });
    }

    const dataForSupabase: Partial<AuthUserType> = {
      name: profileDataToUpdate.name,
      avatarUrl: profileDataToUpdate.avatarUrl,
      updatedAt: new Date().toISOString(),
    };

    Object.keys(dataForSupabase).forEach(key =>
      dataForSupabase[key as keyof typeof dataForSupabase] === undefined && delete dataForSupabase[key as keyof typeof dataForSupabase]
    );

    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('id', uid)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Supabase error checking existing user:', fetchError);
      return NextResponse.json({ message: 'Error checking user existence in Supabase', error: fetchError.message }, { status: 500 });
    }

    let savedData;
    let opError;

    if (existingUser) {
      const { data, error } = await supabase
        .from('users')
        .update(dataForSupabase)
        .eq('id', uid)
        .select()
        .single();
      savedData = data;
      opError = error;
    } else {
      const { data, error } = await supabase
        .from('users')
        .insert({
            id: uid,
            ...dataForSupabase,
            // email and roles should be set during initial sync from Firebase Auth
            // or have defaults in the table.
            // Forcing an email here might not be right if it wasn't part of the update request.
            // It's better if useAuth ensures the basic user row exists with email.
        })
        .select()
        .single();
      savedData = data;
      opError = error;
    }

    if (opError) {
      console.error('Supabase error saving user profile:', opError);
      return NextResponse.json({ message: 'Error saving user profile to Supabase', error: opError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Profile updated successfully', user: savedData });
  } catch (error) {
    console.error('Error processing profile update (outer catch):', error);
    return NextResponse.json({ message: 'Error updating user profile', error: (error as Error).message }, { status: 500 });
  }
}
