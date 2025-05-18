
// /src/app/api/admin/content/homepage/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface HomepageContentData {
  hero: {
    title: string;
    description: string;
  };
  artisanalRoots?: {
    title: string;
    description: string;
  };
}

const filePath = path.join(process.cwd(), 'src', 'data', 'homepage-content.json');

export async function POST(request: NextRequest) {
  // IMPORTANT: In a real application, this endpoint MUST be protected
  // to ensure only authenticated admins can modify content.

  // This file writing approach will NOT work in typical serverless environments
  // like Vercel for deployed apps, as their filesystems are read-only.
  // This is for demonstration purposes in a local development environment.
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
      console.warn("File system write attempts are disabled in Vercel production environment for this demo API.");
      return NextResponse.json({ message: 'Content modification is disabled in this environment for demo purposes.' }, { status: 403 });
  }

  try {
    const newData = (await request.json()) as HomepageContentData;

    // Basic validation of incoming data structure (can be more robust with Zod)
    if (!newData || !newData.hero || typeof newData.hero.title !== 'string' || typeof newData.hero.description !== 'string') {
      return NextResponse.json({ message: 'Invalid data format for homepage content.' }, { status: 400 });
    }
     if (newData.artisanalRoots && (typeof newData.artisanalRoots.title !== 'string' || typeof newData.artisanalRoots.description !== 'string')) {
      return NextResponse.json({ message: 'Invalid data format for artisanal roots section.' }, { status: 400 });
    }


    // Read the current file to preserve any other keys that might exist
    let currentData = {};
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      currentData = JSON.parse(fileContent);
    } catch (readError) {
      // If file doesn't exist or is malformed, we'll just overwrite with new data
      console.warn("Could not read existing homepage content file, will overwrite:", readError);
    }

    const updatedData = {
      ...currentData, // Preserve other potential top-level keys
      hero: newData.hero,
      artisanalRoots: newData.artisanalRoots || (currentData as HomepageContentData).artisanalRoots || { title: "", description: "" }
    };

    await fs.writeFile(filePath, JSON.stringify(updatedData, null, 2), 'utf-8');

    return NextResponse.json({ message: 'Homepage content updated successfully.' });
  } catch (error) {
    console.error('Error updating homepage content:', error);
    return NextResponse.json({ message: 'Error updating homepage content.', error: (error as Error).message }, { status: 500 });
  }
}
