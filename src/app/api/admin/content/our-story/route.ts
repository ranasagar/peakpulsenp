
// /src/app/api/admin/content/our-story/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface OurStoryContentData {
  hero: {
    title: string;
    description: string;
  };
  mission: {
    title: string;
    paragraph1: string;
    paragraph2: string;
  };
  craftsmanship: {
    title: string;
    paragraph1: string;
    paragraph2: string;
  };
  valuesSection: {
    title: string;
  };
  joinJourneySection: {
    title: string;
    description: string;
  };
}

const filePath = path.join(process.cwd(), 'src', 'data', 'our-story-content.json');

export async function POST(request: NextRequest) {
  // IMPORTANT: In a real application, this endpoint MUST be protected
  // to ensure only authenticated admins can modify content.
  // This file writing approach will NOT work in typical serverless environments like Vercel.
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
      console.warn("File system write attempts are disabled in Vercel production environment for this demo API.");
      return NextResponse.json({ message: 'Content modification is disabled in this environment for demo purposes.' }, { status: 403 });
  }

  try {
    const newData = (await request.json()) as OurStoryContentData;

    // Basic validation
    if (!newData || !newData.hero || !newData.mission || !newData.craftsmanship || !newData.valuesSection || !newData.joinJourneySection ) {
      return NextResponse.json({ message: 'Invalid data format for Our Story content.' }, { status: 400 });
    }

    let currentData = {};
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      currentData = JSON.parse(fileContent);
    } catch (readError) {
      console.warn("Could not read existing our-story content file, will overwrite:", readError);
    }

    const updatedData = { ...currentData, ...newData };

    await fs.writeFile(filePath, JSON.stringify(updatedData, null, 2), 'utf-8');

    return NextResponse.json({ message: 'Our Story content updated successfully.' });
  } catch (error) {
    console.error('Error updating Our Story content:', error);
    return NextResponse.json({ message: 'Error updating Our Story content.', error: (error as Error).message }, { status: 500 });
  }
}
