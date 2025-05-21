
// /src/app/api/admin/content/our-story/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '../../../../../lib/supabaseClient.ts';
import type { OurStoryContentData } from '@/types';

const OUR_STORY_CONFIG_KEY = 'ourStoryContent';

const defaultOurStoryContent: OurStoryContentData = {
  hero: { title: "Our Story", description: "Weaving together heritage and vision." },
  mission: { title: "Our Mission", paragraph1: "Elevating craftsmanship.", paragraph2: "Connecting cultures." },
  craftsmanship: { title: "The Art of Creation", paragraph1: "Honoring traditions.", paragraph2: "Sourcing quality." },
  valuesSection: { title: "Our Values: Beyond the Seams" },
  joinJourneySection: { title: "Join Our Journey", description: "Follow us for updates." }
};

// GET current Our Story content for admin
export async function GET() {
  console.log(`[Admin API OurStory GET] Request to fetch content from Supabase for key: ${OUR_STORY_CONFIG_KEY}`);
  if (!supabase) {
    console.error('[Admin API OurStory GET] Supabase client is not initialized.');
    return NextResponse.json({ message: 'Database client not configured.' }, { status: 503 });
  }

  try {
    const { data, error } = await supabase
      .from('site_configurations')
      .select('value')
      .eq('config_key', OUR_STORY_CONFIG_KEY)
      .maybeSingle();

    if (error) {
      console.error(`[Admin API OurStory GET] Supabase error fetching content for ${OUR_STORY_CONFIG_KEY}:`, error);
      return NextResponse.json({ message: 'Failed to fetch Our Story content.', rawSupabaseError: error }, { status: 500 });
    }

    if (data && data.value) {
      console.log(`[Admin API OurStory GET] Successfully fetched content for ${OUR_STORY_CONFIG_KEY}.`);
      // Merge with defaults to ensure all fields are present if DB data is partial
      const dbContent = data.value as Partial<OurStoryContentData>;
      const mergedContent: OurStoryContentData = {
        hero: { ...defaultOurStoryContent.hero, ...dbContent.hero },
        mission: { ...defaultOurStoryContent.mission, ...dbContent.mission },
        craftsmanship: { ...defaultOurStoryContent.craftsmanship, ...dbContent.craftsmanship },
        valuesSection: { ...defaultOurStoryContent.valuesSection, ...dbContent.valuesSection },
        joinJourneySection: { ...defaultOurStoryContent.joinJourneySection, ...dbContent.joinJourneySection },
      };
      return NextResponse.json(mergedContent);
    } else {
      console.log(`[Admin API OurStory GET] No content found for ${OUR_STORY_CONFIG_KEY}, returning default structure.`);
      return NextResponse.json(defaultOurStoryContent);
    }
  } catch (e) {
    console.error(`[Admin API OurStory GET] Unhandled error fetching content for ${OUR_STORY_CONFIG_KEY}:`, e);
    return NextResponse.json({ message: 'Error fetching Our Story content.', error: (e as Error).message }, { status: 500 });
  }
}

// POST to update Our Story content
export async function POST(request: NextRequest) {
  console.log(`[Admin API OurStory POST] Request to update content in Supabase for key: ${OUR_STORY_CONFIG_KEY}`);
  if (!supabase) {
    console.error('[Admin API OurStory POST] Supabase client is not initialized.');
    return NextResponse.json({ message: 'Database client not configured.' }, { status: 503 });
  }

  try {
    const newContent = await request.json() as OurStoryContentData;
    console.log(`[Admin API OurStory POST] Received new data for ${OUR_STORY_CONFIG_KEY}:`, newContent);
    
    const { error } = await supabase
      .from('site_configurations')
      .upsert({ config_key: OUR_STORY_CONFIG_KEY, value: newContent }, { onConflict: 'config_key' });

    if (error) {
      console.error(`[Admin API OurStory POST] Supabase error updating content for ${OUR_STORY_CONFIG_KEY}:`, error);
      return NextResponse.json({ message: 'Failed to update Our Story content.', rawSupabaseError: error }, { status: 500 });
    }
    
    console.log(`[Admin API OurStory POST] Our Story content for ${OUR_STORY_CONFIG_KEY} updated successfully.`);
    return NextResponse.json({ message: 'Our Story content updated successfully.' });
  } catch (e) {
    console.error(`[Admin API OurStory POST] Unhandled error updating content for ${OUR_STORY_CONFIG_KEY}:`, e);
    return NextResponse.json({ message: 'Error updating Our Story content.', error: (e as Error).message }, { status: 500 });
  }
}
