
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin, supabase as fallbackSupabase } from '../../../../lib/supabaseClient';
import type { DesignCollaborationGallery, GalleryImageItem } from '@/types';

export const dynamic = 'force-dynamic';

// GET all design collaborations (for admin)
export async function GET() {
  console.log("[API ADMIN DC GET] Request received to fetch all collaborations for admin.");
  const clientToUse = supabaseAdmin || fallbackSupabase;
  const clientType = supabaseAdmin ? "ADMIN client (service_role)" : "FALLBACK public client";
  console.log(`[API ADMIN DC GET] Using ${clientType}.`);

  if (!clientToUse) {
    console.error('[API ADMIN DC GET] Supabase client (admin or fallback) is not initialized.');
    return NextResponse.json({ message: 'Database client not configured.', rawSupabaseError: { message: 'Database client not properly initialized.' } }, { status: 503 });
  }

  try {
    const { data, error } = await clientToUse
      .from('design_collaborations')
      .select(`
        *,
        category:design_collaboration_categories (name)
      `)
      .order('collaboration_date', { ascending: false, nullsFirst: false })
      .order('"createdAt"', { ascending: false });

    if (error) {
      console.error('[API ADMIN DC GET] Supabase error fetching collaborations:', error);
      return NextResponse.json({ 
        message: `Failed to fetch collaborations. Supabase error: ${error.message}`, 
        rawSupabaseError: { message: error.message, details: error.details, hint: error.hint, code: error.code }
      }, { status: 500 });
    }

    const galleries = data?.map((g: any) => ({
      ...g,
      category_id: g.category_id,
      category_name: g.category?.name,
      gallery_images: Array.isArray(g.gallery_images) ? g.gallery_images.map((img: Partial<GalleryImageItem>, index: number) => ({
        id: img.id || `img-loaded-${g.id}-${index}`,
        url: img.url || '',
        altText: img.altText || '',
        dataAiHint: img.dataAiHint || '',
        displayOrder: img.displayOrder === undefined ? index : Number(img.displayOrder)
      })) : []
    })) || [];
    
    console.log(`[API ADMIN DC GET] Successfully fetched ${galleries.length} collaborations for admin.`);
    return NextResponse.json(galleries);
  } catch (e: any) {
    console.error('[API ADMIN DC GET] Unhandled error:', e);
    return NextResponse.json({ message: 'Server error fetching collaborations.', errorDetails: e.message }, { status: 500 });
  }
}

// POST a new design collaboration (Admin)
export async function POST(request: NextRequest) {
  console.log("[API ADMIN DC POST] Request received to create new design collaboration.");
  const clientForWrite = supabaseAdmin; // Strictly use admin client for creates

  if (!clientForWrite) {
    console.error('[API ADMIN DC POST] CRITICAL: Supabase ADMIN client (service_role) is not initialized. Cannot create collaboration. Check SUPABASE_SERVICE_ROLE_KEY.');
    return NextResponse.json({ 
        message: 'Database admin client not configured. Cannot create collaboration. Service role key might be missing.',
        rawSupabaseError: { message: 'Admin database client (service_role) for collaboration creation is missing.' }
    }, { status: 503 });
  }
  console.log("[API ADMIN DC POST] Using ADMIN Supabase client (service_role).");
  
  let body;
  try {
    body = await request.json() as Omit<DesignCollaborationGallery, 'id' | 'createdAt' | 'updatedAt'>;
  } catch (jsonError: any) {
    console.error("[API ADMIN DC POST] Error parsing request JSON:", jsonError);
    return NextResponse.json({ message: "Invalid JSON in request body.", errorDetails: jsonError.message }, { status: 400 });
  }
  console.log("[API ADMIN DC POST] Received body:", JSON.stringify(body, null, 2).substring(0, 1000) + "...");

  if (!body.title || body.title.trim() === '') {
    return NextResponse.json({ message: "Collaboration title is required." }, { status: 400 });
  }

  const galleryToInsert = {
    title: body.title,
    slug: body.slug?.trim() || body.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
    description: body.description || null,
    category_id: body.category_id || null,
    cover_image_url: body.cover_image_url || null,
    ai_cover_image_prompt: body.ai_cover_image_prompt || null,
    artist_name: body.artist_name || null,
    artist_statement: body.artist_statement || null,
    gallery_images: Array.isArray(body.gallery_images) 
        ? body.gallery_images.map((img, index) => ({
            id: img.id || `client-img-${Date.now()}-${index}`, // Ensure ID for client-side list keys, not critical for DB
            url: img.url,
            altText: img.altText || null,
            dataAiHint: img.dataAiHint || null,
            displayOrder: img.displayOrder === undefined ? index : Number(img.displayOrder)
          })) 
        : [],
    is_published: body.is_published === undefined ? false : body.is_published,
    collaboration_date: body.collaboration_date || null,
    // Supabase will handle "createdAt" and "updatedAt" by default/trigger
  };
  console.log("[API ADMIN DC POST] Data to insert into Supabase:", JSON.stringify(galleryToInsert, null, 2).substring(0,1000)+"...");

  try {
    const { data: insertedData, error: insertError } = await clientForWrite
      .from('design_collaborations')
      .insert(galleryToInsert)
      .select(`*, category:design_collaboration_categories (name)`)
      .single();

    if (insertError) {
      console.error('[API ADMIN DC POST] Supabase error creating collaboration:', insertError);
      const specificMessage = insertError.code === '23505' // Unique constraint violation
        ? `Failed to create collaboration: A collaboration with that title or slug already exists. (${insertError.details || insertError.message})`
        : `Failed to create collaboration in database. Supabase error: ${insertError.message}`;
      return NextResponse.json({ 
        message: specificMessage, 
        rawSupabaseError: { message: insertError.message, details: insertError.details, hint: insertError.hint, code: insertError.code }
      }, { status: insertError.code === '23505' ? 409 : 500 });
    }
    if (!insertedData) {
        console.error('[API ADMIN DC POST] Supabase insert succeeded but returned no data.');
        return NextResponse.json({ message: 'Collaboration creation succeeded but no data returned from database.'}, { status: 500 });
    }
    
    const responseData = {
        ...insertedData,
        category_id: insertedData.category_id,
        // @ts-ignore
        category_name: insertedData.category?.name
    };
    console.log(`[API ADMIN DC POST] Collaboration "${responseData.title}" created successfully.`);
    return NextResponse.json(responseData, { status: 201 });

  } catch (e: any) {
    console.error('[API ADMIN DC POST] Unhandled exception during collaboration creation:', e);
    return NextResponse.json({ 
        message: 'Server error during collaboration creation.', 
        errorDetails: e.message,
        rawSupabaseError: { message: e.message }
    }, { status: 500 });
  }
}
