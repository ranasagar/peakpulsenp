
// /src/app/api/content/our-story/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { OurStoryContentData } from '@/types';

export const dynamic = 'force-dynamic'; // Ensures the route is re-executed on every request

const filePath = path.join(process.cwd(), 'src', 'data', 'our-story-content.json');

const fallbackContent: OurStoryContentData = {
  hero: { title: "Our Story (Fallback)", description: "Content temporarily unavailable due to a server issue." },
  mission: { title: "Our Mission (Fallback)", paragraph1: "Details loading...", paragraph2: "Please try again shortly." },
  craftsmanship: { title: "Craftsmanship (Fallback)", paragraph1: "Details loading...", paragraph2: "Please try again shortly." },
  valuesSection: { title: "Our Values (Fallback)" },
  joinJourneySection: { title: "Join Us (Fallback)", description: "Details loading..." }
};

export async function GET() {
  console.log("[API /api/content/our-story] GET request received.");
  try {
    const jsonData = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(jsonData) as OurStoryContentData;
    console.log("[API /api/content/our-story] Successfully read and parsed our-story-content.json");
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API /api/content/our-story] Error reading or parsing our-story-content.json:', (error as Error).message);
    // In case of an error, return a structured fallback content with an error field
    return NextResponse.json(
      { 
        ...fallbackContent, 
        error: `Failed to load Our Story content. ${(error as Error).message}` 
      }, 
      { status: 500 }
    );
  }
}
