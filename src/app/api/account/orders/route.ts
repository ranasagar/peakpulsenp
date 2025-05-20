
// /src/app/api/account/orders/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import type { Order } from '@/types';
// Note: For server-side authentication to get userId securely,
// you'd typically use Firebase Admin SDK to verify an ID token.
// For this demo, we'll rely on userId passed in query params or assume it's from a trusted client.

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Supabase error fetching orders:', error);
      throw error;
    }

    return NextResponse.json(data as Order[]);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return NextResponse.json({ message: 'Error fetching user orders', error: (error as Error).message }, { status: 500 });
  }
}

