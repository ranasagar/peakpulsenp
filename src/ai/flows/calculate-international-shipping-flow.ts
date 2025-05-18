
'use server';
/**
 * @fileOverview An AI agent for calculating international shipping rates and times from Nepal.
 *
 * - calculateInternationalShipping - A function that estimates shipping costs and delivery times.
 * - CalculateInternationalShippingInput - The input type for the calculateInternationalShipping function.
 * - CalculateInternationalShippingOutput - The return type for the calculateInternationalShipping function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CalculateInternationalShippingInputSchema = z.object({
  destinationCountry: z.string().describe('The destination country for the shipment.'),
  // Future enhancements could include packageWeightKg, packageDimensionsCm (e.g., {length: number, width: number, height: number})
});
export type CalculateInternationalShippingInput = z.infer<typeof CalculateInternationalShippingInputSchema>;

const CalculateInternationalShippingOutputSchema = z.object({
  rateNPR: z.number().describe('Estimated shipping cost in Nepali Rupees (NPR).'),
  estimatedDeliveryTime: z.string().describe('Estimated delivery time, e.g., "5-7 business days", "1-2 weeks".'),
  disclaimer: z.string().optional().describe('Any disclaimers or important notes about the estimate.'),
});
export type CalculateInternationalShippingOutput = z.infer<typeof CalculateInternationalShippingOutputSchema>;

export async function calculateInternationalShipping(input: CalculateInternationalShippingInput): Promise<CalculateInternationalShippingOutput> {
  return calculateInternationalShippingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'calculateInternationalShippingPrompt',
  input: {schema: CalculateInternationalShippingInputSchema},
  output: {schema: CalculateInternationalShippingOutputSchema},
  prompt: `You are an expert logistics coordinator specializing in international shipping from Kathmandu, Nepal.
A customer wants to ship a standard small package (approximately 1kg, dimensions 30cm x 20cm x 10cm) from Kathmandu, Nepal to {{{destinationCountry}}}.

Provide an estimated shipping cost in Nepali Rupees (NPR) and an estimated delivery time.
Focus on reliable but cost-effective standard international shipping options (e.g., postal services, budget couriers).
The rateNPR should be a number.
The estimatedDeliveryTime should be a string (e.g., "7-10 business days").
You can add a brief disclaimer if necessary (e.g., "Estimates may vary based on exact location and chosen carrier.").

Output ONLY the JSON object with the fields "rateNPR", "estimatedDeliveryTime", and optionally "disclaimer".
Example for France: {"rateNPR": 3500, "estimatedDeliveryTime": "7-12 business days", "disclaimer": "Estimate via standard postal service."}
Example for USA: {"rateNPR": 4500, "estimatedDeliveryTime": "10-15 business days"}
`,
});

const calculateInternationalShippingFlow = ai.defineFlow(
  {
    name: 'calculateInternationalShippingFlow',
    inputSchema: CalculateInternationalShippingInputSchema,
    outputSchema: CalculateInternationalShippingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('AI failed to provide a shipping estimate.');
    }
    // Ensure rateNPR is a number, sometimes LLMs might return it as a string in JSON.
    if (typeof output.rateNPR === 'string') {
        output.rateNPR = parseFloat(output.rateNPR);
         if (isNaN(output.rateNPR)) {
            // Fallback or error if parsing fails, this indicates a poorly formed AI response.
            // For now, we'll let a high-level try-catch handle this by flow failing.
            // A more robust solution might attempt to re-query or use a default.
            console.error("AI returned rateNPR as a non-numeric string:", output.rateNPR);
            throw new Error("AI returned an invalid numeric value for shipping rate.");
         }
    }
    return output;
  }
);
