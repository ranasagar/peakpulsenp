
// /src/app/api/products/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient.ts'; // Using relative path
import type { Product } from '@/types';

export const dynamic = 'force-dynamic'; // Ensure fresh data

export async function GET() {
  console.log("[API /api/products] GET request received.");
  if (!supabase) {
    console.error('[API /api/products] Supabase client is not initialized. Check environment variables and server restart.');
    return NextResponse.json({ message: 'Database client not configured. Please check server logs and .env file.' }, { status: 503 });
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('[API /api/products] Supabase query error:', error);
      return NextResponse.json(
        { message: 'Error fetching products from database.', rawSupabaseError: error },
        { status: 500 }
      );
    }
    
    console.log(`[API /api/products] Successfully fetched ${data?.length || 0} products.`);
    return NextResponse.json(data || []);
  } catch (e) {
    console.error('[API /api/products] Unhandled error in GET handler:', e);
    return NextResponse.json(
      { message: 'Unexpected server error while fetching products.', error: (e as Error).message },
      { status: 500 }
    );
  }
}
