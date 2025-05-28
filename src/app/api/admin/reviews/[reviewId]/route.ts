
// /src/app/api/admin/reviews/[reviewId]/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin, supabase as fallbackSupabase } from '../../../../../lib/supabaseClient';
import type { Review } from '@/types';

export const dynamic = 'force-dynamic';

interface UpdateReviewPayload {
  status?: Review['status'];
  // Add other fields if admins should be able to edit more than status
}

// PUT (Update) a review's status
export async function PUT(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  const { reviewId } = params;
  const client = supabaseAdmin || fallbackSupabase;

  if (!client) {
    console.error(`[API /api/admin/reviews/${reviewId} PUT] Supabase client not initialized.`);
    return NextResponse.json({ message: 'Database client not configured.' }, { status: 503 });
  }
   if (client === fallbackSupabase) {
      console.warn(`[API /api/admin/reviews/${reviewId} PUT] Using fallback public Supabase client. RLS policies for 'authenticated' admin role will apply.`);
  }


  if (!reviewId) {
    return NextResponse.json({ message: 'Review ID is required.' }, { status: 400 });
  }

  try {
    const payload = await request.json() as UpdateReviewPayload;
    console.log(`[API /api/admin/reviews/${reviewId} PUT] Received payload:`, payload);

    if (!payload.status || !['pending', 'approved', 'rejected'].includes(payload.status)) {
      return NextResponse.json({ message: 'Invalid or missing status in payload.' }, { status: 400 });
    }

    const reviewToUpdate: Partial<Pick<Review, 'status' | 'updatedAt'>> = {
      status: payload.status,
      // "updatedAt" will be handled by the database trigger
    };

    const { data, error } = await client
      .from('reviews')
      .update(reviewToUpdate)
      .eq('id', reviewId)
      .select()
      .single();

    if (error) {
      console.error(`[API /api/admin/reviews/${reviewId} PUT] Supabase error updating review:`, error);
      if (error.code === 'PGRST116') { // Row not found
        return NextResponse.json({ message: 'Review not found.', rawSupabaseError: error }, { status: 404 });
      }
      return NextResponse.json({ message: 'Failed to update review status.', rawSupabaseError: error }, { status: 500 });
    }
    if (!data) {
        return NextResponse.json({ message: 'Review not found after update attempt.' }, { status: 404 });
    }

    console.log(`[API /api/admin/reviews/${reviewId} PUT] Review status updated successfully.`);
    return NextResponse.json(data);

  } catch (e: any) {
    console.error(`[API /api/admin/reviews/${reviewId} PUT] Unhandled error:`, e);
    if (e instanceof SyntaxError) {
        return NextResponse.json({ message: 'Invalid JSON payload.' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Server error updating review status.', error: e.message }, { status: 500 });
  }
}

// DELETE a review
export async function DELETE(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  const { reviewId } = params;
  const client = supabaseAdmin || fallbackSupabase;

  if (!client) {
    console.error(`[API /api/admin/reviews/${reviewId} DELETE] Supabase client not initialized.`);
    return NextResponse.json({ message: 'Database client not configured.' }, { status: 503 });
  }
   if (client === fallbackSupabase) {
      console.warn(`[API /api/admin/reviews/${reviewId} DELETE] Using fallback public Supabase client. RLS policies for 'authenticated' admin role will apply.`);
  }

  if (!reviewId) {
    return NextResponse.json({ message: 'Review ID is required.' }, { status: 400 });
  }

  try {
    const { error } = await client
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (error) {
      console.error(`[API /api/admin/reviews/${reviewId} DELETE] Supabase error deleting review:`, error);
      return NextResponse.json({ message: 'Failed to delete review.', rawSupabaseError: error }, { status: 500 });
    }

    console.log(`[API /api/admin/reviews/${reviewId} DELETE] Review deleted successfully.`);
    return NextResponse.json({ message: 'Review deleted successfully.' }, { status: 200 });

  } catch (e: any) {
    console.error(`[API /api/admin/reviews/${reviewId} DELETE] Unhandled error:`, e);
    return NextResponse.json({ message: 'Server error deleting review.', error: e.message }, { status: 500 });
  }
}

    