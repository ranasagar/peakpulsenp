
// /src/app/api/settings/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import type { SiteSettings } from '@/types';

export const dynamic = 'force-dynamic';
const SETTINGS_CONFIG_KEY = 'siteGeneralSettings';

const defaultSettings: SiteSettings = {
  siteTitle: "Peak Pulse - Nepali Craftsmanship (Default)",
  siteDescription: "Default description: Discover Peak Pulse, a Nepali clothing brand blending traditional craftsmanship with contemporary streetwear.",
  storeEmail: "contact@peakpulse.example.com",
  storePhone: "+977-XXX-XXXXXX (Default)",
  storeAddress: "Kathmandu, Nepal (Default)",
  socialLinks: [],
  showExternalLinkWarning: true,
  whatsappNumber: "9862020757",
  instagramUsername: "peakpulsenp",
  facebookUsernameOrPageId: "peakpulsenp",
};

export async function GET() {
  if (!supabase) {
    console.error('[Public API Settings GET] Supabase client is not initialized. Returning default settings.');
    return NextResponse.json({ ...defaultSettings, error: "Database client not configured." });
  }
  // console.log(`[Public API Settings GET] Request to fetch settings from Supabase for key: ${SETTINGS_CONFIG_KEY}`);

  try {
    const { data, error } = await supabase
      .from('site_configurations')
      .select('value')
      .eq('config_key', SETTINGS_CONFIG_KEY)
      .maybeSingle();

    if (error) {
      console.error(`[Public API Settings GET] Supabase error fetching settings for ${SETTINGS_CONFIG_KEY}:`, error);
      return NextResponse.json({ ...defaultSettings, error: `Failed to load settings. Supabase: ${error.message}` }, { status: 500 });
    }

    if (data && data.value) {
      // console.log(`[Public API Settings GET] Successfully fetched settings for ${SETTINGS_CONFIG_KEY}.`);
      const dbSettings = data.value as Partial<SiteSettings>;
      const responseSettings: SiteSettings = {
        siteTitle: dbSettings.siteTitle || defaultSettings.siteTitle,
        siteDescription: dbSettings.siteDescription || defaultSettings.siteDescription,
        storeEmail: dbSettings.storeEmail || defaultSettings.storeEmail,
        storePhone: dbSettings.storePhone || defaultSettings.storePhone,
        storeAddress: dbSettings.storeAddress || defaultSettings.storeAddress,
        socialLinks: dbSettings.socialLinks || defaultSettings.socialLinks,
        showExternalLinkWarning: dbSettings.showExternalLinkWarning === undefined ? defaultSettings.showExternalLinkWarning : dbSettings.showExternalLinkWarning,
        whatsappNumber: dbSettings.whatsappNumber || defaultSettings.whatsappNumber,
        instagramUsername: dbSettings.instagramUsername || defaultSettings.instagramUsername,
        facebookUsernameOrPageId: dbSettings.facebookUsernameOrPageId || defaultSettings.facebookUsernameOrPageId,
      };
      return NextResponse.json(responseSettings);
    } else {
      // console.warn(`[Public API Settings GET] No settings found for ${SETTINGS_CONFIG_KEY}. Returning default.`);
      return NextResponse.json(defaultSettings);
    }
  } catch (e) {
    console.error(`[Public API Settings GET] Unhandled error fetching settings for ${SETTINGS_CONFIG_KEY}:`, e);
    return NextResponse.json({ ...defaultSettings, error: `Server error fetching settings. ${(e as Error).message}` }, { status: 500 });
  }
}
