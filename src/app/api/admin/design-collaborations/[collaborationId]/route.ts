
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin, supabase as fallbackSupabase } from '../../../../../lib/supabaseClient.ts';
import type { DesignCollaborationGallery } from '@/types';

export const dynamic = 'force-dynamic';

// GET a single design collaboration
export async function GET(
  request: NextRequest,
  { params }: { params: { collaborationId: string } }
) {
  const { collaborationId } = params;
  const clientToUse = supabaseAdmin || fallbackSupabase;
  const clientType = supabaseAdmin ? "ADMIN client (service_role)" : "FALLBACK public client";

  if (!clientToUse) {
    console.error(`[API ADMIN DC GET /${collaborationId}] Supabase client (admin or fallback) not configured.`);
    return NextResponse.json({ message: 'Database client not configured.' }, { status: 503 });
  }
  if (!collaborationId) {
    return NextResponse.json({ message: 'Collaboration ID required' }, { status: 400 });
  }
  console.log(`[API ADMIN DC GET /${collaborationId}] Fetching collaboration. Using ${clientType}.`);

  try {
    const { data, error } = await clientToUse
      .from('design_collaborations')
      .select('*, category:design_collaboration_categories (id, name, slug)')
      .eq('id', collaborationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.warn(`[API ADMIN DC GET /${collaborationId}] Collaboration not found.`);
        return NextResponse.json({ message: 'Collaboration not found', rawSupabaseError: error }, { status: 404 });
      }
      console.error(`[API ADMIN DC GET /${collaborationId}] Supabase error:`, error);
      return NextResponse.json({ 
        message: `Failed to fetch collaboration. Supabase Error: ${error.message}`, 
        rawSupabaseError: { message: error.message, details: error.details, hint: error.hint, code: error.code }
      }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ message: 'Collaboration not found (no data returned).' }, { status: 404 });
    }
    
    const gallery = {
        ...data,
        category_name: data.category?.name || null,
        category_slug: data.category?.slug || null,
        gallery_images: Array.isArray(data.gallery_images) ? data.gallery_images.map((img: any, index: number) => ({
            id: img.id || `img-loaded-${data.id}-${index}`,
            url: img.url || '',
            altText: img.altText || '',
            dataAiHint: img.dataAiHint || '',
            displayOrder: img.displayOrder === undefined ? index : Number(img.displayOrder)
        })) : []
    };
    
    return NextResponse.json(gallery);
  } catch (e: any) {
    console.error(`[API ADMIN DC GET /${collaborationId}] Unhandled error:`, e);
    return NextResponse.json({ message: e.message || "An unexpected error occurred." }, { status: 500 });
  }
}


