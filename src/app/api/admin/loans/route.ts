// /src/app/api/admin/loans/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin, supabase as fallbackSupabase } from '../../../../lib/supabaseClient.ts';
import type { Loan } from '@/types';

export const dynamic = 'force-dynamic';

// GET all loans
export async function GET() {
  console.log("[API /api/admin/loans GET] Request received.");
  const supabaseClientToUse = supabaseAdmin || fallbackSupabase;
   if (!supabaseClientToUse) {
    console.error('[API /api/admin/loans GET] Supabase client (neither admin nor fallback) is not initialized.');
    return NextResponse.json({ message: 'Database client not configured.' }, { status: 503 });
  }
  if (supabaseClientToUse === fallbackSupabase && !supabaseAdmin) {
    console.warn("[API /api/admin/loans GET] Using fallback public Supabase client as admin client (service_role) is not available. RLS policies will apply.");
  } else if (supabaseAdmin) {
    console.log("[API /api/admin/loans GET] Using ADMIN Supabase client (service_role).");
  }


  try {
    const { data, error } = await supabaseClientToUse
      .from('loans')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[API /api/admin/loans GET] Supabase error fetching loans:', error);
      return NextResponse.json({ message: 'Failed to fetch loans from database.', rawSupabaseError: error }, { status: 500 });
    }
    console.log(`[API /api/admin/loans GET] Successfully fetched ${data?.length || 0} loans.`);
    return NextResponse.json(data || []);
  } catch (e: any) {
    console.error('[API /api/admin/loans GET] Unhandled error fetching loans:', e);
    return NextResponse.json({ message: 'Server error fetching loans.', errorDetails: e.message }, { status: 500 });
  }
}

// POST a new loan
export async function POST(request: NextRequest) {
  console.log("[API /api/admin/loans POST] Request received to create loan.");
  const supabaseClientToUse = supabaseAdmin; // Prioritize service_role for creating loans

  if (!supabaseClientToUse) {
    console.error('[API /api/admin/loans POST] CRITICAL: Admin Supabase client (service_role) is not initialized. Loan creation will fail. Check SUPABASE_SERVICE_ROLE_KEY in .env and server restart.');
    return NextResponse.json({ 
        message: 'Database admin client not configured. Cannot create loan. Contact administrator.',
        rawSupabaseError: { message: 'Admin database client (service_role) for loan creation is missing.' }
    }, { status: 503 }); // Service Unavailable
  }
  console.log("[API /api/admin/loans POST] Using ADMIN Supabase client (service_role).");

  let body;
  try {
    body = await request.json() as Omit<Loan, 'id' | 'createdAt' | 'updatedAt'>;
    console.log("[API /api/admin/loans POST] Received body for new loan:", body);
  } catch (jsonError: any) {
      console.error("[API /api/admin/loans POST] Error parsing request JSON:", jsonError);
      return NextResponse.json({ message: "Invalid JSON in request body.", errorDetails: jsonError.message }, { status: 400 });
  }
  
  if (!body.loan_name || !body.lender_name || body.principal_amount === undefined || body.interest_rate === undefined || body.loan_term_months === undefined || !body.start_date || !body.status) {
    return NextResponse.json({ message: 'Missing required fields for loan creation.' }, { status: 400 });
  }

  const loanToInsert = {
    loan_name: body.loan_name,
    lender_name: body.lender_name,
    principal_amount: Number(body.principal_amount),
    interest_rate: Number(body.interest_rate),
    loan_term_months: Number(body.loan_term_months),
    start_date: new Date(body.start_date).toISOString().split('T')[0], // Format to YYYY-MM-DD
    status: body.status,
    notes: body.notes || null,
    // Supabase will handle id, createdAt, updatedAt by default if table is configured correctly
  };
  console.log("[API /api/admin/loans POST] Attempting to insert loan with payload:", loanToInsert);

  try {
    const { data, error } = await supabaseClientToUse
      .from('loans')
      .insert(loanToInsert)
      .select()
      .single();

    if (error) {
      console.error('[API /api/admin/loans POST] Supabase error creating loan:', JSON.stringify(error, null, 2));
      return NextResponse.json({ 
        message: 'Failed to create loan in database.', 
        rawSupabaseError: { message: error.message, details: error.details, hint: error.hint, code: error.code }
      }, { status: error.code === '42501' ? 403 : 500 }); // 403 for RLS, 500 for others
    }
    if (!data) {
        console.error('[API /api/admin/loans POST] Supabase insert succeeded but returned no data.');
        return NextResponse.json({ message: 'Loan creation succeeded but no data returned from database.'}, { status: 500 });
    }
    console.log("[API /api/admin/loans POST] Loan created successfully:", data.loan_name);
    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    console.error('[API /api/admin/loans POST] Unhandled exception during loan creation:', e);
    return NextResponse.json({ message: 'Server error during loan creation.', errorDetails: e.message }, { status: 500 });
  }
}
