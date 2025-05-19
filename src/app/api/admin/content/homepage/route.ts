
// /src/app/api/admin/content/homepage/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { HomepageContent } from '@/types'; // Updated to use the main type

const filePath = path.join(process.cwd(), 'src', 'data', 'homepage-content.json');

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
      console.warn("File system write attempts are disabled in Vercel production environment for this demo API.");
      return NextResponse.json({ message: 'Content modification is disabled in this environment for demo purposes.' }, { status: 403 });
  }

  try {
    const newData = (await request.json()) as HomepageContent;

    // Basic validation
    if (!newData || !newData.heroSlides || !Array.isArray(newData.heroSlides) || newData.heroSlides.length === 0) {
      return NextResponse.json({ message: 'Invalid data format: heroSlides array is required and must not be empty.' }, { status: 400 });
    }
    // Add more validation for each slide and other sections if needed

    let currentData: Partial<HomepageContent> = {};
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      currentData = JSON.parse(fileContent);
    } catch (readError) {
      console.warn("Could not read existing homepage content file, will overwrite:", readError);
    }
    
    const updatedData: HomepageContent = {
      ...currentData,
      heroSlides: newData.heroSlides.map(slide => ({
        ...slide,
        // Ensure videoId and imageUrl are undefined if empty string, not just empty string
        videoId: slide.videoId || undefined, 
        imageUrl: slide.imageUrl || undefined,
      })),
      artisanalRoots: newData.artisanalRoots || currentData.artisanalRoots || { title: "", description: "" },
      socialCommerceItems: newData.socialCommerceItems || currentData.socialCommerceItems || [],
    };

    await fs.writeFile(filePath, JSON.stringify(updatedData, null, 2), 'utf-8');

    return NextResponse.json({ message: 'Homepage content updated successfully.' });
  } catch (error) {
    console.error('Error updating homepage content:', error);
    return NextResponse.json({ message: 'Error updating homepage content.', error: (error as Error).message }, { status: 500 });
  }
}
