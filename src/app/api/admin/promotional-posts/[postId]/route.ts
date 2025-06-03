
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
  if (body.title !== undefined) postToUpdate.title = body.title;
  
  if (body.hasOwnProperty('slug')) {
     postToUpdate.slug = body.slug?.trim() || (body.title ? body.title.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '') : undefined);
     if (!postToUpdate.slug && body.title && body.title.trim() !== "") { // Ensure slug is generated if title exists but slug was empty
        postToUpdate.slug = body.title.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
     } else if (!postToUpdate.slug) {
        delete postToUpdate.slug; // Don't send undefined or empty slug if it cannot be derived
     }
  } else if (body.title && body.title.trim() !== '') {
     postToUpdate.slug = body.title.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  }


  if (body.hasOwnProperty('description')) postToUpdate.description = body.description === undefined ? null : body.description;
  if (body.imageUrl !== undefined) postToUpdate.image_url = body.imageUrl;
  if (body.hasOwnProperty('imageAltText')) postToUpdate.image_alt_text = body.imageAltText === undefined ? null : body.imageAltText;
  if (body.hasOwnProperty('dataAiHint')) postToUpdate.data_ai_hint = body.dataAiHint === undefined ? null : body.dataAiHint;
  if (body.hasOwnProperty('ctaText')) postToUpdate.cta_text = body.ctaText === undefined ? null : body.ctaText;
  if (body.hasOwnProperty('ctaLink')) postToUpdate.cta_link = body.ctaLink === undefined ? null : body.ctaLink;
  
  if (body.hasOwnProperty('price')) postToUpdate.price = body.price === undefined || body.price === null ? null : Number(body.price);
  if (body.hasOwnProperty('discountPrice')) postToUpdate.discount_price = body.discountPrice === undefined || body.discountPrice === null ? null : Number(body.discountPrice);
  
  if (body.hasOwnProperty('sku')) postToUpdate.sku = body.sku === undefined ? null : body.sku;
  if (body.hasOwnProperty('validFrom')) postToUpdate.valid_from = body.validFrom || null;
  if (body.hasOwnProperty('validUntil')) postToUpdate.valid_until = body.validUntil || null;
  if (body.hasOwnProperty('isActive')) postToUpdate.is_active = body.isActive === undefined ? true : !!body.isActive;
  if (body.hasOwnProperty('displayOrder')) postToUpdate.display_order = body.displayOrder === undefined ? 0 : Number(body.displayOrder);
  if (body.hasOwnProperty('backgroundColor')) postToUpdate.background_color = body.backgroundColor === undefined ? null : body.backgroundColor;
  if (body.hasOwnProperty('textColor')) postToUpdate.text_color = body.textColor === undefined ? null : body.textColor;
  
  postToUpdate.updated_at = new Date().toISOString();

  if (Object.keys(postToUpdate).length <= 1 && postToUpdate.updated_at) { // only updated_at means no real change
    delete postToUpdate.updated_at; // No need to send if only timestamp
    if(Object.keys(postToUpdate).length === 0) {
      return NextResponse.json({ message: "No valid fields to update." }, { status: 400 });
    }
  }
  
  // Ensure required fields are not accidentally nulled if they weren't part of the update but are NOT NULL in DB
  if (postToUpdate.title !== undefined && postToUpdate.title.trim() === "") {
    return NextResponse.json({ message: "Title cannot be empty." }, { status: 400 });
  }
  if (postToUpdate.image_url !== undefined && postToUpdate.image_url.trim() === "") {
     return NextResponse.json({ message: "Image URL cannot be empty." }, { status: 400 });
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
