
// /src/app/api/admin/content/homepage/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase as fallbackSupabase } from '@/lib/supabaseClient'; // Import both
import type { HomepageContent, HeroSlide, SocialCommerceItem, ArtisanalRootsSlide } from '@/types';

export const dynamic = 'force-dynamic';
const HOMEPAGE_CONFIG_KEY = 'homepageContent';

const defaultHeroSlideStructure: Omit<HeroSlide, 'id'> = {
  title: "New Collection",
  description: "Discover the latest arrivals.",
  imageUrl: undefined,
  videoId: undefined,
  videoAutoplay: true, // Default added
  audioUrl: undefined,
  altText: "Hero image",
  dataAiHint: "fashion background",
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

const defaultArtisanalRootsSlideStructure: Omit<ArtisanalRootsSlide, 'id'> = {
  imageUrl: '', altText: 'Artisanal background image', dataAiHint: 'craft texture tradition'
};

const defaultSocialCommerceItemStructure: Omit<SocialCommerceItem, 'id'> = {
  imageUrl: 'https://placehold.co/400x400.png?text=Social+Post', linkUrl: '#', altText: 'Social media post', dataAiHint: 'social fashion user', displayOrder: 0
};

const defaultHomepageContentData: HomepageContent = {
  heroSlides: [{ ...defaultHeroSlideStructure, id: `hs-default-${Date.now()}` }],
  artisanalRoots: {
    title: "Our Artisanal Roots (Default)",
    description: "Default description about heritage and craftsmanship.",
    slides: [],
  },
  socialCommerceItems: [],
  heroVideoId: undefined,
  heroImageUrl: undefined,
  promotionalPostsSection: {
    enabled: true,
    title: "Special Offers",
    maxItems: 3,
    autoplay: true,
    delay: 5000,
    showArrows: true,
    showDots: true,
  },
};

// GET current homepage content for admin
export async function GET() {
  const supabaseClientToUse = supabaseAdmin;

  if (!supabaseClientToUse) {
    const errorMessage = '[Admin API Homepage GET] CRITICAL: Supabase ADMIN client (service_role) is not initialized. Cannot fetch settings. Check SUPABASE_SERVICE_ROLE_KEY in .env and server restart.';
    console.error(errorMessage);
    return NextResponse.json({
      message: 'Database admin client not configured. Cannot fetch settings. Contact administrator.',
      rawSupabaseError: { message: errorMessage }
    }, { status: 503 });
  }
  console.log(`[Admin API Homepage GET] Attempting to fetch content. Key: ${HOMEPAGE_CONFIG_KEY}. Using ADMIN client (service_role).`);

  try {
    const { data, error: dbError } = await supabaseClientToUse
      .from('site_configurations')
      .select('value')
      .eq('config_key', HOMEPAGE_CONFIG_KEY)
      .maybeSingle();

    if (dbError) {
      console.error(`[Admin API Homepage GET] Supabase error fetching for ${HOMEPAGE_CONFIG_KEY}:`, JSON.stringify(dbError, null, 2));
      return NextResponse.json({
        message: `Failed to load homepage content from database. Supabase Error: ${dbError.message}`,
        rawSupabaseError: { message: dbError.message, details: dbError.details, hint: dbError.hint, code: dbError.code }
      }, { status: 500 });
    }

    if (data && data.value && typeof data.value === 'object') {
      const dbContent = data.value as Partial<HomepageContent>;
      console.log(`[Admin API Homepage GET] Successfully fetched content for ${HOMEPAGE_CONFIG_KEY}. Raw DB value:`, JSON.stringify(dbContent).substring(0, 500) + "...");

      const artisanalRootsData = dbContent.artisanalRoots || defaultHomepageContentData.artisanalRoots!;

      const responseData: HomepageContent = {
        heroSlides: (Array.isArray(dbContent.heroSlides) ? dbContent.heroSlides : defaultHomepageContentData.heroSlides!).map(
          (slide: Partial<HeroSlide>, index: number) => ({
            ...defaultHeroSlideStructure, ...slide, id: slide.id || `hs-db-${Date.now()}-${index}`,
            videoAutoplay: slide.videoAutoplay === undefined ? defaultHeroSlideStructure.videoAutoplay : slide.videoAutoplay,
            audioUrl: slide.audioUrl || undefined,
            duration: slide.duration === undefined ? null : Number(slide.duration) || defaultHeroSlideStructure.duration,
            displayOrder: slide.displayOrder === undefined ? index * 10 : Number(slide.displayOrder) || 0,
            filterOverlay: slide.filterOverlay || undefined,
            youtubeAuthorName: slide.youtubeAuthorName || undefined,
            youtubeAuthorLink: slide.youtubeAuthorLink || undefined,
            ctaButtonVariant: slide.ctaButtonVariant || defaultHeroSlideStructure.ctaButtonVariant,
            ctaButtonCustomBgColor: slide.ctaButtonCustomBgColor || defaultHeroSlideStructure.ctaButtonCustomBgColor,
            ctaButtonCustomTextColor: slide.ctaButtonCustomTextColor || defaultHeroSlideStructure.ctaButtonCustomTextColor,
            ctaButtonClassName: slide.ctaButtonClassName || defaultHeroSlideStructure.ctaButtonClassName,
          })
        ),
        artisanalRoots: {
          title: artisanalRootsData.title || defaultHomepageContentData.artisanalRoots!.title,
          description: artisanalRootsData.description || defaultHomepageContentData.artisanalRoots!.description,
          slides: (Array.isArray(artisanalRootsData.slides) ? artisanalRootsData.slides : defaultHomepageContentData.artisanalRoots!.slides || []).map(
            (slide: Partial<ArtisanalRootsSlide>, index: number) => ({
              ...defaultArtisanalRootsSlideStructure, ...slide, id: slide.id || `ars-db-${Date.now()}-${index}`
            })
          )
        },
        socialCommerceItems: (Array.isArray(dbContent.socialCommerceItems) ? dbContent.socialCommerceItems : defaultHomepageContentData.socialCommerceItems || [])
          .map((item: Partial<SocialCommerceItem>, index: number) => ({
            ...defaultSocialCommerceItemStructure, ...item, id: item.id || `scs-db-${Date.now()}-${index}`
          }))
          .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)),
        heroVideoId: dbContent.heroVideoId === null ? undefined : (dbContent.heroVideoId || defaultHomepageContentData.heroVideoId),
        heroImageUrl: dbContent.heroImageUrl === null ? undefined : (dbContent.heroImageUrl || defaultHomepageContentData.heroImageUrl),
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
      console.log(`[Admin API Homepage GET] Processed and returning data for admin form.`);
      return NextResponse.json(responseData);
    } else {
      console.log(`[Admin API Homepage GET] No content found for ${HOMEPAGE_CONFIG_KEY} in Supabase, returning default structure for admin form.`);
      return NextResponse.json(defaultHomepageContentData);
    }
  } catch (e: any) {
    console.error(`[Admin API Homepage GET] UNHANDLED EXCEPTION fetching content for ${HOMEPAGE_CONFIG_KEY}:`, e);
    return NextResponse.json({
      message: `Server error processing request for homepage content: ${e.message}`,
      errorDetails: e.toString(),
      rawSupabaseError: { message: e.message, code: e.code }
    }, { status: 500 });
  }
}

