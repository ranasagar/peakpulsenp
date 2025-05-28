
// /src/app/api/content/homepage/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase as fallbackSupabase } from '@/lib/supabaseClient';
import type { HomepageContent, HeroSlide, SocialCommerceItem } from '@/types';

export const dynamic = 'force-dynamic';
const HOMEPAGE_CONFIG_KEY = 'homepageContent';

const defaultHeroSlideStructure: Omit<HeroSlide, 'id'> = {
  title: "Welcome to Peak Pulse",
  description: "Discover unique apparel where Nepali heritage meets contemporary design.",
  imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&h=1080&q=80",
  altText: "Peak Pulse Default Hero",
  dataAiHint: "fashion abstract modern",
  ctaText: "Shop Collection",
  ctaLink: "/products",
  videoId: undefined,
};

const defaultSocialCommerceItemStructure: Omit<SocialCommerceItem, 'id'> = {
  imageUrl: 'https://placehold.co/400x400.png?text=Peak+Style', linkUrl: '#', altText: 'User style post', dataAiHint: 'fashion user social', displayOrder: 0
};

const defaultHomepageContentData: HomepageContent = {
  heroSlides: [defaultHeroSlideStructure],
  artisanalRoots: { title: "Our Artisanal Roots", description: "Every thread tells a story of tradition and innovation." },
  socialCommerceItems: [],
  heroVideoId: undefined,
  heroImageUrl: undefined,
};

export async function GET() {
  const supabase = supabaseAdmin || fallbackSupabase;
  if (!supabase) {
    console.error('[Public API Homepage GET] Supabase client not initialized. Returning hardcoded fallback.');
    return NextResponse.json({ ...defaultHomepageContentData, error: "Database client not configured." });
  }
  
  try {
    const { data, error } = await supabase
      .from('site_configurations')
      .select('value')
      .eq('config_key', HOMEPAGE_CONFIG_KEY)
      .maybeSingle();

    if (error) {
      console.error(`[Public API Homepage GET] Supabase error fetching for ${HOMEPAGE_CONFIG_KEY}:`, error);
      return NextResponse.json({ ...defaultHomepageContentData, error: `Failed to load content. Supabase: ${error.message}`, rawSupabaseError: error }, { status: 500 });
    }

    if (data && data.value) {
      const dbContent = data.value as Partial<HomepageContent>;
      const responseData: HomepageContent = {
        heroSlides: (Array.isArray(dbContent.heroSlides) && dbContent.heroSlides.length > 0 
          ? dbContent.heroSlides.map(slide => ({ ...defaultHeroSlideStructure, ...slide })) 
          : [defaultHeroSlideStructure]), // Ensure at least one slide if array is empty/missing
        artisanalRoots: { ...defaultHomepageContentData.artisanalRoots!, ...dbContent.artisanalRoots },
        socialCommerceItems: (Array.isArray(dbContent.socialCommerceItems) 
          ? dbContent.socialCommerceItems.map(item => ({ ...defaultSocialCommerceItemStructure, ...item }))
          : defaultHomepageContentData.socialCommerceItems!
        ).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)), // Sort here
        heroVideoId: dbContent.heroVideoId === null ? undefined : dbContent.heroVideoId,
        heroImageUrl: dbContent.heroImageUrl === null ? undefined : dbContent.heroImageUrl,
      };
      return NextResponse.json(responseData);
    } else {
      console.warn(`[Public API Homepage GET] No content found for ${HOMEPAGE_CONFIG_KEY}. Returning default structure.`);
      return NextResponse.json(defaultHomepageContentData);
    }
  } catch (e: any) {
    console.error(`[Public API Homepage GET] UNHANDLED EXCEPTION fetching content for ${HOMEPAGE_CONFIG_KEY}:`, e);
    return NextResponse.json({ ...defaultHomepageContentData, error: `Server error: ${e.message}` }, { status: 500 });
  }
}
