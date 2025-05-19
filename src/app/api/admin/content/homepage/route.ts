
// /src/app/api/admin/content/homepage/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { HomepageContent, HeroSlide, SocialCommerceItem } from '@/types';

const filePath = path.join(process.cwd(), 'src', 'data', 'homepage-content.json');

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
      console.warn("File system write attempts are disabled in Vercel production environment for this demo API.");
      return NextResponse.json({ message: 'Content modification is disabled in this environment for demo purposes.' }, { status: 403 });
  }

  try {
    const newDataFromRequest = (await request.json()) as Partial<HomepageContent>; // Data from admin form
    console.log("[Admin API POST] Received newDataFromRequest:", JSON.stringify(newDataFromRequest, null, 2));

    let currentData: HomepageContent = {
        heroSlides: [],
        artisanalRoots: { title: "", description: "" },
        socialCommerceItems: [],
    };

    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      if (fileContent) {
        const parsedData = JSON.parse(fileContent);
        // Ensure currentData has the full structure even if file is partially formed
        currentData = {
            heroSlides: parsedData.heroSlides || [],
            artisanalRoots: parsedData.artisanalRoots || { title: "", description: "" },
            socialCommerceItems: parsedData.socialCommerceItems || [],
        };
      }
      console.log("[Admin API POST] Read currentData:", JSON.stringify(currentData, null, 2));
    } catch (readError: any) {
      if (readError.code !== 'ENOENT') {
        console.warn("Error reading existing homepage content file. Defaulting to empty structure. Error:", readError.message);
      } else {
        console.log("Homepage content file not found, will be created with new data.");
      }
    }
    
    const updatedData: HomepageContent = {
      heroSlides: (newDataFromRequest.heroSlides || currentData.heroSlides || []).map((slide: HeroSlide) => ({
        id: slide.id || `slide-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        title: slide.title || "",
        description: slide.description || "",
        imageUrl: slide.imageUrl || undefined,
        videoId: slide.videoId || undefined,
        altText: slide.altText || "",
        dataAiHint: slide.dataAiHint || "",
        ctaText: slide.ctaText || "",
        ctaLink: slide.ctaLink || "",
      })),
      artisanalRoots: newDataFromRequest.artisanalRoots || currentData.artisanalRoots || { title: "", description: "" },
      socialCommerceItems: (newDataFromRequest.socialCommerceItems || currentData.socialCommerceItems || []).map((item: SocialCommerceItem) => ({
          id: item.id || `social-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          imageUrl: item.imageUrl || "",
          linkUrl: item.linkUrl || "",
          altText: item.altText || "",
          dataAiHint: item.dataAiHint || "",
      })),
    };
    
    // If newDataFromRequest explicitly sends an empty array for a section, it should overwrite
    if (newDataFromRequest.heroSlides !== undefined) {
        updatedData.heroSlides = newDataFromRequest.heroSlides.map((slide: HeroSlide) => ({
            id: slide.id || `slide-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            title: slide.title || "",
            description: slide.description || "",
            imageUrl: slide.imageUrl || undefined,
            videoId: slide.videoId || undefined,
            altText: slide.altText || "",
            dataAiHint: slide.dataAiHint || "",
            ctaText: slide.ctaText || "",
            ctaLink: slide.ctaLink || "",
        }));
    }
    if (newDataFromRequest.artisanalRoots !== undefined) {
        updatedData.artisanalRoots = newDataFromRequest.artisanalRoots;
    }
    if (newDataFromRequest.socialCommerceItems !== undefined) {
        updatedData.socialCommerceItems = newDataFromRequest.socialCommerceItems.map((item: SocialCommerceItem) => ({
            id: item.id || `social-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            imageUrl: item.imageUrl || "",
            linkUrl: item.linkUrl || "",
            altText: item.altText || "",
            dataAiHint: item.dataAiHint || "",
        }));
    }


    console.log("[Admin API POST] Writing updatedData:", JSON.stringify(updatedData, null, 2));
    await fs.writeFile(filePath, JSON.stringify(updatedData, null, 2), 'utf-8');

    return NextResponse.json({ message: 'Homepage content updated successfully.' });
  } catch (error) {
    console.error('Error updating homepage content:', error);
    return NextResponse.json({ message: 'Error updating homepage content.', error: (error as Error).message }, { status: 500 });
  }
}
