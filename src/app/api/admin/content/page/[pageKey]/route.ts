
// /src/app/api/admin/content/page/[pageKey]/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '../../../../../../lib/supabaseClient.ts';
import type { PageContent } from '@/types';

export const dynamic = 'force-dynamic';

const CONFIG_PREFIX = 'pageContent_'; // To distinguish page content keys

// GET content for a specific page for admin editing
export async function GET(
  request: NextRequest,
  { params }: { params: { pageKey: string } }
) {
  const { pageKey } = params;
  const configKey = `${CONFIG_PREFIX}${pageKey}`;
  console.log(`[Admin API Page Content GET /${pageKey}] Request received for config_key: ${configKey}`);

  if (!supabase) {
    console.error(`[Admin API Page Content GET /${pageKey}] Supabase client is not initialized.`);
    return NextResponse.json({ message: 'Database client not configured.' }, { status: 503 });
  }

  if (!pageKey) {
    return NextResponse.json({ message: 'Page key parameter is required.' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('site_configurations')
      .select('value')
      .eq('config_key', configKey)
      .maybeSingle();

    if (error) {
      console.error(`[Admin API Page Content GET /${pageKey}] Supabase error fetching content for ${configKey}:`, error);
      return NextResponse.json({ message: `Failed to fetch content for ${pageKey}.`, rawSupabaseError: error }, { status: 500 });
    }

    if (data && data.value) {
      console.log(`[Admin API Page Content GET /${pageKey}] Successfully fetched content for ${configKey}.`);
      return NextResponse.json(data.value as PageContent);
    } else {
      console.log(`[Admin API Page Content GET /${pageKey}] No content found for ${configKey}, returning default structure.`);
      return NextResponse.json({ content: `Default content for ${pageKey}. Please edit.` } as PageContent);
    }
  } catch (e) {
    console.error(`[Admin API Page Content GET /${pageKey}] Unhandled error fetching content for ${configKey}:`, e);
    return NextResponse.json({ message: `Error fetching content for ${pageKey}.`, error: (e as Error).message }, { status: 500 });
  }
}

// POST to update content for a specific page
export async function POST(
  request: NextRequest,
  { params }: { params: { pageKey: string } }
) {
  const { pageKey } = params;
  const configKey = `${CONFIG_PREFIX}${pageKey}`;
  console.log(`[Admin API Page Content POST /${pageKey}] Request to update content for config_key: ${configKey}`);

  if (!supabase) {
    console.error(`[Admin API Page Content POST /${pageKey}] Supabase client is not initialized.`);
    return NextResponse.json({ message: 'Database client not configured.' }, { status: 503 });
  }

  if (!pageKey) {
    return NextResponse.json({ message: 'Page key parameter is required.' }, { status: 400 });
  }
  
  try {
    const newPageContent = await request.json() as PageContent; // Expects { content: "..." }
    console.log(`[Admin API Page Content POST /${pageKey}] Received new data for ${configKey}:`, newPageContent);

    if (typeof newPageContent.content !== 'string') {
        return NextResponse.json({ message: 'Invalid content format. Expected { content: "string" }.' }, { status: 400 });
    }

    const { error } = await supabase
      .from('site_configurations')
      .upsert({ config_key: configKey, value: { content: newPageContent.content } }, { onConflict: 'config_key' });

    if (error) {
      console.error(`[Admin API Page Content POST /${pageKey}] Supabase error updating content for ${configKey}:`, error);
      return NextResponse.json({ message: `Failed to update content for ${pageKey}.`, rawSupabaseError: error }, { status: 500 });
    }
    
    console.log(`[Admin API Page Content POST /${pageKey}] Content for ${configKey} updated successfully.`);
    return NextResponse.json({ message: `${pageKey} content updated successfully.` });
  } catch (e) {
    console.error(`[Admin API Page Content POST /${pageKey}] Unhandled error updating content for ${configKey}:`, e);
    return NextResponse.json({ message: `Error updating content for ${pageKey}.`, error: (e as Error).message }, { status: 500 });
  }
}
