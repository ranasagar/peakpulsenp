// src/app/api/content/homepage/route.ts
import type { HeroSlide, HomepageContent } from '@/types';

// DO NOT USE 'use server'; here. This is an API route.

export function GET() {
  console.log("[API /api/content/homepage] Barebones GET request received by API route.");
  const data: HomepageContent = {
    heroSlides: [
      {
        id: 'barebones-debug-1',
        title: "Barebones API Title (Hardcoded)",
        description: "This content is served directly from a very simplified API route.",
        imageUrl: "https://placehold.co/1920x1080.png?text=Barebones+API+Image",
        altText: "Barebones API Image",
        dataAiHint: "debug placeholder",
        ctaText: "Debug CTA",
        ctaLink: "/"
      }
    ],
    artisanalRoots: {
        title: "Barebones Artisanal Roots (Hardcoded)",
        description: "Minimal API content for artisanal roots section."
    }
  };

  try {
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('[API /api/content/homepage] CRITICAL ERROR in barebones route:', error);
    // Fallback in case JSON.stringify fails (highly unlikely with this simple object)
    return new Response(JSON.stringify({ message: 'Internal Server Error in API', heroSlides: [], artisanalRoots: {title: 'Error', description: 'Error'} }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
