
// /src/app/api/admin/loans/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient.ts';
import type { Loan } from '@/types';

export const dynamic = 'force-dynamic';

// GET all loans
export async function GET() {
  console.log("[API /api/admin/loans] GET request received.");
  if (!supabase) {
    console.error('[API /api/admin/loans GET] Supabase client is not initialized. Check environment variables and server restart.');
    return NextResponse.json({ message: 'Database client not configured. Please check server logs and .env file.' }, { status: 503 });
  }
  try {
    const { data, error } = await supabase
      .from('loans')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[API /api/admin/loans] Supabase error fetching loans:', error);
      return NextResponse.json({ message: error.message, details: error.details, hint: error.hint, rawSupabaseError: error }, { status: 500 });
    }
    console.log(`[API /api/admin/loans] Successfully fetched ${data?.length || 0} loans.`);
    return NextResponse.json(data || []);
  } catch (e) {
    console.error('[API /api/admin/loans] Unhandled error fetching loans:', e);
    return NextResponse.json({ message: (e as Error).message }, { status: 500 });
  }
}

// POST a new loan
export async function POST(request: NextRequest) {
  console.log("[API /api/admin/loans] POST request received.");
  if (!supabase) {
    console.error('[API /api/admin/loans POST] Supabase client is not initialized. Check environment variables and server restart.');
    return NextResponse.json({ message: 'Database client not configured. Please check server logs and .env file.' }, { status: 503 });
  }
  try {
    const body = await request.json() as Omit<Loan, 'id' | 'created_at' | 'updated_at'>;
    
    // Ensure numeric fields are numbers and date is valid
    const loanToInsert = {
      ...body,
      principal_amount: Number(body.principal_amount),
      interest_rate: Number(body.interest_rate),
      loan_term_months: Number(body.loan_term_months),
      start_date: new Date(body.start_date).toISOString().split('T')[0], // Format to YYYY-MM-DD
    };
    console.log("[API /api/admin/loans] Attempting to insert loan:", loanToInsert);

    const { data, error } = await supabase
      .from('loans')
      .insert(loanToInsert)
      .select()
      .single();

    if (error) {
      console.error('[API /api/admin/loans] Supabase error creating loan:', error);
      return NextResponse.json({ message: error.message, details: error.details, hint: error.hint, code: error.code, rawSupabaseError: error }, { status: 400 });
    }
    console.log("[API /api/admin/loans] Loan created successfully:", data);
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error('[API /api/admin/loans] Unhandled error creating loan:', e);
    return NextResponse.json({ message: (e as Error).message }, { status: 500 });
  }
}
