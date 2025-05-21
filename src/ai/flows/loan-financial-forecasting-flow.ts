
'use server';
/**
 * @fileOverview AI flow for loan financial forecasting and advisory for Peak Pulse.
 */

import { ai } from '@/ai/genkit'; // Ensure alias is used here
import { z } from 'genkit';
import { format, addMonths, differenceInMonths, parseISO, isValid } from 'date-fns';

// Schema for the main input to the callable `loanFinancialForecasting` function
const LoanAnalysisMainInputSchema = z.object({
  loan_name: z.string().describe('Name of the loan for identification.'),
  lender_name: z.string().describe('Name of the institution or individual providing the loan.'),
  principal_amount: z.number().describe('The initial amount of the loan in NPR.'),
  interest_rate: z.number().min(0).max(100).describe('The annual interest rate as a percentage (e.g., 5 for 5%).'),
  loan_term_months: z.number().int().positive().describe('The total term of the loan in months.'),
  start_date: z.string().describe('The start date of the loan in YYYY-MM-DD format.'),
  status: z.string().describe("Current status of the loan (e.g., 'Active', 'Paid Off')."),
  recent_sales_revenue_last_30_days: z.number().optional().describe('Peak Pulse\'s sales revenue in NPR for the last 30 days, if available.'),
});
export type LoanFinancialForecastingInput = z.infer<typeof LoanAnalysisMainInputSchema>;

// Extended schema for the prompt, including pre-calculated values
const LoanForecastingPromptInputSchema = LoanAnalysisMainInputSchema.extend({
  calculated_next_payment_date: z.string().optional().describe('Pre-calculated estimated next payment date if the loan is active. For AI context.'),
  calculated_monthly_payment_npr: z.number().optional().describe('Pre-calculated simplified estimated monthly payment in NPR. For AI context.'),
  current_date_for_context: z.string().describe('The current date for providing context to the AI.'),
});
type LoanForecastingPromptInput = z.infer<typeof LoanForecastingPromptInputSchema>;


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
  const totalInterestApproximation = principal * (annualRate / 100) * (termMonths / 12);
  return (principal + totalInterestApproximation) / termMonths;
}

function getNextPaymentDate(startDateStr: string, termMonths: number, status: string): string | undefined {
  if (status.toLowerCase() !== 'active') return undefined;
  
  const startDate = parseISO(startDateStr);
  if (!isValid(startDate)) return undefined;

  const today = new Date();
  let nextPaymentDateCandidate = addMonths(startDate, 1); 

  while (nextPaymentDateCandidate < today && differenceInMonths(nextPaymentDateCandidate, startDate) < termMonths) {
    nextPaymentDateCandidate = addMonths(nextPaymentDateCandidate, 1);
  }

  if (differenceInMonths(nextPaymentDateCandidate, startDate) >= termMonths && nextPaymentDateCandidate < today) {
    return "Term likely ended"; 
  }
  
  // If all payments seem to be in the past but term hasn't strictly ended according to months diff,
  // suggest next month from today as a practical next payment.
  if (nextPaymentDateCandidate < today && differenceInMonths(today, startDate) < termMonths) {
      return format(addMonths(today,1), 'yyyy-MM-dd');
  }

  return format(nextPaymentDateCandidate, 'yyyy-MM-dd');
}


const loanForecastingPrompt = ai.definePrompt({
  name: 'loanFinancialForecastingPrompt',
  input: { schema: LoanForecastingPromptInputSchema },
  output: { schema: LoanFinancialForecastingOutputSchema },
  prompt: `You are an expert financial advisor for "Peak Pulse", a Nepali clothing brand.
Analyze the following loan details and provide insights. Today's date is {{{current_date_for_context}}}.

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
- Estimated Next Payment Date (if active): {{#if calculated_next_payment_date}}{{{calculated_next_payment_date}}}{{else}}N/A (Not Active or Past Term){{/if}}
- Simplified Estimated Monthly Payment (NPR): {{#if calculated_monthly_payment_npr}}{{{calculated_monthly_payment_npr}}}{{else}}N/A (Not Active){{/if}}

Instructions:
1.  **Financial Outlook Summary:** Provide a concise summary of the financial outlook concerning this loan. Consider its terms and status.
2.  **Repayment Capacity Assessment:** {{#if recent_sales_revenue_last_30_days}}Based on the recent sales revenue, assess Peak Pulse's capacity to meet the estimated monthly payments for this loan. Be realistic.{{else}}Sales data not provided; cannot assess repayment capacity based on current sales.{{/if}}
3.  **Potential Risks or Advice:** List 2-3 key potential risks or actionable pieces of advice for Peak Pulse regarding this loan.
4.  **Estimated Next Payment Date:** If the loan is 'Active' and a future payment is expected, confirm or refine the pre-calculated estimated next payment date. If not active or term ended, state N/A or as appropriate.
5.  **Estimated Monthly Payment (NPR):** If the loan is 'Active', confirm or refine the pre-calculated estimated monthly payment. If not active, state N/A.

Output ONLY the JSON object as specified by the output schema. Ensure amounts are numbers.
`,
});


export const loanFinancialForecastingFlow = ai.defineFlow(
  {
    name: 'loanFinancialForecastingFlow',
    inputSchema: LoanAnalysisMainInputSchema, // User provides this
    outputSchema: LoanFinancialForecastingOutputSchema,
  },
  async (input) => {
    // Pre-calculate values
    const calculatedNextPaymentDate = getNextPaymentDate(input.start_date, input.loan_term_months, input.status);
    let calculatedMonthlyPaymentNPR: number | undefined = undefined;
    if (input.status.toLowerCase() === 'active') {
        const estimatedPayment = estimateMonthlyPayment(input.principal_amount, input.interest_rate, input.loan_term_months);
        calculatedMonthlyPaymentNPR = parseFloat(estimatedPayment.toFixed(0));
        if (isNaN(calculatedMonthlyPaymentNPR)) {
            calculatedMonthlyPaymentNPR = undefined;
        }
    }
    
    const promptInput: LoanForecastingPromptInput = {
      ...input,
      calculated_next_payment_date: calculatedNextPaymentDate,
      calculated_monthly_payment_npr: calculatedMonthlyPaymentNPR,
      current_date_for_context: format(new Date(), 'yyyy-MM-dd'),
    };
    
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

// Exported function to be called by Server Actions or other server-side code
export async function loanFinancialForecasting(
  input: LoanFinancialForecastingInput
): Promise<LoanFinancialForecastingOutput> {
  return loanFinancialForecastingFlow(input);
}
