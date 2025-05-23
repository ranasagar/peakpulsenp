
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient';
import type { DesignCollaborationGallery } from '@/types';

export const dynamic = 'force-dynamic';

// GET all design collaborations
export async function GET() {
  if (!supabase) return NextResponse.json({ message: 'Database client not configured.' }, { status: 503 });
  try {
    const { data, error } = await supabase
      .from('design_collaborations')
      .select(`
        *,
        category:design_collaboration_categories (name)
      `)
      .order('collaboration_date', { ascending: false, nullsFirst: false })
      .order('createdAt', { ascending: false });

    if (error) throw error;

    const galleries = data?.map(g => ({
      ...g,
      category_id: g.category_id, // Keep original category_id
      // @ts-ignore - Supabase typing for joined tables can be tricky
      category_name: g.category?.name 
    })) || [];

    return NextResponse.json(galleries);
  } catch (e: any) {
    console.error('[API ADMIN DC GET]', e.message);
    return NextResponse.json({ message: e.message, details: e.details, hint: e.hint, code: e.code }, { status: 500 });
  }
}

// POST a new design collaboration
export async function POST(request: NextRequest) {
  if (!supabase) return NextResponse.json({ message: 'Database client not configured.' }, { status: 503 });
  try {
    const body = await request.json() as Omit<DesignCollaborationGallery, 'id' | 'createdAt' | 'updatedAt'>;
    const galleryToInsert = {
      title: body.title,
      slug: body.slug || body.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
      description: body.description || null,
      category_id: body.category_id || null,
      cover_image_url: body.cover_image_url || null,
      ai_cover_image_prompt: body.ai_cover_image_prompt || null,
      artist_name: body.artist_name || null,
      artist_statement: body.artist_statement || null,
      gallery_images: body.gallery_images || [], // Ensure it's an array, even if empty
      is_published: body.is_published || false,
      collaboration_date: body.collaboration_date || null,
    };
    const { data, error } = await supabase
      .from('design_collaborations')
      .insert(galleryToInsert)
      .select(`*, category:design_collaboration_categories (name)`) // Re-fetch with category name
      .single();
    if (error) throw error;
    
    const responseData = {
        ...data,
        category_id: data.category_id,
        // @ts-ignore
        category_name: data.category?.name
    };
    return NextResponse.json(responseData, { status: 201 });
  } catch (e: any) {
    console.error('[API ADMIN DC POST]', e.message, e);
    return NextResponse.json({ message: e.message, details: e.details, hint: e.hint, code: e.code }, { status: 400 });
  }
}

    