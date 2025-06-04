
// /src/app/api/content/homepage/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase as fallbackSupabase } from '../../../../lib/supabaseClient.ts'; // Use the public client
import type { HomepageContent, HeroSlide, SocialCommerceItem, ArtisanalRootsSlide } from '@/types';

export const dynamic = 'force-dynamic';
const HOMEPAGE_CONFIG_KEY = 'homepageContent';

const defaultHeroSlideStructure: Omit<HeroSlide, 'id'> = {
  title: "Peak Pulse Collection",
  description: "Experience unique Nepali craftsmanship.",
  imageUrl: undefined,
  videoId: undefined,
  videoAutoplay: true, // Default added
  audioUrl: undefined,
  altText: "Hero image",
  dataAiHint: "fashion model style",
  ctaText: "Shop Now",
  ctaLink: "/products",
  ctaButtonVariant: "default",
  ctaButtonCustomBgColor: undefined,
  ctaButtonCustomTextColor: undefined,
  ctaButtonClassName: undefined,
  duration: 7000,
  displayOrder: 0,
  filterOverlay: undefined,
  youtubeAuthorName: undefined,
  youtubeAuthorLink: undefined,
};

const defaultHomepageContentData: HomepageContent = {
  heroSlides: [{ ...defaultHeroSlideStructure, id: `hs-default-fallback-${Date.now()}` }],
  artisanalRoots: {
    title: "Our Artisanal Roots (Default)",
    description: "Default description about craftsmanship.",
    slides: [],
  },
  socialCommerceItems: [],
  heroVideoId: undefined,
  heroImageUrl: undefined,
  promotionalPostsSection: {
    enabled: false,
    title: "Special Offers",
    maxItems: 3,
    autoplay: true,
    delay: 5000,
    showArrows: true,
    showDots: true,
  },
};

