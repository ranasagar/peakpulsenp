
// /src/app/api/admin/settings/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin, supabase as fallbackSupabase } from '@/lib/supabaseClient';
import type { SiteSettings } from '@/types';

const SETTINGS_CONFIG_KEY = 'siteGeneralSettings';

const defaultSettings: SiteSettings = {
  siteTitle: "Peak Pulse (Default)",
  siteDescription: "Default description for Peak Pulse. Discover unique apparel where Nepali heritage meets contemporary design.",
  headerLogoUrl: undefined,
  headerSiteTitle: "Peak Pulse",
  storeEmail: "info@example.com",
  storePhone: "+977-000-000000",
  storeAddress: "Kathmandu, Nepal (Default Address)",
  socialLinks: [],
  showExternalLinkWarning: true,
  whatsappNumber: "9862020757",
  instagramUsername: "peakpulsenp",
  facebookUsernameOrPageId: "peakpulsenp",
};

// GET current site settings for admin
export async function GET() {
  const supabase = supabaseAdmin || fallbackSupabase;
  if (!supabase) {
    console.error('[Admin API Settings GET] Supabase client is not initialized.');
    return NextResponse.json({ message: 'Database client not configured.', rawSupabaseError: { message: 'Supabase client not initialized.'} }, { status: 503 });
  }
  // console.log(`[Admin API Settings GET] Request to fetch settings. Using ${supabase === supabaseAdmin ? "ADMIN client" : "public client"}`);

  try {
    const { data, error } = await supabase
      .from('site_configurations')
      .select('value')
      .eq('config_key', SETTINGS_CONFIG_KEY)
      .maybeSingle();

    if (error) {
      console.error(`[Admin API Settings GET] Supabase error fetching settings for ${SETTINGS_CONFIG_KEY}:`, error);
      return NextResponse.json({ ...defaultSettings, error: `Failed to load settings. ${error.message}`, rawSupabaseError: error }, { status: 500 });
    }

    if (data && data.value) {
      // console.log(`[Admin API Settings GET] Successfully fetched settings for ${SETTINGS_CONFIG_KEY}.`);
      const dbSettings = data.value as Partial<SiteSettings>;
      const responseSettings: SiteSettings = {
        siteTitle: dbSettings.siteTitle || defaultSettings.siteTitle,
        siteDescription: dbSettings.siteDescription || defaultSettings.siteDescription,
        headerLogoUrl: dbSettings.headerLogoUrl || defaultSettings.headerLogoUrl,
        headerSiteTitle: dbSettings.headerSiteTitle || defaultSettings.headerSiteTitle,
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
      // console.log(`[Admin API Settings GET] No settings found for ${SETTINGS_CONFIG_KEY}, returning default structure.`);
      return NextResponse.json(defaultSettings);
    }
  } catch (e) {
    console.error(`[Admin API Settings GET] Unhandled error fetching settings for ${SETTINGS_CONFIG_KEY}:`, e);
    return NextResponse.json({ ...defaultSettings, error: `Server error fetching site settings. ${(e as Error).message}` }, { status: 500 });
  }
}

// POST to update site settings
export async function POST(request: NextRequest) {
  const client = supabaseAdmin || fallbackSupabase;
  if (!client) {
    console.error('[Admin API Settings POST] Supabase client is not initialized.');
    return NextResponse.json({ message: 'Database client not configured.', rawSupabaseError: { message: 'Supabase client not initialized.'} }, { status: 503 });
  }
  // console.log(`[Admin API Settings POST] Request to update settings. Using ${client === supabaseAdmin ? "ADMIN client" : "public client"}`);

  try {
    const newSettings = await request.json() as Partial<SiteSettings>;
    // console.log(`[Admin API Settings POST] Received new data for ${SETTINGS_CONFIG_KEY}:`, JSON.stringify(newSettings, null, 2));

    const dataToUpsert: SiteSettings = {
      siteTitle: newSettings.siteTitle || defaultSettings.siteTitle,
      siteDescription: newSettings.siteDescription || defaultSettings.siteDescription,
      headerLogoUrl: newSettings.headerLogoUrl || defaultSettings.headerLogoUrl,
      headerSiteTitle: newSettings.headerSiteTitle || defaultSettings.headerSiteTitle,
      storeEmail: newSettings.storeEmail || defaultSettings.storeEmail,
      storePhone: newSettings.storePhone || defaultSettings.storePhone,
      storeAddress: newSettings.storeAddress || defaultSettings.storeAddress,
      socialLinks: newSettings.socialLinks || defaultSettings.socialLinks,
      showExternalLinkWarning: newSettings.showExternalLinkWarning === undefined ? defaultSettings.showExternalLinkWarning : newSettings.showExternalLinkWarning,
      whatsappNumber: newSettings.whatsappNumber || defaultSettings.whatsappNumber,
      instagramUsername: newSettings.instagramUsername || defaultSettings.instagramUsername,
      facebookUsernameOrPageId: newSettings.facebookUsernameOrPageId || defaultSettings.facebookUsernameOrPageId,
    };
    
    const { error } = await client
      .from('site_configurations')
      .upsert({ config_key: SETTINGS_CONFIG_KEY, value: dataToUpsert }, { onConflict: 'config_key' });

    if (error) {
      console.error(`[Admin API Settings POST] Supabase error updating settings for ${SETTINGS_CONFIG_KEY}:`, error);
      return NextResponse.json({ 
        message: `Supabase error: ${error.message}`,
        rawSupabaseError: { message: error.message, details: error.details, hint: error.hint, code: error.code }
      }, { status: 500 });
    }
    
    // console.log(`[Admin API Settings POST] Site settings for ${SETTINGS_CONFIG_KEY} updated successfully.`);
    return NextResponse.json({ message: 'Site settings updated successfully.' });
  } catch (e) {
    console.error(`[Admin API Settings POST] Unhandled error updating settings for ${SETTINGS_CONFIG_KEY}:`, e);
    const errorMessage = (e instanceof Error) ? e.message : 'An unknown error occurred.';
    if (e instanceof SyntaxError && e.message.toLowerCase().includes('json')) {
      return NextResponse.json({ message: 'Invalid JSON in request body.', error: errorMessage }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to update site settings.', error: errorMessage }, { status: 500 });
  }
}
