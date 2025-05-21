
// /src/app/api/admin/content/footer/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '../../../../../lib/supabaseClient.ts'; // Relative path for Supabase client
import type { FooterContentData } from '@/types';

const FOOTER_CONFIG_KEY = 'footerContent';

const defaultFooterContent: FooterContentData = {
  copyrightText: "© {currentYear} Peak Pulse. All rights reserved.",
  navigationSections: [
    { id: "company-default", label: "Company", items: [{ id: "os", name: "Our Story", href: "/our-story" }] },
    { id: "support-default", label: "Support", items: [{ id: "cu", name: "Contact Us", href: "/contact" }] },
    { id: "legal-default", label: "Legal", items: [{ id: "pp", name: "Privacy Policy", href: "/privacy-policy" }] },
  ]
};

// GET current footer content for admin
export async function GET() {
  console.log("[Admin API Footer GET] Request to fetch footer content from Supabase.");
  if (!supabase) {
    console.error('[Admin API Footer GET] Supabase client is not initialized.');
    return NextResponse.json({ message: 'Database client not configured.' }, { status: 503 });
  }

  try {
    const { data, error } = await supabase
      .from('site_configurations')
      .select('value')
      .eq('config_key', FOOTER_CONFIG_KEY)
      .maybeSingle(); // Use maybeSingle as the row might not exist yet

    if (error) {
      console.error('[Admin API Footer GET] Supabase error fetching footer content:', error);
      return NextResponse.json({ message: 'Failed to fetch footer content from database.', rawSupabaseError: error }, { status: 500 });
    }

    if (data && data.value) {
      console.log("[Admin API Footer GET] Successfully fetched footer content from Supabase.");
      return NextResponse.json(data.value as FooterContentData);
    } else {
      console.log("[Admin API Footer GET] No footer content found in Supabase, returning default structure.");
      // If no content found, return a default structure so admin page can initialize
      return NextResponse.json(defaultFooterContent);
    }
  } catch (e) {
    console.error('[Admin API Footer GET] Unhandled error fetching footer content:', e);
    return NextResponse.json({ message: 'Error fetching footer content.', error: (e as Error).message }, { status: 500 });
  }
}

// POST to update footer content
export async function POST(request: NextRequest) {
  console.log("[Admin API Footer POST] Request to update footer content in Supabase.");
  if (!supabase) {
    console.error('[Admin API Footer POST] Supabase client is not initialized.');
    return NextResponse.json({ message: 'Database client not configured.' }, { status: 503 });
  }

  // Note: In a real production app, ensure this endpoint is secured and only callable by admins.
  // For Vercel, writing to local file system is not possible for production. Supabase is the right way.

  try {
    const newContentFromAdmin = (await request.json()) as FooterContentData;
    console.log("[Admin API Footer POST] Received new data:", JSON.stringify(newContentFromAdmin, null, 2));

    // Ensure IDs for sections and items if missing (useful for React keys, though less critical for JSONB)
    const processedSections = (newContentFromAdmin.navigationSections || []).map((section, sectionIndex) => ({
      ...section,
      id: section.id || `section-${Date.now()}-${sectionIndex}`,
      items: (section.items || []).map((item, itemIndex) => ({
        ...item,
        id: item.id || `item-${Date.now()}-${sectionIndex}-${itemIndex}`,
      })),
    }));

    const finalDataToUpsert: FooterContentData = {
      copyrightText: newContentFromAdmin.copyrightText || defaultFooterContent.copyrightText,
      navigationSections: processedSections,
    };
    
    const { error } = await supabase
      .from('site_configurations')
      .upsert({ config_key: FOOTER_CONFIG_KEY, value: finalDataToUpsert }, { onConflict: 'config_key' });

    if (error) {
      console.error('[Admin API Footer POST] Supabase error updating footer content:', error);
      return NextResponse.json({ message: 'Failed to update footer content in database.', rawSupabaseError: error }, { status: 500 });
    }
    
    console.log("[Admin API Footer POST] Footer content updated successfully in Supabase.");
    return NextResponse.json({ message: 'Footer content updated successfully.' });
  } catch (e) {
    console.error('[Admin API Footer POST] Unhandled error updating footer content:', e);
    return NextResponse.json({ message: 'Error updating footer content.', error: (e as Error).message }, { status: 500 });
  }
}
