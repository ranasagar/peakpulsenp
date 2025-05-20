
// /src/app/api/account/wishlist/add/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '../../../../../lib/supabaseClient.ts'; // Changed to relative path

interface AddToWishlistPayload {
  userId: string;
  productId: string;
}

export async function POST(request: NextRequest) {
  console.log("[API /api/account/wishlist/add] POST request received.");
  try {
    const { userId, productId } = (await request.json()) as AddToWishlistPayload;

    if (!userId || !productId) {
      console.warn("[API /api/account/wishlist/add] User ID and Product ID are required, but not provided.");
      return NextResponse.json({ message: 'User ID and Product ID are required' }, { status: 400 });
    }
    console.log(`[API /api/account/wishlist/add] Attempting to add productId: ${productId} for userId: ${userId}`);

    // Fetch current wishlist
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('wishlist')
      .eq('id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means user not found
      console.error('[API /api/account/wishlist/add] Supabase error fetching user for wishlist add:', fetchError);
      return NextResponse.json({ message: 'Error fetching user data', error: fetchError.message, details: fetchError.details }, { status: 500 });
    }
    
    if (!userData && fetchError?.code === 'PGRST116') {
        console.warn(`[API /api/account/wishlist/add] User document for ${userId} not found. Attempting to create it.`);
        // This case implies the user document doesn't exist in 'users' table yet.
        // The useAuth hook should ideally create a basic user doc on first login.
        // For robustness, we'll create it here.
        const { error: createUserError } = await supabase.from('users').insert({ id: userId, wishlist: [productId], email: 'unknown_for_wishlist_add@example.com', name: 'User (from wishlist add)' }); 
        if (createUserError) {
            console.error('[API /api/account/wishlist/add] Supabase error creating user during wishlist add:', createUserError);
            return NextResponse.json({ message: 'Error preparing user wishlist', error: createUserError.message, details: createUserError.details }, { status: 500 });
        }
        console.log(`[API /api/account/wishlist/add] Created new user and added product to wishlist for userId: ${userId}`);
        return NextResponse.json({ message: 'Product added to new wishlist successfully', wishlist: [productId] });
    }

    const currentWishlist: string[] = userData?.wishlist || [];
    if (currentWishlist.includes(productId)) {
      console.log(`[API /api/account/wishlist/add] Product ${productId} already in wishlist for userId: ${userId}`);
      return NextResponse.json({ message: 'Product already in wishlist', wishlist: currentWishlist });
    }

    const updatedWishlist = [...currentWishlist, productId];

    const { error: updateError } = await supabase
      .from('users')
      .update({ wishlist: updatedWishlist, updatedAt: new Date().toISOString() })
      .eq('id', userId);

    if (updateError) {
      console.error('[API /api/account/wishlist/add] Supabase error adding to wishlist:', updateError);
      return NextResponse.json({ message: 'Error adding product to wishlist', error: updateError.message, details: updateError.details }, { status: 500 });
    }
    
    console.log(`[API /api/account/wishlist/add] Successfully added productId: ${productId} to wishlist for userId: ${userId}`);
    return NextResponse.json({ message: 'Product added to wishlist successfully', wishlist: updatedWishlist });
  } catch (error) {
    console.error('[API /api/account/wishlist/add] Unhandled error in add to wishlist API:', error);
    return NextResponse.json({ message: 'Failed to add product to wishlist', error: (error as Error).message }, { status: 500 });
  }
}
