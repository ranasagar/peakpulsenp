
// /src/app/api/account/wishlist/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient.ts'; // Changed to relative path

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  console.log(`[API /api/account/wishlist] GET request for userId: ${userId}`);

  if (!userId) {
    console.warn("[API /api/account/wishlist] User ID is required, but not provided.");
    return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('wishlist')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No user found or wishlist column might be missing if table was not altered
        console.warn(`[API /api/account/wishlist] User or wishlist not found for userId: ${userId}. Returning empty wishlist. Supabase error:`, error);
        return NextResponse.json({ wishlist: [] });
      }
      console.error('[API /api/account/wishlist] Supabase error fetching wishlist:', error);
      return NextResponse.json({ message: 'Error fetching wishlist from Supabase', error: error.message, details: error.details }, { status: 500 });
    }
    
    console.log(`[API /api/account/wishlist] Successfully fetched wishlist for userId: ${userId}`);
    return NextResponse.json({ wishlist: data?.wishlist || [] });
  } catch (error) {
    console.error('[API /api/account/wishlist] Unhandled error fetching wishlist:', error);
    return NextResponse.json({ message: 'Error fetching wishlist', error: (error as Error).message }, { status: 500 });
  }
}
