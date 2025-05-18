
'use server';
/**
 * @fileOverview An AI agent for summarizing site analytics and providing recommendations.
 *
 * - summarizeSiteAnalytics - A function that analyzes mock site metrics.
 * - SiteAnalyticsInput - The input type for the summarizeSiteAnalytics function.
 * - SiteAnalyticsOutput - The return type for the summarizeSiteAnalytics function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SiteAnalyticsInputSchema = z.object({
  period: z.string().describe('The time period for the analytics (e.g., "Last 7 Days", "Last Month").'),
  totalPageViews: z.number().describe('Total number of page views during the period.'),
  uniqueVisitors: z.number().describe('Number of unique visitors during the period.'),
  conversionRate: z.number().min(0).max(1).describe('Overall conversion rate (e.g., 0.05 for 5%).'),
  topPages: z.array(z.string()).describe('List of top 2-3 most visited pages/products.'),
  newUsers: z.number().describe('Number of new users acquired during the period.'),
  bounceRate: z.number().min(0).max(1).optional().describe('Overall bounce rate (e.g., 0.4 for 40%).'),
});
export type SiteAnalyticsInput = z.infer<typeof SiteAnalyticsInputSchema>;

const SiteAnalyticsOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the site performance based on the provided metrics.'),
  positiveObservations: z.array(z.string()).describe('Key positive observations or trends.'),
  areasForImprovement: z.array(z.string()).describe('Areas that might need attention or improvement.'),
  actionableRecommendations: z.array(z.string()).describe('Specific, actionable recommendations to improve site performance or engagement based on the data.'),
});
export type SiteAnalyticsOutput = z.infer<typeof SiteAnalyticsOutputSchema>;

export async function summarizeSiteAnalytics(input: SiteAnalyticsInput): Promise<SiteAnalyticsOutput> {
  return siteAnalyticsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'siteAnalyticsSummaryPrompt',
  input: {schema: SiteAnalyticsInputSchema},
  output: {schema: SiteAnalyticsOutputSchema},
  prompt: `You are an expert Web Analyst for an e-commerce brand called "Peak Pulse", which sells Nepali-inspired contemporary streetwear.
Analyze the following website performance metrics for the period: {{{period}}}.

Metrics:
- Total Page Views: {{{totalPageViews}}}
- Unique Visitors: {{{uniqueVisitors}}}
- New Users: {{{newUsers}}}
- Conversion Rate: {{#if conversionRate}}{{{conversionRate}}}{{else}}N/A{{/if}} (as a decimal, e.g., 0.05 for 5%)
{{#if bounceRate~}}
- Bounce Rate: {{{bounceRate}}} (as a decimal, e.g., 0.4 for 40%)
{{/if~}}
- Top Pages/Products: {{#each topPages}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

Based on these metrics, provide:
1.  A concise overall 'summary' of the site's performance for Peak Pulse.
2.  A list of 'positiveObservations' (2-3 key positive points or trends).
3.  A list of 'areasForImprovement' (2-3 areas that might need attention).
4.  A list of 'actionableRecommendations' (2-3 specific, actionable steps Peak Pulse could take to improve engagement, conversions, or user experience).

Focus on insights relevant to an e-commerce clothing brand. Be clear and constructive.
Output ONLY the JSON object as specified by the output schema.
`,
});

const siteAnalyticsFlow = ai.defineFlow(
  {
    name: 'siteAnalyticsFlow',
    inputSchema: SiteAnalyticsInputSchema,
    outputSchema: SiteAnalyticsOutputSchema,
  },
  async (input: SiteAnalyticsInput) => {
    // Ensure conversionRate is formatted nicely if needed by the prompt, or handle in prompt directly
    // For example, to pass as percentage string:
    // const formattedInput = {
    //   ...input,
    //   conversionRateDisplay: input.conversionRate ? `${(input.conversionRate * 100).toFixed(1)}%` : "N/A",
    //   bounceRateDisplay: input.bounceRate ? `${(input.bounceRate * 100).toFixed(1)}%` : "N/A",
    // };
    const {output} = await prompt(input); // Pass original input
    if (!output) {
      throw new Error('AI failed to provide an analytics summary.');
    }
    return output;
  }
);
