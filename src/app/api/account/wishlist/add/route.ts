
// /src/app/api/account/wishlist/add/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Mock data store (in-memory for demo, not persistent)
// This needs to be consistent with the one in GET and REMOVE routes if they were separate files.
// For simplicity in this single-file context, it's fine.
let userWishlists: { [key: string]: string[] } = {}; // This state will reset on server restart

interface AddToWishlistPayload {
  userId: string;
  productId: string;
}

export async function POST(request: NextRequest) {
  console.log("[API /api/account/wishlist/add] (Mock) POST request received.");
  try {
    const { userId, productId } = (await request.json()) as AddToWishlistPayload;

    if (!userId || !productId) {
      return NextResponse.json({ message: 'User ID and Product ID are required' }, { status: 400 });
    }
    console.log(`[API /api/account/wishlist/add] (Mock) Adding ${productId} for user ${userId}`);

    if (!userWishlists[userId]) {
      userWishlists[userId] = [];
    }

    if (!userWishlists[userId].includes(productId)) {
      userWishlists[userId].push(productId);
      console.log(`[API /api/account/wishlist/add] (Mock) Product added. Current wishlist for ${userId}:`, userWishlists[userId]);
    } else {
      console.log(`[API /api/account/wishlist/add] (Mock) Product already in wishlist for ${userId}.`);
    }
    
    return NextResponse.json({ message: 'Product added to wishlist successfully (mock)', wishlist: userWishlists[userId] });
  } catch (error) {
    console.error('[API /api/account/wishlist/add] (Mock) Error:', error);
    return NextResponse.json({ message: 'Failed to add product to wishlist (mock)', error: (error as Error).message }, { status: 500 });
  }
}
