
// /src/app/api/account/wishlist/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Mock data store (in-memory for demo, not persistent)
let userWishlists: { [key: string]: string[] } = {};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  console.log(`[API /api/account/wishlist] (Mock) GET request for userId: ${userId}`);

  if (!userId) {
    return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
  }

  const wishlist = userWishlists[userId] || [];
  console.log(`[API /api/account/wishlist] (Mock) Returning wishlist for ${userId}:`, wishlist);
  return NextResponse.json({ wishlist });
}
