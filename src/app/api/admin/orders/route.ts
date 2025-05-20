
// /src/app/api/admin/orders/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient.ts'; // Changed to relative path
import type { Order } from '@/types';

export async function GET() {
  console.log("[API /api/admin/orders] GET request received.");
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('[API /api/admin/orders] Supabase error fetching orders:', error);
      return NextResponse.json(
        { message: 'Error fetching orders for admin from Supabase', error: error.message, details: error.details, hint: error.hint, code: error.code },
        { status: 500 }
      );
    }
    
    console.log(`[API /api/admin/orders] Successfully fetched ${data?.length || 0} orders.`);
    return NextResponse.json(data as Order[]);
  } catch (error) {
    console.error('[API /api/admin/orders] Unhandled error fetching orders for admin:', error);
    return NextResponse.json({ message: 'Error fetching orders for admin', error: (error as Error).message }, { status: 500 });
  }
}
