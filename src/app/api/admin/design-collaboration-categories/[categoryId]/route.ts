
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '../../../../../lib/supabaseClient';
import type { DesignCollaborationCategory } from '@/types';

export const dynamic = 'force-dynamic';

// PUT (Update) a design collaboration category
export async function PUT(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  const { categoryId } = params;
  if (!supabase) return NextResponse.json({ message: 'Database client not configured.' }, { status: 503 });
  if (!categoryId) return NextResponse.json({ message: 'Category ID required' }, { status: 400 });

  try {
    const body = await request.json() as Partial<Omit<DesignCollaborationCategory, 'id' | 'createdAt' | 'updatedAt'>>;
    const categoryToUpdate: { [key: string]: any } = {};
    if (body.name !== undefined) categoryToUpdate.name = body.name;
    if (body.slug !== undefined) categoryToUpdate.slug = body.slug;
    else if (body.name !== undefined) categoryToUpdate.slug = body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    if (body.hasOwnProperty('description')) categoryToUpdate.description = body.description || null;
    if (body.hasOwnProperty('image_url')) categoryToUpdate.image_url = body.image_url || null;
    if (body.hasOwnProperty('ai_image_prompt')) categoryToUpdate.ai_image_prompt = body.ai_image_prompt || null;
    
    categoryToUpdate."updatedAt" = new Date().toISOString();

    const { data, error } = await supabase
      .from('design_collaboration_categories')
      .update(categoryToUpdate)
      .eq('id', categoryId)
      .select()
      .single();
    if (error) throw error;
    if (!data) return NextResponse.json({ message: 'Category not found or update failed' }, { status: 404 });
    return NextResponse.json(data);
  } catch (e: any) {
    console.error(`[API ADMIN DCC PUT ${categoryId}]`, e.message);
    return NextResponse.json({ message: e.message, details: e.details, hint: e.hint, code: e.code }, { status: 400 });
  }
}

// DELETE a design collaboration category
export async function DELETE(
  request: NextRequest, 
  { params }: { params: { categoryId: string } }
) {
  const { categoryId } = params;
  if (!supabase) return NextResponse.json({ message: 'Database client not configured.' }, { status: 503 });
  if (!categoryId) return NextResponse.json({ message: 'Category ID required' }, { status: 400 });

  try {
    // Before deleting, consider implications if categories are linked to design_collaborations
    // The FK on design_collaborations.category_id is ON DELETE SET NULL, so this is safe.
    const { error } = await supabase
      .from('design_collaboration_categories')
      .delete()
      .eq('id', categoryId);
    if (error) throw error;
    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (e: any) {
    console.error(`[API ADMIN DCC DELETE ${categoryId}]`, e.message);
    return NextResponse.json({ message: e.message, details: e.details, hint: e.hint, code: e.code }, { status: 500 });
  }
}

    