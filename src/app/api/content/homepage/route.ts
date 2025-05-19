// src/app/api/content/homepage/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { HomepageContent, HeroSlide, SocialCommerceItem } from '@/types';

const filePath = path.join(process.cwd(), 'src', 'data', 'homepage-content.json');

// Define a robust default fallback content structure
const defaultFallbackContent: HomepageContent = {
  heroSlides: [
    {
      id: 'fallback-hero-default',
      title: "Welcome to Peak Pulse",
      description: "Content is currently being updated. Please check back soon!",
      imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1920&h=1080&fit=crop&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // A neutral, appealing placeholder
      altText: "Default hero image - Peak Pulse",
      dataAiHint: "abstract texture modern",
      ctaText: "Explore Products",
      ctaLink: "/products",
      videoId: undefined, // Explicitly undefined
    }
  ],
  artisanalRoots: {
    title: "Our Heritage",
    description: "Discover the craftsmanship woven into every piece we create."
  },
  socialCommerceItems: [],
};

export async function GET() {
  console.log("[API /api/content/homepage] GET request received.");
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const parsedData = JSON.parse(fileContent) as Partial<HomepageContent>; // Cast as partial to handle potentially incomplete data

    // Ensure all parts of the structure are present before sending, using defaults if necessary
    const responseData: HomepageContent = {
      heroSlides: (Array.isArray(parsedData.heroSlides) && parsedData.heroSlides.length > 0)
        ? parsedData.heroSlides.map(slide => ({
            id: slide.id || `tempslide-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            title: slide.title || "Discover Peak Pulse",
            description: slide.description || "Unique styles inspired by tradition.",
            imageUrl: slide.imageUrl, // Keep as is, frontend will handle fallback if undefined
            videoId: slide.videoId,   // Keep as is
            altText: slide.altText || "Peak Pulse Hero",
            dataAiHint: slide.dataAiHint || "fashion background",
            ctaText: slide.ctaText || "Shop Now",
            ctaLink: slide.ctaLink || "/products",
          }))
        : defaultFallbackContent.heroSlides, // Fallback to default if no valid slides
      artisanalRoots: (parsedData.artisanalRoots && parsedData.artisanalRoots.title)
        ? parsedData.artisanalRoots
        : defaultFallbackContent.artisanalRoots,
      socialCommerceItems: (Array.isArray(parsedData.socialCommerceItems))
        ? parsedData.socialCommerceItems.map(item => ({
            id: item.id || `tempsocial-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            imageUrl: item.imageUrl || "https://placehold.co/400x400.png?text=Social+Post",
            linkUrl: item.linkUrl || "#",
            altText: item.altText || "Peak Pulse Social",
            dataAiHint: item.dataAiHint || "social fashion",
        }))
        : defaultFallbackContent.socialCommerceItems,
    };
    console.log("[API /api/content/homepage] Successfully read and structured data. Sending response.");
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('[API /api/content/homepage] Error reading, parsing, or structuring homepage-content.json:', error);
    // If there's any error, send the robust default fallback content with a 200 OK status
    // to prevent client-side "Failed to fetch" if the client expects JSON.
    // The client can then decide if this fallback content indicates an issue.
    console.log("[API /api/content/homepage] Sending default fallback content due to error.");
    return NextResponse.json(defaultFallbackContent); // Send fallback, but still as OK so client can parse JSON
  }
}
