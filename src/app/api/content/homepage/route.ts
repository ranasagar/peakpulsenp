
// /src/app/api/content/homepage/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient.ts';
import type { HomepageContent, HeroSlide, SocialCommerceItem } from '@/types';

export const dynamic = 'force-dynamic';
const HOMEPAGE_CONFIG_KEY = 'homepageContent';

const hardcodedFallbackContent: HomepageContent = {
  heroSlides: [
    {
      id: 'fallback-hero-main',
      title: "Peak Pulse (Default)",
      description: "Experience the fusion of ancient Nepali artistry and modern streetwear. Content is loading or using defaults.",
      imageUrl: "https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?q=80&w=1920&h=1080&fit=crop&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      altText: "Abstract mountain range placeholder",
      dataAiHint: "mountain abstract texture",
      ctaText: "Explore Collections",
      ctaLink: "/products",
      videoId: undefined,
    }
  ],
  artisanalRoots: {
    title: "Our Artisanal Roots (Default)",
    description: "Discover the heritage and craftsmanship woven into every Peak Pulse piece."
  },
  socialCommerceItems: [],
  heroVideoId: undefined, // Explicitly undefined
  heroImageUrl: undefined,  // Explicitly undefined
  error: "Using default content structure." // Add error field for clarity
};

export async function GET() {
  console.log(`[Public API Homepage GET] Request to fetch content from Supabase for key: ${HOMEPAGE_CONFIG_KEY}`);
  if (!supabase) {
    console.error('[Public API Homepage GET] Supabase client is not initialized. Returning hardcoded fallback content.');
    return NextResponse.json({ ...hardcodedFallbackContent, error: "Database client not configured." });
  }

  try {
    const { data, error } = await supabase
      .from('site_configurations')
      .select('value')
      .eq('config_key', HOMEPAGE_CONFIG_KEY)
      .maybeSingle();

    if (error) {
      console.error(`[Public API Homepage GET] Supabase error fetching content for ${HOMEPAGE_CONFIG_KEY}:`, error);
      return NextResponse.json({ ...hardcodedFallbackContent, error: `Failed to load homepage content from database. ${error.message}` }, { status: 500 });
    }

    if (data && data.value) {
      console.log(`[Public API Homepage GET] Successfully fetched content for ${HOMEPAGE_CONFIG_KEY}.`);
      const dbContent = data.value as Partial<HomepageContent>;
      // Ensure all parts of HomepageContent are present, using fallbacks if necessary
      const responseData: HomepageContent = {
        heroSlides: (dbContent.heroSlides && dbContent.heroSlides.length > 0)
          ? dbContent.heroSlides.map((slide: Partial<HeroSlide>, index: number) => ({
              id: slide.id || `slide-api-${Date.now()}-${index}`,
              title: slide.title || hardcodedFallbackContent.heroSlides![0].title,
              description: slide.description || hardcodedFallbackContent.heroSlides![0].description,
              imageUrl: slide.imageUrl || undefined,
              videoId: slide.videoId || undefined,
              altText: slide.altText || "Hero image",
              dataAiHint: slide.dataAiHint || "fashion background",
              ctaText: slide.ctaText || "Shop Now",
              ctaLink: slide.ctaLink || "/products",
          }))
          : hardcodedFallbackContent.heroSlides!,
        artisanalRoots: dbContent.artisanalRoots || hardcodedFallbackContent.artisanalRoots!,
        socialCommerceItems: (dbContent.socialCommerceItems && dbContent.socialCommerceItems.length > 0)
          ? dbContent.socialCommerceItems.map((item: Partial<SocialCommerceItem>, index: number) => ({
              id: item.id || `social-api-${Date.now()}-${index}`,
              imageUrl: item.imageUrl || "https://placehold.co/400x400.png",
              linkUrl: item.linkUrl || "#",
              altText: item.altText || "Social post",
              dataAiHint: item.dataAiHint || "social fashion",
          }))
          : hardcodedFallbackContent.socialCommerceItems!,
        heroVideoId: dbContent.heroVideoId || undefined,
        heroImageUrl: dbContent.heroImageUrl || undefined,
      };
      return NextResponse.json(responseData);
    } else {
      console.warn(`[Public API Homepage GET] No content found for ${HOMEPAGE_CONFIG_KEY}. Returning hardcoded fallback.`);
      return NextResponse.json({ ...hardcodedFallbackContent, error: "Homepage content not found in database." });
    }
  } catch (e) {
    console.error(`[Public API Homepage GET] Unhandled error fetching content for ${HOMEPAGE_CONFIG_KEY}, returning hardcoded fallback. Error:`, (e as Error).message);
    return NextResponse.json({ ...hardcodedFallbackContent, error: `Server error fetching homepage content. ${(e as Error).message}` }, { status: 500 });
  }
}
