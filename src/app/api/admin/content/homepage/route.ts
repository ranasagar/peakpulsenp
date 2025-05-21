
// /src/app/api/admin/content/homepage/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '../../../../../lib/supabaseClient.ts';
import type { HomepageContent, HeroSlide, SocialCommerceItem } from '@/types';

const HOMEPAGE_CONFIG_KEY = 'homepageContent';

const defaultHomepageContent: HomepageContent = {
  heroSlides: [{ id: 'default-slide-admin', title: "Welcome to Peak Pulse", description: "Explore our collections.", ctaText: "Shop Now", ctaLink: "/products", imageUrl: "https://placehold.co/1920x1080.png", altText: "Default hero", dataAiHint: "fashion mountain" }],
  artisanalRoots: { title: "Our Artisanal Roots", description: "Discover the heritage behind our designs." },
  socialCommerceItems: [],
  heroVideoId: undefined,
  heroImageUrl: undefined,
};

// GET current homepage content for admin
export async function GET() {
  console.log(`[Admin API Homepage GET] Request to fetch content from Supabase for key: ${HOMEPAGE_CONFIG_KEY}`);
  if (!supabase) {
    console.error('[Admin API Homepage GET] Supabase client is not initialized.');
    return NextResponse.json({ message: 'Database client not configured.' }, { status: 503 });
  }

  try {
    const { data, error } = await supabase
      .from('site_configurations')
      .select('value')
      .eq('config_key', HOMEPAGE_CONFIG_KEY)
      .maybeSingle();

    if (error) {
      console.error(`[Admin API Homepage GET] Supabase error fetching content for ${HOMEPAGE_CONFIG_KEY}:`, error);
      return NextResponse.json({ message: 'Failed to fetch homepage content.', rawSupabaseError: error }, { status: 500 });
    }

    if (data && data.value) {
      console.log(`[Admin API Homepage GET] Successfully fetched content for ${HOMEPAGE_CONFIG_KEY}.`);
      // Ensure the structure matches HomepageContent, filling defaults if parts are missing
      const dbContent = data.value as Partial<HomepageContent>;
      const mergedContent: HomepageContent = {
        heroSlides: dbContent.heroSlides && dbContent.heroSlides.length > 0 ? dbContent.heroSlides.map(s => ({...defaultHomepageContent.heroSlides![0], ...s})) : defaultHomepageContent.heroSlides,
        artisanalRoots: { ...defaultHomepageContent.artisanalRoots!, ...dbContent.artisanalRoots },
        socialCommerceItems: dbContent.socialCommerceItems && dbContent.socialCommerceItems.length > 0 ? dbContent.socialCommerceItems : defaultHomepageContent.socialCommerceItems,
        heroVideoId: dbContent.heroVideoId === null ? undefined : dbContent.heroVideoId || defaultHomepageContent.heroVideoId,
        heroImageUrl: dbContent.heroImageUrl === null ? undefined : dbContent.heroImageUrl || defaultHomepageContent.heroImageUrl,
      };
      return NextResponse.json(mergedContent);
    } else {
      console.log(`[Admin API Homepage GET] No content found for ${HOMEPAGE_CONFIG_KEY}, returning default structure.`);
      return NextResponse.json(defaultHomepageContent);
    }
  } catch (e) {
    console.error(`[Admin API Homepage GET] Unhandled error fetching content for ${HOMEPAGE_CONFIG_KEY}:`, e);
    return NextResponse.json({ message: 'Error fetching homepage content.', error: (e as Error).message }, { status: 500 });
  }
}

// POST to update homepage content
export async function POST(request: NextRequest) {
  console.log(`[Admin API Homepage POST] Request to update content in Supabase for key: ${HOMEPAGE_CONFIG_KEY}`);
  if (!supabase) {
    console.error('[Admin API Homepage POST] Supabase client is not initialized.');
    return NextResponse.json({ message: 'Database client not configured.' }, { status: 503 });
  }

  try {
    const newContent = await request.json() as HomepageContentFormValues; // Use form values type
    console.log(`[Admin API Homepage POST] Received new data for ${HOMEPAGE_CONFIG_KEY}:`, newContent);

    // Map form values to HomepageContent structure
    const dataToUpsert: HomepageContent = {
      heroSlides: (newContent.heroSlides || []).map((slide, index) => ({
        id: slide.id || `slide-${Date.now()}-${index}`,
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
        title: newContent.artisanalRootsTitle || '',
        description: newContent.artisanalRootsDescription || '',
      },
      socialCommerceItems: (newContent.socialCommerceItems || []).map((item, index) => ({
        id: item.id || `social-${Date.now()}-${index}`,
        imageUrl: item.imageUrl, // Required by schema
        linkUrl: item.linkUrl,   // Required by schema
        altText: item.altText || '',
        dataAiHint: item.dataAiHint || '',
      })),
      heroVideoId: newContent.heroVideoId || undefined,
      heroImageUrl: newContent.heroImageUrl || undefined,
    };
    
    const { error } = await supabase
      .from('site_configurations')
      .upsert({ config_key: HOMEPAGE_CONFIG_KEY, value: dataToUpsert as any }, { onConflict: 'config_key' }); // Cast to any if Supabase types are strict

    if (error) {
      console.error(`[Admin API Homepage POST] Supabase error updating content for ${HOMEPAGE_CONFIG_KEY}:`, error);
      return NextResponse.json({ message: 'Failed to update homepage content.', rawSupabaseError: error }, { status: 500 });
    }
    
    console.log(`[Admin API Homepage POST] Homepage content for ${HOMEPAGE_CONFIG_KEY} updated successfully.`);
    return NextResponse.json({ message: 'Homepage content updated successfully.' });
  } catch (e) {
    console.error(`[Admin API Homepage POST] Unhandled error updating content for ${HOMEPAGE_CONFIG_KEY}:`, e);
    return NextResponse.json({ message: 'Error updating homepage content.', error: (e as Error).message }, { status: 500 });
  }
}

// Helper type for POST request body from form
type HomepageContentFormValues = {
  heroSlides?: Partial<HeroSlide>[];
  artisanalRootsTitle?: string;
  artisanalRootsDescription?: string;
  socialCommerceItems?: Partial<SocialCommerceItem>[];
  heroVideoId?: string;
  heroImageUrl?: string;
};
