'use server';

/**
 * @fileOverview This file contains the Genkit flow for generating predictive financial forecasts for Peak Pulse.
 *
 * - predictiveForecasting - A function that takes historical data and loan terms to generate financial forecasts.
 * - PredictiveForecastingInput - The input type for the predictiveForecasting function.
 * - PredictiveForecastingOutput - The return type for the predictiveForecasting function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictiveForecastingInputSchema = z.object({
  historicalData: z
    .string()
    .describe('Historical financial data for Peak Pulse, including income, expenses, and cash flow.'),
  loanTerms: z
    .string()
    .describe('Terms of the loan, including loan amount, interest rate, and repayment schedule.'),
});

export type PredictiveForecastingInput = z.infer<typeof PredictiveForecastingInputSchema>;

const PredictiveForecastingOutputSchema = z.object({
  cashFlowForecast: z
    .string()
    .describe('A forecast of Peak Pulse cash flow over a specified period.'),
  profitabilityForecast: z
    .string()
    .describe('A forecast of Peak Pulse profitability over a specified period.'),
});

export type PredictiveForecastingOutput = z.infer<typeof PredictiveForecastingOutputSchema>;

export async function predictiveForecasting(
  input: PredictiveForecastingInput
): Promise<PredictiveForecastingOutput> {
  return predictiveForecastingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictiveForecastingPrompt',
  input: {schema: PredictiveForecastingInputSchema},
  output: {schema: PredictiveForecastingOutputSchema},
  prompt: `You are an expert financial analyst specializing in creating financial forecasts for businesses.

  Based on the historical financial data and loan terms provided, generate insightful financial forecasts for Peak Pulse, predicting cash flow and profitability.

  Historical Data: {{{historicalData}}}
  Loan Terms: {{{loanTerms}}}

  Cash Flow Forecast:
  Profitability Forecast:`,
});

const predictiveForecastingFlow = ai.defineFlow(
  {
    name: 'predictiveForecastingFlow',
    inputSchema: PredictiveForecastingInputSchema,
    outputSchema: PredictiveForecastingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
