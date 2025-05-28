// /src/app/api/reviews/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';
import type { Review, ReviewImageItem } from '@/types';

export const dynamic = 'force-dynamic';

// GET approved reviews for a product or all approved reviews
export async function GET(request: NextRequest) {
  if (!supabase) {
    console.error('[API /api/reviews GET] Supabase client is not initialized.');
    return NextResponse.json({ message: 'Database client not configured.', rawSupabaseError: { message: 'Database client not configured.' } }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('productId');
  console.log(`[API /api/reviews GET] Request received. ProductId: ${productId || 'all'}`);

  try {
    let query = supabase
      .from('reviews')
      .select(`
        id,
        product_id,
        user_id,
        rating,
        title,
        comment,
        images,
        status,
        verified_purchase,
        "createdAt",
        "updatedAt",
        user:users (name, "avatarUrl") 
      `)
      .eq('status', 'approved')
      .order('"createdAt"', { ascending: false });

    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data, error } = await query;

    if (error) {
      console.error(`[API /api/reviews GET] Supabase error fetching reviews for product_id ${productId || 'all'}:`, error);
      return NextResponse.json({ 
        message: 'Failed to fetch reviews from database.', 
        rawSupabaseError: { message: error.message, details: error.details, hint: error.hint, code: error.code }
      }, { status: 500 });
    }
    
    const reviews: Review[] = (data || []).map((r: any) => ({
        id: r.id,
        product_id: r.product_id,
        user_id: r.user_id,
        user_name: r.user?.name || 'Anonymous',
        user_avatar_url: r.user?.avatarUrl,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        images: r.images as ReviewImageItem[] | null,
        status: r.status as Review['status'],
        verified_purchase: r.verified_purchase,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
    }));
    console.log(`[API /api/reviews GET] Successfully fetched ${reviews.length} approved reviews for product_id ${productId || 'all'}.`);
    return NextResponse.json(reviews);
  } catch (e: any) {
    console.error(`[API /api/reviews GET] Unhandled error for product_id ${productId || 'all'}:`, e);
    return NextResponse.json({ message: 'Server error fetching reviews.', errorDetails: e.message }, { status: 500 });
  }
}

// POST a new review (user-submitted)
interface CreateReviewPayload {
    productId: string;
    userId: string; // Firebase UID
    rating: number;
    title?: string;
    comment: string;
    images?: ReviewImageItem[]; // Optional: if users can upload images with reviews
    // verified_purchase will be handled by backend or based on order history later
}

export async function POST(request: NextRequest) {
  if (!supabase) {
    console.error('[API /api/reviews POST] Supabase client is not initialized.');
    return NextResponse.json({ message: 'Database client not configured.', rawSupabaseError: { message: 'Database client not configured.' } }, { status: 503 });
  }
  console.log('[API /api/reviews POST] Received request to create review.');

  try {
    const body = await request.json() as CreateReviewPayload;
    const { productId, userId, rating, title, comment, images } = body;
    console.log('[API /api/reviews POST] Request body:', body);

    if (!productId || !userId || rating === undefined || !comment) {
      console.warn('[API /api/reviews POST] Missing required fields.');
      return NextResponse.json({ message: 'Product ID, User ID, Rating, and Comment are required.' }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
        console.warn(`[API /api/reviews POST] Invalid rating: ${rating}`);
        return NextResponse.json({ message: 'Rating must be between 1 and 5.' }, { status: 400 });
    }

    const reviewToInsert = {
      product_id: productId,
      user_id: userId,
      rating: Number(rating),
      title: title || null,
      comment,
      images: images || null,
      status: 'pending', // New reviews default to pending
      verified_purchase: false, // Placeholder; actual verification would need order check
    };
    
    console.log('[API /api/reviews POST] Attempting to insert review into Supabase:', reviewToInsert);

    const { data: insertedReview, error: insertError } = await supabase
      .from('reviews')
      .insert(reviewToInsert)
      .select()
      .single();

    if (insertError) {
      console.error('[API /api/reviews POST] Supabase error creating review:', insertError);
      return NextResponse.json({ 
        message: 'Failed to submit review to database.', 
        rawSupabaseError: {message: insertError.message, details: insertError.details, hint: insertError.hint, code: insertError.code}
      }, { status: 500 });
    }

    console.log('[API /api/reviews POST] Review submitted successfully:', insertedReview);
    return NextResponse.json(insertedReview, { status: 201 });

  } catch (e: any) {
    console.error('[API /api/reviews POST] Unhandled error:', e);
    if (e instanceof SyntaxError && e.message.toLowerCase().includes('json')) {
        return NextResponse.json({ message: 'Invalid JSON payload in request body.' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Server error submitting review.', errorDetails: e.message }, { status: 500 });
  }
}