// POST to update homepage content
export async function POST(request: NextRequest) {
  const clientForWrite = supabaseAdmin;
  if (!clientForWrite) {
    const errorMessage = '[Admin API Homepage POST] CRITICAL: Supabase ADMIN client (service_role) is not initialized. Cannot save settings. Check SUPABASE_SERVICE_ROLE_KEY in .env and server restart.';
    console.error(errorMessage);
    return NextResponse.json({
      message: 'Database admin client not configured. Cannot save settings. Contact administrator.',
      rawSupabaseError: { message: errorMessage }
    }, { status: 503 });
  }
  console.log(`[Admin API Homepage POST] Request to update content. Key: ${HOMEPAGE_CONFIG_KEY}. Using ADMIN client (service_role).`);

  let newDataFromRequest: Partial<HomepageContent>;
  try {
    newDataFromRequest = await request.json();
  } catch (e: any) {
    console.error(`[Admin API Homepage POST] Error parsing request JSON for ${HOMEPAGE_CONFIG_KEY}:`, e.message);
    return NextResponse.json({ message: 'Invalid JSON in request body.', errorDetails: e.message }, { status: 400 });
  }

  const dataToStore: HomepageContent = {
    heroSlides: (newDataFromRequest.heroSlides || []).map((slide, index) => ({
      ...slide,
      id: slide.id || `hs-new-${Date.now()}-${index}`,
      title: slide.title || '',
      description: slide.description || '',
      imageUrl: slide.imageUrl || undefined,
      videoId: slide.videoId || undefined,
      videoAutoplay: slide.videoAutoplay === undefined ? true : slide.videoAutoplay,
      audioUrl: slide.audioUrl || undefined,
      altText: slide.altText || '',
      dataAiHint: slide.dataAiHint || '',
      ctaText: slide.ctaText || '',
      ctaLink: slide.ctaLink || '',
      ctaButtonVariant: slide.ctaButtonVariant || undefined,
      ctaButtonCustomBgColor: slide.ctaButtonCustomBgColor || undefined,
      ctaButtonCustomTextColor: slide.ctaButtonCustomTextColor || undefined,
      ctaButtonClassName: slide.ctaButtonClassName || undefined,
      duration: slide.duration === undefined || slide.duration === null || Number(slide.duration) < 1000 ? defaultHeroSlideStructure.duration : Number(slide.duration),
      displayOrder: slide.displayOrder === undefined ? index * 10 : Number(slide.displayOrder) || 0,
      filterOverlay: slide.filterOverlay || undefined,
      youtubeAuthorName: slide.youtubeAuthorName || undefined,
      youtubeAuthorLink: slide.youtubeAuthorLink || undefined,
    })),
    artisanalRoots: {
      title: newDataFromRequest.artisanalRoots?.title || defaultHomepageContentData.artisanalRoots!.title,
      description: newDataFromRequest.artisanalRoots?.description || defaultHomepageContentData.artisanalRoots!.description,
      slides: (newDataFromRequest.artisanalRoots?.slides || []).map((slide, index) => ({
        ...slide,
        id: slide.id || `ars-new-${Date.now()}-${index}`,
      }))
    },
    socialCommerceItems: (newDataFromRequest.socialCommerceItems || [])
      .map((item, index) => ({
        ...item,
        id: item.id || `scs-new-${Date.now()}-${index}`,
        displayOrder: Number(item.displayOrder) || 0,
      }))
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)),
    heroVideoId: newDataFromRequest.heroVideoId || undefined,
    heroImageUrl: newDataFromRequest.heroImageUrl || undefined,
    promotionalPostsSection: {
      enabled: newDataFromRequest.promotionalPostsSection?.enabled ?? defaultHomepageContentData.promotionalPostsSection!.enabled,
      title: newDataFromRequest.promotionalPostsSection?.title || defaultHomepageContentData.promotionalPostsSection!.title,
      maxItems: newDataFromRequest.promotionalPostsSection?.maxItems || defaultHomepageContentData.promotionalPostsSection!.maxItems,
      autoplay: newDataFromRequest.promotionalPostsSection?.autoplay === undefined ? defaultHomepageContentData.promotionalPostsSection!.autoplay : newDataFromRequest.promotionalPostsSection.autoplay,
      delay: newDataFromRequest.promotionalPostsSection?.delay || defaultHomepageContentData.promotionalPostsSection!.delay,
      showArrows: newDataFromRequest.promotionalPostsSection?.showArrows === undefined ? defaultHomepageContentData.promotionalPostsSection!.showArrows : newDataFromRequest.promotionalPostsSection.showArrows,
      showDots: newDataFromRequest.promotionalPostsSection?.showDots === undefined ? defaultHomepageContentData.promotionalPostsSection!.showDots : newDataFromRequest.promotionalPostsSection.showDots,
    }
  };

  try {
    const { data: existingData, error: selectError } = await clientForWrite
      .from('site_configurations')
      .select('config_key')
      .eq('config_key', HOMEPAGE_CONFIG_KEY)
      .maybeSingle();

    if (selectError) {
      console.error(`[Admin API Homepage POST] Supabase error checking existing config for ${HOMEPAGE_CONFIG_KEY}:`, JSON.stringify(selectError, null, 2));
      throw selectError;
    }

    let dbOperationError;
    if (existingData) {
      console.log(`[Admin API Homepage POST] Updating existing entry for ${HOMEPAGE_CONFIG_KEY}`);
      const { error } = await clientForWrite
        .from('site_configurations')
        .update({ value: dataToStore as any, updated_at: new Date().toISOString() })
        .eq('config_key', HOMEPAGE_CONFIG_KEY);
      dbOperationError = error;
    } else {
      console.log(`[Admin API Homepage POST] Inserting new entry for ${HOMEPAGE_CONFIG_KEY}`);
      const { error } = await clientForWrite
        .from('site_configurations')
        .insert({ config_key: HOMEPAGE_CONFIG_KEY, value: dataToStore as any, updated_at: new Date().toISOString() });
      dbOperationError = error;
    }

    if (dbOperationError) {
      console.error(`[Admin API Homepage POST] Supabase error during save for ${HOMEPAGE_CONFIG_KEY}:`, JSON.stringify(dbOperationError, null, 2));
      return NextResponse.json({
        message: `Failed to save homepage content. Supabase Error: ${dbOperationError.message}`,
        rawSupabaseError: { message: dbOperationError.message, details: dbOperationError.details, hint: dbOperationError.hint, code: dbOperationError.code }
      }, { status: 500 });
    }

    return NextResponse.json({ message: 'Homepage content updated successfully.' });

  } catch (e: any) {
    console.error(`[Admin API Homepage POST] UNHANDLED EXCEPTION updating content for ${HOMEPAGE_CONFIG_KEY}:`, e);
    const errorMessage = e.message || 'An unexpected server error occurred.';
    return NextResponse.json({
      message: `Critical server error processing your request to save homepage content: ${errorMessage}`,
      errorDetails: e.toString(),
      rawSupabaseError: { message: e.message, code: e.code, details: e.details, hint: e.hint }
    }, { status: 500 });
  }
}

```