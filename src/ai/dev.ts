
import { config } from 'dotenv';
config();

import '@/ai/flows/ai-assistant.ts';
import '@/ai/flows/predictive-forecasting.ts';
import '@/ai/flows/transaction-categorization.ts';
import '@/ai/flows/ai-chatbot-concierge.ts';
import '@/ai/flows/personal-shopping-recommendations.ts';
import '@/ai/flows/calculate-international-shipping-flow.ts';
import '@/ai/flows/site-analytics-flow.ts'; // Added new analytics flow
import '@/ai/flows/loan-financial-forecasting-flow.ts'; // Added missing import

