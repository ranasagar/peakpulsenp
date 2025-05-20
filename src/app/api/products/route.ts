
// /src/app/api/products/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient.ts'; // Changed to relative path
import type { Product } from '@/types';

export const dynamic = 'force-dynamic'; // Ensure fresh data

export async function GET() {
  console.log("[API /api/products] GET request received.");
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('[API /api/products] Supabase query error:', error);
      return NextResponse.json(
        { message: 'Error fetching products from Supabase', error: error.message, details: error.details, hint: error.hint, code: error.code },
        { status: 500 }
      );
    }

    return NextResponse.json(data as Product[]);
  } catch (error) {
    console.error('[API /api/products] Unhandled error in GET handler:', error);
    return NextResponse.json(
      { message: 'Error fetching products', error: (error as Error).message },
      { status: 500 }
    );
  }
}

