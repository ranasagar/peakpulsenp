
// /src/app/api/account/wishlist/add/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '../../../../../lib/supabaseClient.ts'; // Relative path

interface AddToWishlistPayload {
  userId: string;
  productId: string;
}

export async function POST(request: NextRequest) {
  console.log("[API /api/account/wishlist/add] POST request received.");
  if (!supabase) {
    console.error('[API /api/account/wishlist/add] Supabase client is not initialized.');
    return NextResponse.json({ message: 'Database client not configured.' }, { status: 503 });
  }
  try {
    const { userId, productId } = (await request.json()) as AddToWishlistPayload;

    if (!userId || !productId) {
      return NextResponse.json({ message: 'User ID and Product ID are required' }, { status: 400 });
    }
    console.log(`[API /api/account/wishlist/add] Adding ${productId} for user ${userId}`);

    // Fetch current wishlist
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('wishlist')
      .eq('id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116: user not found, which is an error here
      console.error(`[API /api/account/wishlist/add] Error fetching user ${userId} for wishlist update:`, fetchError);
      return NextResponse.json({ message: 'Failed to retrieve user data.', rawError: fetchError.message }, { status: 500 });
    }
    
    let currentWishlist = userData?.wishlist || [];
    if (!Array.isArray(currentWishlist)) { // Ensure it's an array
        currentWishlist = [];
    }

    if (!currentWishlist.includes(productId)) {
      const updatedWishlist = [...currentWishlist, productId];
      const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update({ wishlist: updatedWishlist, updatedAt: new Date().toISOString() })
        .eq('id', userId)
        .select('wishlist'); // Select the updated wishlist to return

      if (updateError) {
        console.error(`[API /api/account/wishlist/add] Supabase error updating wishlist for ${userId}:`, updateError);
        return NextResponse.json({ message: 'Failed to add product to wishlist in database.', rawError: updateError.message }, { status: 500 });
      }
      console.log(`[API /api/account/wishlist/add] Product added. Current wishlist for ${userId}:`, updateData?.[0]?.wishlist);
      return NextResponse.json({ message: 'Product added to wishlist successfully', wishlist: updateData?.[0]?.wishlist || [] });
    } else {
      console.log(`[API /api/account/wishlist/add] Product already in wishlist for ${userId}.`);
      return NextResponse.json({ message: 'Product already in wishlist', wishlist: currentWishlist });
    }
    
  } catch (error) {
    console.error('[API /api/account/wishlist/add] Unhandled error:', error);
    return NextResponse.json({ message: 'Failed to add product to wishlist', error: (error as Error).message }, { status: 500 });
  }
}
