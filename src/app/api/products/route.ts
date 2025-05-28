// /src/app/api/products/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient.ts';
import type { Product } from '@/types';

export const dynamic = 'force-dynamic'; // Ensure fresh data

export async function GET() {
  console.log("[API /api/products] GET request received.");

  if (!supabase) {
    const errorMessage = 'Database client not configured. Please check server logs and .env file for NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.';
    console.error(`[API /api/products] Supabase client is not initialized. ${errorMessage}`);
    return NextResponse.json(
      { message: errorMessage, error: "Service Unavailable" },
      { status: 503 }
    );
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('[API /api/products] Supabase query error:', error);
      return NextResponse.json(
        { 
          message: 'Error fetching products from database.', 
          error: error.message, // Send Supabase error message
          rawSupabaseError: { message: error.message, details: error.details, hint: error.hint, code: error.code } 
        },
        { status: 500 }
      );
    }
    
    const products = (data || []).map(p => ({
      ...p,
      createdAt: p.createdAt || p.created_at, // Handle potential casing differences
      updatedAt: p.updatedAt || p.updated_at,
    }));

    console.log(`[API /api/products] Successfully fetched ${products.length} products.`);
    return NextResponse.json(products);
  } catch (e: any) {
    console.error('[API /api/products] Unhandled error in GET handler:', e);
    return NextResponse.json(
      { 
        message: 'Unexpected server error while fetching products.', 
        error: e.message 
      },
      { status: 500 }
    );
  }
}
