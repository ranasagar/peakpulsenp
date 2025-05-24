
// /src/app/api/admin/content/our-story/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin, supabase as fallbackSupabase } from '@/lib/supabaseClient';
import type { OurStoryContentData } from '@/types';

const OUR_STORY_CONFIG_KEY = 'ourStoryContent';

const defaultOurStoryContent: OurStoryContentData = {
  hero: { title: "Our Story (Default)", description: "Default heritage and vision description." },
  mission: { title: "Our Mission (Default)", paragraph1: "Default mission paragraph 1.", paragraph2: "Default mission paragraph 2." },
  craftsmanship: { title: "The Art of Creation (Default)", paragraph1: "Default craftsmanship paragraph 1.", paragraph2: "Default craftsmanship paragraph 2." },
  valuesSection: { title: "Our Values (Default)" },
  joinJourneySection: { title: "Join Our Journey (Default)", description: "Default join journey description." }
};

// GET current Our Story content for admin
export async function GET() {
  const supabase = supabaseAdmin || fallbackSupabase;
   if (!supabase) {
    console.error('[Admin API OurStory GET] Supabase client is not initialized.');
    return NextResponse.json({ message: 'Database client not configured.', rawSupabaseError: { message: 'Supabase client not initialized.'} }, { status: 503 });
  }
  console.log(`[Admin API OurStory GET] Request to fetch content from Supabase for key: ${OUR_STORY_CONFIG_KEY}. Using ${supabase === supabaseAdmin ? "ADMIN client" : "public client"}`);

  try {
    const { data, error } = await supabase
      .from('site_configurations')
      .select('value')
      .eq('config_key', OUR_STORY_CONFIG_KEY)
      .maybeSingle();

    if (error) {
      console.error(`[Admin API OurStory GET] Supabase error fetching content for ${OUR_STORY_CONFIG_KEY}:`, error);
      return NextResponse.json({ ...defaultOurStoryContent, error: `Failed to load content. ${error.message}`, rawSupabaseError: error }, { status: 500 });
    }

    if (data && data.value) {
      console.log(`[Admin API OurStory GET] Successfully fetched content for ${OUR_STORY_CONFIG_KEY}.`);
      const dbContent = data.value as Partial<OurStoryContentData>;
      const responseData: OurStoryContentData = {
        hero: { ...defaultOurStoryContent.hero, ...dbContent.hero },
        mission: { ...defaultOurStoryContent.mission, ...dbContent.mission },
        craftsmanship: { ...defaultOurStoryContent.craftsmanship, ...dbContent.craftsmanship },
        valuesSection: { ...defaultOurStoryContent.valuesSection, ...dbContent.valuesSection },
        joinJourneySection: { ...defaultOurStoryContent.joinJourneySection, ...dbContent.joinJourneySection },
      };
      return NextResponse.json(responseData);
    } else {
      console.log(`[Admin API OurStory GET] No content found for ${OUR_STORY_CONFIG_KEY}, returning default structure.`);
      return NextResponse.json(defaultOurStoryContent);
    }
  } catch (e) {
    console.error(`[Admin API OurStory GET] Unhandled error fetching content for ${OUR_STORY_CONFIG_KEY}:`, e);
    return NextResponse.json({ ...defaultOurStoryContent, error: `Server error fetching Our Story content. ${(e as Error).message}` }, { status: 500 });
  }
}

// POST to update Our Story content
export async function POST(request: NextRequest) {
  const client = supabaseAdmin || fallbackSupabase;
  if (!client) {
    console.error('[Admin API OurStory POST] Supabase client is not initialized.');
    return NextResponse.json({ message: 'Database client not configured.', rawSupabaseError: { message: 'Supabase client not initialized.'} }, { status: 503 });
  }
  console.log(`[Admin API OurStory POST] Request to update content. Using ${client === supabaseAdmin ? "ADMIN client" : "public client"}`);
  
  try {
    const newContent = await request.json() as OurStoryContentData;
    console.log(`[Admin API OurStory POST] Received new data for ${OUR_STORY_CONFIG_KEY}:`, JSON.stringify(newContent, null, 2));
    
    const dataToUpsert: OurStoryContentData = {
      hero: newContent.hero || defaultOurStoryContent.hero,
      mission: newContent.mission || defaultOurStoryContent.mission,
      craftsmanship: newContent.craftsmanship || defaultOurStoryContent.craftsmanship,
      valuesSection: newContent.valuesSection || defaultOurStoryContent.valuesSection,
      joinJourneySection: newContent.joinJourneySection || defaultOurStoryContent.joinJourneySection,
    };

    const { error } = await client
      .from('site_configurations')
      .upsert({ config_key: OUR_STORY_CONFIG_KEY, value: dataToUpsert }, { onConflict: 'config_key' });

    if (error) {
      console.error(`[Admin API OurStory POST] Supabase error updating content for ${OUR_STORY_CONFIG_KEY}:`, error);
      return NextResponse.json({ 
        message: `Supabase error: ${error.message}`,
        rawSupabaseError: { message: error.message, details: error.details, hint: error.hint, code: error.code }
      }, { status: 500 });
    }
    
    console.log(`[Admin API OurStory POST] Our Story content for ${OUR_STORY_CONFIG_KEY} updated successfully.`);
    return NextResponse.json({ message: 'Our Story content updated successfully.' });
  } catch (e) {
    console.error(`[Admin API OurStory POST] Unhandled error updating content for ${OUR_STORY_CONFIG_KEY}:`, e);
    const errorMessage = (e instanceof Error) ? e.message : 'An unknown error occurred.';
    if (e instanceof SyntaxError && e.message.toLowerCase().includes('json')) {
      return NextResponse.json({ message: 'Invalid JSON in request body.', error: errorMessage }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to update Our Story content.', error: errorMessage }, { status: 500 });
  }
}

    