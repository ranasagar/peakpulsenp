
// /src/app/api/admin/content/our-story/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin, supabase as fallbackSupabase } from '../../../../../lib/supabaseClient';
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

// GET current Our Story content for admin
export async function GET() {
  const client = supabaseAdmin || fallbackSupabase;
   if (!client) {
    console.error('[Admin API OurStory GET] Supabase client is not initialized.');
    return NextResponse.json({ 
        ...defaultOurStoryContentData, 
        error: 'Database client not configured.', 
        rawSupabaseError: { message: 'Supabase client not initialized.'} 
    }, { status: 503 });
  }
  // console.log(`[Admin API OurStory GET] Request to fetch content from Supabase for key: ${OUR_STORY_CONFIG_KEY}. Using ${client === supabaseAdmin ? "ADMIN client" : "public client"}`);

  try {
    const { data, error } = await client
      .from('site_configurations')
      .select('value')
      .eq('config_key', OUR_STORY_CONFIG_KEY)
      .maybeSingle();

    if (error) {
      console.error(`[Admin API OurStory GET] Supabase error fetching content for ${OUR_STORY_CONFIG_KEY}:`, error);
      return NextResponse.json({ ...defaultOurStoryContentData, error: `Failed to load content. ${error.message}`, rawSupabaseError: error }, { status: 500 });
    }

    if (data && data.value) {
      // console.log(`[Admin API OurStory GET] Successfully fetched content for ${OUR_STORY_CONFIG_KEY}.`);
      const dbContent = data.value as Partial<OurStoryContentData>;
      // Merge fetched data with defaults to ensure all sections are present for the form
      const responseData: OurStoryContentData = {
        hero: { ...defaultOurStoryContentData.hero, ...dbContent.hero },
        mission: { ...defaultOurStoryContentData.mission, ...dbContent.mission },
        craftsmanship: { ...defaultOurStoryContentData.craftsmanship, ...dbContent.craftsmanship },
        valuesSection: { ...defaultOurStoryContentData.valuesSection, ...dbContent.valuesSection },
        joinJourneySection: { ...defaultOurStoryContentData.joinJourneySection, ...dbContent.joinJourneySection },
      };
      return NextResponse.json(responseData);
    } else {
      // console.log(`[Admin API OurStory GET] No content found for ${OUR_STORY_CONFIG_KEY}, returning default structure for admin form.`);
      return NextResponse.json(defaultOurStoryContentData);
    }
  } catch (e: any) {
    console.error(`[Admin API OurStory GET] Unhandled error fetching content for ${OUR_STORY_CONFIG_KEY}:`, e);
    return NextResponse.json({ ...defaultOurStoryContentData, error: `Server error fetching Our Story content. ${e.message}` }, { status: 500 });
  }
}

// POST to update Our Story content
export async function POST(request: NextRequest) {
  const client = supabaseAdmin || fallbackSupabase;
  if (!client) {
    console.error('[Admin API OurStory POST] Supabase client is not initialized. Cannot save settings.');
    return NextResponse.json({ 
        message: 'Database client not configured. Cannot save settings.', 
        rawSupabaseError: { message: 'Supabase client not configured.'} 
    }, { status: 503 });
  }
  if (client === fallbackSupabase) {
    console.warn("[Admin API OurStory POST] Using fallback public Supabase client. RLS policies for 'authenticated' admin role will apply if service key is not used.");
  } else {
    // console.log(`[Admin API OurStory POST] Using ADMIN client (service_role) for write operation.`);
  }
  
  try {
    const newContent = await request.json() as OurStoryContentData;
    // console.log(`[Admin API OurStory POST] Received new data for ${OUR_STORY_CONFIG_KEY}:`, JSON.stringify(newContent, null, 2));
    
    // Sanitize and ensure all sections are present, even if empty, to match the defined structure
    const dataToUpsert: OurStoryContentData = {
      hero: { ...defaultSectionStructure, ...newContent.hero },
      mission: { ...defaultSectionStructure, ...newContent.mission },
      craftsmanship: { ...defaultSectionStructure, ...newContent.craftsmanship },
      valuesSection: { ...defaultSectionStructure, ...newContent.valuesSection }, // Only title is typically used here from current frontend
      joinJourneySection: { ...defaultSectionStructure, ...newContent.joinJourneySection },
    };

    const { error } = await client
      .from('site_configurations')
      .upsert({ config_key: OUR_STORY_CONFIG_KEY, value: dataToUpsert, updated_at: new Date().toISOString() }, { onConflict: 'config_key' });

    if (error) {
      console.error(`[Admin API OurStory POST] Supabase error updating content for ${OUR_STORY_CONFIG_KEY}:`, error);
      return NextResponse.json({ 
        message: `Supabase error: ${error.message}`,
        rawSupabaseError: { message: error.message, details: error.details, hint: error.hint, code: error.code }
      }, { status: 500 });
    }
    
    // console.log(`[Admin API OurStory POST] Our Story content for ${OUR_STORY_CONFIG_KEY} updated successfully.`);
    return NextResponse.json({ message: 'Our Story content updated successfully.' });
  } catch (e: any) {
    console.error(`[Admin API OurStory POST] Unhandled error updating content for ${OUR_STORY_CONFIG_KEY}:`, e);
    const errorMessage = (e instanceof Error) ? e.message : 'An unknown error occurred.';
    if (e instanceof SyntaxError && e.message.toLowerCase().includes('json')) {
      return NextResponse.json({ message: 'Invalid JSON in request body.', error: errorMessage }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to update Our Story content.', error: errorMessage }, { status: 500 });
  }
}

    