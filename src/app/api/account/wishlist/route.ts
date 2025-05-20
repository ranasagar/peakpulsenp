
// /src/app/api/account/wishlist/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// Note: For server-side authentication to get userId securely,
// you'd typically use Firebase Admin SDK to verify an ID token.
// For this demo, we'll rely on userId passed in query params.

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('wishlist')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No user found
        return NextResponse.json({ wishlist: [] }); // Return empty wishlist if user doc not found
      }
      console.error('Supabase error fetching wishlist:', error);
      throw error;
    }

    return NextResponse.json({ wishlist: data?.wishlist || [] });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return NextResponse.json({ message: 'Error fetching wishlist', error: (error as Error).message }, { status: 500 });
  }
}

  