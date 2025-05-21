
// /src/app/api/admin/content/homepage/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '../../../../../lib/supabaseClient.ts'; // Relative path
import type { HomepageContent, HeroSlide, SocialCommerceItem } from '@/types';

export const dynamic = 'force-dynamic';

const HOMEPAGE_CONFIG_KEY = 'homepageContent';

const defaultHomepageContentData: HomepageContent = {
  heroSlides: [{ id: 'default-slide-api', title: "Welcome", description: "Default description", ctaText: "Explore", ctaLink: "/products", imageUrl: "https://placehold.co/1920x1080.png?text=Default+Hero", altText:"Default Hero Image", dataAiHint:"abstract background" }],
  artisanalRoots: { title: "Our Artisanal Roots (Default)", description: "Default description for artisanal roots." },
  socialCommerceItems: [],
  heroVideoId: undefined,
  heroImageUrl: undefined,
};

// GET current homepage content for admin or public
export async function GET() {
  console.log(`[API /api/content/homepage] GET request received. Fetching from Supabase for key: ${HOMEPAGE_CONFIG_KEY}`);
  if (!supabase) {
    console.error('[API /api/content/homepage] Supabase client is not initialized. Returning hardcoded fallback content.');
    return NextResponse.json({ ...defaultHomepageContentData, error: "Database client not configured." });
  }

  try {
    const { data, error } = await supabase
      .from('site_configurations')
      .select('value')
      .eq('config_key', HOMEPAGE_CONFIG_KEY)
      .maybeSingle();

    if (error) {
      console.error(`[API /api/content/homepage] Supabase error fetching content for ${HOMEPAGE_CONFIG_KEY}:`, error);
      return NextResponse.json({ ...defaultHomepageContentData, error: `Failed to load content from database. ${error.message}` }, { status: 500 });
    }

    if (data && data.value) {
      console.log(`[API /api/content/homepage] Successfully fetched content for ${HOMEPAGE_CONFIG_KEY}.`);
      const dbContent = data.value as Partial<HomepageContent>;
      // Ensure all parts of HomepageContent are present, using fallbacks if necessary
      const responseData: HomepageContent = {
        heroSlides: (dbContent.heroSlides && dbContent.heroSlides.length > 0)
          ? dbContent.heroSlides.map((slide: Partial<HeroSlide>, index: number) => ({
              id: slide.id || defaultHomepageContentData.heroSlides![0].id + `-${index}`,
              title: slide.title || defaultHomepageContentData.heroSlides![0].title,
              description: slide.description || defaultHomepageContentData.heroSlides![0].description,
              imageUrl: slide.imageUrl || defaultHomepageContentData.heroSlides![0].imageUrl,
              videoId: slide.videoId === null ? undefined : slide.videoId,
              altText: slide.altText || defaultHomepageContentData.heroSlides![0].altText,
              dataAiHint: slide.dataAiHint || defaultHomepageContentData.heroSlides![0].dataAiHint,
              ctaText: slide.ctaText || defaultHomepageContentData.heroSlides![0].ctaText,
              ctaLink: slide.ctaLink || defaultHomepageContentData.heroSlides![0].ctaLink,
          }))
          : defaultHomepageContentData.heroSlides!,
        artisanalRoots: { 
            title: dbContent.artisanalRoots?.title || defaultHomepageContentData.artisanalRoots!.title,
            description: dbContent.artisanalRoots?.description || defaultHomepageContentData.artisanalRoots!.description,
        },
        socialCommerceItems: (dbContent.socialCommerceItems && dbContent.socialCommerceItems.length > 0)
          ? dbContent.socialCommerceItems.map((item: Partial<SocialCommerceItem>, index: number) => ({
              id: item.id || `social-api-${Date.now()}-${index}`,
              imageUrl: item.imageUrl || "https://placehold.co/400x400.png",
              linkUrl: item.linkUrl || "#",
              altText: item.altText || "Social post",
              dataAiHint: item.dataAiHint || "social fashion",
          }))
          : defaultHomepageContentData.socialCommerceItems!,
        heroVideoId: dbContent.heroVideoId === null ? undefined : dbContent.heroVideoId,
        heroImageUrl: dbContent.heroImageUrl === null ? undefined : dbContent.heroImageUrl,
      };
      return NextResponse.json(responseData);
    } else {
      console.warn(`[API /api/content/homepage] No content found for ${HOMEPAGE_CONFIG_KEY}. Returning hardcoded fallback.`);
      return NextResponse.json({ ...defaultHomepageContentData, error: "Homepage content not found in database." });
    }
  } catch (e) {
    console.error(`[API /api/content/homepage] Unhandled error fetching content for ${HOMEPAGE_CONFIG_KEY}, returning hardcoded fallback. Error:`, (e as Error).message);
    return NextResponse.json({ ...defaultHomepageContentData, error: `Server error fetching homepage content. ${(e as Error).message}` }, { status: 500 });
  }
}


