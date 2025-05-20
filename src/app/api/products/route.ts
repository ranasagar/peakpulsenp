
// /src/app/api/products/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import type { Product } from '@/types';

export const dynamic = 'force-dynamic'; // Ensure fresh data

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Supabase error fetching products:', error);
      return NextResponse.json(
        { message: 'Error fetching products from Supabase', error: error.message },
        { status: 500 }
      );
    }

    // Corrected: use 'data' which is the result from Supabase
    return NextResponse.json(data as Product[]);
  } catch (error) {
    console.error('Failed to fetch products from Supabase API (outer catch):', error);
    return NextResponse.json(
      { message: 'Error fetching products', error: (error as Error).message },
      { status: 500 }
    );
  }
}
