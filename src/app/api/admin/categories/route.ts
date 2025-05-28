
// /src/app/api/admin/categories/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin, supabase as fallbackSupabase } from '../../../../lib/supabaseClient';
import type { AdminCategory } from '@/types';

export const dynamic = 'force-dynamic';

// GET all categories for admin
export async function GET() {
  const clientForRead = supabaseAdmin || fallbackSupabase;
  if (!clientForRead) {
    console.error('[API ADMIN CATEGORIES GET] Supabase client not configured.');
    return NextResponse.json({ message: 'Database client not configured.', rawSupabaseError: { message: 'Database client not configured.'} }, { status: 503 });
  }

  try {
    const { data, error } = await clientForRead
      .from('categories')
      .select('*, parent_id, "displayOrder"') // Ensure displayOrder is selected
      .order('"displayOrder"', { ascending: true, nullsLast: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('[API ADMIN CATEGORIES GET] Supabase error fetching categories:', error);
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
      displayOrder: cat.displayOrder,
      createdAt: cat.createdAt || cat.created_at,
      updatedAt: cat.updatedAt || cat.updated_at,
    })) || [];
    
    return NextResponse.json(categories);
  } catch (e: any) {
    console.error('[API ADMIN CATEGORIES GET] Unhandled error fetching categories:', e);
    return NextResponse.json({ message: e.message }, { status: 500 });
  }
}

// POST a new category (Admin)
export async function POST(request: NextRequest) {
  const supabaseService = supabaseAdmin;

  if (!supabaseService) {
    console.error('[API ADMIN CATEGORIES POST] CRITICAL: Admin Supabase client (service_role) is not initialized.');
    return NextResponse.json({ message: 'Database admin client not configured. Cannot create category.', rawSupabaseError: { message: 'Admin Supabase client not available.' } }, { status: 503 });
  }

  try {
    const body = await request.json() as Omit<AdminCategory, 'id' | 'createdAt' | 'updatedAt'>;
    
    const categoryNameToUse = body.name?.trim() || `Untitled Category ${Date.now()}`;

    const categoryToInsert = {
      name: categoryNameToUse,
      slug: body.slug?.trim() || categoryNameToUse.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
      description: body.description || null,
      image_url: body.imageUrl || null,
      ai_image_prompt: body.aiImagePrompt || null,
      parent_id: body.parentId || null,
      "displayOrder": body.displayOrder === undefined ? 0 : Number(body.displayOrder),
      // "createdAt" and "updatedAt" will be handled by database defaults/triggers
    };
    console.log("[API ADMIN CATEGORIES POST] Attempting to insert category with payload:", categoryToInsert);

    const { data: insertedData, error } = await supabaseService
      .from('categories')
      .insert(categoryToInsert)
      .select('*, parent_id, "displayOrder"')
      .single();

    if (error) {
      console.error('[API ADMIN CATEGORIES POST] Supabase error creating category:', error);
      return NextResponse.json({
        message: `Database error creating category: ${error.message}`,
        rawSupabaseError: { message: error.message, details: error.details, hint: error.hint, code: error.code }
      }, { status: error.code === '23505' ? 409 : 400 }); // 409 for unique constraint violation
    }

    if (!insertedData) {
      console.error('[API ADMIN CATEGORIES POST] Supabase insert succeeded but returned no data.');
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
      displayOrder: insertedData.displayOrder,
      createdAt: insertedData.createdAt || insertedData.created_at,
      updatedAt: insertedData.updatedAt || insertedData.updated_at,
    };
    return NextResponse.json(responseCategory, { status: 201 });
  } catch (e: any) {
    console.error('[API ADMIN CATEGORIES POST] Unhandled error creating category:', e);
    if (e instanceof SyntaxError && e.message.toLowerCase().includes("json")) {
      return NextResponse.json({ message: "Invalid JSON in request body.", errorDetails: e.message }, { status: 400 });
    }
    return NextResponse.json({ message: `Failed to create category: ${e.message}` }, { status: 500 });
  }
}
