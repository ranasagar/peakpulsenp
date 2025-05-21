
// /src/app/api/settings/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient.ts';
import type { SiteSettings } from '@/types';

export const dynamic = 'force-dynamic';
const SETTINGS_CONFIG_KEY = 'siteGeneralSettings';

const defaultSettings: SiteSettings = {
  siteTitle: "Peak Pulse - Default Title",
  siteDescription: "Default description for Peak Pulse. Discover unique apparel where Nepali heritage meets contemporary design.",
  storeEmail: "contact@example.com",
  storePhone: "+977-000-000000",
  storeAddress: "Kathmandu, Nepal (Default)",
  socialLinks: [] // Social links are typically part of footerContent or a separate settings key
};

export async function GET() {
  console.log(`[Public API Settings GET] Request to fetch settings from Supabase for key: ${SETTINGS_CONFIG_KEY}`);
  if (!supabase) {
    console.error('[Public API Settings GET] Supabase client is not initialized. Returning default settings.');
    return NextResponse.json(defaultSettings);
  }

  try {
    const { data, error } = await supabase
      .from('site_configurations')
      .select('value')
      .eq('config_key', SETTINGS_CONFIG_KEY)
      .maybeSingle();

    if (error) {
      console.error(`[Public API Settings GET] Supabase error fetching settings for ${SETTINGS_CONFIG_KEY}:`, error);
      return NextResponse.json({ ...defaultSettings, error: `Failed to load settings from database. ${error.message}` }, { status: 500 });
    }

    if (data && data.value) {
      console.log(`[Public API Settings GET] Successfully fetched settings for ${SETTINGS_CONFIG_KEY}.`);
      return NextResponse.json(data.value as SiteSettings);
    } else {
      console.warn(`[Public API Settings GET] No settings found for ${SETTINGS_CONFIG_KEY}. Returning default.`);
      return NextResponse.json(defaultSettings);
    }
  } catch (e) {
    console.error(`[Public API Settings GET] Unhandled error fetching settings for ${SETTINGS_CONFIG_KEY}, returning default. Error:`, (e as Error).message);
    return NextResponse.json({ ...defaultSettings, error: `Server error fetching settings. ${(e as Error).message}` }, { status: 500 });
  }
}
