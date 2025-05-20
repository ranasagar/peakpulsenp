
'use server';
/**
 * @fileOverview AI flow for loan financial forecasting and advisory for Peak Pulse.
 */

import { ai } from '@/ai/genkit'; // Ensure alias is used here
import { z } from 'genkit';
import { format, addMonths, differenceInMonths, parseISO, isValid } from 'date-fns';

export const LoanFinancialForecastingInputSchema = z.object({
  loan_name: z.string().describe('Name of the loan for identification.'),
  lender_name: z.string().describe('Name of the institution or individual providing the loan.'),
  principal_amount: z.number().describe('The initial amount of the loan in NPR.'),
  interest_rate: z.number().min(0).max(100).describe('The annual interest rate as a percentage (e.g., 5 for 5%).'),
  loan_term_months: z.number().int().positive().describe('The total term of the loan in months.'),
  start_date: z.string().describe('The start date of the loan in YYYY-MM-DD format.'),
  status: z.string().describe("Current status of the loan (e.g., 'Active', 'Paid Off')."),
  recent_sales_revenue_last_30_days: z.number().optional().describe('Peak Pulse\'s sales revenue in NPR for the last 30 days, if available.'),
});
export type LoanFinancialForecastingInput = z.infer<typeof LoanFinancialForecastingInputSchema>;

export const LoanFinancialForecastingOutputSchema = z.object({
  estimated_next_payment_date: z.string().optional().describe('Estimated next payment date if the loan is active.'),
  estimated_monthly_payment_npr: z.number().optional().describe('Roughly estimated monthly payment in NPR.'),
  financial_outlook_summary: z.string().describe('A brief summary of the financial outlook regarding this loan.'),
  repayment_capacity_assessment: z.string().optional().describe('Assessment of repayment capacity based on provided sales data.'),
  potential_risks_or_advice: z.array(z.string()).describe('Key potential risks or actionable advice related to this loan.'),
});
export type LoanFinancialForecastingOutput = z.infer<typeof LoanFinancialForecastingOutputSchema>;

// Helper: Simple estimated monthly payment (EMI not fully calculated here, just a rough estimate for AI context)
function estimateMonthlyPayment(principal: number, annualRate: number, termMonths: number): number {
  if (termMonths <= 0) return principal; // Or handle as error
  if (annualRate === 0) return principal / termMonths;
  // This is a very simplified interest calculation for context, not a precise EMI.
  // A full EMI calculation: P * r * (1+r)^n / ((1+r)^n - 1) where r is monthly rate.
  // For simplicity here, we'll just add a portion of total interest.
  const totalInterestApproximation = principal * (annualRate / 100) * (termMonths / 12);
  return (principal + totalInterestApproximation) / termMonths;
}

function getNextPaymentDate(startDateStr: string, termMonths: number, status: string): string | undefined {
  if (status !== 'Active') return undefined;
  
  const startDate = parseISO(startDateStr);
  if (!isValid(startDate)) return undefined;

  const today = new Date();
  let nextPaymentDate = addMonths(startDate, 1); // First payment usually one month after start

  while (nextPaymentDate < today && differenceInMonths(nextPaymentDate, startDate) < termMonths) {
    nextPaymentDate = addMonths(nextPaymentDate, 1);
  }

  if (differenceInMonths(nextPaymentDate, startDate) >= termMonths && nextPaymentDate < today) {
    return "Term likely ended"; // Loan term passed
  }
  if (nextPaymentDate < today) { // If term hasn't ended but next calculated payment is in past (shouldn't happen with loop)
      return format(addMonths(today,1), 'yyyy-MM-dd'); // Default to next month from today
  }

  return format(nextPaymentDate, 'yyyy-MM-dd');
}


const loanForecastingPrompt = ai.definePrompt({
  name: 'loanFinancialForecastingPrompt',
  input: { schema: LoanFinancialForecastingInputSchema },
  output: { schema: LoanFinancialForecastingOutputSchema },
  prompt: `You are an expert financial advisor for "Peak Pulse", a Nepali clothing brand.
Analyze the following loan details and provide insights. Today's date is ${format(new Date(), 'yyyy-MM-dd')}.

Loan Details:
- Loan Name: {{{loan_name}}}
- Lender: {{{lender_name}}}
- Principal: NPR {{{principal_amount}}}
- Annual Interest Rate: {{{interest_rate}}}%
- Term: {{{loan_term_months}}} months
- Start Date: {{{start_date}}}
- Current Status: {{{status}}}

{{#if recent_sales_revenue_last_30_days}}
- Recent Sales Revenue (Last 30 Days for Peak Pulse): NPR {{{recent_sales_revenue_last_30_days}}}
{{/if}}

Deterministic Pre-calculations (for your context, verify or refine if needed):
- Estimated Next Payment Date (if active): {{#if (eq status "Active")}}${getNextPaymentDate('{{{start_date}}}', {{{loan_term_months}}}, '{{{status}}}')}{{else}}N/A{{/if}}
- Simplified Estimated Monthly Payment (NPR): {{#if (eq status "Active")}}${estimateMonthlyPayment({{{principal_amount}}}, {{{interest_rate}}}, {{{loan_term_months}}}).toFixed(0)}{{else}}N/A{{/if}}

Instructions:
1.  **Financial Outlook Summary:** Provide a concise summary of the financial outlook concerning this loan. Consider its terms and status.
2.  **Repayment Capacity Assessment:** {{#if recent_sales_revenue_last_30_days}}Based on the recent sales revenue, assess Peak Pulse's capacity to meet the estimated monthly payments for this loan. Be realistic.{{else}}Sales data not provided; cannot assess repayment capacity based on current sales.{{/if}}
3.  **Potential Risks or Advice:** List 2-3 key potential risks or actionable pieces of advice for Peak Pulse regarding this loan.
4.  **Estimated Next Payment Date:** If the loan is 'Active', confirm or refine the estimated next payment date. If not active, state N/A.
5.  **Estimated Monthly Payment (NPR):** If the loan is 'Active', confirm or refine the estimated monthly payment. If not active, state N/A.

Output ONLY the JSON object as specified by the output schema. Ensure amounts are numbers.
`,
});


export const loanFinancialForecastingFlow = ai.defineFlow(
  {
    name: 'loanFinancialForecastingFlow',
    inputSchema: LoanFinancialForecastingInputSchema,
    outputSchema: LoanFinancialForecastingOutputSchema,
  },
  async (input) => {
    // Helper function to parse date safely
    const parseDateSafe = (dateStr: string) => {
        const parsed = parseISO(dateStr);
        return isValid(parsed) ? parsed : null;
    };

    // Construct a slightly augmented input for the prompt if needed, or pass directly
    const promptInput = { ...input };
    
    const { output } = await loanForecastingPrompt(promptInput);
    if (!output) {
        throw new Error('AI failed to provide loan financial analysis.');
    }
    
    // Ensure numeric fields are numbers if AI returns them as strings in JSON
    if (output.estimated_monthly_payment_npr && typeof output.estimated_monthly_payment_npr === 'string') {
        output.estimated_monthly_payment_npr = parseFloat(output.estimated_monthly_payment_npr);
        if (isNaN(output.estimated_monthly_payment_npr)) {
            output.estimated_monthly_payment_npr = undefined; // Or handle error
        }
    }

    return output;
  }
);

export async function loanFinancialForecasting(
  input: LoanFinancialForecastingInput
): Promise<LoanFinancialForecastingOutput> {
  return loanFinancialForecastingFlow(input);
}
