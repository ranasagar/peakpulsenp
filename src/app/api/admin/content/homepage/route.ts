
// /src/app/api/admin/content/homepage/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin, supabase as fallbackSupabase } from '@/lib/supabaseClient';
import type { HomepageContent, HeroSlide, SocialCommerceItem } from '@/types';

export const dynamic = 'force-dynamic';

const HOMEPAGE_CONFIG_KEY = 'homepageContent';

const defaultHomepageContentData: HomepageContent = {
  heroSlides: [{ id: 'default-slide-admin-api', title: "Default Hero Title (API)", description: "Default description (API).", ctaText: "Shop Now", ctaLink: "/products", imageUrl: "https://placehold.co/1920x1080.png?text=Default+Hero", altText:"Default Hero Image", dataAiHint:"abstract background" }],
  artisanalRoots: { title: "Our Artisanal Roots (API Default)", description: "Default artisanal roots description (API)." },
  socialCommerceItems: [],
  heroVideoId: undefined,
  heroImageUrl: undefined,
};

// GET current homepage content for admin
export async function GET() {
  const supabase = supabaseAdmin || fallbackSupabase; // Prefer admin for reading config if available
  const clientName = supabase === supabaseAdmin ? "ADMIN client" : "public fallback client";
  console.log(`[Admin API Homepage GET] Request to fetch content. Using ${clientName}. Key: ${HOMEPAGE_CONFIG_KEY}`);

  if (!supabase) {
    console.error('[Admin API Homepage GET] Supabase client is not initialized.');
    return NextResponse.json({ ...defaultHomepageContentData, error: "Database client not configured.", rawSupabaseError: { message: 'Supabase client not initialized.'} }, { status: 503 });
  }

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
      const dbContent = data.value as Partial<HomepageContent>;
      // Ensure structure consistency, merging with defaults for missing parts
      const responseData: HomepageContent = {
        heroSlides: (dbContent.heroSlides && dbContent.heroSlides.length > 0)
          ? dbContent.heroSlides.map((slide: Partial<HeroSlide>, index: number) => ({
              id: slide.id || `hs-db-${Date.now()}-${index}`,
              title: slide.title || defaultHomepageContentData.heroSlides![0].title,
              description: slide.description || defaultHomepageContentData.heroSlides![0].description,
              imageUrl: slide.imageUrl || undefined,
              videoId: slide.videoId === null ? undefined : slide.videoId,
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
  const clientName = client === supabaseAdmin ? "ADMIN client (service_role)" : "public fallback client";
  console.log(`[Admin API Homepage POST] Request to update content. Key: ${HOMEPAGE_CONFIG_KEY}. Using ${clientName}.`);

  if (!client) {
    console.error('[Admin API Homepage POST] Supabase client for write is not initialized.');
    return NextResponse.json({ message: 'Database client for write operations not configured.', rawSupabaseError: { message: 'Supabase client not initialized.'} }, { status: 503 });
  }
   if (client !== supabaseAdmin) {
    console.warn(`[Admin API Homepage POST] WARNING: Using public fallback Supabase client. RLS policies for 'authenticated' admin role will apply for key ${HOMEPAGE_CONFIG_KEY}. Ensure they allow update/insert for site_configurations.`);
  }

  let newDataFromRequest: Partial<HomepageContent>;
  try {
    newDataFromRequest = await request.json();
  } catch (e) {
    console.error(`[Admin API Homepage POST] Error parsing request JSON for ${HOMEPAGE_CONFIG_KEY}:`, e);
    return NextResponse.json({ message: 'Invalid JSON in request body.', error: (e as Error).message }, { status: 400 });
  }
  console.log(`[Admin API Homepage POST] Received newDataFromRequest for ${HOMEPAGE_CONFIG_KEY}:`, JSON.stringify(newDataFromRequest, null, 2).substring(0, 1000) + "...");
  
  const dataToStore: HomepageContent = {
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
  
  try {
    console.log(`[Admin API Homepage POST] Attempting to query existing config for key: ${HOMEPAGE_CONFIG_KEY}`);
    const { data: existingConfig, error: selectError } = await client
      .from('site_configurations')
      .select('config_key')
      .eq('config_key', HOMEPAGE_CONFIG_KEY)
      .maybeSingle();

    if (selectError) {
      console.error(`[Admin API Homepage POST] Supabase error selecting existing config for ${HOMEPAGE_CONFIG_KEY}:`, selectError);
      return NextResponse.json({
        message: `Supabase error checking existing config: ${selectError.message}`,
        rawSupabaseError: { message: selectError.message, details: selectError.details, hint: selectError.hint, code: selectError.code }
      }, { status: 500 });
    }

    let operationError;
    if (existingConfig) {
      console.log(`[Admin API Homepage POST] Existing config found. Attempting UPDATE for ${HOMEPAGE_CONFIG_KEY} with payload:`, JSON.stringify(dataToStore, null, 2).substring(0,500)+"...");
      const { error } = await client
        .from('site_configurations')
        .update({ value: dataToStore as any, updated_at: new Date().toISOString() }) // Explicitly set updated_at
        .eq('config_key', HOMEPAGE_CONFIG_KEY);
      operationError = error;
    } else {
      console.log(`[Admin API Homepage POST] No existing config. Attempting INSERT for ${HOMEPAGE_CONFIG_KEY} with payload:`, JSON.stringify(dataToStore, null, 2).substring(0,500)+"...");
      const { error } = await client
        .from('site_configurations')
        .insert({ config_key: HOMEPAGE_CONFIG_KEY, value: dataToStore as any, updated_at: new Date().toISOString() }); // Also set updated_at for insert
      operationError = error;
    }

    if (operationError) {
      console.error(`[Admin API Homepage POST] Supabase error during ${existingConfig ? 'update' : 'insert'} for ${HOMEPAGE_CONFIG_KEY}:`, operationError);
      return NextResponse.json({
        message: `Supabase error: ${operationError.message}`,
        rawSupabaseError: { message: operationError.message, details: operationError.details, hint: operationError.hint, code: operationError.code }
      }, { status: 500 });
    }
    
    console.log(`[Admin API Homepage POST] Homepage content for ${HOMEPAGE_CONFIG_KEY} ${existingConfig ? 'updated' : 'inserted'} successfully.`);
    return NextResponse.json({ message: 'Homepage content updated successfully.' });

  } catch (e) {
    console.error(`[Admin API Homepage POST] Unhandled error updating content for ${HOMEPAGE_CONFIG_KEY}:`, e);
    const errorMessage = (e instanceof Error) ? e.message : 'An unknown error occurred.';
    return NextResponse.json({ message: 'Failed to update homepage content.', error: errorMessage }, { status: 500 });
  }
}
    