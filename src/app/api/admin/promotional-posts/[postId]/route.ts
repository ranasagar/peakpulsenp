
// /src/app/api/admin/promotional-posts/[postId]/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabaseClient';
import type { PromotionalPost } from '@/types';

export const dynamic = 'force-dynamic';

// Helper to parse optional numeric fields that can be null
const parseOptionalNumericOrNull = (value: any): number | null => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null; // Explicitly map empty string, null, undefined to null
  }
  const num = Number(value);
  // If, after attempting to convert, it's NaN, also treat as null
  // This aligns with Zod schema allowing .nullable()
  return isNaN(num) ? null : num;
};

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
    } else if (body.title !== undefined) { 
        return NextResponse.json({ message: "Title cannot be empty if provided for update." }, { status: 400 });
    }
  }
  
  if (body.hasOwnProperty('slug')) {
     const slugToSet = body.slug?.trim() || (postToUpdate.title ? postToUpdate.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '') : undefined);
     if (slugToSet && slugToSet.length > 0) {
       postToUpdate.slug = slugToSet;
     } else if (body.slug !== undefined && !postToUpdate.title) { // Slug explicitly empty and no title to derive from
        return NextResponse.json({ message: "Slug cannot be empty if title is also not being updated to a non-empty value." }, { status: 400 });
     }
  } else if (postToUpdate.title) { 
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
    postToUpdate.price = parseOptionalNumericOrNull(body.price);
  }
  if (body.hasOwnProperty('discountPrice')) {
    postToUpdate.discount_price = parseOptionalNumericOrNull(body.discountPrice);
  }
  
  if (body.hasOwnProperty('sku')) postToUpdate.sku = body.sku || null;

  if (body.hasOwnProperty('validFrom')) {
    const vd = String(body.validFrom).trim();
    postToUpdate.valid_from = vd ? new Date(vd).toISOString() : null;
    if (vd && postToUpdate.valid_from && isNaN(new Date(postToUpdate.valid_from).getTime())) {
        return NextResponse.json({ message: `Invalid date format for validFrom: '${body.validFrom}'` }, { status: 400 });
    }
  }
  if (body.hasOwnProperty('validUntil')) {
    const vu = String(body.validUntil).trim();
    postToUpdate.valid_until = vu ? new Date(vu).toISOString() : null;
    if (vu && postToUpdate.valid_until && isNaN(new Date(postToUpdate.valid_until).getTime())) {
        return NextResponse.json({ message: `Invalid date format for validUntil: '${body.validUntil}'` }, { status: 400 });
    }
  }
  
  // Validate date range server-side if both are present
  if (postToUpdate.valid_from && postToUpdate.valid_until && new Date(postToUpdate.valid_until) < new Date(postToUpdate.valid_from)) {
    return NextResponse.json({ message: "Valid until date must be after or same as valid from date." }, { status: 400 });
  }


  if (body.hasOwnProperty('isActive')) postToUpdate.is_active = body.isActive === undefined ? true : !!body.isActive;
  
  if (body.hasOwnProperty('displayOrder')) {
      const numDisplayOrder = Number(body.displayOrder);
      postToUpdate.display_order = (body.displayOrder === null || body.displayOrder === undefined || String(body.displayOrder).trim() === "" || isNaN(numDisplayOrder))
                                  ? 0 
                                  : numDisplayOrder;
  }
  
  if (body.hasOwnProperty('backgroundColor')) postToUpdate.background_color = body.backgroundColor || null;
  if (body.hasOwnProperty('textColor')) postToUpdate.text_color = body.textColor || null;
  
  postToUpdate.updated_at = new Date().toISOString();

  if (Object.keys(postToUpdate).length <= 1 && postToUpdate.updated_at) {
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

    