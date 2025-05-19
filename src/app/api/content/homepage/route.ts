// src/app/api/content/homepage/route.ts
import { NextResponse } from 'next/server';
import type { HomepageContent, HeroSlide, SocialCommerceItem } from '@/types';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic'; // Ensures the route is re-executed on every request

// Define a robust default fallback content structure
const hardcodedFallbackContent: HomepageContent = {
  heroSlides: [
    {
      id: 'fallback-hero-1',
      title: "Peak Pulse (API Fallback)",
      description: "Experience the fusion of ancient Nepali artistry and modern streetwear. (Content may be loading or temporarily unavailable).",
      imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1920&h=1080&fit=crop&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      altText: "Fallback hero image: abstract fashion",
      dataAiHint: "fashion abstract modern",
      ctaText: "Explore Collections",
      ctaLink: "/products",
      videoId: undefined,
    }
  ],
  artisanalRoots: {
    title: "Our Artisanal Roots (API Fallback)",
    description: "Details about our craftsmanship are currently unavailable. We partner with local artisans in Nepal, preserving centuries-old techniques while innovating for today's global citizen."
  },
  socialCommerceItems: [
    { id: 'social-fallback-1', imageUrl: 'https://placehold.co/400x400.png?text=Social+Fallback+1', linkUrl: 'https://instagram.com/peakpulsenp', altText: 'Social Post 1 Fallback', dataAiHint: 'social fashion fallback' },
  ],
};

const filePath = path.join(process.cwd(), 'src', 'data', 'homepage-content.json');

export async function GET() {
  console.log("[API /api/content/homepage] GET request received.");
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const jsonData = JSON.parse(fileContent) as Partial<HomepageContent>; // Assume it might be partial
    console.log("[API /api/content/homepage] Successfully read and parsed homepage-content.json");

    // Ensure all expected parts are present, using fallbacks if necessary
    const responseData: HomepageContent = {
      heroSlides: (Array.isArray(jsonData.heroSlides) && jsonData.heroSlides.length > 0)
        ? jsonData.heroSlides.map((slide: Partial<HeroSlide>) => ({ // Ensure each slide has defaults
            id: slide.id || `slide-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            title: slide.title || "Discover Peak Pulse",
            description: slide.description || "Unique styles await.",
            imageUrl: slide.imageUrl || undefined,
            videoId: slide.videoId || undefined,
            altText: slide.altText || "Hero image",
            dataAiHint: slide.dataAiHint || "fashion background",
            ctaText: slide.ctaText || "Shop Now",
            ctaLink: slide.ctaLink || "/products",
        }))
        : hardcodedFallbackContent.heroSlides,
      artisanalRoots: jsonData.artisanalRoots && jsonData.artisanalRoots.title && jsonData.artisanalRoots.description
        ? jsonData.artisanalRoots
        : hardcodedFallbackContent.artisanalRoots,
      socialCommerceItems: (Array.isArray(jsonData.socialCommerceItems) && jsonData.socialCommerceItems.length > 0)
        ? jsonData.socialCommerceItems.map((item: Partial<SocialCommerceItem>) => ({ // Ensure each item has defaults
            id: item.id || `social-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            imageUrl: item.imageUrl || "https://placehold.co/400x400.png",
            linkUrl: item.linkUrl || "#",
            altText: item.altText || "Social post",
            dataAiHint: item.dataAiHint || "social fashion",
        }))
        : hardcodedFallbackContent.socialCommerceItems,
    };
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('[API /api/content/homepage] Error reading or parsing homepage-content.json, returning hardcoded fallback. Error:', (error as Error).message);
    return NextResponse.json(hardcodedFallbackContent, { status: 500 }); // Return 500 but still with fallback content
  }
}
