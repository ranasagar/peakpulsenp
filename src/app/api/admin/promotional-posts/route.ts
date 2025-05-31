
// /src/app/api/admin/promotional-posts/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseClient';
import type { PromotionalPost } from '@/types';

export const dynamic = 'force-dynamic';

// GET all promotional posts for admin
export async function GET() {
  if (!supabaseAdmin) {
    return NextResponse.json({ message: 'Admin database service not available.' }, { status: 503 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('promotional_posts')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error fetching promotional posts:', error);
      return NextResponse.json({ message: 'Failed to fetch promotional posts.', rawSupabaseError: error }, { status: 500 });
    }
    return NextResponse.json(data || []);
  } catch (e: any) {
    console.error('Error fetching promotional posts:', e);
    return NextResponse.json({ message: 'Server error.', errorDetails: e.message }, { status: 500 });
  }
}

// POST a new promotional post (Admin)
export async function POST(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ message: 'Admin database service not available.' }, { status: 503 });
  }

  let body: Omit<PromotionalPost, 'id' | 'createdAt' | 'updatedAt'>;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ message: 'Invalid JSON payload.' }, { status: 400 });
  }

  if (!body.title || !body.imageUrl) {
    return NextResponse.json({ message: 'Title and Image URL are required.' }, { status: 400 });
  }

  const postToInsert = {
    title: body.title,
    slug: body.slug?.trim() || body.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
    description: body.description || null,
    image_url: body.imageUrl,
    image_alt_text: body.imageAltText || null,
    data_ai_hint: body.dataAiHint || null,
    cta_text: body.ctaText || null,
    cta_link: body.ctaLink || null,
    price: body.price !== undefined && body.price !== null ? Number(body.price) : null,
    discount_price: body.discountPrice !== undefined && body.discountPrice !== null ? Number(body.discountPrice) : null,
    valid_from: body.validFrom || null,
    valid_until: body.validUntil || null,
    is_active: body.isActive === undefined ? true : body.isActive,
    display_order: body.displayOrder === undefined ? 0 : Number(body.displayOrder),
    background_color: body.backgroundColor || null,
    text_color: body.textColor || null,
    // createdAt and updatedAt will be handled by database defaults/triggers
  };

  try {
    const { data, error } = await supabaseAdmin
      .from('promotional_posts')
      .insert(postToInsert)
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating promotional post:', error);
      if (error.code === '23505') { // unique_violation for slug
         return NextResponse.json({ message: `Failed to create post: slug '${postToInsert.slug}' already exists.`, rawSupabaseError: error }, { status: 409 });
      }
      return NextResponse.json({ message: 'Failed to create promotional post.', rawSupabaseError: error }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    console.error('Error creating promotional post:', e);
    return NextResponse.json({ message: 'Server error.', errorDetails: e.message }, { status: 500 });
  }
}
