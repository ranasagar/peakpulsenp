
// /src/app/api/account/wishlist/remove/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '../../../../../lib/supabaseClient.ts'; // Changed to relative path

interface RemoveFromWishlistPayload {
  userId: string;
  productId: string;
}

export async function POST(request: NextRequest) {
  console.log("[API /api/account/wishlist/remove] POST request received.");
  try {
    const { userId, productId } = (await request.json()) as RemoveFromWishlistPayload;

    if (!userId || !productId) {
      console.warn("[API /api/account/wishlist/remove] User ID and Product ID are required, but not provided.");
      return NextResponse.json({ message: 'User ID and Product ID are required' }, { status: 400 });
    }
    console.log(`[API /api/account/wishlist/remove] Attempting to remove productId: ${productId} for userId: ${userId}`);

    // Fetch current wishlist
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('wishlist')
      .eq('id', userId)
      .single();

    if (fetchError) {
        if (fetchError.code === 'PGRST116') { // User doc doesn't exist
             console.warn(`[API /api/account/wishlist/remove] User ${userId} not found. Product cannot be in wishlist.`);
             return NextResponse.json({ message: 'Product not found in wishlist or user does not exist', wishlist: [] });
        }
      console.error('[API /api/account/wishlist/remove] Supabase error fetching user for wishlist removal:', fetchError);
      return NextResponse.json({ message: 'Error fetching user data', error: fetchError.message, details: fetchError.details }, { status: 500 });
    }

    const currentWishlist: string[] = userData?.wishlist || [];
    if (!currentWishlist.includes(productId)) {
      console.log(`[API /api/account/wishlist/remove] Product ${productId} not found in wishlist for userId: ${userId}`);
      return NextResponse.json({ message: 'Product not found in wishlist', wishlist: currentWishlist });
    }

    const updatedWishlist = currentWishlist.filter(id => id !== productId);

    const { error: updateError } = await supabase
      .from('users')
      .update({ wishlist: updatedWishlist, updatedAt: new Date().toISOString() })
      .eq('id', userId);

    if (updateError) {
      console.error('[API /api/account/wishlist/remove] Supabase error removing from wishlist:', updateError);
      return NextResponse.json({ message: 'Error removing product from wishlist', error: updateError.message, details: updateError.details }, { status: 500 });
    }

    console.log(`[API /api/account/wishlist/remove] Successfully removed productId: ${productId} from wishlist for userId: ${userId}`);
    return NextResponse.json({ message: 'Product removed from wishlist successfully', wishlist: updatedWishlist });
  } catch (error) {
    console.error('[API /api/account/wishlist/remove] Unhandled error in remove from wishlist API:', error);
    return NextResponse.json({ message: 'Failed to remove product from wishlist', error: (error as Error).message }, { status: 500 });
  }
}
