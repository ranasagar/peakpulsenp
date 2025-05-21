
// /src/app/api/content/footer/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient.ts'; // Relative path for Supabase client
import type { FooterContentData } from '@/types';

export const dynamic = 'force-dynamic';

const FOOTER_CONFIG_KEY = 'footerContent';

const defaultFooterContent: FooterContentData = {
  copyrightText: "© {currentYear} Peak Pulse. All rights reserved.",
  navigationSections: [
    { id: "company-fallback", label: "Company", items: [{ id: "os-fb", name: "Our Story", href: "/our-story" }] },
    { id: "support-fallback", label: "Support", items: [{ id: "cu-fb", name: "Contact Us", href: "/contact" }] },
    { id: "legal-fallback", label: "Legal", items: [{ id: "pp-fb", name: "Privacy Policy", href: "/privacy-policy" }] },
  ]
};

export async function GET() {
  console.log("[API /api/content/footer] GET request received. Fetching from Supabase.");
  if (!supabase) {
    console.error('[API /api/content/footer] Supabase client is not initialized. Returning default content.');
    return NextResponse.json(defaultFooterContent); // Return default on client init failure
  }

  try {
    const { data, error } = await supabase
      .from('site_configurations')
      .select('value')
      .eq('config_key', FOOTER_CONFIG_KEY)
      .maybeSingle();

    if (error) {
      console.error('[API /api/content/footer] Supabase error fetching footer content:', error);
      return NextResponse.json({ 
        ...defaultFooterContent, 
        error: `Failed to load footer content from database. ${error.message}` 
      }, { status: 500 });
    }

    if (data && data.value) {
      console.log("[API /api/content/footer] Successfully fetched footer content from Supabase.");
      return NextResponse.json(data.value as FooterContentData);
    } else {
      console.warn('[API /api/content/footer] No footer content found in Supabase for key "footerContent". Returning default.');
      return NextResponse.json(defaultFooterContent);
    }
  } catch (e) {
    console.error('[API /api/content/footer] Unhandled error fetching footer content, returning default. Error:', (e as Error).message);
    return NextResponse.json({
         ...defaultFooterContent, 
         error: `Server error fetching footer content. ${(e as Error).message}` 
    }, { status: 500 });
  }
}
