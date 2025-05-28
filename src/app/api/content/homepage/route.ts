
// /src/app/api/content/homepage/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase as fallbackSupabase } from '@/lib/supabaseClient';
import type { HomepageContent, HeroSlide, SocialCommerceItem, ArtisanalRootsSlide } from '@/types';

export const dynamic = 'force-dynamic';
const HOMEPAGE_CONFIG_KEY = 'homepageContent';

const defaultHeroSlideStructure: Omit<HeroSlide, 'id'> = {
  title: "Welcome to Peak Pulse",
  description: "Discover unique apparel where Nepali heritage meets contemporary design. (Default content)",
  imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&h=1080&q=80",
  altText: "Default Peak Pulse Hero Image",
  dataAiHint: "fashion abstract modern",
  ctaText: "Explore Collections",
  ctaLink: "/products",
  videoId: undefined,
};

const defaultArtisanalRootsSlideStructure: Omit<ArtisanalRootsSlide, 'id'> = {
  imageUrl: 'https://placehold.co/800x500.png?text=Artisan+Craft', 
  altText: 'Artisanal craft background', 
  dataAiHint: 'craft tradition texture'
};

const defaultSocialCommerceItemStructure: Omit<SocialCommerceItem, 'id'> = {
  imageUrl: 'https://placehold.co/400x400.png?text=Peak+Style', linkUrl: '#', altText: 'User style post', dataAiHint: 'social fashion user', displayOrder: 0
};

const defaultHomepageContentData: HomepageContent = {
  heroSlides: [defaultHeroSlideStructure],
  artisanalRoots: { 
    title: "Our Artisanal Roots (Default)", 
    description: "Default description about heritage and craftsmanship.",
    slides: [] 
  },
  socialCommerceItems: [],
  heroVideoId: undefined,
  heroImageUrl: undefined,
};

export async function GET() {
  const supabase = supabaseAdmin || fallbackSupabase; // Prefer admin for consistent view, fallback for public if needed
  if (!supabase) {
    console.error('[Public API Homepage GET] Supabase client is not initialized. Returning hardcoded fallback content.');
    return NextResponse.json({ ...defaultHomepageContentData, error: "Database client not configured. Check server logs and .env file for Supabase credentials." });
  }
  const clientType = supabase === supabaseAdmin ? "ADMIN client (service_role)" : "PUBLIC client";
  console.log(`[Public API Homepage GET] Request to fetch content from Supabase. Key: ${HOMEPAGE_CONFIG_KEY}. Using ${clientType}`);
  
  try {
    const { data, error } = await supabase
      .from('site_configurations')
      .select('value')
      .eq('config_key', HOMEPAGE_CONFIG_KEY)
      .maybeSingle();

    if (error) {
      console.error(`[Public API Homepage GET] Supabase error fetching for ${HOMEPAGE_CONFIG_KEY}:`, error);
      return NextResponse.json({ ...defaultHomepageContentData, error: `Failed to load content. Supabase: ${error.message}`, rawSupabaseError: error }, { status: 500 });
    }

    if (data && data.value) {
      console.log(`[Public API Homepage GET] Successfully fetched content for ${HOMEPAGE_CONFIG_KEY}.`);
      const dbContent = data.value as Partial<HomepageContent>;
      const artisanalRootsData = dbContent.artisanalRoots || defaultHomepageContentData.artisanalRoots!;
      
      const responseData: HomepageContent = {
        heroSlides: (Array.isArray(dbContent.heroSlides) && dbContent.heroSlides.length > 0 
          ? dbContent.heroSlides.map((slide: Partial<HeroSlide>, index: number) => ({ ...defaultHeroSlideStructure, ...slide, id: slide.id || `hs-pub-${Date.now()}-${index}` })) 
          : [defaultHeroSlideStructure]),
        artisanalRoots: {
          title: artisanalRootsData.title || defaultHomepageContentData.artisanalRoots!.title,
          description: artisanalRootsData.description || defaultHomepageContentData.artisanalRoots!.description,
          slides: (Array.isArray(artisanalRootsData.slides) ? artisanalRootsData.slides : []).map(
            (slide: Partial<ArtisanalRootsSlide>, index: number) => ({
              ...defaultArtisanalRootsSlideStructure, ...slide, id: slide.id || `ars-pub-${Date.now()}-${index}`
            })
          )
        },
        socialCommerceItems: (Array.isArray(dbContent.socialCommerceItems) 
          ? dbContent.socialCommerceItems.map((item: Partial<SocialCommerceItem>, index: number) => ({ 
              ...defaultSocialCommerceItemStructure, ...item, id: item.id || `scs-pub-${Date.now()}-${index}`
            }))
          : defaultHomepageContentData.socialCommerceItems!
        ).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)),
        heroVideoId: dbContent.heroVideoId === null ? undefined : dbContent.heroVideoId,
        heroImageUrl: dbContent.heroImageUrl === null ? undefined : dbContent.heroImageUrl,
      };
      return NextResponse.json(responseData);
    } else {
      console.warn(`[Public API Homepage GET] No content found for ${HOMEPAGE_CONFIG_KEY}. Returning default structure.`);
      return NextResponse.json(defaultHomepageContentData);
    }
  } catch (e: any) {
    console.error(`[Public API Homepage GET] UNHANDLED EXCEPTION fetching content for ${HOMEPAGE_CONFIG_KEY}:`, e);
    return NextResponse.json({ ...defaultHomepageContentData, error: `Server error: ${e.message}` }, { status: 500 });
  }
}
