'use server';

/**
 * @fileOverview An AI agent that categorizes transactions from bank statements and receipts.
 *
 * - categorizeTransaction - A function that handles the transaction categorization process.
 * - CategorizeTransactionInput - The input type for the categorizeTransaction function.
 * - CategorizeTransactionOutput - The return type for the categorizeTransaction function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CategorizeTransactionInputSchema = z.object({
  transactionDescription: z.string().describe('The description of the transaction.'),
  transactionAmount: z.number().describe('The amount of the transaction.'),
  bankStatementDataUri: z
    .string()
    .optional()
    .describe(
      "A bank statement, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  receiptDataUri: z
    .string()
    .optional()
    .describe(
      "A receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type CategorizeTransactionInput = z.infer<typeof CategorizeTransactionInputSchema>;

const CategorizeTransactionOutputSchema = z.object({
  category: z.string().describe('The category of the transaction (e.g., "Rent", "Supplies", "Sales").'),
  subCategory: z
    .string()
    .optional()
    .describe('A more specific sub-category of the transaction (e.g., "Office Supplies", "Raw Materials").'),
  isIncome: z.boolean().describe('Whether the transaction is income or expense.'),
  confidence: z.number().describe('A confidence score between 0 and 1 indicating the accuracy of the categorization.'),
});
export type CategorizeTransactionOutput = z.infer<typeof CategorizeTransactionOutputSchema>;

export async function categorizeTransaction(input: CategorizeTransactionInput): Promise<CategorizeTransactionOutput> {
  return categorizeTransactionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'categorizeTransactionPrompt',
  input: {schema: CategorizeTransactionInputSchema},
  output: {schema: CategorizeTransactionOutputSchema},
  prompt: `You are an expert accounting assistant. Your task is to categorize transactions based on their description, amount, and any available bank statement or receipt data.

  Analyze the following transaction details:
  Description: {{{transactionDescription}}}
  Amount: {{{transactionAmount}}}
  {{#if bankStatementDataUri}}
  Bank Statement: {{media url=bankStatementDataUri}}
  {{/if}}
  {{#if receiptDataUri}}
  Receipt: {{media url=receiptDataUri}}
  {{/if}}

  Determine the most appropriate category, sub-category (if applicable), and whether the transaction is income or expense. Provide a confidence score indicating the accuracy of your categorization.

  Respond in the following JSON format:
  {
    "category": "",
    "subCategory": "",
    "isIncome": true/false,
    "confidence": 0.0
  }`,
});

const categorizeTransactionFlow = ai.defineFlow(
  {
    name: 'categorizeTransactionFlow',
    inputSchema: CategorizeTransactionInputSchema,
    outputSchema: CategorizeTransactionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
