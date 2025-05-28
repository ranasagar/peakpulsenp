
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin, supabase as fallbackSupabase } from '../../../../lib/supabaseClient';
import type { PrintOnDemandDesign } from '@/types';

export const dynamic = 'force-dynamic';

// GET all print-on-demand designs (can use public client if RLS allows for admin reads, or admin client for full access)
export async function GET() {
  const clientToUse = supabaseAdmin || fallbackSupabase;
  const clientTypeForLog = supabaseAdmin ? "ADMIN client (service_role)" : "FALLBACK public client";
  console.log(`[API ADMIN POD GET] Request to fetch all designs. Using ${clientTypeForLog}.`);

  if (!clientToUse) {
    console.error('[API ADMIN POD GET] Supabase client (admin or fallback) is not initialized.');
    return NextResponse.json({ message: 'Database client not configured.' }, { status: 503 });
  }

  try {
    const { data, error } = await clientToUse
      .from('print_on_demand_designs')
      .select(`
        *,
        collaboration:design_collaborations (title)
      `)
      .order('"createdAt"', { ascending: false });

    if (error) {
      console.error('[API ADMIN POD GET] Supabase error fetching designs:', error);
      return NextResponse.json({ message: 'Failed to fetch print designs.', rawSupabaseError: error }, { status: 500 });
    }
    
    const designs = data?.map((d: any) => ({
        ...d,
        collaboration_title: d.collaboration?.title || null
    })) || [];

    return NextResponse.json(designs);
  } catch (e: any) {
    console.error('[API ADMIN POD GET] Unhandled error:', e.message);
    return NextResponse.json({ message: 'Server error fetching print designs.', errorDetails: e.message }, { status: 500 });
  }
}

// POST a new print-on-demand design (Admin only - use service_role key)
export async function POST(request: NextRequest) {
  const clientForWrite = supabaseAdmin;
  console.log("[API ADMIN POD POST] Request to create new design.");

  if (!clientForWrite) {
    console.error('[API ADMIN POD POST] CRITICAL: Supabase ADMIN client (service_role) is not initialized. Cannot create design. Check SUPABASE_SERVICE_ROLE_KEY.');
    return NextResponse.json({
        message: 'Database admin client not configured. Service role key might be missing.',
        rawSupabaseError: { message: 'Admin database client (service_role) for design creation is missing.' }
    }, { status: 503 });
  }
  console.log("[API ADMIN POD POST] Using ADMIN Supabase client (service_role).");

  let body;
  try {
    body = await request.json() as Omit<PrintOnDemandDesign, 'id' | 'createdAt' | 'updatedAt' | 'collaboration_title'>;
  } catch (jsonError: any) {
      console.error("[API ADMIN POD POST] Error parsing request JSON:", jsonError);
      return NextResponse.json({ message: "Invalid JSON in request body.", errorDetails: jsonError.message }, { status: 400 });
  }
  console.log("[API ADMIN POD POST] Received body:", body);

  if (!body.title || !body.image_url || body.price === undefined) {
    return NextResponse.json({ message: "Title, Image URL, and Price are required." }, { status: 400 });
  }
  
  const designToInsert = {
    title: body.title,
    slug: body.slug?.trim() || body.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
    description: body.description || null,
    image_url: body.image_url,
    ai_image_prompt: body.ai_image_prompt || null,
    price: Number(body.price),
    is_for_sale: body.is_for_sale === undefined ? true : body.is_for_sale,
    sku: body.sku || null,
    collaboration_id: body.collaboration_id || null,
    // "createdAt" and "updatedAt" will be handled by database defaults/trigger
  };
  console.log("[API ADMIN POD POST] Data to insert:", designToInsert);

  try {
    const { data: insertedData, error: insertError } = await clientForWrite
      .from('print_on_demand_designs')
      .insert(designToInsert)
      .select(`*, collaboration:design_collaborations (title)`)
      .single();

    if (insertError) {
      console.error('[API ADMIN POD POST] Supabase error creating design:', insertError);
      return NextResponse.json({ 
        message: 'Failed to create print design in database.', 
        rawSupabaseError: { message: insertError.message, details: insertError.details, hint: insertError.hint, code: insertError.code }
      }, { status: insertError.code === '23505' ? 409 : 500 }); // 409 for unique constraint violation
    }
    if (!insertedData) {
        console.error('[API ADMIN POD POST] Supabase insert succeeded but returned no data.');
        return NextResponse.json({ message: 'Design creation succeeded but no data returned.'}, { status: 500 });
    }
    
    const responseData = {
        ...insertedData,
        collaboration_title: (insertedData as any).collaboration?.title || null
    };
    console.log(`[API ADMIN POD POST] Design "${responseData.title}" created successfully.`);
    return NextResponse.json(responseData, { status: 201 });

  } catch (e: any) {
    console.error('[API ADMIN POD POST] Unhandled exception:', e);
    return NextResponse.json({ message: 'Server error creating print design.', errorDetails: e.message }, { status: 500 });
  }
}
