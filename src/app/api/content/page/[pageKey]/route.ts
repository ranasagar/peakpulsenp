
// /src/app/api/content/page/[pageKey]/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '../../../../../lib/supabaseClient.ts';
import type { PageContent } from '@/types';

export const dynamic = 'force-dynamic';

const CONFIG_PREFIX = 'pageContent_';

export async function GET(
  request: NextRequest,
  { params }: { params: { pageKey: string } }
) {
  const { pageKey } = params;
  const configKey = `${CONFIG_PREFIX}${pageKey}`;
  console.log(`[Public API Page Content GET /${pageKey}] Request for config_key: ${configKey}`);

  if (!supabase) {
    console.error(`[Public API Page Content GET /${pageKey}] Supabase client not initialized.`);
    return NextResponse.json({ content: `Error: Database service unavailable for ${pageKey}.`, error: "Database client not configured." } as PageContent, { status: 503 });
  }

  if (!pageKey) {
    return NextResponse.json({ content: `Error: Page key missing for ${pageKey}.`, error: "Page key parameter is required." } as PageContent, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('site_configurations')
      .select('value')
      .eq('config_key', configKey)
      .maybeSingle();

    if (error) {
      console.error(`[Public API Page Content GET /${pageKey}] Supabase error fetching content for ${configKey}:`, error);
      return NextResponse.json({ 
        content: `Error: Could not load content for ${pageKey}. Details: ${error.message}`, 
        error: error.message 
      } as PageContent, { status: 500 });
    }

    if (data && data.value && typeof (data.value as any).content === 'string') {
      console.log(`[Public API Page Content GET /${pageKey}] Successfully fetched content for ${configKey}.`);
      return NextResponse.json(data.value as PageContent);
    } else {
      const defaultText = `Content for '${pageKey}' is not yet available. Please check back later or contact support.`;
      console.warn(`[Public API Page Content GET /${pageKey}] No content found or invalid format for ${configKey}. Returning default.`);
      return NextResponse.json({ content: defaultText, error: "Content not found" } as PageContent, { status: 404 });
    }
  } catch (e) {
    console.error(`[Public API Page Content GET /${pageKey}] Unhandled error for ${configKey}:`, e);
    return NextResponse.json({ 
      content: `Error: Server error while loading content for ${pageKey}.`, 
      error: (e as Error).message 
    } as PageContent, { status: 500 });
  }
}
