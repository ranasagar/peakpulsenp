
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient';
import type { DesignCollaborationCategory } from '@/types';

export const dynamic = 'force-dynamic';

// GET all design collaboration categories
export async function GET() {
  if (!supabase) return NextResponse.json({ message: 'Database client not configured.' }, { status: 503 });
  try {
    const { data, error } = await supabase
      .from('design_collaboration_categories')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e: any) {
    console.error('[API ADMIN DCC GET]', e.message);
    return NextResponse.json({ message: e.message, details: e.details, hint: e.hint, code: e.code }, { status: 500 });
  }
}

// POST a new design collaboration category
export async function POST(request: NextRequest) {
  if (!supabase) return NextResponse.json({ message: 'Database client not configured.' }, { status: 503 });
  try {
    const body = await request.json() as Omit<DesignCollaborationCategory, 'id' | 'createdAt' | 'updatedAt'>;
    const categoryToInsert = {
      name: body.name,
      slug: body.slug || body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
      description: body.description || null,
      image_url: body.image_url || null,
      ai_image_prompt: body.ai_image_prompt || null,
    };
    const { data, error } = await supabase
      .from('design_collaboration_categories')
      .insert(categoryToInsert)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    console.error('[API ADMIN DCC POST]', e.message);
    return NextResponse.json({ message: e.message, details: e.details, hint: e.hint, code: e.code }, { status: 400 });
  }
}

    