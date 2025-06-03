
// /src/app/api/admin/reviews/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin, supabase as fallbackSupabase } from '../../../../lib/supabaseClient';
import type { Review } from '@/types';

export const dynamic = 'force-dynamic';

// GET all reviews for admin panel
export async function GET(request: NextRequest) {
  console.log('[API /api/admin/reviews GET] Request received to fetch all reviews for admin.');

  if (!supabaseAdmin) {
    console.error('[API /api/admin/reviews GET] CRITICAL: Admin Supabase client (service_role) is not initialized. Check SUPABASE_SERVICE_ROLE_KEY in .env and server restart.');
    return NextResponse.json({
      message: 'Admin database client not configured. Cannot fetch reviews. Contact administrator.',
      rawSupabaseError: { message: 'Admin database client (service_role) missing.' }
    }, { status: 503 }); // Service Unavailable
  }
  console.log('[API /api/admin/reviews GET] Using ADMIN Supabase client (service_role).');

  try {
    const { data, error } = await supabaseAdmin // Strictly use supabaseAdmin
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
        created_at, 
        updated_at, 
        product:products (name),
        user:users (name, "avatarUrl")
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[API /api/admin/reviews GET] Supabase error fetching reviews:', error);
      return NextResponse.json({
        message: 'Failed to fetch reviews for admin.',
        rawSupabaseError: { message: error.message, details: error.details, hint: error.hint, code: error.code }
      }, { status: 500 });
    }
    
    const reviews: Review[] = (data || []).map((r: any) => ({
        id: r.id,
        product_id: r.product_id,
        product_name: r.product?.name || 'N/A',
        user_id: r.user_id,
        user_name: r.user?.name || r.user?.email || 'Anonymous',
        user_avatar_url: r.user?.["avatarUrl"], 
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        images: r.images,
        status: r.status as Review['status'],
        verified_purchase: r.verified_purchase,
        createdAt: r.created_at, // Changed from r.createdAt
        updatedAt: r.updated_at,   // Changed from r.updatedAt
    }));
    console.log(`[API /api/admin/reviews GET] Successfully fetched ${reviews.length} reviews for admin.`);
    return NextResponse.json(reviews);
  } catch (e: any) {
    console.error('[API /api/admin/reviews GET] Unhandled error:', e);
    return NextResponse.json({ message: 'Server error fetching reviews for admin.', errorDetails: e.message }, { status: 500 });
  }
}