export async function GET() {
  console.log(`[API /api/content/homepage GET] Request received for key: ${HOMEPAGE_CONFIG_KEY}.`);

  const supabaseClientToUse = supabaseAdmin || fallbackSupabase;
  const clientTypeForLog = supabaseAdmin ? "ADMIN client (service_role)" : "FALLBACK public client";


  if (!supabaseClientToUse) {
    const errorMsg = '[API /api/content/homepage GET] CRITICAL: Supabase client (admin or public) is not initialized.';
    console.error(errorMsg);
    return NextResponse.json({
        ...defaultHomepageContentData,
        error: "Database client not configured on server.",
        rawSupabaseError: { message: 'Supabase client not initialized on server for GET. Check server logs and environment variables.' }
    }, { status: 503 });
  }
  console.log(`[API /api/content/homepage GET] Using ${clientTypeForLog}.`);


  try {
    const { data, error: dbError } = await supabaseClientToUse
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
      try { // Added try-catch block for data processing
        const dbContent = data.value as Partial<HomepageContent>;
        console.log(`[API /api/content/homepage GET] Successfully fetched content for ${HOMEPAGE_CONFIG_KEY}.`);

        if (Array.isArray(dbContent.heroSlides)) {
          finalHeroSlides = dbContent.heroSlides.map((slideFromDb: Partial<HeroSlide>, index: number) => {
            return {
              id: slideFromDb.id || `hs-db-${Date.now()}-${index}`,
              title: slideFromDb.title || defaultHeroSlideStructure.title,
              description: slideFromDb.description || defaultHeroSlideStructure.description,
              imageUrl: (slideFromDb.imageUrl === null || slideFromDb.imageUrl === '') ? undefined : (slideFromDb.imageUrl || defaultHeroSlideStructure.imageUrl),
              videoId: (slideFromDb.videoId === null || slideFromDb.videoId === '') ? undefined : (slideFromDb.videoId || defaultHeroSlideStructure.videoId),
              videoAutoplay: slideFromDb.videoAutoplay === undefined ? defaultHeroSlideStructure.videoAutoplay : slideFromDb.videoAutoplay,
              audioUrl: (slideFromDb.audioUrl === null || slideFromDb.audioUrl === '') ? undefined : (slideFromDb.audioUrl || defaultHeroSlideStructure.audioUrl),
              altText: slideFromDb.altText || defaultHeroSlideStructure.altText,
              dataAiHint: slideFromDb.dataAiHint || defaultHeroSlideStructure.dataAiHint,
              ctaText: slideFromDb.ctaText || defaultHeroSlideStructure.ctaText,
              ctaLink: slideFromDb.ctaLink || defaultHeroSlideStructure.ctaLink,
              ctaButtonVariant: slideFromDb.ctaButtonVariant || defaultHeroSlideStructure.ctaButtonVariant,
              ctaButtonCustomBgColor: slideFromDb.ctaButtonCustomBgColor || defaultHeroSlideStructure.ctaButtonCustomBgColor,
              ctaButtonCustomTextColor: slideFromDb.ctaButtonCustomTextColor || defaultHeroSlideStructure.ctaButtonCustomTextColor,
              ctaButtonClassName: slideFromDb.ctaButtonClassName || defaultHeroSlideStructure.ctaButtonClassName,
              duration: (slideFromDb.duration !== undefined && slideFromDb.duration !== null && Number(slideFromDb.duration) >= 1000)
                          ? Number(slideFromDb.duration)
                          : defaultHeroSlideStructure.duration,
              displayOrder: slideFromDb.displayOrder !== undefined ? Number(slideFromDb.displayOrder) : (index * 10),
              filterOverlay: slideFromDb.filterOverlay || defaultHeroSlideStructure.filterOverlay,
              youtubeAuthorName: (slideFromDb.youtubeAuthorName === null || slideFromDb.youtubeAuthorName === '') ? undefined : (slideFromDb.youtubeAuthorName || defaultHeroSlideStructure.youtubeAuthorName),
              youtubeAuthorLink: (slideFromDb.youtubeAuthorLink === null || slideFromDb.youtubeAuthorLink === '') ? undefined : (slideFromDb.youtubeAuthorLink || defaultHeroSlideStructure.youtubeAuthorLink),
              _isPromo: slideFromDb._isPromo,
              _backgroundColor: slideFromDb._backgroundColor,
              _textColor: slideFromDb._textColor,
            };
          });
        } else {
          console.warn(`[API /api/content/homepage GET] dbContent.heroSlides is not an array or missing. Using global default slides.`);
          finalHeroSlides = defaultHomepageContentData.heroSlides!;
        }

        const artisanalRootsData = dbContent.artisanalRoots || defaultHomepageContentData.artisanalRoots!;
        const responseData: HomepageContent = {
          heroSlides: finalHeroSlides.length > 0 ? finalHeroSlides : defaultHomepageContentData.heroSlides!,
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
          heroVideoId: (dbContent.heroVideoId === null || dbContent.heroVideoId === '') ? undefined : (dbContent.heroVideoId || defaultHomepageContentData.heroVideoId),
          heroImageUrl: (dbContent.heroImageUrl === null || dbContent.heroImageUrl === '') ? undefined : (dbContent.heroImageUrl || defaultHomepageContentData.heroImageUrl),
          promotionalPostsSection: {
            enabled: dbContent.promotionalPostsSection?.enabled ?? defaultHomepageContentData.promotionalPostsSection!.enabled,
            title: dbContent.promotionalPostsSection?.title || defaultHomepageContentData.promotionalPostsSection!.title,
            maxItems: dbContent.promotionalPostsSection?.maxItems || defaultHomepageContentData.promotionalPostsSection!.maxItems,
            autoplay: dbContent.promotionalPostsSection?.autoplay === undefined ? defaultHomepageContentData.promotionalPostsSection!.autoplay : dbContent.promotionalPostsSection.autoplay,
            delay: dbContent.promotionalPostsSection?.delay || defaultHomepageContentData.promotionalPostsSection!.delay,
            showArrows: dbContent.promotionalPostsSection?.showArrows === undefined ? defaultHomepageContentData.promotionalPostsSection!.showArrows : dbContent.promotionalPostsSection.showArrows,
            showDots: dbContent.promotionalPostsSection?.showDots === undefined ? defaultHomepageContentData.promotionalPostsSection!.showDots : dbContent.promotionalPostsSection.showDots,
          }
        };
        console.log(`[API /api/content/homepage GET] Processed. Number of hero slides in response: ${responseData.heroSlides?.length}`);
        return NextResponse.json(responseData);
      } catch (processingError: any) {
        console.error(`[API /api/content/homepage GET] Error during data processing for ${HOMEPAGE_CONFIG_KEY}:`, processingError);
        return NextResponse.json({
          message: `Error processing homepage data after fetch: ${processingError.message}`,
          errorDetails: processingError.toString(),
          rawSupabaseError: { message: "Data processing error after successful fetch." }
        }, { status: 500 });
      }
    } else {
      console.warn(`[API /api/content/homepage GET] No content found or invalid format for ${HOMEPAGE_CONFIG_KEY} in Supabase. Returning default structure.`);
      return NextResponse.json(defaultHomepageContentData);
    }
  } catch (e: any) {
    console.error(`[API /api/content/homepage GET] UNHANDLED EXCEPTION fetching content for ${HOMEPAGE_CONFIG_KEY}:`, e);
    return NextResponse.json({
      message: `Server error processing homepage content request: ${e.message || 'Unknown error'}`,
      errorDetails: e.toString(),
      rawSupabaseError: { message: e.message, code: e.code || 'UNKNOWN_API_ERROR_HOMEPAGE_GET' }
    }, { status: 500 });
  }
}
