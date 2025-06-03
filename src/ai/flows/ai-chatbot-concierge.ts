
'use server';

/**
 * @fileOverview An AI chatbot concierge that handles FAQs, sizing help, shipping, restock alerts, and offers personal shopping recommendations for customers. For admins, it acts as a strategic business and creative advisor for Peak Pulse.
 *
 * - aiChatbotConcierge - A function that provides customer support or admin-level strategic advice.
 * - AiChatbotConciergeInput - The input type for the aiChatbotConcierge function.
 * - AiChatbotConciergeOutput - The return type for the aiChatbotConcierge function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiChatbotConciergeInputSchema = z.object({
  query: z.string().describe('The customer query or admin request.'),
  orderId: z.string().optional().describe('The order ID, if applicable (for customer queries).'),
  productId: z.string().optional().describe('The product ID, if applicable (for customer queries).'),
  isAdmin: z.boolean().optional().describe('Set to true if the query is from an admin user seeking strategic advice.'),
});

export type AiChatbotConciergeInput = z.infer<typeof AiChatbotConciergeInputSchema>;

const AiChatbotConciergeOutputSchema = z.object({
  response: z.string().describe('The chatbot response to the query.'),
});

export type AiChatbotConciergeOutput = z.infer<typeof AiChatbotConciergeOutputSchema>;

export async function aiChatbotConcierge(input: AiChatbotConciergeInput): Promise<AiChatbotConciergeOutput> {
  return aiChatbotConciergeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiChatbotConciergePrompt',
  input: {schema: AiChatbotConciergeInputSchema},
  output: {schema: AiChatbotConciergeOutputSchema},
  prompt: `{{#if isAdmin}}
You are a Strategic Business & Creative Advisor for "Peak Pulse", a Nepali clothing brand that blends traditional Nepali craftsmanship with contemporary streetwear aesthetics. Your goal is to provide insightful and actionable advice to the Peak Pulse admin team to help grow the brand and product line.

Focus on these areas when responding to admin queries:
1.  **Full-Stack Clothing Trends:** Analyze current streetwear and e-commerce fashion trends (global and South Asian markets if possible). Consider design elements, materials, sustainability, digital presentation, and customer experience.
2.  **Print-on-Demand Design Ideas:** Suggest innovative and culturally relevant print-on-demand design concepts that align with Peak Pulse's brand identity. Think about motifs, color palettes, and themes that resonate with both Nepali heritage and modern streetwear.
3.  **Business Growth Strategies:** Offer practical suggestions for business development, such as new product categories, market expansion opportunities (online/offline), operational improvements, or potential collaborations.
4.  **Marketing Suggestions:** Provide creative marketing campaign ideas, content strategies, social media engagement tactics, and ways to enhance Peak Pulse's brand storytelling.

Query from Admin: {{{query}}}

Advisor Response:
{{else}}
You are a helpful AI chatbot concierge for Peak Pulse, a Nepali clothing brand. Address the user's query with accurate and concise information. You have access to order information, product details, and general FAQs.

If the user is asking about a specific order, use the orderId: {{{orderId}}} if provided.
If the user is asking about a specific product, use the productId: {{{productId}}} if provided.

Here are some examples of common questions and how to answer them:
- "Where is my order?": Provide the current shipping status of the order.
- "What sizes do you have for this product?": Check the product inventory and tell the user what sizes are available.
- "When will you restock this item?": Check restock schedules and provide an estimated restock date.

Query: {{{query}}}

Response:
{{/if}}`,
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

