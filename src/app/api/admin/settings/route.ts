
// /src/app/api/admin/settings/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient.ts';
import type { SiteSettings } from '@/types';

const SETTINGS_CONFIG_KEY = 'siteGeneralSettings';

const defaultSettings: SiteSettings = {
  siteTitle: "Peak Pulse",
  siteDescription: "Discover Peak Pulse, a Nepali clothing brand blending traditional craftsmanship with contemporary streetwear.",
  storeEmail: "info@peakpulse.com",
  storePhone: "+977-1-XXXXXXX",
  storeAddress: "Kathmandu, Nepal",
  socialLinks: [ // This part is actually managed via footerContent now, but let's keep structure for other settings
    { platform: "Instagram", url: "https://instagram.com/peakpulse" },
  ]
};

// GET current site settings for admin
export async function GET() {
  console.log(`[Admin API Settings GET] Request to fetch settings from Supabase for key: ${SETTINGS_CONFIG_KEY}`);
  if (!supabase) {
    console.error('[Admin API Settings GET] Supabase client is not initialized.');
    return NextResponse.json({ message: 'Database client not configured.' }, { status: 503 });
  }

  try {
    const { data, error } = await supabase
      .from('site_configurations')
      .select('value')
      .eq('config_key', SETTINGS_CONFIG_KEY)
      .maybeSingle();

    if (error) {
      console.error(`[Admin API Settings GET] Supabase error fetching settings for ${SETTINGS_CONFIG_KEY}:`, error);
      return NextResponse.json({ message: 'Failed to fetch site settings from database.', rawSupabaseError: error }, { status: 500 });
    }

    if (data && data.value) {
      console.log(`[Admin API Settings GET] Successfully fetched settings for ${SETTINGS_CONFIG_KEY}.`);
      return NextResponse.json(data.value as SiteSettings);
    } else {
      console.log(`[Admin API Settings GET] No settings found for ${SETTINGS_CONFIG_KEY}, returning default structure.`);
      return NextResponse.json(defaultSettings);
    }
  } catch (e) {
    console.error(`[Admin API Settings GET] Unhandled error fetching settings for ${SETTINGS_CONFIG_KEY}:`, e);
    return NextResponse.json({ message: 'Error fetching site settings.', error: (e as Error).message }, { status: 500 });
  }
}

// POST to update site settings
export async function POST(request: NextRequest) {
  console.log(`[Admin API Settings POST] Request to update settings in Supabase for key: ${SETTINGS_CONFIG_KEY}`);
  if (!supabase) {
    console.error('[Admin API Settings POST] Supabase client is not initialized.');
    return NextResponse.json({ message: 'Database client not configured.' }, { status: 503 });
  }

  try {
    const newSettings = await request.json() as Partial<SiteSettings>; // Allow partial updates from form
    console.log(`[Admin API Settings POST] Received new data for ${SETTINGS_CONFIG_KEY}:`, newSettings);

    // Merge with defaults to ensure all fields are present if newSettings is partial
    const dataToUpsert: SiteSettings = {
      siteTitle: newSettings.siteTitle || defaultSettings.siteTitle,
      siteDescription: newSettings.siteDescription || defaultSettings.siteDescription,
      storeEmail: newSettings.storeEmail || defaultSettings.storeEmail,
      storePhone: newSettings.storePhone || defaultSettings.storePhone,
      storeAddress: newSettings.storeAddress || defaultSettings.storeAddress,
      socialLinks: newSettings.socialLinks || defaultSettings.socialLinks, // Keep if form sends it
    };
    
    const { error } = await supabase
      .from('site_configurations')
      .upsert({ config_key: SETTINGS_CONFIG_KEY, value: dataToUpsert }, { onConflict: 'config_key' });

    if (error) {
      console.error(`[Admin API Settings POST] Supabase error updating settings for ${SETTINGS_CONFIG_KEY}:`, error);
      return NextResponse.json({ message: 'Failed to update site settings in database.', rawSupabaseError: error }, { status: 500 });
    }
    
    console.log(`[Admin API Settings POST] Site settings for ${SETTINGS_CONFIG_KEY} updated successfully.`);
    return NextResponse.json({ message: 'Site settings updated successfully.' });
  } catch (e) {
    console.error(`[Admin API Settings POST] Unhandled error updating settings for ${SETTINGS_CONFIG_KEY}:`, e);
    return NextResponse.json({ message: 'Error updating site settings.', error: (e as Error).message }, { status: 500 });
  }
}
