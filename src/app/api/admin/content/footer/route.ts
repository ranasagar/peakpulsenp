
// /src/app/api/admin/content/footer/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin, supabase as fallbackSupabase } from '@/lib/supabaseClient';
import type { FooterContentData, FooterNavSection } from '@/types';

const FOOTER_CONFIG_KEY = 'footerContent';

const defaultFooterContent: FooterContentData = {
  copyrightText: "© {currentYear} Peak Pulse. All rights reserved.",
  navigationSections: [
    { id: "company-default-admin", label: "Company", items: [{ id: "os-admin", name: "Our Story", href: "/our-story" }] },
    { id: "support-default-admin", label: "Support", items: [{ id: "cu-admin", name: "Contact Us", href: "/contact" }] },
    { id: "legal-default-admin", label: "Legal", items: [{ id: "pp-admin", name: "Privacy Policy", href: "/privacy-policy" }] },
  ]
};

// GET current footer content for admin
export async function GET() {
  const supabase = supabaseAdmin || fallbackSupabase;
  if (!supabase) {
    console.error('[Admin API Footer GET] Supabase client is not initialized.');
    return NextResponse.json({ message: 'Database client not configured.', rawSupabaseError: { message: 'Supabase client not initialized.'} }, { status: 503 });
  }
  console.log(`[Admin API Footer GET] Request to fetch content from Supabase for key: ${FOOTER_CONFIG_KEY}. Using ${supabase === supabaseAdmin ? "ADMIN client" : "public client"}`);
  
  try {
    const { data, error } = await supabase
      .from('site_configurations')
      .select('value')
      .eq('config_key', FOOTER_CONFIG_KEY)
      .maybeSingle();

    if (error) {
      console.error('[Admin API Footer GET] Supabase error fetching footer content:', error);
      return NextResponse.json({ ...defaultFooterContent, error: `Failed to load content. ${error.message}`, rawSupabaseError: error }, { status: 500 });
    }

    if (data && data.value) {
      console.log("[Admin API Footer GET] Successfully fetched footer content from Supabase.");
      const dbContent = data.value as Partial<FooterContentData>;
      const responseData: FooterContentData = {
        copyrightText: dbContent.copyrightText || defaultFooterContent.copyrightText,
        navigationSections: (dbContent.navigationSections && dbContent.navigationSections.length > 0)
          ? dbContent.navigationSections.map((section: Partial<FooterNavSection>, sIdx: number) => ({
              id: section.id || defaultFooterContent.navigationSections![sIdx]?.id || `section-db-${Date.now()}-${sIdx}`,
              label: section.label || defaultFooterContent.navigationSections![sIdx]?.label || "Section",
              items: (section.items && section.items.length > 0)
                ? section.items.map((item, iIdx) => ({
                    id: item.id || defaultFooterContent.navigationSections![sIdx]?.items[iIdx]?.id || `item-db-${Date.now()}-${sIdx}-${iIdx}`,
                    name: item.name || defaultFooterContent.navigationSections![sIdx]?.items[iIdx]?.name || "Link",
                    href: item.href || defaultFooterContent.navigationSections![sIdx]?.items[iIdx]?.href || "/",
                }))
                : defaultFooterContent.navigationSections![sIdx]?.items || [],
            }))
          : defaultFooterContent.navigationSections!,
      };
      return NextResponse.json(responseData);
    } else {
      console.log("[Admin API Footer GET] No footer content found in Supabase, returning default structure.");
      return NextResponse.json(defaultFooterContent);
    }
  } catch (e) {
    console.error('[Admin API Footer GET] Unhandled error fetching footer content:', e);
    return NextResponse.json({ ...defaultFooterContent, error: `Server error fetching footer content. ${(e as Error).message}` }, { status: 500 });
  }
}

// POST to update footer content
export async function POST(request: NextRequest) {
  const client = supabaseAdmin || fallbackSupabase;
  if (!client) {
    console.error('[Admin API Footer POST] Supabase client is not initialized.');
    return NextResponse.json({ message: 'Database client not configured.', rawSupabaseError: { message: 'Supabase client not initialized.'} }, { status: 503 });
  }
  console.log(`[Admin API Footer POST] Request to update content. Using ${client === supabaseAdmin ? "ADMIN client" : "public client"}`);

  try {
    const newContentFromAdmin = await request.json() as FooterContentData;
    console.log("[Admin API Footer POST] Received new data:", JSON.stringify(newContentFromAdmin, null, 2));

    // Ensure IDs for sections and items if missing (useful for React keys, though less critical for JSONB)
    const processedSections = (newContentFromAdmin.navigationSections || []).map((section, sectionIndex) => ({
      ...section,
      id: section.id || `section-submit-${Date.now()}-${sectionIndex}`,
      items: (section.items || []).map((item, itemIndex) => ({
        ...item,
        id: item.id || `item-submit-${Date.now()}-${sectionIndex}-${itemIndex}`,
      })),
    }));

    const finalDataToUpsert: FooterContentData = {
      copyrightText: newContentFromAdmin.copyrightText || defaultFooterContent.copyrightText,
      navigationSections: processedSections,
    };
    
    const { error } = await client
      .from('site_configurations')
      .upsert({ config_key: FOOTER_CONFIG_KEY, value: finalDataToUpsert }, { onConflict: 'config_key' });

    if (error) {
      console.error('[Admin API Footer POST] Supabase error updating footer content:', error);
      return NextResponse.json({ 
        message: `Supabase error: ${error.message}`,
        rawSupabaseError: { message: error.message, details: error.details, hint: error.hint, code: error.code }
      }, { status: 500 });
    }
    
    console.log("[Admin API Footer POST] Footer content updated successfully in Supabase.");
    return NextResponse.json({ message: 'Footer content updated successfully.' });
  } catch (e) {
    console.error('[Admin API Footer POST] Unhandled error updating footer content:', e);
    const errorMessage = (e instanceof Error) ? e.message : 'An unknown error occurred.';
     if (e instanceof SyntaxError && e.message.toLowerCase().includes('json')) {
      return NextResponse.json({ message: 'Invalid JSON in request body.', error: errorMessage }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to update footer content.', error: errorMessage }, { status: 500 });
  }
}

    