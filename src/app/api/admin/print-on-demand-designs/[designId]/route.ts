
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin, supabase as fallbackSupabase } from '../../../../../lib/supabaseClient';
import type { PrintOnDemandDesign } from '@/types';

export const dynamic = 'force-dynamic';

// GET a single print-on-demand design (Admin - can use service role for full access)
export async function GET(
  request: NextRequest,
  { params }: { params: { designId: string } }
) {
  const { designId } = params;
  const clientToUse = supabaseAdmin || fallbackSupabase;
  const clientTypeForLog = supabaseAdmin ? "ADMIN client (service_role)" : "FALLBACK public client";
  console.log(`[API ADMIN POD GET /${designId}] Request to fetch design. Using ${clientTypeForLog}.`);


  if (!clientToUse) {
    console.error(`[API ADMIN POD GET /${designId}] Supabase client not configured.`);
    return NextResponse.json({ message: 'Database client not configured.' }, { status: 503 });
  }
  if (!designId) {
    return NextResponse.json({ message: 'Design ID required' }, { status: 400 });
  }

  try {
    const { data, error } = await clientToUse
      .from('print_on_demand_designs')
      .select(`*, collaboration:design_collaborations (title), created_at, updated_at`)
      .eq('id', designId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ message: 'Print design not found.', rawSupabaseError: error }, { status: 404 });
      }
      console.error(`[API ADMIN POD GET /${designId}] Supabase error:`, error);
      return NextResponse.json({ message: 'Failed to fetch print design.', rawSupabaseError: error }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ message: 'Print design not found (no data returned).' }, { status: 404 });
    }
    
    const responseData: PrintOnDemandDesign = {
        ...data,
        collaboration_title: (data as any).collaboration?.title || undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
    };
    return NextResponse.json(responseData);
  } catch (e: any) {
    console.error(`[API ADMIN POD GET /${designId}] Unhandled error:`, e);
    return NextResponse.json({ message: 'Server error.', errorDetails: e.message }, { status: 500 });
  }
}


// PUT (Update) a print-on-demand design (Admin only - use service_role key)
export async function PUT(
  request: NextRequest,
  { params }: { params: { designId: string } }
) {
  const { designId } = params;
  const clientForWrite = supabaseAdmin;
  console.log(`[API ADMIN POD PUT /${designId}] Request to update design.`);

  if (!clientForWrite) {
    console.error(`[API ADMIN POD PUT /${designId}] CRITICAL: Supabase ADMIN client (service_role) is not initialized. Cannot update design.`);
    return NextResponse.json({
        message: 'Database admin client not configured. Service role key might be missing.',
        rawSupabaseError: { message: 'Admin database client for design update is missing.' }
    }, { status: 503 });
  }
  console.log(`[API ADMIN POD PUT /${designId}] Using ADMIN Supabase client (service_role).`);
  
  if (!designId) {
    return NextResponse.json({ message: 'Design ID required for update.' }, { status: 400 });
  }

  let body;
  try {
    body = await request.json() as Partial<Omit<PrintOnDemandDesign, 'id' | 'createdAt' | 'updatedAt' | 'collaboration_title'>>;
  } catch (jsonError: any) {
    console.error(`[API ADMIN POD PUT /${designId}] Error parsing request JSON:`, jsonError);
    return NextResponse.json({ message: "Invalid JSON in request body.", errorDetails: jsonError.message }, { status: 400 });
  }
  console.log(`[API ADMIN POD PUT /${designId}] Received body:`, body);

  const designToUpdate: { [key: string]: any } = {};

  if (body.hasOwnProperty('title')) designToUpdate.title = body.title;
  
  if (body.hasOwnProperty('slug')) {
    if (body.slug && body.slug.trim() !== '') {
        designToUpdate.slug = body.slug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    } else if (body.title && body.title.trim() !== '') {
        designToUpdate.slug = body.title.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    }
  } else if (body.hasOwnProperty('title') && body.title?.trim() !== '') {
     designToUpdate.slug = body.title.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  }
  
  if (body.hasOwnProperty('description')) designToUpdate.description = body.description || null;
  if (body.image_url) designToUpdate.image_url = body.image_url; // Required, so should be present
  if (body.hasOwnProperty('ai_image_prompt')) designToUpdate.ai_image_prompt = body.ai_image_prompt || null;
  if (body.hasOwnProperty('price')) designToUpdate.price = Number(body.price); // Required
  if (body.hasOwnProperty('is_for_sale')) designToUpdate.is_for_sale = body.is_for_sale === undefined ? true : !!body.is_for_sale;
  if (body.hasOwnProperty('sku')) designToUpdate.sku = body.sku || null;
  if (body.hasOwnProperty('collaboration_id')) {
    designToUpdate.collaboration_id = body.collaboration_id === "__NONE_COLLAB__" || body.collaboration_id === '' ? null : body.collaboration_id;
  }
  
  // "updated_at" will be handled by the database trigger
  if (Object.keys(designToUpdate).length === 0) {
    return NextResponse.json({ message: "No valid fields provided for update." }, { status: 400 });
  }
  console.log(`[API ADMIN POD PUT /${designId}] Payload to Supabase:`, designToUpdate);

  try {
    const { data, error } = await clientForWrite
      .from('print_on_demand_designs')
      .update(designToUpdate)
      .eq('id', designId)
      .select(`*, collaboration:design_collaborations (title), created_at, updated_at`)
      .single();

    if (error) {
      console.error(`[API ADMIN POD PUT /${designId}] Supabase error updating design:`, error);
      const status = error.code === 'PGRST116' ? 404 : error.code === '23505' ? 409 : 500;
      const message = error.code === 'PGRST116' ? 'Design not found for update.' : 
                      error.code === '23505' ? `Update failed: A design with that title, slug or SKU might already exist. (${error.details || error.message})` :
                      `Database error updating design: ${error.message}`;
      return NextResponse.json({ 
        message: message, 
        rawSupabaseError: { message: error.message, details: error.details, hint: error.hint, code: error.code }
      }, { status });
    }
    if (!data) {
      return NextResponse.json({ message: 'Design not found after update attempt.' }, { status: 404 });
    }
    
    const responseData: PrintOnDemandDesign = {
        ...data,
        collaboration_title: (data as any).collaboration?.title || undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
    };
    console.log(`[API ADMIN POD PUT /${designId}] Design updated successfully.`);
    return NextResponse.json(responseData);
  } catch (e: any) {
    console.error(`[API ADMIN POD PUT /${designId}] Unhandled error:`, e);
    return NextResponse.json({ message: 'Server error updating print design.', errorDetails: e.message }, { status: 500 });
  }
}

