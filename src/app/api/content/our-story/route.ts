
// /src/app/api/content/our-story/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient.ts';
import type { OurStoryContentData } from '@/types';

export const dynamic = 'force-dynamic';
const OUR_STORY_CONFIG_KEY = 'ourStoryContent';

const fallbackContent: OurStoryContentData = {
  hero: { title: "Our Story (Default)", description: "Weaving together heritage and vision to share with the world." },
  mission: { title: "Our Mission (Default)", paragraph1: "Elevating craftsmanship and connecting cultures through unique apparel.", paragraph2: "Every piece tells a story of tradition and modernity." },
  craftsmanship: { title: "The Art of Creation (Default)", paragraph1: "Honoring ancient techniques with a commitment to quality.", paragraph2: "Sustainably sourced materials form the heart of our designs." },
  valuesSection: { title: "Our Values: Beyond the Seams (Default)" },
  joinJourneySection: { title: "Join Our Journey (Default)", description: "Follow us and be part of the Peak Pulse story." },
  error: "Using default content structure."
};

export async function GET() {
  console.log(`[Public API OurStory GET] Request to fetch content from Supabase for key: ${OUR_STORY_CONFIG_KEY}`);
  if (!supabase) {
    console.error('[Public API OurStory GET] Supabase client is not initialized. Returning fallback content.');
    return NextResponse.json({ ...fallbackContent, error: "Database client not configured." });
  }

  try {
    const { data, error } = await supabase
      .from('site_configurations')
      .select('value')
      .eq('config_key', OUR_STORY_CONFIG_KEY)
      .maybeSingle();

    if (error) {
      console.error(`[Public API OurStory GET] Supabase error fetching content for ${OUR_STORY_CONFIG_KEY}:`, error);
      return NextResponse.json({ ...fallbackContent, error: `Failed to load Our Story content from database. ${error.message}` }, { status: 500 });
    }

    if (data && data.value) {
      console.log(`[Public API OurStory GET] Successfully fetched content for ${OUR_STORY_CONFIG_KEY}.`);
      // Merge with defaults to ensure all fields are present if DB data is partial
      const dbContent = data.value as Partial<OurStoryContentData>;
      const responseData: OurStoryContentData = {
        hero: { ...fallbackContent.hero, ...dbContent.hero },
        mission: { ...fallbackContent.mission, ...dbContent.mission },
        craftsmanship: { ...fallbackContent.craftsmanship, ...dbContent.craftsmanship },
        valuesSection: { ...fallbackContent.valuesSection, ...dbContent.valuesSection },
        joinJourneySection: { ...fallbackContent.joinJourneySection, ...dbContent.joinJourneySection },
      };
      return NextResponse.json(responseData);
    } else {
      console.warn(`[Public API OurStory GET] No content found for ${OUR_STORY_CONFIG_KEY}. Returning fallback.`);
      return NextResponse.json({ ...fallbackContent, error: "Our Story content not found in database." });
    }
  } catch (e) {
    console.error(`[Public API OurStory GET] Unhandled error fetching content for ${OUR_STORY_CONFIG_KEY}, returning fallback. Error:`, (e as Error).message);
    return NextResponse.json({ ...fallbackContent, error: `Server error fetching Our Story content. ${(e as Error).message}` }, { status: 500 });
  }
}
