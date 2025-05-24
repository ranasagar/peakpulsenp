
// /src/app/api/admin/content/homepage/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin, supabase as fallbackSupabase } from '@/lib/supabaseClient';
import type { HomepageContent, HeroSlide, SocialCommerceItem } from '@/types';

export const dynamic = 'force-dynamic';

const HOMEPAGE_CONFIG_KEY = 'homepageContent';

const defaultHomepageContentData: HomepageContent = {
  heroSlides: [{ id: 'default-slide-admin', title: "Default Hero Title", description: "Default description for hero slide.", ctaText: "Shop Now", ctaLink: "/products", imageUrl: "https://placehold.co/1920x1080.png?text=Default+Hero+Image", altText:"Default Hero Image", dataAiHint:"abstract background" }],
  artisanalRoots: { title: "Our Artisanal Roots (Default)", description: "Default description for artisanal roots section." },
  socialCommerceItems: [{ id: 'default-social-admin', imageUrl: 'https://placehold.co/400x400.png', linkUrl: '#', altText: 'Default Social Post', dataAiHint: 'social media post'}],
  heroVideoId: undefined,
  heroImageUrl: undefined,
};

// GET current homepage content for admin
export async function GET() {
  const supabase = supabaseAdmin || fallbackSupabase;
  if (!supabase) {
    console.error('[Admin API Homepage GET] Supabase client is not initialized.');
    return NextResponse.json({ message: 'Database client not configured.', rawSupabaseError: { message: 'Supabase client not initialized.'} }, { status: 503 });
  }
  console.log(`[Admin API Homepage GET] Request to fetch content from Supabase for key: ${HOMEPAGE_CONFIG_KEY}. Using ${supabase === supabaseAdmin ? "ADMIN client" : "public client"}`);

  try {
    const { data, error } = await supabase
      .from('site_configurations')
      .select('value')
      .eq('config_key', HOMEPAGE_CONFIG_KEY)
      .maybeSingle();

    if (error) {
      console.error(`[Admin API Homepage GET] Supabase error fetching content for ${HOMEPAGE_CONFIG_KEY}:`, error);
      return NextResponse.json({ ...defaultHomepageContentData, error: `Failed to load content. ${error.message}`, rawSupabaseError: error }, { status: 500 });
    }

    if (data && data.value) {
      console.log(`[Admin API Homepage GET] Successfully fetched content for ${HOMEPAGE_CONFIG_KEY}.`);
      // Ensure all parts of HomepageContent are present, using fallbacks if necessary
      const dbContent = data.value as Partial<HomepageContent>;
      const responseData: HomepageContent = {
        heroSlides: (dbContent.heroSlides && dbContent.heroSlides.length > 0)
          ? dbContent.heroSlides.map((slide: Partial<HeroSlide>, index: number) => ({
              id: slide.id || `hs-db-${Date.now()}-${index}`,
              title: slide.title || defaultHomepageContentData.heroSlides![0].title,
              description: slide.description || defaultHomepageContentData.heroSlides![0].description,
              imageUrl: slide.imageUrl || undefined,
              videoId: slide.videoId === null ? undefined : slide.videoId, // Handle explicit null from DB
              altText: slide.altText || '',
              dataAiHint: slide.dataAiHint || '',
              ctaText: slide.ctaText || '',
              ctaLink: slide.ctaLink || '',
          }))
          : defaultHomepageContentData.heroSlides!,
        artisanalRoots: { 
            title: dbContent.artisanalRoots?.title || defaultHomepageContentData.artisanalRoots!.title,
            description: dbContent.artisanalRoots?.description || defaultHomepageContentData.artisanalRoots!.description,
        },
        socialCommerceItems: (dbContent.socialCommerceItems && dbContent.socialCommerceItems.length > 0)
          ? dbContent.socialCommerceItems.map((item: Partial<SocialCommerceItem>, index: number) => ({
              id: item.id || `sc-db-${Date.now()}-${index}`,
              imageUrl: item.imageUrl || defaultHomepageContentData.socialCommerceItems![0].imageUrl,
              linkUrl: item.linkUrl || defaultHomepageContentData.socialCommerceItems![0].linkUrl,
              altText: item.altText || '',
              dataAiHint: item.dataAiHint || '',
          }))
          : defaultHomepageContentData.socialCommerceItems!,
        heroVideoId: dbContent.heroVideoId === null ? undefined : dbContent.heroVideoId,
        heroImageUrl: dbContent.heroImageUrl === null ? undefined : dbContent.heroImageUrl,
      };
      return NextResponse.json(responseData);
    } else {
      console.log(`[Admin API Homepage GET] No content found for ${HOMEPAGE_CONFIG_KEY}. Returning default structure.`);
      return NextResponse.json(defaultHomepageContentData);
    }
  } catch (e) {
    console.error(`[Admin API Homepage GET] Unhandled error fetching content for ${HOMEPAGE_CONFIG_KEY}:`, e);
    return NextResponse.json({ ...defaultHomepageContentData, error: `Server error fetching homepage content. ${(e as Error).message}` }, { status: 500 });
  }
}

