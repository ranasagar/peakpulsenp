
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin, supabase as fallbackSupabase } from '../../../../../lib/supabaseClient.ts'; // Corrected path
import type { DesignCollaborationCategory } from '@/types';

export const dynamic = 'force-dynamic';

// GET a single design collaboration category
export async function GET(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  const { categoryId } = params;
  const clientForRead = supabaseAdmin || fallbackSupabase;
  if (!clientForRead) {
    console.error(`[API ADMIN DCC GET /${categoryId}] Supabase client not configured.`);
    return NextResponse.json({ message: 'Database client not configured.' }, { status: 503 });
  }
  if (!categoryId) return NextResponse.json({ message: 'Category ID required' }, { status: 400 });

  console.log(`[API ADMIN DCC GET /${categoryId}] Fetching category. Using ${clientForRead === supabaseAdmin ? "ADMIN client" : "PUBLIC client"}.`);
  try {
    const { data, error } = await clientForRead
      .from('design_collaboration_categories')
      .select('*')
      .eq('id', categoryId)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return NextResponse.json({ message: 'Category not found' }, { status: 404 });
      console.error(`[API ADMIN DCC GET /${categoryId}] Supabase error:`, error);
      return NextResponse.json({ message: 'Failed to fetch category.', rawSupabaseError: error }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (e: any) {
    console.error(`[API ADMIN DCC GET /${categoryId}] Unhandled error:`, e);
    return NextResponse.json({ message: e.message || "An unexpected error occurred." }, { status: 500 });
  }
}


// PUT (Update) a design collaboration category
export async function PUT(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  const { categoryId } = params;
  const supabaseService = supabaseAdmin; 

  if (!supabaseService) {
    console.error(`[API ADMIN DCC PUT /${categoryId}] CRITICAL: Supabase Service Role Client (supabaseAdmin) is not initialized. Update will fail. Check SUPABASE_SERVICE_ROLE_KEY.`);
    return NextResponse.json({
      message: 'Database admin client not configured for write operations. Service role key might be missing.',
      rawSupabaseError: { message: `Admin database client (service_role) not available for updating design collaboration category ${categoryId}.` }
    }, { status: 503 });
  }
  if (!categoryId) return NextResponse.json({ message: 'Category ID required' }, { status: 400 });

  console.log(`[API ADMIN DCC PUT /${categoryId}] Attempting to update category. Using ADMIN client (service_role).`);

  let body;
  try {
    body = await request.json() as Partial<Omit<DesignCollaborationCategory, 'id' | 'createdAt' | 'updatedAt'>>;
  } catch (jsonError: any) {
    console.error(`[API ADMIN DCC PUT /${categoryId}] Error parsing request JSON:`, jsonError);
    return NextResponse.json({ message: "Invalid JSON in request body.", errorDetails: jsonError.message }, { status: 400 });
  }
  console.log(`[API ADMIN DCC PUT /${categoryId}] Received body:`, body);

  const categoryToUpdate: { [key: string]: any } = {};
  if (body.name !== undefined) categoryToUpdate.name = body.name;
  
  if (body.slug !== undefined && body.slug.trim() !== '') {
      categoryToUpdate.slug = body.slug.trim();
  } else if (body.name !== undefined) { // Only generate slug from name if name is being updated and slug is not explicitly set
      categoryToUpdate.slug = body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  }

  if (body.hasOwnProperty('description')) categoryToUpdate.description = body.description || null;
  if (body.hasOwnProperty('image_url')) categoryToUpdate.image_url = body.image_url || null;
  if (body.hasOwnProperty('ai_image_prompt')) categoryToUpdate.ai_image_prompt = body.ai_image_prompt || null;
  
  // "updatedAt" will be handled by the database trigger
  // categoryToUpdate."updatedAt" = new Date().toISOString(); 

  if (Object.keys(categoryToUpdate).length === 0) {
    // Fetch current data if nothing to update, to ensure consistent response format
    try {
        const { data: currentData, error: fetchError } = await supabaseService.from('design_collaboration_categories').select('*').eq('id', categoryId).single();
        if (fetchError) throw fetchError;
        return NextResponse.json(currentData || {});
    } catch(e) {
        return NextResponse.json({ message: "No fields to update and failed to fetch current data." }, { status: 400 });
    }
  }
  console.log(`[API ADMIN DCC PUT /${categoryId}] Payload to Supabase:`, categoryToUpdate);

  try {
    const { data, error } = await supabaseService
      .from('design_collaboration_categories')
      .update(categoryToUpdate)
      .eq('id', categoryId)
      .select()
      .single();

    if (error) {
        console.error(`[API ADMIN DCC PUT /${categoryId}] Supabase error updating category:`, error);
        if (error.code === 'PGRST116') return NextResponse.json({ message: 'Category not found for update.', rawSupabaseError: error }, { status: 404 });
        return NextResponse.json({ message: 'Failed to update category in database.', rawSupabaseError: error }, { status: 500 });
    }
    if (!data) return NextResponse.json({ message: 'Category not found after update attempt.' }, { status: 404 });

    console.log(`[API ADMIN DCC PUT /${categoryId}] Category updated successfully.`);
    return NextResponse.json(data);
  } catch (e: any) {
    console.error(`[API ADMIN DCC PUT /${categoryId}] Unhandled error:`, e);
    return NextResponse.json({ message: e.message || "An unexpected error occurred." }, { status: 500 });
  }
}

// DELETE a design collaboration category
export async function DELETE(
  request: NextRequest, 
  { params }: { params: { categoryId: string } }
) {
  const { categoryId } = params;
  const supabaseService = supabaseAdmin;

  if (!supabaseService) {
    console.error(`[API ADMIN DCC DELETE /${categoryId}] CRITICAL: Supabase Service Role Client (supabaseAdmin) is not initialized. Delete will fail. Check SUPABASE_SERVICE_ROLE_KEY.`);
    return NextResponse.json({
      message: 'Database admin client not configured for write operations. Service role key might be missing.',
      rawSupabaseError: { message: `Admin database client (service_role) not available for deleting design collaboration category ${categoryId}.` }
    }, { status: 503 });
  }
  if (!categoryId) return NextResponse.json({ message: 'Category ID required' }, { status: 400 });

  console.log(`[API ADMIN DCC DELETE /${categoryId}] Attempting to delete category. Using ADMIN client (service_role).`);
  try {
    const { error } = await supabaseService
      .from('design_collaboration_categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
        console.error(`[API ADMIN DCC DELETE /${categoryId}] Supabase error deleting category:`, error);
        return NextResponse.json({ message: 'Failed to delete category from database.', rawSupabaseError: error }, { status: 500 });
    }
    console.log(`[API ADMIN DCC DELETE /${categoryId}] Category deleted successfully.`);
    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (e: any) {
    console.error(`[API ADMIN DCC DELETE /${categoryId}] Unhandled error:`, e);
    return NextResponse.json({ message: e.message || "An unexpected error occurred." }, { status: 500 });
  }
}
