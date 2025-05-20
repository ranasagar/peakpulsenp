
// /src/app/api/account/wishlist/remove/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Mock data store (in-memory for demo, not persistent)
let userWishlists: { [key: string]: string[] } = {}; // This state will reset on server restart

interface RemoveFromWishlistPayload {
  userId: string;
  productId: string;
}

export async function POST(request: NextRequest) {
  console.log("[API /api/account/wishlist/remove] (Mock) POST request received.");
  try {
    const { userId, productId } = (await request.json()) as RemoveFromWishlistPayload;

    if (!userId || !productId) {
      return NextResponse.json({ message: 'User ID and Product ID are required' }, { status: 400 });
    }
    console.log(`[API /api/account/wishlist/remove] (Mock) Removing ${productId} for user ${userId}`);

    if (userWishlists[userId]) {
      const initialLength = userWishlists[userId].length;
      userWishlists[userId] = userWishlists[userId].filter(id => id !== productId);
      if (userWishlists[userId].length < initialLength) {
        console.log(`[API /api/account/wishlist/remove] (Mock) Product removed. Current wishlist for ${userId}:`, userWishlists[userId]);
      } else {
        console.log(`[API /api/account/wishlist/remove] (Mock) Product not found in wishlist for ${userId}.`);
      }
    } else {
      console.log(`[API /api/account/wishlist/remove] (Mock) No wishlist found for user ${userId}.`);
    }
    
    return NextResponse.json({ message: 'Product removed from wishlist successfully (mock)', wishlist: userWishlists[userId] || [] });
  } catch (error) {
    console.error('[API /api/account/wishlist/remove] (Mock) Error:', error);
    return NextResponse.json({ message: 'Failed to remove product from wishlist (mock)', error: (error as Error).message }, { status: 500 });
  }
}
