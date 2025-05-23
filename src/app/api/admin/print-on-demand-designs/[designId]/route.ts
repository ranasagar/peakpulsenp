
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '../../../../../lib/supabaseClient';
import type { PrintOnDemandDesign } from '@/types';

export const dynamic = 'force-dynamic';

// PUT (Update) a print-on-demand design
export async function PUT(
  request: NextRequest,
  { params }: { params: { designId: string } }
) {
  const { designId } = params;
  if (!supabase) return NextResponse.json({ message: 'Database client not configured.' }, { status: 503 });
  if (!designId) return NextResponse.json({ message: 'Design ID required' }, { status: 400 });

  try {
    const body = await request.json() as Partial<Omit<PrintOnDemandDesign, 'id' | 'createdAt' | 'updatedAt'>>;
    const designToUpdate: { [key: string]: any } = {};

    if (body.title !== undefined) designToUpdate.title = body.title;
    if (body.slug !== undefined) designToUpdate.slug = body.slug;
    else if (body.title !== undefined) designToUpdate.slug = body.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    
    if (body.hasOwnProperty('description')) designToUpdate.description = body.description || null;
    if (body.image_url !== undefined) designToUpdate.image_url = body.image_url; // Required
    if (body.hasOwnProperty('ai_image_prompt')) designToUpdate.ai_image_prompt = body.ai_image_prompt || null;
    if (body.price !== undefined) designToUpdate.price = Number(body.price); // Required
    if (body.hasOwnProperty('is_for_sale')) designToUpdate.is_for_sale = body.is_for_sale === undefined ? true : body.is_for_sale;
    if (body.hasOwnProperty('sku')) designToUpdate.sku = body.sku || null;
    if (body.hasOwnProperty('collaboration_id')) designToUpdate.collaboration_id = body.collaboration_id || null;
    
    designToUpdate."updatedAt" = new Date().toISOString();

    const { data, error } = await supabase
      .from('print_on_demand_designs')
      .update(designToUpdate)
      .eq('id', designId)
      .select(`*, collaboration:design_collaborations (title)`)
      .single();

    if (error) throw error;
    if (!data) return NextResponse.json({ message: 'Design not found or update failed' }, { status: 404 });
    
    const responseData = {
        ...data,
        // @ts-ignore
        collaboration_title: data.collaboration?.title
    };
    return NextResponse.json(responseData);
  } catch (e: any) {
    console.error(`[API ADMIN POD PUT ${designId}]`, e.message);
    return NextResponse.json({ message: e.message, details: e.details, hint: e.hint, code: e.code }, { status: 400 });
  }
}

// DELETE a print-on-demand design
export async function DELETE(
  request: NextRequest, 
  { params }: { params: { designId: string } }
) {
  const { designId } = params;
  if (!supabase) return NextResponse.json({ message: 'Database client not configured.' }, { status: 503 });
  if (!designId) return NextResponse.json({ message: 'Design ID required' }, { status: 400 });

  try {
    const { error } = await supabase
      .from('print_on_demand_designs')
      .delete()
      .eq('id', designId);
    if (error) throw error;
    return NextResponse.json({ message: 'Print design deleted successfully' });
  } catch (e: any) {
    console.error(`[API ADMIN POD DELETE ${designId}]`, e.message);
    return NextResponse.json({ message: e.message, details: e.details, hint: e.hint, code: e.code }, { status: 500 });
  }
}

    