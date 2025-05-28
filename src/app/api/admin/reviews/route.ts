
// /src/app/api/admin/reviews/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin, supabase as fallbackSupabase } from '../../../../lib/supabaseClient';
import type { Review } from '@/types';

export const dynamic = 'force-dynamic';

// GET all reviews for admin panel
export async function GET(request: NextRequest) {
  const client = supabaseAdmin || fallbackSupabase;
  if (!client) {
    console.error('[API /api/admin/reviews GET] Supabase client not initialized.');
    return NextResponse.json({ message: 'Database client not configured.' , rawSupabaseError: { message: 'Supabase client not initialized.'}}, { status: 503 });
  }
  if (client === fallbackSupabase && !supabaseAdmin) { // Check if admin client failed and we are on fallback
      console.warn("[API /api/admin/reviews GET] Using fallback public Supabase client because admin client (service_role) is not available. RLS policies for 'authenticated' admin role will apply.");
  }

  try {
    const { data, error } = await client
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
        product:products (name),
        user:users (name, "avatarUrl", email)
      `)
      .order('"createdAt"', { ascending: false });

    if (error) {
      console.error('[API /api/admin/reviews GET] Supabase error fetching reviews:', error);
      return NextResponse.json({ message: 'Failed to fetch reviews for admin.', rawSupabaseError: error }, { status: 500 });
    }
    
    const reviews: Review[] = (data || []).map((r: any) => ({
        id: r.id,
        product_id: r.product_id,
        product_name: r.product?.name || 'N/A',
        user_id: r.user_id,
        user_name: r.user?.name || r.user?.email || 'Anonymous',
        user_avatar_url: r.user?.avatarUrl,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        images: r.images,
        status: r.status,
        verified_purchase: r.verified_purchase,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
    }));

    return NextResponse.json(reviews);
  } catch (e: any) {
    console.error('[API /api/admin/reviews GET] Unhandled error:', e);
    return NextResponse.json({ message: 'Server error fetching reviews for admin.', error: e.message }, { status: 500 });
  }
}

    