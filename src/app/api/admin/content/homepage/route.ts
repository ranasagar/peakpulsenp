
// /src/app/api/admin/content/homepage/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin, supabase as fallbackSupabase } from '@/lib/supabaseClient';
import type { HomepageContent, HeroSlide, SocialCommerceItem, ArtisanalRootsSlide } from '@/types';

export const dynamic = 'force-dynamic';
const HOMEPAGE_CONFIG_KEY = 'homepageContent';

const defaultHeroSlideStructure: Omit<HeroSlide, 'id'> = {
  title: 'New Collection', description: 'Discover the latest arrivals.', imageUrl: undefined, videoId: undefined, altText: 'Hero image', dataAiHint: 'fashion background', ctaText: 'Shop Now', ctaLink: '/products'
};

const defaultArtisanalRootsSlideStructure: Omit<ArtisanalRootsSlide, 'id'> = {
  imageUrl: '', altText: 'Artisanal background image', dataAiHint: 'craft texture tradition'
};

const defaultSocialCommerceItemStructure: Omit<SocialCommerceItem, 'id'> = {
  imageUrl: 'https://placehold.co/400x400.png?text=Social+Post', linkUrl: '#', altText: 'Social media post', dataAiHint: 'social fashion user', displayOrder: 0
};

const defaultHomepageContentData: HomepageContent = {
  heroSlides: [],
  artisanalRoots: { 
    title: "Our Artisanal Roots (Default)", 
    description: "Default description about heritage and craftsmanship.",
    slides: [] 
  },
  socialCommerceItems: [],
  heroVideoId: undefined,
  heroImageUrl: undefined,
};

// GET current homepage content for admin
export async function GET() {
  const supabase = supabaseAdmin || fallbackSupabase;
  if (!supabase) {
    console.error('[Admin API Homepage GET] Supabase client is not initialized. This is critical for admin operations.');
    return NextResponse.json({ ...defaultHomepageContentData, error: "Database client (admin or public) not configured. Check server logs and .env file for SUPABASE_SERVICE_ROLE_KEY.", rawSupabaseError: { message: 'Supabase client not initialized.'} }, { status: 503 });
  }
  const clientType = supabase === supabaseAdmin ? "ADMIN client (service_role)" : "FALLBACK public client";
  console.log(`[Admin API Homepage GET] Request to fetch content. Key: ${HOMEPAGE_CONFIG_KEY}. Using ${clientType}`);

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
      const artisanalRootsData = dbContent.artisanalRoots || defaultHomepageContentData.artisanalRoots!;
      
      const responseData: HomepageContent = {
        heroSlides: (Array.isArray(dbContent.heroSlides) ? dbContent.heroSlides : []).map(
          (slide: Partial<HeroSlide>, index: number) => ({ 
            ...defaultHeroSlideStructure, ...slide, id: slide.id || `hs-db-${Date.now()}-${index}`
          })
        ),
        artisanalRoots: {
          title: artisanalRootsData.title || defaultHomepageContentData.artisanalRoots!.title,
          description: artisanalRootsData.description || defaultHomepageContentData.artisanalRoots!.description,
          slides: (Array.isArray(artisanalRootsData.slides) ? artisanalRootsData.slides : []).map(
            (slide: Partial<ArtisanalRootsSlide>, index: number) => ({
              ...defaultArtisanalRootsSlideStructure, ...slide, id: slide.id || `ars-db-${Date.now()}-${index}`
            })
          )
        },
        socialCommerceItems: (Array.isArray(dbContent.socialCommerceItems) ? dbContent.socialCommerceItems : []).map(
          (item: Partial<SocialCommerceItem>, index: number) => ({ 
            ...defaultSocialCommerceItemStructure, ...item, id: item.id || `scs-db-${Date.now()}-${index}`
          })
        ).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)),
        heroVideoId: dbContent.heroVideoId === null ? undefined : dbContent.heroVideoId,
        heroImageUrl: dbContent.heroImageUrl === null ? undefined : dbContent.heroImageUrl,
      };
      console.log(`[Admin API Homepage GET] Successfully fetched and processed content for ${HOMEPAGE_CONFIG_KEY}.`);
      return NextResponse.json(responseData);
    } else {
      console.log(`[Admin API Homepage GET] No content found for ${HOMEPAGE_CONFIG_KEY}, returning default structure for admin form.`);
      return NextResponse.json(defaultHomepageContentData);
    }
  } catch (e: any) {
    console.error(`[Admin API Homepage GET] UNHANDLED EXCEPTION fetching content for ${HOMEPAGE_CONFIG_KEY}:`, e);
    return NextResponse.json({ ...defaultHomepageContentData, error: `Server error: ${e.message}` }, { status: 500 });
  }
}

