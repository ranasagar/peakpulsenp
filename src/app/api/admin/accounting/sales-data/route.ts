
// /src/app/api/admin/accounting/sales-data/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '../../../../../lib/supabaseClient';
import type { Order } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate'); // Expect yyyy-MM-dd
  const endDate = searchParams.get('endDate');     // Expect yyyy-MM-dd

  console.log(`[API /api/admin/accounting/sales-data] GET request for sales data. Range: ${startDate} to ${endDate}`);

  if (!supabase) {
    console.error('[API /api/admin/accounting/sales-data] Supabase client is not initialized. Check environment variables and server restart.');
    return NextResponse.json({ message: 'Database client not configured. Please check server logs and .env file.' }, { status: 503 });
  }

  if (!startDate || !endDate) {
    return NextResponse.json({ message: 'startDate and endDate query parameters are required.' }, { status: 400 });
  }

  try {
    const adjustedEndDate = new Date(endDate);
    adjustedEndDate.setUTCHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .gte('createdAt', new Date(startDate).toISOString())
      .lte('createdAt', adjustedEndDate.toISOString())
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('[API /api/admin/accounting/sales-data] Supabase error fetching orders:', error);
      return NextResponse.json({ message: 'Error fetching orders from database.', rawSupabaseError: error }, { status: 500 });
    }

    console.log(`[API /api/admin/accounting/sales-data] Successfully fetched ${data?.length || 0} orders.`);
    return NextResponse.json(data || []);

  } catch (e) {
    console.error('[API /api/admin/accounting/sales-data] Unhandled error fetching sales data:', e);
    return NextResponse.json({ message: 'Server error fetching sales data.', error: (e as Error).message }, { status: 500 });
  }
}
