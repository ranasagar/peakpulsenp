
// /src/app/api/admin/content/homepage/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface HomepageContentData {
  hero: {
    title: string;
    description: string;
    videoId?: string;
    imageUrl?: string; // Added imageUrl
  };
  artisanalRoots?: {
    title: string;
    description: string;
  };
}

const filePath = path.join(process.cwd(), 'src', 'data', 'homepage-content.json');

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
      console.warn("File system write attempts are disabled in Vercel production environment for this demo API.");
      return NextResponse.json({ message: 'Content modification is disabled in this environment for demo purposes.' }, { status: 403 });
  }

  try {
    const newData = (await request.json()) as HomepageContentData;

    if (!newData || !newData.hero || typeof newData.hero.title !== 'string' || typeof newData.hero.description !== 'string') {
      return NextResponse.json({ message: 'Invalid data format for hero section.' }, { status: 400 });
    }
    if (newData.hero.videoId && (typeof newData.hero.videoId !== 'string' || !/^[a-zA-Z0-9_-]{11}$/.test(newData.hero.videoId))) {
        return NextResponse.json({ message: 'Invalid YouTube Video ID format for hero section.' }, { status: 400 });
    }
    if (newData.hero.imageUrl && typeof newData.hero.imageUrl !== 'string') { // Basic check for string
        return NextResponse.json({ message: 'Invalid Image URL format for hero section.' }, { status: 400 });
    }
     if (newData.artisanalRoots && (typeof newData.artisanalRoots.title !== 'string' || typeof newData.artisanalRoots.description !== 'string')) {
      return NextResponse.json({ message: 'Invalid data format for artisanal roots section.' }, { status: 400 });
    }

    let currentData: Partial<HomepageContentData> = {};
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      currentData = JSON.parse(fileContent);
    } catch (readError) {
      console.warn("Could not read existing homepage content file, will overwrite:", readError);
    }

    // Ensure hero object exists on currentData before merging
    if (!currentData.hero) {
        currentData.hero = { title: '', description: '' };
    }
    
    const updatedHero = {
        ...currentData.hero, // Start with existing hero data
        title: newData.hero.title, // Overwrite title
        description: newData.hero.description, // Overwrite description
        videoId: newData.hero.videoId, // Set or clear videoId
        imageUrl: newData.hero.imageUrl, // Set or clear imageUrl
    };

    // Ensure videoId is removed if newData.hero.videoId is an empty string or undefined
    if (newData.hero.videoId === '' || newData.hero.videoId === undefined) {
      delete updatedHero.videoId;
    }
    // Ensure imageUrl is removed if newData.hero.imageUrl is an empty string or undefined
    if (newData.hero.imageUrl === '' || newData.hero.imageUrl === undefined) {
      delete updatedHero.imageUrl;
    }


    const updatedData: HomepageContentData = {
      ...currentData,
      hero: updatedHero,
      artisanalRoots: newData.artisanalRoots || currentData.artisanalRoots || { title: "", description: "" }
    };


    await fs.writeFile(filePath, JSON.stringify(updatedData, null, 2), 'utf-8');

    return NextResponse.json({ message: 'Homepage content updated successfully.' });
  } catch (error) {
    console.error('Error updating homepage content:', error);
    return NextResponse.json({ message: 'Error updating homepage content.', error: (error as Error).message }, { status: 500 });
  }
}
