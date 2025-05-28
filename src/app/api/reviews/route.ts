
// /src/app/api/reviews/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin, supabase as fallbackSupabase } from '../../../lib/supabaseClient';
import type { Review } from '@/types';

export const dynamic = 'force-dynamic';

// GET approved reviews for a product or all approved reviews
export async function GET(request: NextRequest) {
  const supabase = supabaseAdmin || fallbackSupabase; // Prefer admin for reads to bypass RLS if needed, or ensure public RLS is set up
  if (!supabase) {
    console.error('[API /api/reviews GET] Supabase client is not initialized.');
    return NextResponse.json({ message: 'Database client not configured.' }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('productId');

  try {
    let query = supabase
      .from('reviews')
      .select(`
        *,
        user:users (name, "avatarUrl") 
      `)
      .eq('status', 'approved')
      .order('"createdAt"', { ascending: false });

    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[API /api/reviews GET] Supabase error fetching reviews:', error);
      return NextResponse.json({ message: 'Failed to fetch reviews.', rawSupabaseError: error }, { status: 500 });
    }

    const reviews: Review[] = (data || []).map((r: any) => ({
      ...r,
      user_name: r.user?.name,
      user_avatar_url: r.user?.avatarUrl,
      product_id: r.product_id, // ensure this is passed through
      user_id: r.user_id, // ensure this is passed through
    }));

    return NextResponse.json(reviews);
  } catch (e: any) {
    console.error('[API /api/reviews GET] Unhandled error:', e);
    return NextResponse.json({ message: 'Server error fetching reviews.', error: e.message }, { status: 500 });
  }
}

// POST a new review (user-submitted)
export async function POST(request: NextRequest) {
  // For user submissions, we should use the public client and rely on RLS
  // The RLS policy "Users can submit reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = user_id);
  // will ensure the user_id matches the authenticated user.
  const supabaseClient = fallbackSupabase; 
  if (!supabaseClient) {
    console.error('[API /api/reviews POST] Supabase client (public) is not initialized.');
    return NextResponse.json({ message: 'Database client not configured.' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { product_id, user_id, rating, title, comment, images } = body;

    if (!product_id || !user_id || !rating || !comment) {
      return NextResponse.json({ message: 'Product ID, User ID, Rating, and Comment are required.' }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
        return NextResponse.json({ message: 'Rating must be between 1 and 5.' }, { status: 400 });
    }

    const reviewToInsert = {
      product_id,
      user_id, // This MUST match the UID of the authenticated user making the request for RLS to pass
      rating: Number(rating),
      title: title || null,
      comment,
      images: images || null,
      status: 'pending', // New reviews default to pending
      verified_purchase: false, // This would typically be set by checking user's order history
      // createdAt and updatedAt will be set by database defaults/triggers
    };
    
    console.log('[API /api/reviews POST] Attempting to insert review:', reviewToInsert);

    const { data, error } = await supabaseClient
      .from('reviews')
      .insert(reviewToInsert)
      .select()
      .single();

    if (error) {
      console.error('[API /api/reviews POST] Supabase error creating review:', error);
      return NextResponse.json({ 
        message: 'Failed to submit review to database.', 
        rawSupabaseError: {message: error.message, details: error.details, hint: error.hint, code: error.code}
      }, { status: 500 });
    }

    console.log('[API /api/reviews POST] Review submitted successfully:', data);
    return NextResponse.json(data, { status: 201 });

  } catch (e: any) {
    console.error('[API /api/reviews POST] Unhandled error:', e);
    if (e instanceof SyntaxError) {
        return NextResponse.json({ message: 'Invalid JSON payload.' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Server error submitting review.', error: e.message }, { status: 500 });
  }
}

    