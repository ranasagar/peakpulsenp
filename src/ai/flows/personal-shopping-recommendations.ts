'use server';

/**
 * @fileOverview An AI agent that provides personalized shopping recommendations based on user preferences and past purchases.
 *
 * - personalShoppingRecommendations - A function that handles the personal shopping recommendations process.
 * - PersonalShoppingRecommendationsInput - The input type for the personalShoppingRecommendations function.
 * - PersonalShoppingRecommendationsOutput - The return type for the personalShoppingRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalShoppingRecommendationsInputSchema = z.object({
  userPreferences: z.string().describe('The user\u2019s style and preferences.'),
  pastPurchases: z.string().describe('The user\u2019s past purchases.'),
});
export type PersonalShoppingRecommendationsInput = z.infer<typeof PersonalShoppingRecommendationsInputSchema>;

const PersonalShoppingRecommendationsOutputSchema = z.object({
  recommendations: z.string().describe('Personalized shopping recommendations for the user.'),
});
export type PersonalShoppingRecommendationsOutput = z.infer<typeof PersonalShoppingRecommendationsOutputSchema>;

export async function personalShoppingRecommendations(
  input: PersonalShoppingRecommendationsInput
): Promise<PersonalShoppingRecommendationsOutput> {
  return personalShoppingRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalShoppingRecommendationsPrompt',
  input: {schema: PersonalShoppingRecommendationsInputSchema},
  output: {schema: PersonalShoppingRecommendationsOutputSchema},
  prompt: `You are an expert personal shopping assistant. Your task is to provide personalized shopping recommendations based on the user\u2019s preferences and past purchases.

  Analyze the following user details:
  Preferences: {{{userPreferences}}}
  Past Purchases: {{{pastPurchases}}}

  Provide personalized shopping recommendations for the user.

  Recommendations: `,
});

const personalShoppingRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalShoppingRecommendationsFlow',
    inputSchema: PersonalShoppingRecommendationsInputSchema,
    outputSchema: PersonalShoppingRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
