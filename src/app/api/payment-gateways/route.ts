
// /src/app/api/payment-gateways/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient'; // Use public client
import type { PaymentGatewaySetting } from '@/types';

export const dynamic = 'force-dynamic';

// GET only enabled payment gateways for frontend checkout
export async function GET() {
  if (!supabase) {
    console.error('[API /api/payment-gateways GET] Supabase client is not initialized.');
    return NextResponse.json({ message: 'Database client not configured.' }, { status: 503 });
  }
  console.log("[API /api/payment-gateways GET] Request received for active payment gateways.");

  try {
    // Select only non-sensitive fields
    const { data, error } = await supabase
      .from('payment_gateway_settings')
      .select('gateway_key, display_name, description, icon_name, is_domestic_only, is_international_only, display_order')
      .eq('is_enabled', true)
      .order('display_order', { ascending: true })
      .order('display_name', { ascending: true });

    if (error) {
      console.error('[API /api/payment-gateways GET] Supabase error fetching active gateways:', error);
      return NextResponse.json({ 
        message: 'Failed to fetch active payment gateways from database.', 
        rawSupabaseError: { message: error.message, details: error.details, hint: error.hint, code: error.code }
      }, { status: 500 });
    }
    
    console.log(`[API /api/payment-gateways GET] Successfully fetched ${data?.length || 0} active payment gateways.`);
    // Map to ensure only allowed fields are returned, even if select changes unexpectedly
    const publicData = (data || []).map(gw => ({
        gateway_key: gw.gateway_key,
        display_name: gw.display_name,
        description: gw.description,
        icon_name: gw.icon_name,
        is_domestic_only: gw.is_domestic_only,
        is_international_only: gw.is_international_only,
        display_order: gw.display_order,
    }));
    return NextResponse.json(publicData);
  } catch (e: any) {
    console.error('[API /api/payment-gateways GET] Unhandled error:', e);
    return NextResponse.json({ message: 'Server error fetching active payment gateways.', errorDetails: e.message }, { status: 500 });
  }
}
