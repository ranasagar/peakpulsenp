
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin, supabase as fallbackSupabase } from '../../../../../lib/supabaseClient.ts';
import type { DesignCollaborationGallery, GalleryImageItem } from '@/types';

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
      .select('*, category:design_collaboration_categories (id, name, slug), created_at, updated_at')
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

    const gallery: DesignCollaborationGallery = {
        ...data,
        category_name: data.category?.name || undefined,
        category_slug: data.category?.slug || undefined,
        gallery_images: Array.isArray(data.gallery_images) ? data.gallery_images.map((img: any, index: number) => ({
            id: img.id || `img-loaded-${data.id}-${index}`,
            url: img.url || '',
            altText: img.altText || '',
            dataAiHint: img.dataAiHint || '',
            displayOrder: img.displayOrder === undefined ? index : Number(img.displayOrder)
        })) : [],
        createdAt: data.created_at,
        updatedAt: data.updated_at,
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
  const clientTypeForLog = supabaseAdmin ? "ADMIN client (service_role)" : "FALLBACK public client (WARNING: RLS will apply)";

  if (!clientToUse) {
    const errorMessage = `CRITICAL: Supabase ADMIN client (service_role) is not initialized for PUT on /api/admin/design-collaborations/${collaborationId}. Check SUPABASE_SERVICE_ROLE_KEY.`;
    console.error(errorMessage);
    return NextResponse.json({
        message: 'Database admin client not configured for update operations. Contact administrator.',
        rawSupabaseError: { message: errorMessage }
    }, { status: 503 });
  }

  if (!collaborationId) {
    return NextResponse.json({ message: 'Collaboration ID required for update.' }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch (jsonError: any) {
    console.error(`[API ADMIN DC PUT /${collaborationId}] Error parsing request JSON:`, jsonError.message);
    return NextResponse.json({ message: "Invalid JSON in request body.", errorDetails: jsonError.message }, { status: 400 });
  }
  console.log(`[API ADMIN DC PUT /${collaborationId}] Received body for update:`, JSON.stringify(body).substring(0, 500) + "...");

  const galleryToUpdate: { [key: string]: any } = {};

  if (body.hasOwnProperty('title')) galleryToUpdate.title = body.title?.trim() || null;

  if (body.hasOwnProperty('slug')) {
    if (body.slug && body.slug.trim() !== '') {
      galleryToUpdate.slug = body.slug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    } else if (body.title && body.title.trim() !== '') {
      galleryToUpdate.slug = body.title.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    }
  } else if (body.hasOwnProperty('title') && body.title?.trim() !== '') {
     galleryToUpdate.slug = body.title.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  }

  if (body.hasOwnProperty('description')) galleryToUpdate.description = body.description?.trim() || null;
  if (body.hasOwnProperty('category_id')) {
    galleryToUpdate.category_id = body.category_id === "__NONE_CATEGORY__" || body.category_id === '' || body.category_id === undefined ? null : body.category_id;
  }
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
          })).filter((img: GalleryImageItem) => img.url) 
        : [];
  }

  if (body.hasOwnProperty('is_published')) galleryToUpdate.is_published = body.is_published === undefined ? false : !!body.is_published;
  if (body.hasOwnProperty('collaboration_date')) galleryToUpdate.collaboration_date = body.collaboration_date?.trim() || null;
  
  // updated_at is handled by Supabase trigger

  if (Object.keys(galleryToUpdate).length === 0) {
    console.log(`[API ADMIN DC PUT /${collaborationId}] No valid fields provided for update. Fetching current data.`);
     try {
        const { data: currentData, error: fetchError } = await clientToUse
            .from('design_collaborations')
            .select('*, category:design_collaboration_categories (id, name, slug), created_at, updated_at')
            .eq('id', collaborationId)
            .single();
        if (fetchError) {
             console.error(`[API ADMIN DC PUT /${collaborationId}] Error fetching current data for no-op update:`, fetchError);
             return NextResponse.json({ message: 'Error fetching current data for no-op update.', rawSupabaseError: { message: fetchError.message, details: fetchError.details, hint: fetchError.hint, code: fetchError.code }}, { status: 500 });
        }
        if (!currentData) return NextResponse.json({ message: 'Collaboration not found for no-op update.'}, { status: 404 });
        const responseData: DesignCollaborationGallery = {
            ...currentData,
            category_name: currentData.category?.name || undefined,
            category_slug: currentData.category?.slug || undefined,
            gallery_images: Array.isArray(currentData.gallery_images) ? currentData.gallery_images.map((img: any, index: number) => ({
                id: img.id || `img-current-${currentData.id}-${index}`,
                url: img.url || '',
                altText: img.altText || '',
                dataAiHint: img.dataAiHint || '',
                displayOrder: img.displayOrder === undefined ? index : Number(img.displayOrder)
            })) : [],
            createdAt: currentData.created_at,
            updatedAt: currentData.updated_at,
        };
        return NextResponse.json(responseData);
    } catch(e: any){
        console.error(`[API ADMIN DC PUT /${collaborationId}] Exception fetching current data for no-op update:`, e);
        return NextResponse.json({ message: `No fields to update, and failed to fetch current data. Error: ${e.message}` }, { status: 400 });
    }
  }
  console.log(`[API ADMIN DC PUT /${collaborationId}] Attempting to update. Using ${clientTypeForLog}. Payload to Supabase:`, JSON.stringify(galleryToUpdate).substring(0,500)+"...");

  try {
    const { data, error } = await clientToUse
      .from('design_collaborations')
      .update(galleryToUpdate)
      .eq('id', collaborationId)
      .select('*, category:design_collaboration_categories (id, name, slug), created_at, updated_at')
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
        console.warn(`[API ADMIN DC PUT /${collaborationId}] Supabase update succeeded but returned no data. This might indicate the row was not found.`);
        return NextResponse.json({ message: 'Collaboration not found after update attempt (no data returned).' }, { status: 404 });
    }

    const responseData: DesignCollaborationGallery = {
        ...data,
        category_name: data.category?.name || undefined,
        category_slug: data.category?.slug || undefined,
        gallery_images: Array.isArray(data.gallery_images) ? data.gallery_images.map((img: any, index: number) => ({
            id: img.id || `img-updated-${data.id}-${index}`,
            url: img.url || '',
            altText: img.altText || '',
            dataAiHint: img.dataAiHint || '',
            displayOrder: img.displayOrder === undefined ? index : Number(img.displayOrder)
        })) : [],
        createdAt: data.created_at,
        updatedAt: data.updated_at,
    };
    console.log(`[API ADMIN DC PUT /${collaborationId}] Collaboration updated successfully.`);
    return NextResponse.json(responseData);
  } catch (e: any) {
    console.error(`[API ADMIN DC PUT /${collaborationId}] Unhandled error during update:`, e);
    return NextResponse.json({
        message: e.message || "An unexpected error occurred during collaboration update.",
        rawSupabaseError: { message: e.message, code: e.code, details: e.details, hint: e.hint }
    }, { status: 500 });
  }
}


