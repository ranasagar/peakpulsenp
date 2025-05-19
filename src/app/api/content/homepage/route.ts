// src/app/api/content/homepage/route.ts
import { NextResponse } from 'next/server';
import type { HomepageContent, HeroSlide, SocialCommerceItem } from '@/types';

// Define a robust default fallback content structure
const hardcodedContentForDebug: HomepageContent = {
  heroSlides: [
    {
      id: 'debug-hero-1',
      title: "Debug Hero Title",
      description: "This is hardcoded debug content from the API route.",
      imageUrl: "https://placehold.co/1920x1080.png",
      altText: "Debug hero image",
      dataAiHint: "debug abstract",
      ctaText: "Debug CTA",
      ctaLink: "/",
      videoId: undefined,
    }
  ],
  artisanalRoots: {
    title: "Debug Artisanal Roots",
    description: "Debug description for artisanal roots section."
  },
  socialCommerceItems: [
    { id: 'debug-social-1', imageUrl: 'https://placehold.co/400x400.png?text=Debug+Social+1', linkUrl: '#', altText: 'Debug Social Post 1', dataAiHint: 'debug social' },
  ],
};

export async function GET() {
  console.log("[API /api/content/homepage] GET request received. Returning hardcoded debug content.");
  try {
    // Directly return the hardcoded content
    return NextResponse.json(hardcodedContentForDebug);
  } catch (error) {
    // This catch block should ideally not be hit if we're just returning hardcoded data,
    // but it's good for safety.
    console.error('[API /api/content/homepage] Unexpected error even with hardcoded response:', error);
    // Return a generic error response, but still valid JSON
    return NextResponse.json(
        { 
            message: 'API route encountered an unexpected error.', 
            error: (error as Error).message,
            // Provide a minimal valid HomepageContent structure in case of an error
            // to prevent the client from failing to parse.
            heroSlides: [{
                id: 'error-fallback-hero',
                title: "API Error",
                description: "Could not load dynamic content due to an API error.",
                imageUrl: "https://placehold.co/1920x1080.png?text=API+Error",
                altText: "API Error Fallback",
                dataAiHint: "error abstract",
                ctaText: "Try Again",
                ctaLink: "/",
                videoId: undefined,
            }],
            artisanalRoots: { title: "Content Unavailable", description: "Due to an API error." },
            socialCommerceItems: [],
        }, 
        { status: 500 }
    );
  }
}
