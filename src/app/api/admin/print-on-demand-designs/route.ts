
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient';
import type { PrintOnDemandDesign } from '@/types';

export const dynamic = 'force-dynamic';

// GET all print-on-demand designs
export async function GET() {
  if (!supabase) return NextResponse.json({ message: 'Database client not configured.' }, { status: 503 });
  try {
    const { data, error } = await supabase
      .from('print_on_demand_designs')
      .select(`
        *,
        collaboration:design_collaborations (title)
      `)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    
    const designs = data?.map(d => ({
        ...d,
        // @ts-ignore
        collaboration_title: d.collaboration?.title
    })) || [];

    return NextResponse.json(designs);
  } catch (e: any) {
    console.error('[API ADMIN POD GET]', e.message);
    return NextResponse.json({ message: e.message, details: e.details, hint: e.hint, code: e.code }, { status: 500 });
  }
}

// POST a new print-on-demand design
export async function POST(request: NextRequest) {
  if (!supabase) return NextResponse.json({ message: 'Database client not configured.' }, { status: 503 });
  try {
    const body = await request.json() as Omit<PrintOnDemandDesign, 'id' | 'createdAt' | 'updatedAt'>;
    const designToInsert = {
      title: body.title,
      slug: body.slug || body.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
      description: body.description || null,
      image_url: body.image_url, // Required
      ai_image_prompt: body.ai_image_prompt || null,
      price: Number(body.price), // Required
      is_for_sale: body.is_for_sale === undefined ? true : body.is_for_sale,
      sku: body.sku || null,
      collaboration_id: body.collaboration_id || null,
    };
    const { data, error } = await supabase
      .from('print_on_demand_designs')
      .insert(designToInsert)
      .select(`*, collaboration:design_collaborations (title)`)
      .single();
    if (error) throw error;

    const responseData = {
        ...data,
        // @ts-ignore
        collaboration_title: data.collaboration?.title
    };
    return NextResponse.json(responseData, { status: 201 });
  } catch (e: any) {
    console.error('[API ADMIN POD POST]', e.message, e);
    return NextResponse.json({ message: e.message, details: e.details, hint: e.hint, code: e.code }, { status: 400 });
  }
}

    