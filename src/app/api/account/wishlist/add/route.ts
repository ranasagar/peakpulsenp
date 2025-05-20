
// /src/app/api/account/wishlist/add/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

interface AddToWishlistPayload {
  userId: string;
  productId: string;
}

export async function POST(request: NextRequest) {
  try {
    const { userId, productId } = (await request.json()) as AddToWishlistPayload;

    if (!userId || !productId) {
      return NextResponse.json({ message: 'User ID and Product ID are required' }, { status: 400 });
    }

    // Fetch current wishlist
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('wishlist')
      .eq('id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means user not found, which is an error here
      console.error('Supabase error fetching user for wishlist add:', fetchError);
      return NextResponse.json({ message: 'Error fetching user data', error: fetchError.message }, { status: 500 });
    }
    
    if (!userData && fetchError?.code === 'PGRST116') {
        // This case implies the user document doesn't exist in 'users' table yet, which is unexpected if user is authenticated.
        // The useAuth hook should create a basic user doc on first login.
        // For robustness, you might create it here, but it's better handled at auth sync.
        console.warn(`User document for ${userId} not found when trying to add to wishlist.`);
         // Attempt to create user document with empty wishlist and then add to it
        const { error: createUserError } = await supabase.from('users').insert({ id: userId, wishlist: [productId], email: 'unknown', name: 'Unknown' }); // Email/Name are placeholders
        if (createUserError) {
            console.error('Supabase error creating user during wishlist add:', createUserError);
            return NextResponse.json({ message: 'Error preparing user wishlist', error: createUserError.message }, { status: 500 });
        }
        return NextResponse.json({ message: 'Product added to new wishlist successfully' });
    }


    const currentWishlist: string[] = userData?.wishlist || [];
    if (currentWishlist.includes(productId)) {
      return NextResponse.json({ message: 'Product already in wishlist', wishlist: currentWishlist });
    }

    const updatedWishlist = [...currentWishlist, productId];

    const { error: updateError } = await supabase
      .from('users')
      .update({ wishlist: updatedWishlist, updatedAt: new Date().toISOString() })
      .eq('id', userId);

    if (updateError) {
      console.error('Supabase error adding to wishlist:', updateError);
      return NextResponse.json({ message: 'Error adding product to wishlist', error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Product added to wishlist successfully', wishlist: updatedWishlist });
  } catch (error) {
    console.error('Error in add to wishlist API:', error);
    return NextResponse.json({ message: 'Failed to add product to wishlist', error: (error as Error).message }, { status: 500 });
  }
}

  