// DELETE a print-on-demand design (Admin only - use service_role key)
export async function DELETE(
  request: NextRequest, 
  { params }: { params: { designId: string } }
) {
  const { designId } = params;
  const clientForWrite = supabaseAdmin;
  console.log(`[API ADMIN POD DELETE /${designId}] Request to delete design.`);

  if (!clientForWrite) {
    console.error(`[API ADMIN POD DELETE /${designId}] CRITICAL: Supabase ADMIN client (service_role) is not initialized.`);
    return NextResponse.json({
        message: 'Database admin client not configured. Service role key might be missing.',
        rawSupabaseError: { message: 'Admin database client for design deletion is missing.' }
    }, { status: 503 });
  }
  console.log(`[API ADMIN POD DELETE /${designId}] Using ADMIN Supabase client (service_role).`);

  if (!designId) {
    return NextResponse.json({ message: 'Design ID required for deletion.' }, { status: 400 });
  }

  try {
    const { error, count } = await clientForWrite
      .from('print_on_demand_designs')
      .delete({ count: 'exact' }) // Get count of deleted rows
      .eq('id', designId);

    if (error) {
      console.error(`[API ADMIN POD DELETE /${designId}] Supabase error deleting design:`, error);
      return NextResponse.json({ 
        message: 'Failed to delete print design from database.', 
        rawSupabaseError: { message: error.message, details: error.details, hint: error.hint, code: error.code }
      }, { status: 500 });
    }

    if (count === 0) {
        console.warn(`[API ADMIN POD DELETE /${designId}] No design found with ID ${designId} to delete.`);
        return NextResponse.json({ message: 'Print design not found, nothing to delete.' }, { status: 404 });
    }
    
    console.log(`[API ADMIN POD DELETE /${designId}] Design deleted successfully. Count: ${count}`);
    return NextResponse.json({ message: 'Print design deleted successfully' });
  } catch (e: any) {
    console.error(`[API ADMIN POD DELETE /${designId}] Unhandled error:`, e);
    return NextResponse.json({ message: 'Server error deleting print design.', errorDetails: e.message }, { status: 500 });
  }
}

    