// POST to update homepage content
export async function POST(request: NextRequest) {
  const client = supabaseAdmin || fallbackSupabase; // Prefer admin client for writes
  if (!client) {
    console.error('[Admin API Homepage POST] Supabase client is not initialized.');
    return NextResponse.json({ message: 'Database client not configured.', rawSupabaseError: { message: 'Supabase client not initialized.'} }, { status: 503 });
  }
  console.log(`[Admin API Homepage POST] Request to update content. Using ${client === supabaseAdmin ? "ADMIN client" : "public client"}`);

  try {
    const newDataFromRequest = await request.json() as Partial<HomepageContent>; // Form might send partial data
    console.log(`[Admin API Homepage POST] Received newDataFromRequest for ${HOMEPAGE_CONFIG_KEY}:`, JSON.stringify(newDataFromRequest, null, 2));
    
    // Ensure a complete structure for saving, merging with defaults for missing top-level keys
    const dataToUpsert: HomepageContent = {
      heroSlides: (newDataFromRequest.heroSlides || []).map((slide, index) => ({
        id: slide.id || `slide-${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
        title: slide.title || '',
        description: slide.description || '',
        imageUrl: slide.imageUrl || undefined,
        videoId: slide.videoId || undefined,
        altText: slide.altText || '',
        dataAiHint: slide.dataAiHint || '',
        ctaText: slide.ctaText || '',
        ctaLink: slide.ctaLink || '',
      })),
      artisanalRoots: {
        title: newDataFromRequest.artisanalRoots?.title || defaultHomepageContentData.artisanalRoots!.title,
        description: newDataFromRequest.artisanalRoots?.description || defaultHomepageContentData.artisanalRoots!.description,
      },
      socialCommerceItems: (newDataFromRequest.socialCommerceItems || []).map((item, index) => ({
        id: item.id || `social-${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
        imageUrl: item.imageUrl || '',
        linkUrl: item.linkUrl || '#',
        altText: item.altText || '',
        dataAiHint: item.dataAiHint || '',
      })),
      heroVideoId: newDataFromRequest.heroVideoId || undefined,
      heroImageUrl: newDataFromRequest.heroImageUrl || undefined,
    };
    
    console.log(`[Admin API Homepage POST] Attempting to upsert dataToUpsert for ${HOMEPAGE_CONFIG_KEY}:`, JSON.stringify(dataToUpsert, null, 2));

    const { error: upsertError } = await client
      .from('site_configurations')
      .upsert({ config_key: HOMEPAGE_CONFIG_KEY, value: dataToUpsert as any }, { onConflict: 'config_key' });

    if (upsertError) {
      console.error(`[Admin API Homepage POST] Supabase error updating content for ${HOMEPAGE_CONFIG_KEY}:`, upsertError);
      return NextResponse.json({
        message: `Supabase error: ${upsertError.message}`,
        rawSupabaseError: { message: upsertError.message, details: upsertError.details, hint: upsertError.hint, code: upsertError.code }
      }, { status: 500 });
    }
    
    console.log(`[Admin API Homepage POST] Homepage content for ${HOMEPAGE_CONFIG_KEY} updated successfully.`);
    return NextResponse.json({ message: 'Homepage content updated successfully.' });

  } catch (e) {
    console.error(`[Admin API Homepage POST] Unhandled error updating content for ${HOMEPAGE_CONFIG_KEY}:`, e);
    const errorMessage = (e instanceof Error) ? e.message : 'An unknown error occurred.';
    if (e instanceof SyntaxError && e.message.toLowerCase().includes('json')) {
      return NextResponse.json({ message: 'Invalid JSON in request body.', error: errorMessage }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to update homepage content.', error: errorMessage }, { status: 500 });
  }
}

    