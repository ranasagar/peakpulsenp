
// /src/app/api/content/homepage/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import type { HomepageContent, HeroSlide, SocialCommerceItem } from '@/types';

export const dynamic = 'force-dynamic';
const HOMEPAGE_CONFIG_KEY = 'homepageContent';

const fallbackContent: HomepageContent = {
  heroSlides: [
    {
      id: 'fallback-hero-main-public',
      title: "Peak Pulse",
      description: "Experience the fusion of ancient Nepali artistry and modern streetwear. (Default content)",
      imageUrl: "https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?q=80&w=1920&h=1080&fit=crop&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      altText: "Default Peak Pulse Hero Image",
      dataAiHint: "mountain abstract texture",
      ctaText: "Explore Collections",
      ctaLink: "/products",
      videoId: undefined,
    }
  ],
  artisanalRoots: {
    title: "Our Artisanal Roots (Default)",
    description: "Discover the heritage and craftsmanship woven into every Peak Pulse piece. (Default content)"
  },
  socialCommerceItems: [],
  heroVideoId: undefined,
  heroImageUrl: undefined,
  error: "Using default content structure; actual content might be missing or failed to load."
};

export async function GET() {
  if (!supabase) {
    console.error('[Public API Homepage GET] Supabase client is not initialized. Returning fallback content.');
    return NextResponse.json({ ...fallbackContent, error: "Database client not configured." });
  }
  console.log(`[Public API Homepage GET] Request to fetch content from Supabase for key: ${HOMEPAGE_CONFIG_KEY}`);

  try {
    const { data, error } = await supabase
      .from('site_configurations')
      .select('value')
      .eq('config_key', HOMEPAGE_CONFIG_KEY)
      .maybeSingle();

    if (error) {
      console.error(`[Public API Homepage GET] Supabase error fetching content for ${HOMEPAGE_CONFIG_KEY}:`, error);
      return NextResponse.json({ ...fallbackContent, error: `Failed to load homepage content. Supabase: ${error.message}` }, { status: 500 });
    }

    if (data && data.value) {
      console.log(`[Public API Homepage GET] Successfully fetched content for ${HOMEPAGE_CONFIG_KEY}.`);
      const dbContent = data.value as Partial<HomepageContent>;
      const responseData: HomepageContent = {
        heroSlides: (dbContent.heroSlides && dbContent.heroSlides.length > 0)
          ? dbContent.heroSlides.map((slide: Partial<HeroSlide>, index: number) => ({
              id: slide.id || `hs-api-${Date.now()}-${index}`,
              title: slide.title || fallbackContent.heroSlides![0].title,
              description: slide.description || fallbackContent.heroSlides![0].description,
              imageUrl: slide.imageUrl || undefined,
              videoId: slide.videoId === null ? undefined : slide.videoId,
              altText: slide.altText || fallbackContent.heroSlides![0].altText,
              dataAiHint: slide.dataAiHint || fallbackContent.heroSlides![0].dataAiHint,
              ctaText: slide.ctaText || fallbackContent.heroSlides![0].ctaText,
              ctaLink: slide.ctaLink || fallbackContent.heroSlides![0].ctaLink,
          }))
          : fallbackContent.heroSlides!,
        artisanalRoots: dbContent.artisanalRoots
          ? { title: dbContent.artisanalRoots.title || fallbackContent.artisanalRoots!.title, description: dbContent.artisanalRoots.description || fallbackContent.artisanalRoots!.description }
          : fallbackContent.artisanalRoots!,
        socialCommerceItems: (dbContent.socialCommerceItems && dbContent.socialCommerceItems.length > 0)
          ? dbContent.socialCommerceItems.map((item: Partial<SocialCommerceItem>, index: number) => ({
              id: item.id || `sc-api-${Date.now()}-${index}`,
              imageUrl: item.imageUrl || "https://placehold.co/400x400.png?text=Social",
              linkUrl: item.linkUrl || "#",
              altText: item.altText || "Social media post",
              dataAiHint: item.dataAiHint || "social fashion user",
          }))
          : fallbackContent.socialCommerceItems!,
        heroVideoId: dbContent.heroVideoId === null ? undefined : dbContent.heroVideoId,
        heroImageUrl: dbContent.heroImageUrl === null ? undefined : dbContent.heroImageUrl,
      };
      return NextResponse.json(responseData);
    } else {
      console.warn(`[Public API Homepage GET] No content found for ${HOMEPAGE_CONFIG_KEY}. Returning fallback.`);
      return NextResponse.json({ ...fallbackContent, error: "Homepage content not found in database." });
    }
  } catch (e) {
    console.error(`[Public API Homepage GET] Unhandled error for ${HOMEPAGE_CONFIG_KEY}:`, e);
    return NextResponse.json({ ...fallbackContent, error: `Server error fetching homepage content. ${(e as Error).message}` }, { status: 500 });
  }
}

    