// PUT (Update) a design collaboration
export async function PUT(
  request: NextRequest,
  { params }: { params: { collaborationId: string } }
) {
  const { collaborationId } = params;
  const clientToUse = supabaseAdmin; 

  if (!clientToUse) {
    console.error(`[API ADMIN DC PUT /${collaborationId}] CRITICAL: Supabase ADMIN client (service_role) is not initialized. Cannot update. Check SUPABASE_SERVICE_ROLE_KEY.`);
    return NextResponse.json({ 
        message: 'Database admin client not configured. Cannot update collaboration. Contact administrator.', 
        rawSupabaseError: { message: 'Admin database client missing for collaboration update.'} 
    }, { status: 503 });
  }
  if (!collaborationId) {
    return NextResponse.json({ message: 'Collaboration ID required for update.' }, { status: 400 });
  }
  
  let body;
  try {
    body = await request.json() as Partial<Omit<DesignCollaborationGallery, 'id' | 'createdAt' | 'updatedAt'>>;
  } catch (jsonError: any) {
    console.error(`[API ADMIN DC PUT /${collaborationId}] Error parsing request JSON:`, jsonError);
    return NextResponse.json({ message: "Invalid JSON in request body.", errorDetails: jsonError.message }, { status: 400 });
  }
  console.log(`[API ADMIN DC PUT /${collaborationId}] Received body for update:`, JSON.stringify(body).substring(0, 500) + "...");

  const galleryToUpdate: { [key: string]: any } = {};
  if (body.title !== undefined) galleryToUpdate.title = body.title.trim();
  
  if (body.slug !== undefined && body.slug.trim() !== '') {
    galleryToUpdate.slug = body.slug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  } else if (body.title !== undefined && body.title.trim() !== '') { 
    galleryToUpdate.slug = body.title.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  }
  
  if (body.hasOwnProperty('description')) galleryToUpdate.description = body.description?.trim() || null;
  if (body.hasOwnProperty('category_id')) galleryToUpdate.category_id = body.category_id === "__NONE_CATEGORY__" || body.category_id === '' ? null : body.category_id;
  if (body.hasOwnProperty('cover_image_url')) galleryToUpdate.cover_image_url = body.cover_image_url?.trim() || null;
  if (body.hasOwnProperty('ai_cover_image_prompt')) galleryToUpdate.ai_cover_image_prompt = body.ai_cover_image_prompt?.trim() || null;
  if (body.hasOwnProperty('artist_name')) galleryToUpdate.artist_name = body.artist_name?.trim() || null;
  if (body.hasOwnProperty('artist_statement')) galleryToUpdate.artist_statement = body.artist_statement?.trim() || null;
  
  if (body.hasOwnProperty('gallery_images')) {
    galleryToUpdate.gallery_images = Array.isArray(body.gallery_images) 
        ? body.gallery_images.map((img: any, index: number) => ({
            id: img.id || `client-img-update-${Date.now()}-${index}`,
            url: img.url?.trim() || '',
            altText: img.altText?.trim() || null,
            dataAiHint: img.dataAiHint?.trim() || null,
            displayOrder: img.displayOrder === undefined || img.displayOrder === null ? index : Number(img.displayOrder)
          })).filter(img => img.url) 
        : [];
  }

  if (body.hasOwnProperty('is_published')) galleryToUpdate.is_published = body.is_published === undefined ? false : body.is_published;
  if (body.hasOwnProperty('collaboration_date')) galleryToUpdate.collaboration_date = body.collaboration_date?.trim() || null;
  
  // The database trigger handles "updatedAt"

  if (Object.keys(galleryToUpdate).length === 0) {
    return NextResponse.json({ message: 'No valid fields provided for update.' }, { status: 400 });
  }
  console.log(`[API ADMIN DC PUT /${collaborationId}] Payload to Supabase for update:`, JSON.stringify(galleryToUpdate).substring(0,500)+"...");

  try {
    const { data, error } = await clientToUse
      .from('design_collaborations')
      .update(galleryToUpdate)
      .eq('id', collaborationId)
      .select('*, category:design_collaboration_categories (id, name, slug)')
      .single();

    if (error) {
      console.error(`[API ADMIN DC PUT /${collaborationId}] Supabase error updating collaboration:`, error);
      const status = error.code === 'PGRST116' ? 404 : error.code === '23505' ? 409 : 500;
      const message = error.code === 'PGRST116' ? 'Collaboration not found for update.' : 
                      error.code === '23505' ? `Update failed: A collaboration with that title or slug may already exist. (${error.details || error.message})` :
                      `Database error updating collaboration: ${error.message}`;
      return NextResponse.json({ 
        message: message, 
        rawSupabaseError: { message: error.message, details: error.details, hint: error.hint, code: error.code }
      }, { status });
    }
    if (!data) {
        return NextResponse.json({ message: 'Collaboration not found after update attempt (no data returned).' }, { status: 404 });
    }
    
    const responseData = {
        ...data,
        category_name: data.category?.name || null,
        category_slug: data.category?.slug || null,
        gallery_images: Array.isArray(data.gallery_images) ? data.gallery_images.map((img: any, index: number) => ({
            id: img.id || `img-updated-${data.id}-${index}`,
            url: img.url || '',
            altText: img.altText || '',
            dataAiHint: img.dataAiHint || '',
            displayOrder: img.displayOrder === undefined ? index : Number(img.displayOrder)
        })) : []
    };
    console.log(`[API ADMIN DC PUT /${collaborationId}] Collaboration updated successfully.`);
    return NextResponse.json(responseData);
  } catch (e: any) {
    console.error(`[API ADMIN DC PUT /${collaborationId}] Unhandled error during update:`, e);
    return NextResponse.json({ message: e.message || "An unexpected error occurred during update.", rawSupabaseError: {message: e.message} }, { status: 500 });
  }
}

// DELETE a design collaboration
export async function DELETE(
  request: NextRequest, 
  { params }: { params: { collaborationId: string } }
) {
  const { collaborationId } = params;
  const clientToDeleteWith = supabaseAdmin; 

  if (!clientToDeleteWith) {
    console.error(`[API ADMIN DC DELETE /${collaborationId}] CRITICAL: Supabase ADMIN client (service_role) is not initialized. Cannot delete. Check SUPABASE_SERVICE_ROLE_KEY.`);
    return NextResponse.json({ 
        message: 'Database admin client not configured. Cannot delete collaboration. Contact administrator.', 
        rawSupabaseError: { message: 'Admin database client missing for collaboration deletion.' }
    }, { status: 503 });
  }
  if (!collaborationId) {
    return NextResponse.json({ message: 'Collaboration ID required for deletion.' }, { status: 400 });
  }
  console.log(`[API ADMIN DC DELETE /${collaborationId}] Attempting to delete collaboration. Using ADMIN client (service_role).`);

  try {
    const { error, count } = await clientToDeleteWith
      .from('design_collaborations')
      .delete({ count: 'exact' }) 
      .eq('id', collaborationId);

    if (error) {
      console.error(`[API ADMIN DC DELETE /${collaborationId}] Supabase error deleting collaboration:`, error);
      return NextResponse.json({ 
        message: `Failed to delete collaboration from database. Supabase Error: ${error.message}`, 
        rawSupabaseError: { message: error.message, details: error.details, hint: error.hint, code: error.code }
      }, { status: 500 });
    }

    if (count === 0) {
      console.warn(`[API ADMIN DC DELETE /${collaborationId}] No collaboration found with ID ${collaborationId} to delete.`);
      return NextResponse.json({ message: 'Collaboration not found, nothing to delete.' }, { status: 404 });
    }

    console.log(`[API ADMIN DC DELETE /${collaborationId}] Collaboration deleted successfully. Count: ${count}`);
    return NextResponse.json({ message: 'Collaboration deleted successfully' });
  } catch (e: any) {
    console.error(`[API ADMIN DC DELETE /${collaborationId}] Unhandled error during deletion:`, e);
    return NextResponse.json({ message: e.message || "An unexpected error occurred during deletion.", rawSupabaseError: {message: e.message} }, { status: 500 });
  }
}
