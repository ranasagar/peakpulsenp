
// /src/app/api/content/homepage/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient.ts'; // Use the public client
import type { HomepageContent, HeroSlide, SocialCommerceItem, ArtisanalRootsSlide } from '@/types';

export const dynamic = 'force-dynamic';
const HOMEPAGE_CONFIG_KEY = 'homepageContent';

const defaultHeroSlideStructure: Omit<HeroSlide, 'id'> = {
  title: "Welcome to Peak Pulse",
  description: "Discover unique apparel where Nepali heritage meets contemporary design. (Default fallback content)",
  imageUrl: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&h=1080&q=80",
  altText: "Default Peak Pulse Hero Image",
  dataAiHint: "fashion model fallback",
  ctaText: "Explore Collections",
  ctaLink: "/products",
  videoId: undefined,
  audioUrl: undefined, 
  duration: 7000, 
  displayOrder: 0, // Added default displayOrder
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
  heroSlides: [{...defaultHeroSlideStructure, id: `hs-default-${Date.now()}`}],
  artisanalRoots: {
    title: "Our Artisanal Roots (Default)",
    description: "Default description about heritage and craftsmanship.",
    slides: [],
  },
  socialCommerceItems: [],
  heroVideoId: undefined,
  heroImageUrl: undefined,
  promotionalPostsSection: {
    enabled: false,
    title: "Special Offers",
    maxItems: 3,
  },
};

export async function GET() {
  console.log(`[API /api/content/homepage GET] Request received for key: ${HOMEPAGE_CONFIG_KEY}.`);

  if (!supabase) {
    const errorMsg = '[API /api/content/homepage GET] CRITICAL: Supabase client (public) is not initialized. Check environment variables and server restart.';
    console.error(errorMsg);
    return NextResponse.json({
        ...defaultHomepageContentData, 
        error: "Database client not configured on server. Please check server logs and .env file for NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
        rawSupabaseError: { message: 'Supabase public client not initialized.' }
    }, { status: 503 }); 
  }

  try {
    const { data, error: dbError } = await supabase
      .from('site_configurations')
      .select('value')
      .eq('config_key', HOMEPAGE_CONFIG_KEY)
      .maybeSingle();

    if (dbError) {
      console.error(`[API /api/content/homepage GET] Supabase error fetching for ${HOMEPAGE_CONFIG_KEY}:`, dbError);
      return NextResponse.json({
        ...defaultHomepageContentData,
        error: `Failed to load homepage content from database. Supabase: ${dbError.message}`,
        rawSupabaseError: { message: dbError.message, details: dbError.details, hint: dbError.hint, code: dbError.code }
      }, { status: 500 });
    }

    if (data && data.value && typeof data.value === 'object') {
      const dbContent = data.value as Partial<HomepageContent>;
      
      const artisanalRootsData = dbContent.artisanalRoots || defaultHomepageContentData.artisanalRoots!;
      
      const responseData: HomepageContent = {
        heroSlides: (Array.isArray(dbContent.heroSlides) && dbContent.heroSlides.length > 0 
          ? dbContent.heroSlides.map((slide: Partial<HeroSlide>, index: number) => ({ 
              ...defaultHeroSlideStructure, 
              ...slide, 
              id: slide.id || `hs-db-${Date.now()}-${index}`,
              audioUrl: slide.audioUrl || undefined, 
              duration: slide.duration === undefined ? defaultHeroSlideStructure.duration : Number(slide.duration) || defaultHeroSlideStructure.duration,
              displayOrder: slide.displayOrder === undefined ? index * 10 : Number(slide.displayOrder) || 0, // Handle displayOrder
            }))
          : defaultHomepageContentData.heroSlides
        ),
        artisanalRoots: {
          title: artisanalRootsData.title || defaultHomepageContentData.artisanalRoots!.title,
          description: artisanalRootsData.description || defaultHomepageContentData.artisanalRoots!.description,
          slides: (Array.isArray(artisanalRootsData.slides)
            ? artisanalRootsData.slides.map((slide: Partial<ArtisanalRootsSlide>, index: number) => ({ ...defaultArtisanalRootsSlideStructure, ...slide, id: slide.id || `ars-db-${Date.now()}-${index}`}))
            : defaultHomepageContentData.artisanalRoots!.slides || []
          )
        },
        socialCommerceItems: (Array.isArray(dbContent.socialCommerceItems)
          ? dbContent.socialCommerceItems.map((item: Partial<SocialCommerceItem>, index: number) => ({ ...defaultSocialCommerceItemStructure, ...item, id: item.id || `scs-db-${Date.now()}-${index}`}))
          : defaultHomepageContentData.socialCommerceItems || []
        ).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)),
        heroVideoId: dbContent.heroVideoId === null ? undefined : dbContent.heroVideoId,
        heroImageUrl: dbContent.heroImageUrl === null ? undefined : dbContent.heroImageUrl,
        promotionalPostsSection: {
          enabled: dbContent.promotionalPostsSection?.enabled ?? defaultHomepageContentData.promotionalPostsSection!.enabled,
          title: dbContent.promotionalPostsSection?.title || defaultHomepageContentData.promotionalPostsSection!.title,
          maxItems: dbContent.promotionalPostsSection?.maxItems || defaultHomepageContentData.promotionalPostsSection!.maxItems,
        }
      };
      console.log(`[API /api/content/homepage GET] Successfully fetched and processed content for ${HOMEPAGE_CONFIG_KEY}.`);
      return NextResponse.json(responseData);
    } else {
      console.warn(`[API /api/content/homepage GET] No content found or invalid format for ${HOMEPAGE_CONFIG_KEY} in Supabase. Returning default structure.`);
      return NextResponse.json(defaultHomepageContentData); 
    }
  } catch (e: any) {
    console.error(`[API /api/content/homepage GET] UNHANDLED EXCEPTION fetching content for ${HOMEPAGE_CONFIG_KEY}:`, e);
    return NextResponse.json({
      ...defaultHomepageContentData,
      error: `Server error processing homepage content request: ${e.message}`,
      rawSupabaseError: { message: e.message, code: e.code || 'UNKNOWN_API_ERROR_HOMEPAGE_GET' }
    }, { status: 500 });
  }
}
