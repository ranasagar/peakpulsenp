
// /src/app/api/admin/promotional-posts/[postId]/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabaseClient';
import type { PromotionalPost } from '@/types';

export const dynamic = 'force-dynamic';

// GET a single promotional post (Admin)
export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  const { postId } = params;
  if (!supabaseAdmin) {
    return NextResponse.json({ message: 'Admin database service not available.' }, { status: 503 });
  }
  if (!postId) {
    return NextResponse.json({ message: 'Post ID is required.' }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('promotional_posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return NextResponse.json({ message: 'Promotional post not found.' }, { status: 404 });
      console.error(`Supabase error fetching post ${postId}:`, error);
      return NextResponse.json({ message: 'Failed to fetch promotional post.', rawSupabaseError: error }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (e: any) {
    console.error(`Error fetching post ${postId}:`, e);
    return NextResponse.json({ message: 'Server error.', errorDetails: e.message }, { status: 500 });
  }
}

// PUT (Update) an existing promotional post (Admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  const { postId } = params;
  if (!supabaseAdmin) {
    return NextResponse.json({ message: 'Admin database service not available.' }, { status: 503 });
  }
  if (!postId) {
    return NextResponse.json({ message: 'Post ID is required for update.' }, { status: 400 });
  }

  let body: Partial<Omit<PromotionalPost, 'id' | 'createdAt' | 'updatedAt'>>;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ message: 'Invalid JSON payload.' }, { status: 400 });
  }

  const postToUpdate: { [key: string]: any } = {};
  if (body.title) postToUpdate.title = body.title;
  if (body.hasOwnProperty('slug')) {
     postToUpdate.slug = body.slug?.trim() || (body.title ? body.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '') : undefined);
     if (!postToUpdate.slug) delete postToUpdate.slug; // Don't update if becomes empty and title isn't changing
  } else if (body.title) {
     postToUpdate.slug = body.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  }

  if (body.hasOwnProperty('description')) postToUpdate.description = body.description || null;
  if (body.imageUrl) postToUpdate.image_url = body.imageUrl;
  if (body.hasOwnProperty('imageAltText')) postToUpdate.image_alt_text = body.imageAltText || null;
  if (body.hasOwnProperty('dataAiHint')) postToUpdate.data_ai_hint = body.dataAiHint || null;
  if (body.hasOwnProperty('ctaText')) postToUpdate.cta_text = body.ctaText || null;
  if (body.hasOwnProperty('ctaLink')) postToUpdate.cta_link = body.ctaLink || null;
  if (body.hasOwnProperty('price')) postToUpdate.price = body.price !== undefined && body.price !== null ? Number(body.price) : null;
  if (body.hasOwnProperty('discountPrice')) postToUpdate.discount_price = body.discountPrice !== undefined && body.discountPrice !== null ? Number(body.discountPrice) : null;
  if (body.hasOwnProperty('validFrom')) postToUpdate.valid_from = body.validFrom || null;
  if (body.hasOwnProperty('validUntil')) postToUpdate.valid_until = body.validUntil || null;
  if (body.hasOwnProperty('isActive')) postToUpdate.is_active = body.isActive;
  if (body.hasOwnProperty('displayOrder')) postToUpdate.display_order = Number(body.displayOrder);
  if (body.hasOwnProperty('backgroundColor')) postToUpdate.background_color = body.backgroundColor || null;
  if (body.hasOwnProperty('textColor')) postToUpdate.text_color = body.textColor || null;
  
  // "updatedAt" will be handled by the database trigger

  if (Object.keys(postToUpdate).length === 0) {
    return NextResponse.json({ message: "No valid fields to update." }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('promotional_posts')
      .update(postToUpdate)
      .eq('id', postId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return NextResponse.json({ message: 'Promotional post not found for update.' }, { status: 404 });
      console.error(`Supabase error updating post ${postId}:`, error);
      return NextResponse.json({ message: 'Failed to update promotional post.', rawSupabaseError: error }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (e: any) {
    console.error(`Error updating post ${postId}:`, e);
    return NextResponse.json({ message: 'Server error.', errorDetails: e.message }, { status: 500 });
  }
}

// DELETE a promotional post (Admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  const { postId } = params;
  if (!supabaseAdmin) {
    return NextResponse.json({ message: 'Admin database service not available.' }, { status: 503 });
  }
  if (!postId) {
    return NextResponse.json({ message: 'Post ID is required for deletion.' }, { status: 400 });
  }

  try {
    const { error } = await supabaseAdmin
      .from('promotional_posts')
      .delete()
      .eq('id', postId);

    if (error) {
      console.error(`Supabase error deleting post ${postId}:`, error);
      return NextResponse.json({ message: 'Failed to delete promotional post.', rawSupabaseError: error }, { status: 500 });
    }
    return NextResponse.json({ message: 'Promotional post deleted successfully.' });
  } catch (e: any) {
    console.error(`Error deleting post ${postId}:`, e);
    return NextResponse.json({ message: 'Server error.', errorDetails: e.message }, { status: 500 });
  }
}
