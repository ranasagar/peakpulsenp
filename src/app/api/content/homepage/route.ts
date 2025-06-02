
// /src/app/api/content/homepage/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient.ts'; // Use the public client
import type { HomepageContent, HeroSlide, SocialCommerceItem, ArtisanalRootsSlide } from '@/types';

export const dynamic = 'force-dynamic';
const HOMEPAGE_CONFIG_KEY = 'homepageContent';

// This is the default structure for an individual slide IF fields are missing from the DB slide.
// Critical fields like imageUrl and videoId are undefined here.
const defaultHeroSlideStructure: Omit<HeroSlide, 'id'> = {
  title: "Peak Pulse Collection",
  description: "Experience unique Nepali craftsmanship.",
  imageUrl: undefined,
  videoId: undefined,
  audioUrl: undefined,
  altText: "Hero image",
  dataAiHint: "fashion model style",
  ctaText: "Shop Now",
  ctaLink: "/products",
  duration: 7000,
  displayOrder: 0,
};

// This is the fallback for the ENTIRE homepage content if nothing is found in DB.
const defaultHomepageContentData: HomepageContent = {
  heroSlides: [{ ...defaultHeroSlideStructure, id: `hs-default-fallback-${Date.now()}` }], // One default slide if all else fails
  artisanalRoots: {
    title: "Our Artisanal Roots (Default)",
    description: "Default description about heritage and craftsmanship.",
    slides: [],
  },
  socialCommerceItems: [],
  heroVideoId: undefined, // Standalone fallback video
  heroImageUrl: undefined, // Standalone fallback image
  promotionalPostsSection: {
    enabled: false,
    title: "Special Offers",
    maxItems: 3,
  },
};

export async function GET() {
  console.log(`[API /api/content/homepage GET] Request received for key: ${HOMEPAGE_CONFIG_KEY}.`);

  if (!supabase) {
    const errorMsg = '[API /api/content/homepage GET] CRITICAL: Supabase client (public) is not initialized.';
    console.error(errorMsg);
    return NextResponse.json({
        ...defaultHomepageContentData,
        error: "Database client not configured on server.",
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

    let finalHeroSlides: HeroSlide[];

    if (data && data.value && typeof data.value === 'object') {
      const dbContent = data.value as Partial<HomepageContent>;
      console.log(`[API /api/content/homepage GET] Successfully fetched content for ${HOMEPAGE_CONFIG_KEY}. Raw DB heroSlides length: ${dbContent.heroSlides?.length}`);

      if (Array.isArray(dbContent.heroSlides)) {
        // If heroSlides exists in DB and is an array (even if empty)
        finalHeroSlides = dbContent.heroSlides.map((slideFromDb: Partial<HeroSlide>, index: number) => {
          return {
            id: slideFromDb.id || `hs-db-${Date.now()}-${index}`,
            title: slideFromDb.title || defaultHeroSlideStructure.title,
            description: slideFromDb.description || defaultHeroSlideStructure.description,
            imageUrl: (slideFromDb.imageUrl && slideFromDb.imageUrl.trim() !== "") ? slideFromDb.imageUrl.trim() : undefined,
            videoId: (slideFromDb.videoId && slideFromDb.videoId.trim() !== "") ? slideFromDb.videoId.trim() : undefined,
            audioUrl: (slideFromDb.audioUrl && slideFromDb.audioUrl.trim() !== "") ? slideFromDb.audioUrl.trim() : undefined,
            altText: slideFromDb.altText || defaultHeroSlideStructure.altText,
            dataAiHint: slideFromDb.dataAiHint || defaultHeroSlideStructure.dataAiHint,
            ctaText: slideFromDb.ctaText || defaultHeroSlideStructure.ctaText,
            ctaLink: slideFromDb.ctaLink || defaultHeroSlideStructure.ctaLink,
            duration: (slideFromDb.duration !== undefined && slideFromDb.duration !== null && Number(slideFromDb.duration) >= 1000)
                        ? Number(slideFromDb.duration)
                        : defaultHeroSlideStructure.duration,
            displayOrder: slideFromDb.displayOrder !== undefined ? Number(slideFromDb.displayOrder) : (index * 10),
            _isPromo: slideFromDb._isPromo,
            _backgroundColor: slideFromDb._backgroundColor,
            _textColor: slideFromDb._textColor,
          };
        });
      } else {
        // If heroSlides field is entirely missing or not an array in DB, use the global default.
        console.warn(`[API /api/content/homepage GET] dbContent.heroSlides is not an array or missing. Using global default slides.`);
        finalHeroSlides = defaultHomepageContentData.heroSlides!;
      }
      
      const artisanalRootsData = dbContent.artisanalRoots || defaultHomepageContentData.artisanalRoots!;
      const responseData: HomepageContent = {
        heroSlides: finalHeroSlides,
        artisanalRoots: {
          title: artisanalRootsData.title || defaultHomepageContentData.artisanalRoots!.title,
          description: artisanalRootsData.description || defaultHomepageContentData.artisanalRoots!.description,
          slides: (Array.isArray(artisanalRootsData.slides)
            ? artisanalRootsData.slides.map((slide: Partial<ArtisanalRootsSlide>, index: number) => ({ id: slide.id || `ars-db-${Date.now()}-${index}`, imageUrl: slide.imageUrl || '', altText: slide.altText || '', dataAiHint: slide.dataAiHint || '' }))
            : defaultHomepageContentData.artisanalRoots!.slides || []
          )
        },
        socialCommerceItems: (Array.isArray(dbContent.socialCommerceItems)
          ? dbContent.socialCommerceItems.map((item: Partial<SocialCommerceItem>, index: number) => ({ id: item.id || `scs-db-${Date.now()}-${index}`, imageUrl: item.imageUrl || '', linkUrl: item.linkUrl || '#', altText: item.altText || '', dataAiHint: item.dataAiHint || '', displayOrder: item.displayOrder || 0}))
          : defaultHomepageContentData.socialCommerceItems || []
        ).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)),
        heroVideoId: dbContent.heroVideoId === null ? undefined : (dbContent.heroVideoId || defaultHomepageContentData.heroVideoId),
        heroImageUrl: dbContent.heroImageUrl === null ? undefined : (dbContent.heroImageUrl || defaultHomepageContentData.heroImageUrl),
        promotionalPostsSection: {
          enabled: dbContent.promotionalPostsSection?.enabled ?? defaultHomepageContentData.promotionalPostsSection!.enabled,
          title: dbContent.promotionalPostsSection?.title || defaultHomepageContentData.promotionalPostsSection!.title,
          maxItems: dbContent.promotionalPostsSection?.maxItems || defaultHomepageContentData.promotionalPostsSection!.maxItems,
        }
      };
      console.log(`[API /api/content/homepage GET] Processed and returning data for admin form. Number of hero slides: ${responseData.heroSlides?.length}`);
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

