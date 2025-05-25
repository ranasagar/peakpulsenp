
// /src/app/api/admin/content/homepage/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin, supabase as fallbackSupabase } from '@/lib/supabaseClient';
import type { HomepageContent, HeroSlide, SocialCommerceItem } from '@/types';

export const dynamic = 'force-dynamic';

const HOMEPAGE_CONFIG_KEY = 'homepageContent';

const defaultHeroSlideStructure: HeroSlide = {
  id: '', title: '', description: '', imageUrl: undefined, videoId: undefined, altText: '', dataAiHint: '', ctaText: '', ctaLink: ''
};

const defaultSocialCommerceItemStructure: SocialCommerceItem = {
  id: '', imageUrl: '', linkUrl: '#', altText: '', dataAiHint: ''
};

const defaultHomepageContentData: HomepageContent = {
  heroSlides: [defaultHeroSlideStructure],
  artisanalRoots: { title: "Our Artisanal Roots (Default)", description: "Default description." },
  socialCommerceItems: [defaultSocialCommerceItemStructure],
  heroVideoId: undefined,
  heroImageUrl: undefined,
};

// GET current homepage content
export async function GET() {
  const supabase = supabaseAdmin || fallbackSupabase; // Prefer admin for reading system config
  const clientName = supabase === supabaseAdmin ? "ADMIN client" : "public fallback client";
  console.log(`[API /api/content/homepage GET] Request to fetch. Using ${clientName}. Key: ${HOMEPAGE_CONFIG_KEY}`);

  if (!supabase) {
    console.error(`[API /api/content/homepage GET] Supabase client is not initialized.`);
    return NextResponse.json({ ...defaultHomepageContentData, error: "Database client not configured." }, { status: 503 });
  }

  try {
    const { data, error } = await supabase
      .from('site_configurations')
      .select('value')
      .eq('config_key', HOMEPAGE_CONFIG_KEY)
      .maybeSingle();

    if (error) {
      console.error(`[API /api/content/homepage GET] Supabase error fetching for ${HOMEPAGE_CONFIG_KEY}:`, error);
      return NextResponse.json({ ...defaultHomepageContentData, error: `Failed to load content. Supabase: ${error.message}`, rawSupabaseError: error }, { status: 500 });
    }

    if (data && data.value) {
      console.log(`[API /api/content/homepage GET] Successfully fetched for ${HOMEPAGE_CONFIG_KEY}.`);
      const dbContent = data.value as Partial<HomepageContent>;
      const responseData: HomepageContent = {
        heroSlides: (Array.isArray(dbContent.heroSlides) ? dbContent.heroSlides : []).map(slide => ({ ...defaultHeroSlideStructure, ...slide })),
        artisanalRoots: { ...defaultHomepageContentData.artisanalRoots!, ...dbContent.artisanalRoots },
        socialCommerceItems: (Array.isArray(dbContent.socialCommerceItems) ? dbContent.socialCommerceItems : []).map(item => ({ ...defaultSocialCommerceItemStructure, ...item })),
        heroVideoId: dbContent.heroVideoId === null ? undefined : dbContent.heroVideoId,
        heroImageUrl: dbContent.heroImageUrl === null ? undefined : dbContent.heroImageUrl,
      };
      return NextResponse.json(responseData);
    } else {
      console.warn(`[API /api/content/homepage GET] No content for ${HOMEPAGE_CONFIG_KEY}. Returning default.`);
      return NextResponse.json(defaultHomepageContentData);
    }
  } catch (e) {
    console.error(`[API /api/content/homepage GET] Unhandled error for ${HOMEPAGE_CONFIG_KEY}:`, e);
    return NextResponse.json({ ...defaultHomepageContentData, error: `Server error. ${(e as Error).message}` }, { status: 500 });
  }
}


// POST to update homepage content
export async function POST(request: NextRequest) {
  const clientToUse = supabaseAdmin || fallbackSupabase;
  const clientName = clientToUse === supabaseAdmin ? "ADMIN client (service_role)" : "public fallback client";
  console.log(`[Admin API Homepage POST] Request to update. Key: ${HOMEPAGE_CONFIG_KEY}. Using ${clientName}.`);

  if (!clientToUse) {
    console.error('[Admin API Homepage POST] Supabase client for write is not initialized.');
    return NextResponse.json({ message: 'Database client for write operations not configured.', rawSupabaseError: { message: 'Supabase client for write not initialized.'} }, { status: 503 });
  }
  if (clientToUse !== supabaseAdmin) {
    console.warn(`[Admin API Homepage POST] WARNING: Using public fallback Supabase client. RLS policies for 'authenticated' admin role will apply for key ${HOMEPAGE_CONFIG_KEY}.`);
  }

  let newDataFromRequest: Partial<HomepageContent>;
  try {
    newDataFromRequest = await request.json();
  } catch (e) {
    console.error(`[Admin API Homepage POST] Error parsing request JSON for ${HOMEPAGE_CONFIG_KEY}:`, e);
    return NextResponse.json({ message: 'Invalid JSON in request body.', error: (e as Error).message }, { status: 400 });
  }
  console.log(`[Admin API Homepage POST] Received newDataFromRequest for ${HOMEPAGE_CONFIG_KEY}:`, JSON.stringify(newDataFromRequest, null, 2).substring(0, 500) + "...");
  
  const dataToStore: HomepageContent = {
    heroSlides: (newDataFromRequest.heroSlides || []).map((slide, index) => ({
      id: slide.id || `slide-submit-${Date.now()}-${index}`,
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
      id: item.id || `social-submit-${Date.now()}-${index}`,
      imageUrl: item.imageUrl || '',
      linkUrl: item.linkUrl || '#',
      altText: item.altText || '',
      dataAiHint: item.dataAiHint || '',
    })),
    heroVideoId: newDataFromRequest.heroVideoId || undefined,
    heroImageUrl: newDataFromRequest.heroImageUrl || undefined,
  };
  
  try {
    console.log(`[Admin API Homepage POST] Checking existing config for key: ${HOMEPAGE_CONFIG_KEY}`);
    const { data: existingConfig, error: selectError } = await clientToUse
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
      console.log(`[Admin API Homepage POST] Existing config found. Attempting UPDATE for ${HOMEPAGE_CONFIG_KEY}.`);
      const { error } = await clientToUse
        .from('site_configurations')
        .update({ value: dataToStore as any, updated_at: new Date().toISOString() })
        .eq('config_key', HOMEPAGE_CONFIG_KEY);
      operationError = error;
    } else {
      console.log(`[Admin API Homepage POST] No existing config. Attempting INSERT for ${HOMEPAGE_CONFIG_KEY}.`);
      const { error } = await clientToUse
        .from('site_configurations')
        .insert({ config_key: HOMEPAGE_CONFIG_KEY, value: dataToStore as any, updated_at: new Date().toISOString() });
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
