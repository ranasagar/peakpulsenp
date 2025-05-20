
// /src/app/api/account/wishlist/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient.ts'; // Relative path

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  console.log(`[API /api/account/wishlist] GET request for userId: ${userId}`);

  if (!supabase) {
    console.error('[API /api/account/wishlist] Supabase client is not initialized.');
    return NextResponse.json({ message: 'Database client not configured.' }, { status: 503 });
  }

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
      if (error.code === 'PGRST116') { // User profile not found
        console.log(`[API /api/account/wishlist] User profile not found for ${userId}, returning empty wishlist.`);
        return NextResponse.json({ wishlist: [] });
      }
      console.error(`[API /api/account/wishlist] Supabase error fetching wishlist for ${userId}:`, error);
      return NextResponse.json({ message: 'Failed to fetch wishlist from database.', rawError: error.message }, { status: 500 });
    }
    
    const wishlist = data?.wishlist || [];
    console.log(`[API /api/account/wishlist] Returning wishlist for ${userId}:`, wishlist);
    return NextResponse.json({ wishlist });

  } catch (catchError) {
    console.error(`[API /api/account/wishlist] Unhandled error fetching wishlist for ${userId}:`, catchError);
    return NextResponse.json({ message: 'Server error fetching wishlist.', error: (catchError as Error).message }, { status: 500 });
  }
}
