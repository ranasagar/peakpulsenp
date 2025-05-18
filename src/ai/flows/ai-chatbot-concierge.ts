'use server';

/**
 * @fileOverview An AI chatbot concierge that handles FAQs, sizing help, shipping, restock alerts, and offers personal shopping recommendations.
 *
 * - aiChatbotConcierge - A function that provides customer support and personal shopping assistance.
 * - AiChatbotConciergeInput - The input type for the aiChatbotConcierge function.
 * - AiChatbotConciergeOutput - The return type for the aiChatbotConcierge function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiChatbotConciergeInputSchema = z.object({
  query: z.string().describe('The customer query or request.'),
  orderId: z.string().optional().describe('The order ID, if applicable.'),
  productId: z.string().optional().describe('The product ID, if applicable.'),
});

export type AiChatbotConciergeInput = z.infer<typeof AiChatbotConciergeInputSchema>;

const AiChatbotConciergeOutputSchema = z.object({
  response: z.string().describe('The chatbot response to the customer query.'),
});

export type AiChatbotConciergeOutput = z.infer<typeof AiChatbotConciergeOutputSchema>;

export async function aiChatbotConcierge(input: AiChatbotConciergeInput): Promise<AiChatbotConciergeOutput> {
  return aiChatbotConciergeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiChatbotConciergePrompt',
  input: {schema: AiChatbotConciergeInputSchema},
  output: {schema: AiChatbotConciergeOutputSchema},
  prompt: `You are a helpful AI chatbot concierge for Peak Pulse, a Nepali clothing brand. Address the user's query with accurate and concise information. You have access to order information, product details, and general FAQs.

  If the user is asking about a specific order, use the orderId: {{{orderId}}} if provided.
  If the user is asking about a specific product, use the productId: {{{productId}}} if provided.

  Here are some examples of common questions and how to answer them:
  - "Where is my order?": Provide the current shipping status of the order.
  - "What sizes do you have for this product?": Check the product inventory and tell the user what sizes are available.
  - "When will you restock this item?": Check restock schedules and provide an estimated restock date.

  Query: {{{query}}}
  Response: `,
});

const aiChatbotConciergeFlow = ai.defineFlow(
  {
    name: 'aiChatbotConciergeFlow',
    inputSchema: AiChatbotConciergeInputSchema,
    outputSchema: AiChatbotConciergeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
