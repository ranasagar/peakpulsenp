
// /src/app/api/admin/categories/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase, supabaseAdmin } from '../../../../lib/supabaseClient';
import type { AdminCategory } from '@/types';

export const dynamic = 'force-dynamic';

// GET all categories for admin
export async function GET() {
  console.log("[API /api/admin/categories GET] Request received for admin.");
  const clientForRead = supabaseAdmin || supabase;
  if (!clientForRead) {
    return NextResponse.json({ message: 'Database client not configured for read.' }, { status: 503 });
  }
  console.log(`[API /api/admin/categories GET] Using ${clientForRead === supabaseAdmin ? "ADMIN client" : "PUBLIC client"}.`);
  try {
    const { data, error } = await clientForRead
      .from('categories')
      .select('*, parent_id')
      .order('name', { ascending: true });

    if (error) {
      console.error('[API /api/admin/categories GET] Supabase error fetching categories:', error);
      return NextResponse.json({
        message: error.message,
        rawSupabaseError: { message: error.message, details: error.details, hint: error.hint, code: error.code }
      }, { status: 500 });
    }
    
    const categories = data?.map(cat => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      imageUrl: cat.image_url,
      aiImagePrompt: cat.ai_image_prompt,
      parentId: cat.parent_id,
      createdAt: cat.createdAt || cat.created_at, // Handle potential casing differences
      updatedAt: cat.updatedAt || cat.updated_at,
    })) || [];
    
    console.log(`[API /api/admin/categories GET] Successfully fetched ${categories.length} categories for admin.`);
    return NextResponse.json(categories);
  } catch (e: any) {
    console.error('[API /api/admin/categories GET] Unhandled error fetching categories:', e);
    return NextResponse.json({ message: e.message }, { status: 500 });
  }
}

// POST a new category (Admin)
export async function POST(request: NextRequest) {
  console.log("[API /api/admin/categories POST] Request received to create category.");
  const clientForWrite = supabaseAdmin;

  if (!clientForWrite) {
    console.error('[API /api/admin/categories POST] CRITICAL: Admin Supabase client (service_role) is not initialized. Check SUPABASE_SERVICE_ROLE_KEY.');
    return NextResponse.json({ message: 'Database admin client not configured for write operations.' }, { status: 503 });
  }
  console.log(`[API /api/admin/categories POST] Using ADMIN client (service_role).`);

  try {
    const body = await request.json() as Omit<AdminCategory, 'id' | 'createdAt' | 'updatedAt'>;
    console.log("[API /api/admin/categories POST] Received body for new category:", JSON.stringify(body, null, 2));
    
    const categoryToInsert = {
      name: body.name,
      slug: body.slug || body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
      description: body.description || null,
      image_url: body.imageUrl || null,
      ai_image_prompt: body.aiImagePrompt || null,
      parent_id: body.parentId || null,
      // Let database handle createdAt and updatedAt via defaults/triggers
    };
    console.log("[API /api/admin/categories POST] Attempting to insert category with payload:", categoryToInsert);

    const { data: insertedData, error } = await clientForWrite
      .from('categories')
      .insert(categoryToInsert)
      .select('*, parent_id')
      .single();

    if (error) {
      console.error('[API /api/admin/categories POST] Supabase error creating category:', error);
      return NextResponse.json({
        message: `Database error creating category: ${error.message}`,
        rawSupabaseError: { message: error.message, details: error.details, hint: error.hint, code: error.code }
      }, { status: 400 });
    }

    if (!insertedData) {
      console.error('[API /api/admin/categories POST] Supabase insert succeeded but returned no data.');
      return NextResponse.json({ message: 'Category creation succeeded but no data returned from database.' }, { status: 500 });
    }

    const responseCategory: AdminCategory = {
      id: insertedData.id,
      name: insertedData.name,
      slug: insertedData.slug,
      description: insertedData.description,
      imageUrl: insertedData.image_url,
      aiImagePrompt: insertedData.ai_image_prompt,
      parentId: insertedData.parent_id,
      createdAt: insertedData.createdAt || insertedData.created_at,
      updatedAt: insertedData.updatedAt || insertedData.updated_at,
    };

    console.log("[API /api/admin/categories POST] Category created successfully:", responseCategory.name);
    return NextResponse.json(responseCategory, { status: 201 });
  } catch (e: any) {
    console.error('[API /api/admin/categories POST] Unhandled error creating category:', e);
    if (e instanceof SyntaxError && e.message.toLowerCase().includes("json")) {
      return NextResponse.json({ message: "Invalid JSON in request body.", errorDetails: e.message }, { status: 400 });
    }
    return NextResponse.json({ message: `Failed to create category: ${e.message}` }, { status: 500 });
  }
}
