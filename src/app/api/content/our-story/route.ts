
'use server';

import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'src', 'data', 'our-story-content.json');
    const jsonData = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(jsonData);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to read our-story content:', error);
    const fallbackContent = {
      hero: { title: "Our Story (Error)", description: "Content temporarily unavailable." },
      mission: { title: "Our Mission (Error)", paragraph1: "Details unavailable.", paragraph2: "" },
      craftsmanship: { title: "Craftsmanship (Error)", paragraph1: "Details unavailable.", paragraph2: "" },
      valuesSection: { title: "Our Values (Error)"},
      joinJourneySection: { title: "Join Us (Error)", description: "Details unavailable."}
    };
    return NextResponse.json(fallbackContent, { status: 500 });
  }
}
