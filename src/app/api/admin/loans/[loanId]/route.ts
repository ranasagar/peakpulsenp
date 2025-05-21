
// /src/app/api/admin/loans/[loanId]/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '../../../../../lib/supabaseClient.ts';
import type { Loan } from '@/types';

export const dynamic = 'force-dynamic';

// PUT (Update) a loan
export async function PUT(
  request: NextRequest,
  { params }: { params: { loanId: string } }
) {
  const { loanId } = params;
  console.log(`[API /api/admin/loans/${loanId}] PUT request received.`);

  if (!supabase) {
    console.error(`[API /api/admin/loans/${loanId} PUT] Supabase client is not initialized. Check environment variables and server restart.`);
    return NextResponse.json({ message: 'Database client not configured. Please check server logs and .env file.' }, { status: 503 });
  }
  if (!loanId) {
    return NextResponse.json({ message: 'Loan ID is required' }, { status: 400 });
  }

  try {
    const body = await request.json() as Partial<Omit<Loan, 'id' | 'created_at' | 'updated_at'>>;
    
    const loanToUpdate: { [key: string]: any } = { ...body };
    if (body.principal_amount !== undefined) loanToUpdate.principal_amount = Number(body.principal_amount);
    if (body.interest_rate !== undefined) loanToUpdate.interest_rate = Number(body.interest_rate);
    if (body.loan_term_months !== undefined) loanToUpdate.loan_term_months = Number(body.loan_term_months);
    if (body.start_date) loanToUpdate.start_date = new Date(body.start_date).toISOString().split('T')[0];
    
    loanToUpdate.updated_at = new Date().toISOString(); // Explicitly set for Supabase if trigger isn't used/reliable

    console.log(`[API /api/admin/loans/${loanId}] Attempting to update loan with:`, loanToUpdate);

    const { data, error } = await supabase
      .from('loans')
      .update(loanToUpdate)
      .eq('id', loanId)
      .select()
      .single();

    if (error) {
      console.error(`[API /api/admin/loans/${loanId}] Supabase error updating loan:`, error);
      return NextResponse.json({ message: error.message, details: error.details, hint: error.hint, code: error.code, rawSupabaseError: error }, { status: 400 });
    }
    if (!data) {
        return NextResponse.json({ message: 'Loan not found or update failed' }, { status: 404 });
    }
    console.log(`[API /api/admin/loans/${loanId}] Loan updated successfully:`, data);
    return NextResponse.json(data);
  } catch (e) {
    console.error(`[API /api/admin/loans/${loanId}] Unhandled error updating loan:`, e);
    return NextResponse.json({ message: (e as Error).message }, { status: 500 });
  }
}

// DELETE a loan
export async function DELETE(
  request: NextRequest, 
  { params }: { params: { loanId: string } }
) {
  const { loanId } = params;
  console.log(`[API /api/admin/loans/${loanId}] DELETE request received.`);

  if (!supabase) {
    console.error(`[API /api/admin/loans/${loanId} DELETE] Supabase client is not initialized. Check environment variables and server restart.`);
    return NextResponse.json({ message: 'Database client not configured. Please check server logs and .env file.' }, { status: 503 });
  }
  if (!loanId) {
    return NextResponse.json({ message: 'Loan ID is required' }, { status: 400 });
  }

  try {
    const { error } = await supabase
      .from('loans')
      .delete()
      .eq('id', loanId);

    if (error) {
      console.error(`[API /api/admin/loans/${loanId}] Supabase error deleting loan:`, error);
      return NextResponse.json({ message: error.message, details: error.details, hint: error.hint, rawSupabaseError: error }, { status: 500 });
    }
    console.log(`[API /api/admin/loans/${loanId}] Loan deleted successfully.`);
    return NextResponse.json({ message: 'Loan deleted successfully' }, { status: 200 });
  } catch (e) {
    console.error(`[API /api/admin/loans/${loanId}] Unhandled error deleting loan:`, e);
    return NextResponse.json({ message: (e as Error).message }, { status: 500 });
  }
}