// DELETE a design collaboration
export async function DELETE(
  request: NextRequest,
  { params }: { params: { collaborationId: string } }
) {
  const { collaborationId } = params;
  const clientToDeleteWith = supabaseAdmin;
  const clientTypeForLog = supabaseAdmin ? "ADMIN client (service_role)" : "FALLBACK public client (WARNING: RLS will apply)";

  if (!clientToDeleteWith) {
     const errorMessage = `CRITICAL: Supabase ADMIN client (service_role) is not initialized for DELETE on /api/admin/design-collaborations/${collaborationId}. Check SUPABASE_SERVICE_ROLE_KEY.`;
    console.error(errorMessage);
    return NextResponse.json({
        message: 'Database admin client not configured. Cannot delete collaboration. Contact administrator.',
        rawSupabaseError: { message: errorMessage }
    }, { status: 503 });
  }
  if (!collaborationId) {
    return NextResponse.json({ message: 'Collaboration ID required for deletion.' }, { status: 400 });
  }
  console.log(`[API ADMIN DC DELETE /${collaborationId}] Attempting to delete collaboration. Using ${clientTypeForLog}.`);

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
    return NextResponse.json({
        message: e.message || "An unexpected error occurred during collaboration deletion.",
        rawSupabaseError: { message: e.message, code: e.code, details: e.details, hint: e.hint }
    }, { status: 500 });
  }
}

    