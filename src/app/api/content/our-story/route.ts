
// /src/app/api/content/our-story/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase as fallbackSupabase } from '../../../../lib/supabaseClient';
import type { OurStoryContentData, OurStorySection } from '@/types';

export const dynamic = 'force-dynamic';
const OUR_STORY_CONFIG_KEY = 'ourStoryContent';

const defaultSectionStructure: OurStorySection = { 
    title: '', description: '', paragraph1: '', paragraph2: '', imageUrl: '', imageAltText: '', imageAiHint: '' 
};

const defaultOurStoryContentData: OurStoryContentData = {
  hero: { ...defaultSectionStructure, title: "Our Story (Default)", description: "Default heritage and vision description." },
  mission: { ...defaultSectionStructure, title: "Our Mission (Default)", paragraph1: "Default mission paragraph 1.", paragraph2: "Default mission paragraph 2." },
  craftsmanship: { ...defaultSectionStructure, title: "The Art of Creation (Default)", paragraph1: "Default craftsmanship paragraph 1.", paragraph2: "Default craftsmanship paragraph 2." },
  valuesSection: { ...defaultSectionStructure, title: "Our Values (Default)" },
  joinJourneySection: { ...defaultSectionStructure, title: "Join Our Journey (Default)", description: "Default join journey description." }
};

export async function GET() {
  const supabase = supabaseAdmin || fallbackSupabase; // Use admin for consistency if available, otherwise public
   if (!supabase) {
    console.error('[Public API OurStory GET] Supabase client is not initialized. Returning default content.');
    return NextResponse.json({ ...defaultOurStoryContentData, error: "Database client not configured." });
  }
  // console.log(`[Public API OurStory GET] Request to fetch content from Supabase for key: ${OUR_STORY_CONFIG_KEY}. Using ${supabase === supabaseAdmin ? "ADMIN client" : "public client"}`);

  try {
    const { data, error } = await supabase
      .from('site_configurations')
      .select('value')
      .eq('config_key', OUR_STORY_CONFIG_KEY)
      .maybeSingle();

    if (error) {
      console.error(`[Public API OurStory GET] Supabase error fetching content for ${OUR_STORY_CONFIG_KEY}:`, error);
      return NextResponse.json({ 
        ...defaultOurStoryContentData, 
        error: `Failed to load Our Story content. Supabase: ${error.message}`,
        rawSupabaseError: error 
      }, { status: 500 });
    }

    if (data && data.value) {
      // console.log(`[Public API OurStory GET] Successfully fetched content for ${OUR_STORY_CONFIG_KEY}.`);
      const dbContent = data.value as Partial<OurStoryContentData>;
      // Merge with defaults to ensure all sections/fields are present for the frontend
      const responseData: OurStoryContentData = {
        hero: { ...defaultOurStoryContentData.hero, ...dbContent.hero },
        mission: { ...defaultOurStoryContentData.mission, ...dbContent.mission },
        craftsmanship: { ...defaultOurStoryContentData.craftsmanship, ...dbContent.craftsmanship },
        valuesSection: { ...defaultOurStoryContentData.valuesSection, ...dbContent.valuesSection },
        joinJourneySection: { ...defaultOurStoryContentData.joinJourneySection, ...dbContent.joinJourneySection },
      };
      return NextResponse.json(responseData);
    } else {
      // console.warn(`[Public API OurStory GET] No content found for ${OUR_STORY_CONFIG_KEY}. Returning default.`);
      return NextResponse.json(defaultOurStoryContentData);
    }
  } catch (e: any) {
    console.error(`[Public API OurStory GET] Unhandled error for ${OUR_STORY_CONFIG_KEY}:`, e);
    return NextResponse.json({ 
        ...defaultOurStoryContentData, 
        error: `Server error fetching Our Story content. ${(e as Error).message}` 
    }, { status: 500 });
  }
}

    