// Helper type for POST request body from admin form
type HomepageContentFormValues = {
  heroSlides?: Partial<HeroSlide>[];
  artisanalRootsTitle?: string;
  artisanalRootsDescription?: string;
  socialCommerceItems?: Partial<SocialCommerceItem>[];
  heroVideoId?: string;
  heroImageUrl?: string;
};

// POST to update homepage content (used by admin panel)
export async function POST(request: NextRequest) {
  console.log(`[Admin API Homepage POST] Request to update content in Supabase for key: ${HOMEPAGE_CONFIG_KEY}`);

  try { // Top-level try-catch for the entire request processing
    if (!supabase) {
      console.error('[Admin API Homepage POST] Supabase client is not initialized.');
      return NextResponse.json({ 
        message: 'Database client not configured. Please check server logs and .env file.',
        rawSupabaseError: { message: 'Supabase client not initialized.' }
      }, { status: 503 });
    }

    const newContentFromRequest = await request.json() as Partial<HomepageContentFormValues>;
    console.log(`[Admin API Homepage POST] Received newDataFromRequest for ${HOMEPAGE_CONFIG_KEY}:`, JSON.stringify(newContentFromRequest, null, 2));

    // Map form values to HomepageContent structure
    const dataToUpsert: HomepageContent = {
      heroSlides: (newContentFromRequest.heroSlides || []).map((slide, index) => ({
        id: slide.id || `slide-${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
        title: slide.title || defaultHomepageContentData.heroSlides![0].title,
        description: slide.description || defaultHomepageContentData.heroSlides![0].description,
        imageUrl: slide.imageUrl || undefined, // Allow empty string to clear
        videoId: slide.videoId || undefined,   // Allow empty string to clear
        altText: slide.altText || '',
        dataAiHint: slide.dataAiHint || '',
        ctaText: slide.ctaText || '',
        ctaLink: slide.ctaLink || '',
      })),
      artisanalRoots: {
        title: newContentFromRequest.artisanalRootsTitle || defaultHomepageContentData.artisanalRoots!.title,
        description: newContentFromRequest.artisanalRootsDescription || defaultHomepageContentData.artisanalRoots!.description,
      },
      socialCommerceItems: (newContentFromRequest.socialCommerceItems || []).map((item, index) => ({
        id: item.id || `social-${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
        imageUrl: item.imageUrl || "https://placehold.co/400x400.png", // Required by schema
        linkUrl: item.linkUrl || "#",   // Required by schema
        altText: item.altText || '',
        dataAiHint: item.dataAiHint || '',
      })),
      heroVideoId: newContentFromRequest.heroVideoId || undefined, // Allow empty string to clear
      heroImageUrl: newContentFromRequest.heroImageUrl || undefined, // Allow empty string to clear
    };
    
    console.log(`[Admin API Homepage POST] Attempting to upsert dataToUpsert for ${HOMEPAGE_CONFIG_KEY}:`, JSON.stringify(dataToUpsert, null, 2));

    const { error: upsertError } = await supabase
      .from('site_configurations')
      .upsert({ config_key: HOMEPAGE_CONFIG_KEY, value: dataToUpsert as any }, { onConflict: 'config_key' });

    if (upsertError) {
      console.error(`[Admin API Homepage POST] Supabase error updating content for ${HOMEPAGE_CONFIG_KEY}:`, upsertError);
      return NextResponse.json({
        message: `Supabase error: ${upsertError.message}`,
        rawSupabaseError: upsertError 
      }, { status: 500 });
    }
    
    console.log(`[Admin API Homepage POST] Homepage content for ${HOMEPAGE_CONFIG_KEY} updated successfully.`);
    return NextResponse.json({ message: 'Homepage content updated successfully.' });

  } catch (e) {
    console.error(`[Admin API Homepage POST] Unhandled error updating content for ${HOMEPAGE_CONFIG_KEY}:`, e);
    const errorMessage = (e instanceof Error) ? e.message : 'An unknown error occurred while processing the request.';
    // Check if it's a JSON parsing error specifically
    if (e instanceof SyntaxError && e.message.toLowerCase().includes('json')) {
      return NextResponse.json({ message: 'Invalid JSON in request body.', error: errorMessage }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to update homepage content.', error: errorMessage }, { status: 500 });
  }
}

