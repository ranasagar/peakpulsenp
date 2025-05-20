
'use server';

import { loanFinancialForecasting } from '@/ai/flows/loan-financial-forecasting-flow';
import type { LoanFinancialForecastingInput, LoanFinancialForecastingOutput } from '@/ai/flows/loan-financial-forecasting-flow';
import type { Loan } from '@/types';

interface AnalysisParams {
  loan: Loan;
  recent_sales_revenue_last_30_days: number; // Example additional data
}

export async function getAiLoanAnalysis(
  params: AnalysisParams
): Promise<LoanFinancialForecastingOutput | { error: string; details?: string; hint?: string }> {
  try {
    console.log('[Server Action getAiLoanAnalysis] Received params:', params);
    const input: LoanFinancialForecastingInput = {
      loan_name: params.loan.loan_name,
      lender_name: params.loan.lender_name,
      principal_amount: params.loan.principal_amount,
      interest_rate: params.loan.interest_rate,
      loan_term_months: params.loan.loan_term_months,
      start_date: params.loan.start_date, // Should be YYYY-MM-DD string
      status: params.loan.status,
      recent_sales_revenue_last_30_days: params.recent_sales_revenue_last_30_days,
    };
    console.log('[Server Action getAiLoanAnalysis] Calling loanFinancialForecasting with input:', input);
    const result = await loanFinancialForecasting(input);
    console.log('[Server Action getAiLoanAnalysis] Received result from flow:', result);
    return result;
  } catch (error: any) {
    console.error('[Server Action getAiLoanAnalysis] Error:', error);
    // Check if error has Supabase-like structure from Genkit error handling
    if (error.rawSupabaseError) {
      return { 
        error: error.message || 'Failed to get AI loan analysis.',
        details: error.rawSupabaseError.details,
        hint: error.rawSupabaseError.hint
      };
    }
    return { error: error.message || 'Failed to get AI loan analysis.' };
  }
}
