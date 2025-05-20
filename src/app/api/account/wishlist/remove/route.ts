
// /src/app/api/account/wishlist/remove/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

interface RemoveFromWishlistPayload {
  userId: string;
  productId: string;
}

export async function POST(request: NextRequest) {
  try {
    const { userId, productId } = (await request.json()) as RemoveFromWishlistPayload;

    if (!userId || !productId) {
      return NextResponse.json({ message: 'User ID and Product ID are required' }, { status: 400 });
    }

    // Fetch current wishlist
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('wishlist')
      .eq('id', userId)
      .single();

    if (fetchError) {
        // If user doc doesn't exist (PGRST116), their wishlist is effectively empty.
        if (fetchError.code === 'PGRST116') {
             return NextResponse.json({ message: 'Product not found in wishlist or user does not exist', wishlist: [] });
        }
      console.error('Supabase error fetching user for wishlist removal:', fetchError);
      return NextResponse.json({ message: 'Error fetching user data', error: fetchError.message }, { status: 500 });
    }

    const currentWishlist: string[] = userData?.wishlist || [];
    if (!currentWishlist.includes(productId)) {
      return NextResponse.json({ message: 'Product not found in wishlist', wishlist: currentWishlist });
    }

    const updatedWishlist = currentWishlist.filter(id => id !== productId);

    const { error: updateError } = await supabase
      .from('users')
      .update({ wishlist: updatedWishlist, updatedAt: new Date().toISOString() })
      .eq('id', userId);

    if (updateError) {
      console.error('Supabase error removing from wishlist:', updateError);
      return NextResponse.json({ message: 'Error removing product from wishlist', error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Product removed from wishlist successfully', wishlist: updatedWishlist });
  } catch (error) {
    console.error('Error in remove from wishlist API:', error);
    return NextResponse.json({ message: 'Failed to remove product from wishlist', error: (error as Error).message }, { status: 500 });
  }
}

  