// POST to update homepage content
export async function POST(request: NextRequest) {
  const client = supabaseAdmin; // Prefer admin client for writes
  const clientTypeForLog = supabaseAdmin ? "ADMIN client (service_role)" : "FALLBACK public client (WARNING: RLS will apply without service_role)";

  if (!client) {
    console.error(`[Admin API Homepage POST] CRITICAL: Supabase ADMIN client (service_role) is not initialized. Cannot save settings. Check SUPABASE_SERVICE_ROLE_KEY in .env and server restart.`);
    return NextResponse.json({ 
        message: 'Database admin client not configured. Cannot save settings. Contact administrator.', 
        rawSupabaseError: { message: 'Internal server configuration error: Admin database client missing for homepage content.'} 
    }, { status: 503 });
  }
  console.log(`[Admin API Homepage POST] Request to update content. Key: ${HOMEPAGE_CONFIG_KEY}. Using ${clientTypeForLog}`);

  let newDataFromRequest: Partial<HomepageContentFormValues>; // Using form values type
  try {
    newDataFromRequest = await request.json();
  } catch (e: any) {
    console.error(`[Admin API Homepage POST] Error parsing request JSON for ${HOMEPAGE_CONFIG_KEY}:`, e.message);
    return NextResponse.json({ message: 'Invalid JSON in request body.', error: e.message }, { status: 400 });
  }
  console.log("[Admin API Homepage POST] Received newDataFromRequest:", JSON.stringify(newDataFromRequest).substring(0, 1000) + "...");
  
  const dataToStore: HomepageContent = {
    heroSlides: (newDataFromRequest.heroSlides || []).map((slide, index) => ({
      id: slide.id || `hs-new-${Date.now()}-${index}`,
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
      title: newDataFromRequest.artisanalRootsTitle || defaultHomepageContentData.artisanalRoots!.title,
      description: newDataFromRequest.artisanalRootsDescription || defaultHomepageContentData.artisanalRoots!.description,
      slides: (newDataFromRequest.artisanalRootsSlides || []).map((slide, index) => ({
        id: slide.id || `ars-new-${Date.now()}-${index}`,
        imageUrl: slide.imageUrl || '',
        altText: slide.altText || '',
        dataAiHint: slide.dataAiHint || '',
      }))
    },
    socialCommerceItems: (newDataFromRequest.socialCommerceItems || [])
      .map((item, index) => ({
        id: item.id || `scs-new-${Date.now()}-${index}`,
        imageUrl: item.imageUrl || '',
        linkUrl: item.linkUrl || '#',
        altText: item.altText || '',
        dataAiHint: item.dataAiHint || '',
        displayOrder: Number(item.displayOrder) || 0,
      }))
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)),
    heroVideoId: newDataFromRequest.heroVideoId || undefined,
    heroImageUrl: newDataFromRequest.heroImageUrl || undefined,
  };
  
  console.log("[Admin API Homepage POST] Attempting to save (upsert) dataToStore:", JSON.stringify(dataToStore).substring(0,1000) + "...");
  
  try {
    const { data: existingData, error: selectError } = await client
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
      const { error } = await client
        .from('site_configurations')
        .update({ value: dataToStore as any, updated_at: new Date().toISOString() })
        .eq('config_key', HOMEPAGE_CONFIG_KEY);
      upsertError = error;
    } else {
      console.log(`[Admin API Homepage POST] Inserting new entry for ${HOMEPAGE_CONFIG_KEY}`);
      const { error } = await client
        .from('site_configurations')
        .insert({ config_key: HOMEPAGE_CONFIG_KEY, value: dataToStore as any, updated_at: new Date().toISOString() }); // Explicitly set updated_at on insert
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
    const errorMessage = e.message || 'An unexpected server error occurred.';
    const errorDetails = { message: e.message, details: e.details, hint: e.hint, code: e.code };
    return NextResponse.json({ 
        message: `Critical server error processing your request to save homepage content: ${errorMessage}`, 
        errorDetails: errorMessage,
        rawSupabaseError: errorDetails 
    }, { status: 500 });
  }
}

// Helper type for form values used in this admin page
type HomepageContentFormValues = z.infer<typeof homepageContentSchema>;
const homepageContentSchema = z.object({
  heroSlides: z.array(heroSlideSchema).optional(),
  artisanalRootsTitle: z.string().optional(),
  artisanalRootsDescription: z.string().optional(),
  artisanalRootsSlides: z.array(artisanalRootsSlideSchema).optional(),
  socialCommerceItems: z.array(socialCommerceItemSchema).optional(),
  heroVideoId: z.string().optional(),
  heroImageUrl: z.string().optional(),
});

const heroSlideSchema = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().or(z.literal('')).optional(),
  videoId: z.string().optional(),
  altText: z.string().optional(),
  dataAiHint: z.string().optional(),
  ctaText: z.string().optional(),
  ctaLink: z.string().optional(),
});

const artisanalRootsSlideSchema = z.object({
  id: z.string().optional(),
  imageUrl: z.string().url().or(z.literal('')).optional(),
  altText: z.string().optional(),
  dataAiHint: z.string().optional(),
});

const socialCommerceItemSchema = z.object({
  id: z.string().optional(),
  imageUrl: z.string().url().or(z.literal('')).optional(),
  linkUrl: z.string().url().or(z.literal('')).optional(),
  altText: z.string().optional(),
  dataAiHint: z.string().optional(),
  displayOrder: z.number().int().optional(),
});
