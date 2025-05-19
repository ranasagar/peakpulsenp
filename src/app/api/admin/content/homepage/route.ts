// /src/app/api/admin/content/homepage/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { HomepageContent, HeroSlide, SocialCommerceItem } from '@/types';

const filePath = path.join(process.cwd(), 'src', 'data', 'homepage-content.json');

// Helper function to read existing content or return a default structure
async function getCurrentContent(): Promise<HomepageContent> {
    try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const parsedData = JSON.parse(fileContent);
        // Ensure the basic structure exists
        return {
            heroSlides: Array.isArray(parsedData.heroSlides) ? parsedData.heroSlides : [],
            artisanalRoots: parsedData.artisanalRoots || { title: "", description: "" },
            socialCommerceItems: Array.isArray(parsedData.socialCommerceItems) ? parsedData.socialCommerceItems : [],
        };
    } catch (error) {
        // If file doesn't exist or is invalid, return a default structure
        console.warn("[Admin API POST] Error reading existing homepage content file or file is empty/corrupt. Starting with a default structure. Error:", (error as Error).message);
        return {
            heroSlides: [],
            artisanalRoots: { title: "", description: "" },
            socialCommerceItems: [],
        };
    }
}


export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
      console.warn("File system write attempts are disabled in Vercel production environment for this demo API.");
      return NextResponse.json({ message: 'Content modification is disabled in this environment for demo purposes.' }, { status: 403 });
  }

  try {
    const newContentFromAdmin = (await request.json()) as Partial<HomepageContent>; // Data from admin form, might be partial
    console.log("[Admin API POST] Received newDataFromRequest:", JSON.stringify(newContentFromAdmin, null, 2));

    // The admin form should ideally send the full intended structure for HomepageContent.
    // We will treat the incoming data as the new desired state for these sections.
    // If a section is missing from newContentFromAdmin, it implies no changes were made to it, or it was cleared.

    const finalDataToWrite: HomepageContent = {
        heroSlides: (newContentFromAdmin.heroSlides || []).map((slide: Partial<HeroSlide>) => ({
            id: slide.id || `slide-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            title: slide.title || "",
            description: slide.description || "",
            imageUrl: slide.imageUrl || undefined, // Ensure undefined if empty string
            videoId: slide.videoId || undefined,   // Ensure undefined if empty string
            altText: slide.altText || "",
            dataAiHint: slide.dataAiHint || "",
            ctaText: slide.ctaText || "",
            ctaLink: slide.ctaLink || "",
        })),
        artisanalRoots: newContentFromAdmin.artisanalRoots || { title: "", description: "" }, // Default if not provided
        socialCommerceItems: (newContentFromAdmin.socialCommerceItems || []).map((item: Partial<SocialCommerceItem>) => ({
            id: item.id || `social-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            imageUrl: item.imageUrl || "", // Should have URL
            linkUrl: item.linkUrl || "",   // Should have URL
            altText: item.altText || "",
            dataAiHint: item.dataAiHint || "",
        })),
    };
    
    console.log("[Admin API POST] Writing finalDataToWrite to homepage-content.json:", JSON.stringify(finalDataToWrite, null, 2));
    await fs.writeFile(filePath, JSON.stringify(finalDataToWrite, null, 2), 'utf-8');
    console.log("[Admin API POST] Attempted to write finalDataToWrite to homepage-content.json");

    try {
      const writtenContent = await fs.readFile(filePath, 'utf-8');
      console.log("[Admin API POST] Content read back from file immediately after write:", writtenContent);
    } catch (e) {
      console.error("[Admin API POST] Error reading file back immediately after write:", e);
    }

    return NextResponse.json({ message: 'Homepage content updated successfully.' });
  } catch (error) {
    console.error('Error updating homepage content:', error);
    return NextResponse.json({ message: 'Error updating homepage content.', error: (error as Error).message }, { status: 500 });
  }
}
