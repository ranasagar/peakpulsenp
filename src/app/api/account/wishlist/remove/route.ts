
// /src/app/api/account/wishlist/remove/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '../../../../../lib/supabaseClient.ts'; // Relative path

interface RemoveFromWishlistPayload {
  userId: string;
  productId: string;
}

export async function POST(request: NextRequest) {
  console.log("[API /api/account/wishlist/remove] POST request received.");
  if (!supabase) {
    console.error('[API /api/account/wishlist/remove] Supabase client is not initialized.');
    return NextResponse.json({ message: 'Database client not configured.' }, { status: 503 });
  }
  try {
    const { userId, productId } = (await request.json()) as RemoveFromWishlistPayload;

    if (!userId || !productId) {
      return NextResponse.json({ message: 'User ID and Product ID are required' }, { status: 400 });
    }
    console.log(`[API /api/account/wishlist/remove] Removing ${productId} for user ${userId}`);

    // Fetch current wishlist
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('wishlist')
      .eq('id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error(`[API /api/account/wishlist/remove] Error fetching user ${userId} for wishlist update:`, fetchError);
      return NextResponse.json({ message: 'Failed to retrieve user data.', rawError: fetchError.message }, { status: 500 });
    }

    let currentWishlist = userData?.wishlist || [];
    if (!Array.isArray(currentWishlist)) {
        currentWishlist = [];
    }
    
    const initialLength = currentWishlist.length;
    const updatedWishlist = currentWishlist.filter((id: string) => id !== productId);

    if (updatedWishlist.length < initialLength) {
      const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update({ wishlist: updatedWishlist, updatedAt: new Date().toISOString() })
        .eq('id', userId)
        .select('wishlist');

      if (updateError) {
        console.error(`[API /api/account/wishlist/remove] Supabase error updating wishlist for ${userId}:`, updateError);
        return NextResponse.json({ message: 'Failed to remove product from wishlist in database.', rawError: updateError.message }, { status: 500 });
      }
      console.log(`[API /api/account/wishlist/remove] Product removed. Current wishlist for ${userId}:`, updateData?.[0]?.wishlist);
      return NextResponse.json({ message: 'Product removed from wishlist successfully', wishlist: updateData?.[0]?.wishlist || [] });
    } else {
      console.log(`[API /api/account/wishlist/remove] Product not found in wishlist for ${userId}.`);
      return NextResponse.json({ message: 'Product not found in wishlist', wishlist: currentWishlist });
    }

  } catch (error) {
    console.error('[API /api/account/wishlist/remove] Unhandled error:', error);
    return NextResponse.json({ message: 'Failed to remove product from wishlist', error: (error as Error).message }, { status: 500 });
  }
}
