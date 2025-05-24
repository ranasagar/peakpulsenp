
// /src/app/api/content/footer/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import type { FooterContentData, FooterNavSection } from '@/types';

export const dynamic = 'force-dynamic';

const FOOTER_CONFIG_KEY = 'footerContent';

const defaultFooterContent: FooterContentData = {
  copyrightText: "© {currentYear} Peak Pulse. All rights reserved. (Default)",
  navigationSections: [
    { id: "company-fallback-public", label: "Company", items: [{ id: "os-fb-pub", name: "Our Story", href: "/our-story" }] },
    { id: "support-fallback-public", label: "Support", items: [{ id: "cu-fb-pub", name: "Contact Us", href: "/contact" }] },
    { id: "legal-fallback-public", label: "Legal", items: [{ id: "pp-fb-pub", name: "Privacy Policy", href: "/privacy-policy" }] },
  ]
};

export async function GET() {
  if (!supabase) {
    console.error('[Public API Footer GET] Supabase client is not initialized. Returning default content.');
    return NextResponse.json({ ...defaultFooterContent, error: "Database client not configured." });
  }
  console.log("[Public API Footer GET] Request to fetch content from Supabase.");

  try {
    const { data, error } = await supabase
      .from('site_configurations')
      .select('value')
      .eq('config_key', FOOTER_CONFIG_KEY)
      .maybeSingle();

    if (error) {
      console.error('[Public API Footer GET] Supabase error fetching footer content:', error);
      return NextResponse.json({ 
        ...defaultFooterContent, 
        error: `Failed to load footer content. Supabase: ${error.message}` 
      }, { status: 500 });
    }

    if (data && data.value) {
      console.log("[Public API Footer GET] Successfully fetched footer content from Supabase.");
      const dbContent = data.value as Partial<FooterContentData>;
      const responseData: FooterContentData = {
        copyrightText: dbContent.copyrightText || defaultFooterContent.copyrightText,
        navigationSections: (dbContent.navigationSections && dbContent.navigationSections.length > 0)
          ? dbContent.navigationSections.map((section: Partial<FooterNavSection>, sIdx: number) => ({
              id: section.id || defaultFooterContent.navigationSections![sIdx]?.id || `section-pub-${Date.now()}-${sIdx}`,
              label: section.label || defaultFooterContent.navigationSections![sIdx]?.label || "Section",
              items: (section.items && section.items.length > 0)
                ? section.items.map((item, iIdx) => ({
                    id: item.id || defaultFooterContent.navigationSections![sIdx]?.items[iIdx]?.id || `item-pub-${Date.now()}-${sIdx}-${iIdx}`,
                    name: item.name || defaultFooterContent.navigationSections![sIdx]?.items[iIdx]?.name || "Link",
                    href: item.href || defaultFooterContent.navigationSections![sIdx]?.items[iIdx]?.href || "/",
                }))
                : defaultFooterContent.navigationSections![sIdx]?.items || [],
            }))
          : defaultFooterContent.navigationSections!,
      };
      return NextResponse.json(responseData);
    } else {
      console.warn(`[Public API Footer GET] No content found for key "${FOOTER_CONFIG_KEY}". Returning default.`);
      return NextResponse.json(defaultFooterContent);
    }
  } catch (e) {
    console.error('[Public API Footer GET] Unhandled error fetching footer content:', e);
    return NextResponse.json({
         ...defaultFooterContent, 
         error: `Server error fetching footer content. ${(e as Error).message}` 
    }, { status: 500 });
  }
}

    