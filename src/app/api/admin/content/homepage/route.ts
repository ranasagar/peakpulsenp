// /src/app/api/admin/content/homepage/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase, supabaseAdmin } from '../../../../../lib/supabaseClient'; // Import both
import type { HomepageContent, HeroSlide, SocialCommerceItem } from '@/types';

export const dynamic = 'force-dynamic';

const HOMEPAGE_CONFIG_KEY = 'homepageContent';

const defaultHeroSlideStructure: HeroSlide = {
  id: '', title: 'New Collection', description: 'Discover the latest arrivals.', imageUrl: undefined, videoId: undefined, altText: 'Hero image', dataAiHint: 'fashion background', ctaText: 'Shop Now', ctaLink: '/products'
};

const defaultSocialCommerceItemStructure: SocialCommerceItem = {
  id: '', imageUrl: 'https://placehold.co/400x400.png?text=Social+Post', linkUrl: '#', altText: 'Social media post', dataAiHint: 'social fashion user'
};

const defaultHomepageContentData: HomepageContent = {
  heroSlides: [defaultHeroSlideStructure],
  artisanalRoots: { title: "Our Artisanal Roots (Default)", description: "Default description about heritage and craftsmanship." },
  socialCommerceItems: [defaultSocialCommerceItemStructure],
  heroVideoId: undefined,
  heroImageUrl: undefined,
};

// GET current homepage content for admin
export async function GET() {
  const clientToUse = supabaseAdmin || supabase; // Prefer admin for reading system config if available
  const usingAdminClient = supabaseAdmin === clientToUse;
  console.log(`[Admin API Homepage GET] Request to fetch. Using ${usingAdminClient ? "ADMIN client" : "PUBLIC client"}. Key: ${HOMEPAGE_CONFIG_KEY}`);

  if (!clientToUse) {
    console.error('[Admin API Homepage GET] CRITICAL: Database client (neither admin nor public) is not initialized.');
    return NextResponse.json({ ...defaultHomepageContentData, error: "Database client not configured on server." }, { status: 503 });
  }

  try {
    const { data, error } = await clientToUse
      .from('site_configurations')
      .select('value')
      .eq('config_key', HOMEPAGE_CONFIG_KEY)
      .maybeSingle();

    if (error) {
      console.error(`[Admin API Homepage GET] Supabase error fetching for ${HOMEPAGE_CONFIG_KEY}:`, JSON.stringify(error, null, 2));
      return NextResponse.json({ ...defaultHomepageContentData, error: `Failed to load content. Supabase: ${error.message}`, rawSupabaseError: error }, { status: 500 });
    }

    if (data && data.value) {
      console.log(`[Admin API Homepage GET] Successfully fetched for ${HOMEPAGE_CONFIG_KEY}.`);
      const dbContent = data.value as Partial<HomepageContent>;
      // Ensure structure matches HomepageContent, providing defaults for missing parts
      const responseData: HomepageContent = {
        heroSlides: (Array.isArray(dbContent.heroSlides) ? dbContent.heroSlides : []).map(slide => ({ ...defaultHeroSlideStructure, ...slide })),
        artisanalRoots: { ...defaultHomepageContentData.artisanalRoots!, ...dbContent.artisanalRoots },
        socialCommerceItems: (Array.isArray(dbContent.socialCommerceItems) ? dbContent.socialCommerceItems : []).map(item => ({ ...defaultSocialCommerceItemStructure, ...item })),
        heroVideoId: dbContent.heroVideoId === null ? undefined : dbContent.heroVideoId, // Ensure null from DB becomes undefined
        heroImageUrl: dbContent.heroImageUrl === null ? undefined : dbContent.heroImageUrl,
      };
      return NextResponse.json(responseData);
    } else {
      console.warn(`[Admin API Homepage GET] No content for ${HOMEPAGE_CONFIG_KEY}. Returning default structure for admin form.`);
      return NextResponse.json(defaultHomepageContentData);
    }
  } catch (e: any) {
    console.error(`[Admin API Homepage GET] UNHANDLED EXCEPTION fetching content for ${HOMEPAGE_CONFIG_KEY}:`, JSON.stringify(e, null, 2));
    return NextResponse.json({ ...defaultHomepageContentData, error: `Server error: ${e.message}` }, { status: 500 });
  }
}

// POST to update homepage content
export async function POST(request: NextRequest) {
  const clientForWrite = supabaseAdmin; // Admin operations should use service_role key
  
  console.log(`[Admin API Homepage POST] Request to update content. Key: ${HOMEPAGE_CONFIG_KEY}`);

  if (!clientForWrite) {
    console.error('[Admin API Homepage POST] CRITICAL: Supabase ADMIN client (service_role) is not initialized. Check SUPABASE_SERVICE_ROLE_KEY in .env and server restart.');
    return NextResponse.json({ 
        message: 'Database admin client not configured. Cannot save settings. Contact administrator.', 
        rawSupabaseError: { message: 'Internal server configuration error: Admin database client missing.'} 
    }, { status: 503 });
  }

  let newDataFromRequest: Partial<HomepageContent>;
  try {
    newDataFromRequest = await request.json();
    console.log(`[Admin API Homepage POST] Received payload:`, JSON.stringify(newDataFromRequest, null, 2).substring(0, 1000) + "...");
  } catch (e: any) {
    console.error(`[Admin API Homepage POST] Error parsing request JSON for ${HOMEPAGE_CONFIG_KEY}:`, e.message);
    return NextResponse.json({ message: 'Invalid JSON in request body.', error: e.message }, { status: 400 });
  }
  
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
      imageUrl: item.imageUrl || '', // Assuming imageUrl is required for social items
      linkUrl: item.linkUrl || '#',
      altText: item.altText || '',
      dataAiHint: item.dataAiHint || '',
    })),
    heroVideoId: newDataFromRequest.heroVideoId || undefined,
    heroImageUrl: newDataFromRequest.heroImageUrl || undefined,
  };
  
  try {
    console.log(`[Admin API Homepage POST] Attempting to save (upsert) data for key: ${HOMEPAGE_CONFIG_KEY} using ADMIN client.`);
    console.log(`[Admin API Homepage POST] Data to store:`, JSON.stringify(dataToStore, null, 2).substring(0, 1000) + "...");

    const { error } = await clientForWrite
      .from('site_configurations')
      .upsert(
        { config_key: HOMEPAGE_CONFIG_KEY, value: dataToStore as any, updated_at: new Date().toISOString() },
        { onConflict: 'config_key' }
      );

    if (error) {
      console.error(`[Admin API Homepage POST] Supabase error during upsert for ${HOMEPAGE_CONFIG_KEY}:`, JSON.stringify(error, null, 2));
      return NextResponse.json({
        message: `Failed to save homepage content to database. Supabase error: ${error.message}`,
        rawSupabaseError: { message: error.message, details: error.details, hint: error.hint, code: error.code }
      }, { status: 500 });
    }
    
    console.log(`[Admin API Homepage POST] Homepage content for ${HOMEPAGE_CONFIG_KEY} saved successfully.`);
    return NextResponse.json({ message: 'Homepage content updated successfully.' });

  } catch (e: any) {
    console.error(`[Admin API Homepage POST] UNHANDLED EXCEPTION updating content for ${HOMEPAGE_CONFIG_KEY}:`, JSON.stringify(e, null, 2));
    return NextResponse.json({ 
        message: 'Critical server error processing your request to save homepage content.', 
        errorDetails: e.message,
        rawSupabaseError: { message: e.message } 
    }, { status: 500 });
  }
}
