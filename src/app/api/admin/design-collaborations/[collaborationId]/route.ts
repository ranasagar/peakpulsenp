
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '../../../../../lib/supabaseClient';
import type { DesignCollaborationGallery } from '@/types';

export const dynamic = 'force-dynamic';

// PUT (Update) a design collaboration
export async function PUT(
  request: NextRequest,
  { params }: { params: { collaborationId: string } }
) {
  const { collaborationId } = params;
  if (!supabase) return NextResponse.json({ message: 'Database client not configured.' }, { status: 503 });
  if (!collaborationId) return NextResponse.json({ message: 'Collaboration ID required' }, { status: 400 });

  try {
    const body = await request.json() as Partial<Omit<DesignCollaborationGallery, 'id' | 'createdAt' | 'updatedAt'>>;
    const galleryToUpdate: { [key: string]: any } = {};

    if (body.title !== undefined) galleryToUpdate.title = body.title;
    if (body.slug !== undefined) galleryToUpdate.slug = body.slug;
    else if (body.title !== undefined) galleryToUpdate.slug = body.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    
    if (body.hasOwnProperty('description')) galleryToUpdate.description = body.description || null;
    if (body.hasOwnProperty('category_id')) galleryToUpdate.category_id = body.category_id || null;
    if (body.hasOwnProperty('cover_image_url')) galleryToUpdate.cover_image_url = body.cover_image_url || null;
    if (body.hasOwnProperty('ai_cover_image_prompt')) galleryToUpdate.ai_cover_image_prompt = body.ai_cover_image_prompt || null;
    if (body.hasOwnProperty('artist_name')) galleryToUpdate.artist_name = body.artist_name || null;
    if (body.hasOwnProperty('artist_statement')) galleryToUpdate.artist_statement = body.artist_statement || null;
    if (body.hasOwnProperty('gallery_images')) galleryToUpdate.gallery_images = body.gallery_images || [];
    if (body.hasOwnProperty('is_published')) galleryToUpdate.is_published = body.is_published || false;
    if (body.hasOwnProperty('collaboration_date')) galleryToUpdate.collaboration_date = body.collaboration_date || null;
    
    galleryToUpdate."updatedAt" = new Date().toISOString();

    const { data, error } = await supabase
      .from('design_collaborations')
      .update(galleryToUpdate)
      .eq('id', collaborationId)
      .select(`*, category:design_collaboration_categories (name)`)
      .single();

    if (error) throw error;
    if (!data) return NextResponse.json({ message: 'Collaboration not found or update failed' }, { status: 404 });
    
    const responseData = {
        ...data,
        category_id: data.category_id,
        // @ts-ignore
        category_name: data.category?.name
    };
    return NextResponse.json(responseData);
  } catch (e: any) {
    console.error(`[API ADMIN DC PUT ${collaborationId}]`, e.message);
    return NextResponse.json({ message: e.message, details: e.details, hint: e.hint, code: e.code }, { status: 400 });
  }
}

// DELETE a design collaboration
export async function DELETE(
  request: NextRequest, 
  { params }: { params: { collaborationId: string } }
) {
  const { collaborationId } = params;
  if (!supabase) return NextResponse.json({ message: 'Database client not configured.' }, { status: 503 });
  if (!collaborationId) return NextResponse.json({ message: 'Collaboration ID required' }, { status: 400 });

  try {
    const { error } = await supabase
      .from('design_collaborations')
      .delete()
      .eq('id', collaborationId);
    if (error) throw error;
    return NextResponse.json({ message: 'Collaboration deleted successfully' });
  } catch (e: any) {
    console.error(`[API ADMIN DC DELETE ${collaborationId}]`, e.message);
    return NextResponse.json({ message: e.message, details: e.details, hint: e.hint, code: e.code }, { status: 500 });
  }
}

    