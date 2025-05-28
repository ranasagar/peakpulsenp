
// /src/app/api/admin/content/homepage/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin, supabase as fallbackSupabase } from '@/lib/supabaseClient';
import type { HomepageContent, HeroSlide, SocialCommerceItem } from '@/types';

const HOMEPAGE_CONFIG_KEY = 'homepageContent';

const defaultHeroSlideStructure: Omit<HeroSlide, 'id'> = {
  title: 'New Collection', description: 'Discover the latest arrivals.', imageUrl: undefined, videoId: undefined, altText: 'Hero image', dataAiHint: 'fashion background', ctaText: 'Shop Now', ctaLink: '/products'
};

const defaultSocialCommerceItemStructure: Omit<SocialCommerceItem, 'id'> = {
  imageUrl: 'https://placehold.co/400x400.png?text=Social+Post', linkUrl: '#', altText: 'Social media post', dataAiHint: 'social fashion user', displayOrder: 0
};

const defaultHomepageContentData: HomepageContent = {
  heroSlides: [],
  artisanalRoots: { title: "Our Artisanal Roots (Default)", description: "Default description about heritage and craftsmanship." },
  socialCommerceItems: [],
  heroVideoId: undefined,
  heroImageUrl: undefined,
};

// GET current homepage content for admin
export async function GET() {
  const supabase = supabaseAdmin || fallbackSupabase;
  if (!supabase) {
    console.error('[Admin API Homepage GET] Supabase client is not initialized.');
    return NextResponse.json({ ...defaultHomepageContentData, error: "Database client not configured." }, { status: 503 });
  }

  try {
    const { data, error } = await supabase
      .from('site_configurations')
      .select('value')
      .eq('config_key', HOMEPAGE_CONFIG_KEY)
      .maybeSingle();

    if (error) {
      console.error(`[Admin API Homepage GET] Supabase error fetching for ${HOMEPAGE_CONFIG_KEY}:`, error);
      return NextResponse.json({ ...defaultHomepageContentData, error: `Failed to load content. Supabase: ${error.message}`, rawSupabaseError: error }, { status: 500 });
    }

    if (data && data.value) {
      const dbContent = data.value as Partial<HomepageContent>;
      const responseData: HomepageContent = {
        heroSlides: (Array.isArray(dbContent.heroSlides) ? dbContent.heroSlides : []).map(slide => ({ ...defaultHeroSlideStructure, ...slide })),
        artisanalRoots: { ...defaultHomepageContentData.artisanalRoots!, ...dbContent.artisanalRoots },
        socialCommerceItems: (Array.isArray(dbContent.socialCommerceItems) ? dbContent.socialCommerceItems : []).map(item => ({ ...defaultSocialCommerceItemStructure, ...item })).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)),
        heroVideoId: dbContent.heroVideoId === null ? undefined : dbContent.heroVideoId,
        heroImageUrl: dbContent.heroImageUrl === null ? undefined : dbContent.heroImageUrl,
      };
      return NextResponse.json(responseData);
    } else {
      return NextResponse.json(defaultHomepageContentData);
    }
  } catch (e: any) {
    console.error(`[Admin API Homepage GET] UNHANDLED EXCEPTION fetching content for ${HOMEPAGE_CONFIG_KEY}:`, e);
    return NextResponse.json({ ...defaultHomepageContentData, error: `Server error: ${e.message}` }, { status: 500 });
  }
}

// POST to update homepage content
export async function POST(request: NextRequest) {
  const supabaseService = supabaseAdmin;
  const clientLog = supabaseService ? "ADMIN client (service_role)" : "FALLBACK public client";
  console.log(`[Admin API Homepage POST] Request to update content. Key: ${HOMEPAGE_CONFIG_KEY}. Using ${clientLog}`);

  if (!supabaseService) {
    console.error('[Admin API Homepage POST] CRITICAL: Supabase ADMIN client (service_role) is not initialized.');
    return NextResponse.json({ 
        message: 'Database admin client not configured. Cannot save settings. Contact administrator.', 
        rawSupabaseError: { message: 'Internal server configuration error: Admin database client missing.'} 
    }, { status: 503 });
  }

  let newDataFromRequest: Partial<HomepageContent>;
  try {
    newDataFromRequest = await request.json();
  } catch (e: any) {
    console.error(`[Admin API Homepage POST] Error parsing request JSON for ${HOMEPAGE_CONFIG_KEY}:`, e.message);
    return NextResponse.json({ message: 'Invalid JSON in request body.', error: e.message }, { status: 400 });
  }
  
  const dataToStore: HomepageContent = {
    heroSlides: (newDataFromRequest.heroSlides || []).map((slide, index) => ({
      id: slide.id || `slide-new-${Date.now()}-${index}`, // Ensure ID for new slides
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
    socialCommerceItems: (newDataFromRequest.socialCommerceItems || [])
      .map((item, index) => ({
        id: item.id || `social-new-${Date.now()}-${index}`, // Ensure ID for new items
        imageUrl: item.imageUrl || '',
        linkUrl: item.linkUrl || '#',
        altText: item.altText || '',
        dataAiHint: item.dataAiHint || '',
        displayOrder: Number(item.displayOrder) || 0,
      }))
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)), // Sort before saving
    heroVideoId: newDataFromRequest.heroVideoId || undefined,
    heroImageUrl: newDataFromRequest.heroImageUrl || undefined,
  };
  
  try {
    console.log(`[Admin API Homepage POST] Attempting to save (upsert) data for key: ${HOMEPAGE_CONFIG_KEY}`);
    
    const { data: existingData, error: selectError } = await supabaseService
      .from('site_configurations')
      .select('config_key')
      .eq('config_key', HOMEPAGE_CONFIG_KEY)
      .maybeSingle();

    if (selectError) {
      console.error(`[Admin API Homepage POST] Supabase error checking existing config for ${HOMEPAGE_CONFIG_KEY}:`, selectError);
      throw selectError;
    }

    let upsertError;
    if (existingData) {
      console.log(`[Admin API Homepage POST] Updating existing entry for ${HOMEPAGE_CONFIG_KEY}`);
      const { error } = await supabaseService
        .from('site_configurations')
        .update({ value: dataToStore as any, updated_at: new Date().toISOString() })
        .eq('config_key', HOMEPAGE_CONFIG_KEY);
      upsertError = error;
    } else {
      console.log(`[Admin API Homepage POST] Inserting new entry for ${HOMEPAGE_CONFIG_KEY}`);
      const { error } = await supabaseService
        .from('site_configurations')
        .insert({ config_key: HOMEPAGE_CONFIG_KEY, value: dataToStore as any, updated_at: new Date().toISOString() });
      upsertError = error;
    }

    if (upsertError) {
      console.error(`[Admin API Homepage POST] Supabase error during save for ${HOMEPAGE_CONFIG_KEY}:`, upsertError);
      return NextResponse.json({
        message: `Failed to save homepage content. Supabase error: ${upsertError.message}`,
        rawSupabaseError: { message: upsertError.message, details: upsertError.details, hint: upsertError.hint, code: upsertError.code }
      }, { status: 500 });
    }
    
    return NextResponse.json({ message: 'Homepage content updated successfully.' });

  } catch (e: any) {
    console.error(`[Admin API Homepage POST] UNHANDLED EXCEPTION updating content for ${HOMEPAGE_CONFIG_KEY}:`, e);
    return NextResponse.json({ 
        message: 'Critical server error processing your request to save homepage content.', 
        errorDetails: e.message,
        rawSupabaseError: { message: e.message } 
    }, { status: 500 });
  }
}
