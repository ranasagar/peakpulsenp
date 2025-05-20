
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
      throw error;
    }

    if (data) {
      return NextResponse.json(data as AuthUserType);
    } else {
      return NextResponse.json({ message: 'Profile not found in Supabase users table (data was null)' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error fetching user profile from Supabase:', error);
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

    // Data to be saved in Supabase, ensuring only allowed fields are passed
    const dataForSupabase: Partial<AuthUserType> = {
      name: profileDataToUpdate.name,
      avatarUrl: profileDataToUpdate.avatarUrl,
      updatedAt: new Date().toISOString(), // Let Supabase trigger handle this ideally
    };

    // Remove undefined fields so they don't overwrite existing values with null in Supabase patch
    Object.keys(dataForSupabase).forEach(key => 
      dataForSupabase[key as keyof typeof dataForSupabase] === undefined && delete dataForSupabase[key as keyof typeof dataForSupabase]
    );


    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('id', uid)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows, which is fine for upsert
      console.error('Supabase error checking existing user:', fetchError);
      throw fetchError;
    }

    let savedData;
    let opError;

    if (existingUser) {
      // User exists, update
      const { data, error } = await supabase
        .from('users')
        .update(dataForSupabase)
        .eq('id', uid)
        .select()
        .single();
      savedData = data;
      opError = error;
    } else {
      // User does not exist, insert (upsert with id)
      // This assumes Firebase Auth user has been created first.
      // Email and roles would ideally be set upon user creation (e.g. from useAuth hook initial setup)
      const { data, error } = await supabase
        .from('users')
        .insert({ 
            id: uid, // Use Firebase UID as the primary key
            ...dataForSupabase,
            // email: authUserEmail, // Should be fetched from verified token or set during registration sync
            // roles: ['customer'], // Default role
         })
        .select()
        .single();
      savedData = data;
      opError = error;
    }

    if (opError) {
      console.error('Supabase error saving user profile:', opError);
      throw opError;
    }

    return NextResponse.json({ message: 'Profile updated successfully', user: savedData });
  } catch (error) {
    console.error('Error processing profile update:', error);
    return NextResponse.json({ message: 'Error updating user profile', error: (error as Error).message }, { status: 500 });
  }
}

  