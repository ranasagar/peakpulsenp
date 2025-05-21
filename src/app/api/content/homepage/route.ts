
// src/app/api/content/homepage/route.ts
import { NextResponse } from 'next/server';
import type { HomepageContent, HeroSlide, SocialCommerceItem } from '@/types';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic'; 

const filePath = path.join(process.cwd(), 'src', 'data', 'homepage-content.json');

const fallbackContent: HomepageContent = {
  heroSlides: [
    {
      id: 'fallback-hero-1',
      title: "Peak Pulse (Content Loading Error)",
      description: "We're currently unable to load the latest homepage content. Please check back shortly. In the meantime, explore our unique collections!",
      imageUrl: "https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?q=80&w=1920&h=1080&fit=crop&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // A different, neutral placeholder
      altText: "Abstract mountain range placeholder",
      dataAiHint: "mountain abstract texture",
      ctaText: "Shop All Products",
      ctaLink: "/products",
      videoId: undefined,
    }
  ],
  artisanalRoots: {
    title: "Our Artisanal Roots (Content Loading Error)",
    description: "Details about our commitment to craftsmanship are being updated. We champion local artisans and sustainable practices."
  },
  socialCommerceItems: [],
  heroVideoId: undefined,
  heroImageUrl: undefined,
};

export async function GET() {
  console.log("[API /api/content/homepage] GET request received.");
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const jsonData = JSON.parse(fileContent) as Partial<HomepageContent>; // Data might be partial
    console.log("[API /api/content/homepage] Successfully read and parsed homepage-content.json");

    // Ensure all parts of HomepageContent are present, using fallbacks if necessary
    const responseData: HomepageContent = {
      heroSlides: (Array.isArray(jsonData.heroSlides) && jsonData.heroSlides.length > 0)
        ? jsonData.heroSlides.map((slide: Partial<HeroSlide>, index: number) => ({
            id: slide.id || `slide-api-${Date.now()}-${index}`,
            title: slide.title || fallbackContent.heroSlides![0].title,
            description: slide.description || fallbackContent.heroSlides![0].description,
            imageUrl: slide.imageUrl || undefined,
            videoId: slide.videoId || undefined,
            altText: slide.altText || "Hero image",
            dataAiHint: slide.dataAiHint || "fashion background",
            ctaText: slide.ctaText || "Shop Now",
            ctaLink: slide.ctaLink || "/products",
        }))
        : fallbackContent.heroSlides!,
      artisanalRoots: (jsonData.artisanalRoots && jsonData.artisanalRoots.title && jsonData.artisanalRoots.description)
        ? jsonData.artisanalRoots
        : fallbackContent.artisanalRoots!,
      socialCommerceItems: (Array.isArray(jsonData.socialCommerceItems))
        ? jsonData.socialCommerceItems.map((item: Partial<SocialCommerceItem>, index: number) => ({
            id: item.id || `social-api-${Date.now()}-${index}`,
            imageUrl: item.imageUrl || "https://placehold.co/400x400.png",
            linkUrl: item.linkUrl || "#",
            altText: item.altText || "Social post",
            dataAiHint: item.dataAiHint || "social fashion",
        }))
        : fallbackContent.socialCommerceItems!,
      heroVideoId: jsonData.heroVideoId || undefined,
      heroImageUrl: jsonData.heroImageUrl || undefined,
    };
    console.log("[API /api/content/homepage] Returning data:", JSON.stringify(responseData, null, 2).substring(0, 500) + "..."); // Log snippet
    return NextResponse.json(responseData);

  } catch (error) {
    const errorMessage = (error as Error).message;
    console.error('[API /api/content/homepage] Error reading or parsing homepage-content.json, returning hardcoded fallback. Error:', errorMessage);
    return NextResponse.json(
      { ...fallbackContent, error: `Failed to load homepage content: ${errorMessage}` },
      { status: 500 }
    );
  }
}
