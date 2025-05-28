
// /src/app/api/content/homepage/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase as fallbackSupabase } from '@/lib/supabaseClient';
import type { HomepageContent, HeroSlide, SocialCommerceItem, ArtisanalRootsSlide } from '@/types';

export const dynamic = 'force-dynamic';
const HOMEPAGE_CONFIG_KEY = 'homepageContent';

const defaultHeroSlideStructure: Omit<HeroSlide, 'id'> = {
  title: "Welcome to Peak Pulse",
  description: "Discover unique apparel where Nepali heritage meets contemporary design. (Default fallback content)",
  imageUrl: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&h=1080&q=80", // A different default
  altText: "Default Peak Pulse Hero Image",
  dataAiHint: "fashion model lifestyle",
  ctaText: "Explore Collections",
  ctaLink: "/products",
  videoId: undefined,
};

const defaultArtisanalRootsSlideStructure: Omit<ArtisanalRootsSlide, 'id'> = {
  imageUrl: 'https://placehold.co/800x500.png?text=Default+Artisan+Craft', 
  altText: 'Default artisanal craft background', 
  dataAiHint: 'default craft texture'
};

const defaultSocialCommerceItemStructure: Omit<SocialCommerceItem, 'id'> = {
  imageUrl: 'https://placehold.co/400x400.png?text=Default+Style', linkUrl: '#', altText: 'Default user style post', dataAiHint: 'default social fashion', displayOrder: 0
};

const defaultHomepageContentData: HomepageContent = {
  heroSlides: [{...defaultHeroSlideStructure, id: 'fallback-hero-default'}],
  artisanalRoots: { 
    title: "Our Artisanal Roots (Default Fallback)", 
    description: "Default description about heritage and craftsmanship from API fallback.",
    slides: [] 
  },
  socialCommerceItems: [],
  heroVideoId: undefined,
  heroImageUrl: undefined,
};

export async function GET() {
  console.log(`[Public API Homepage GET] Request received for key: ${HOMEPAGE_CONFIG_KEY}.`);
  try {
    const client = supabaseAdmin || fallbackSupabase;
    if (!client) {
      const errorMsg = '[Public API Homepage GET] Supabase client (admin or public) is not initialized. This is a critical config issue.';
      console.error(errorMsg);
      return NextResponse.json({ 
        ...defaultHomepageContentData, 
        error: "Database client not configured on server. Check server logs and .env file.",
        rawSupabaseError: { message: 'Supabase client not initialized on server for GET.' }
      }, { status: 503 });
    }
    const clientType = client === supabaseAdmin ? "ADMIN client (service_role)" : "FALLBACK public client";
    console.log(`[Public API Homepage GET] Using ${clientType} to fetch content.`);

    const { data, error } = await client
      .from('site_configurations')
      .select('value')
      .eq('config_key', HOMEPAGE_CONFIG_KEY)
      .maybeSingle();

    if (error) {
      console.error(`[Public API Homepage GET] Supabase error fetching for ${HOMEPAGE_CONFIG_KEY}:`, JSON.stringify(error, null, 2));
      return NextResponse.json({ 
        ...defaultHomepageContentData, 
        error: `Failed to load homepage content from database. Supabase: ${error.message}`, 
        rawSupabaseError: { message: error.message, details: error.details, hint: error.hint, code: error.code } 
      }, { status: 500 });
    }

    if (data && data.value && typeof data.value === 'object') {
      const dbContent = data.value as Partial<HomepageContent>;
      const artisanalRootsData = dbContent.artisanalRoots || defaultHomepageContentData.artisanalRoots!;
      
      const responseData: HomepageContent = {
        heroSlides: (Array.isArray(dbContent.heroSlides) && dbContent.heroSlides.length > 0 
          ? dbContent.heroSlides.map((slide: Partial<HeroSlide>, index: number) => ({ ...defaultHeroSlideStructure, ...slide, id: slide.id || `hs-db-${Date.now()}-${index}` })) 
          : [{...defaultHeroSlideStructure, id: `hs-default-${Date.now()}`}]), // Ensure at least one default slide
        artisanalRoots: {
          title: artisanalRootsData.title || defaultHomepageContentData.artisanalRoots!.title,
          description: artisanalRootsData.description || defaultHomepageContentData.artisanalRoots!.description,
          slides: (Array.isArray(artisanalRootsData.slides) ? artisanalRootsData.slides : []).map(
            (slide: Partial<ArtisanalRootsSlide>, index: number) => ({
              ...defaultArtisanalRootsSlideStructure, ...slide, id: slide.id || `ars-db-${Date.now()}-${index}`
            })
          )
        },
        socialCommerceItems: (Array.isArray(dbContent.socialCommerceItems) 
          ? dbContent.socialCommerceItems.map((item: Partial<SocialCommerceItem>, index: number) => ({ 
              ...defaultSocialCommerceItemStructure, ...item, id: item.id || `scs-db-${Date.now()}-${index}`
            }))
          : defaultHomepageContentData.socialCommerceItems!
        ).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)),
        heroVideoId: dbContent.heroVideoId === null ? undefined : dbContent.heroVideoId,
        heroImageUrl: dbContent.heroImageUrl === null ? undefined : dbContent.heroImageUrl,
      };
      console.log(`[Public API Homepage GET] Successfully fetched and processed content for ${HOMEPAGE_CONFIG_KEY}.`);
      return NextResponse.json(responseData);
    } else {
      console.warn(`[Public API Homepage GET] No content found or invalid format for ${HOMEPAGE_CONFIG_KEY} in Supabase. Returning default structure.`);
      return NextResponse.json(defaultHomepageContentData);
    }
  } catch (e: any) {
    // Catch any unexpected errors during the API route execution
    console.error(`[Public API Homepage GET] CRITICAL UNHANDLED EXCEPTION fetching content for ${HOMEPAGE_CONFIG_KEY}:`, e);
    return NextResponse.json({ 
      ...defaultHomepageContentData, 
      error: `Server error processing homepage content request: ${e.message}`,
      rawSupabaseError: { message: e.message, code: e.code || 'UNKNOWN_API_ERROR' }
    }, { status: 500 });
  }
}
