'use server';

/**
 * @fileOverview An AI assistant for answering questions about Peak Pulse accounting.
 *
 * - aiAssistant - A function that answers user questions about Peak Pulse accounting using natural language.
 * - AiAssistantInput - The input type for the aiAssistant function.
 * - AiAssistantOutput - The return type for the aiAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiAssistantInputSchema = z.object({
  question: z.string().describe('The user question about Peak Pulse accounting.'),
});
export type AiAssistantInput = z.infer<typeof AiAssistantInputSchema>;

const AiAssistantOutputSchema = z.object({
  answer: z.string().describe('The answer to the user question.'),
});
export type AiAssistantOutput = z.infer<typeof AiAssistantOutputSchema>;

export async function aiAssistant(input: AiAssistantInput): Promise<AiAssistantOutput> {
  return aiAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiAssistantPrompt',
  input: {schema: AiAssistantInputSchema},
  output: {schema: AiAssistantOutputSchema},
  prompt: `You are a helpful AI assistant answering questions about Peak Pulse accounting. Use the provided context to answer the question accurately and concisely.\n\nContext: Peak Pulse is a Nepali clothing brand that blends traditional Nepali craftsmanship with contemporary streetwear aesthetics. The brand has core accounting modules (general ledger, invoicing, expenses, inventory, reporting) and loan management integration.\n\nQuestion: {{{question}}}\n\nAnswer: `,
});

const aiAssistantFlow = ai.defineFlow(
  {
    name: 'aiAssistantFlow',
    inputSchema: AiAssistantInputSchema,
    outputSchema: AiAssistantOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
