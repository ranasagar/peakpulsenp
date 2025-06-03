
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

  if (body.hasOwnProperty('title')) {
    if (typeof body.title === 'string' && body.title.trim() !== '') {
      postToUpdate.title = body.title.trim();
    } else {
      // Title is required by schema, so if it's sent as empty, it's an issue client should catch.
      // If backend still receives it empty, this could lead to issues if DB doesn't allow empty.
      // For PUT, if title is not in body, we don't update it. If it is, it must be valid.
      if (body.title !== undefined && (body.title === null || body.title.trim() === '')) {
        return NextResponse.json({ message: "Title cannot be empty if provided for update." }, { status: 400 });
      }
    }
  }
  
  // Slug generation/update logic
  if (body.hasOwnProperty('slug')) {
     const slugToSet = body.slug?.trim() || (postToUpdate.title ? postToUpdate.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '') : undefined);
     if (slugToSet) {
       postToUpdate.slug = slugToSet;
     } else if (body.slug === '' && !postToUpdate.title) { // If slug is explicitly empty AND title isn't there to generate from
        // This scenario is unlikely if title is required, but good to be defensive.
        // Or we could let DB handle if slug has a default or is nullable.
        // For now, if slug is empty and title isn't there, don't set slug to empty.
     }
  } else if (postToUpdate.title) { // If slug not in body, but title is, generate slug
     postToUpdate.slug = postToUpdate.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  }

  if (body.hasOwnProperty('description')) postToUpdate.description = body.description || null;
  if (body.hasOwnProperty('imageUrl')) {
    if (typeof body.imageUrl === 'string' && body.imageUrl.trim() !== '') {
      postToUpdate.image_url = body.imageUrl.trim();
    } else {
      return NextResponse.json({ message: "Image URL cannot be empty if provided for update." }, { status: 400 });
    }
  }
  if (body.hasOwnProperty('imageAltText')) postToUpdate.image_alt_text = body.imageAltText || null;
  if (body.hasOwnProperty('dataAiHint')) postToUpdate.data_ai_hint = body.dataAiHint || null;
  if (body.hasOwnProperty('ctaText')) postToUpdate.cta_text = body.ctaText || null;
  if (body.hasOwnProperty('ctaLink')) postToUpdate.cta_link = body.ctaLink || null;
  
  if (body.hasOwnProperty('price')) {
    postToUpdate.price = (body.price === null || body.price === undefined) ? null : Number(body.price);
    if (body.price !== null && body.price !== undefined && isNaN(postToUpdate.price)) return NextResponse.json({ message: "Invalid price value." }, { status: 400 });
  }
  if (body.hasOwnProperty('discountPrice')) {
    postToUpdate.discount_price = (body.discountPrice === null || body.discountPrice === undefined) ? null : Number(body.discountPrice);
     if (body.discountPrice !== null && body.discountPrice !== undefined && isNaN(postToUpdate.discount_price)) return NextResponse.json({ message: "Invalid discount price value." }, { status: 400 });
  }
  
  if (body.hasOwnProperty('sku')) postToUpdate.sku = body.sku || null;

  if (body.hasOwnProperty('validFrom')) {
    postToUpdate.valid_from = body.validFrom && body.validFrom.trim() !== '' ? new Date(body.validFrom).toISOString() : null;
  }
  if (body.hasOwnProperty('validUntil')) {
    postToUpdate.valid_until = body.validUntil && body.validUntil.trim() !== '' ? new Date(body.validUntil).toISOString() : null;
  }

  if (body.hasOwnProperty('isActive')) postToUpdate.is_active = body.isActive === undefined ? true : !!body.isActive;
  if (body.hasOwnProperty('displayOrder')) {
      postToUpdate.display_order = (body.displayOrder === null || body.displayOrder === undefined) ? 0 : Number(body.displayOrder);
      if (isNaN(postToUpdate.display_order)) postToUpdate.display_order = 0;
  }
  if (body.hasOwnProperty('backgroundColor')) postToUpdate.background_color = body.backgroundColor || null;
  if (body.hasOwnProperty('textColor')) postToUpdate.text_color = body.textColor || null;
  
  postToUpdate.updated_at = new Date().toISOString();

  if (Object.keys(postToUpdate).length <= 1 && postToUpdate.updated_at) {
    // No actual data change, only timestamp. We can skip the update to prevent unnecessary DB writes.
    // However, to provide a consistent response, let's fetch and return the current state.
    try {
        const { data: currentData, error: fetchError } = await supabaseAdmin
          .from('promotional_posts')
          .select('*')
          .eq('id', postId)
          .single();
        if (fetchError || !currentData) return NextResponse.json({ message: 'Post not found or error fetching current state for no-op update.' }, { status: 404 });
        return NextResponse.json(currentData);
    } catch (e: any) {
        return NextResponse.json({ message: 'Error during no-op update.', errorDetails: e.message }, { status: 500 });
    }
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
