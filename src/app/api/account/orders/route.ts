
// /src/app/api/account/orders/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient.ts'; // Changed to relative path
import type { Order } from '@/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  console.log(`[API /api/account/orders] GET request for userId: ${userId}`);

  if (!userId) {
    console.warn("[API /api/account/orders] User ID is required, but not provided.");
    return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('[API /api/account/orders] Supabase error fetching orders:', error);
      return NextResponse.json({ message: 'Error fetching user orders from Supabase', error: error.message, details: error.details }, { status: 500 });
    }

    console.log(`[API /api/account/orders] Successfully fetched ${data?.length || 0} orders for userId: ${userId}`);
    return NextResponse.json(data as Order[]);
  } catch (error) {
    console.error('[API /api/account/orders] Unhandled error fetching user orders:', error);
    return NextResponse.json({ message: 'Error fetching user orders', error: (error as Error).message }, { status: 500 });
  }
}
