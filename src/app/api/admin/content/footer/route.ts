
// /src/app/api/admin/content/footer/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { FooterContentData, FooterNavSection, FooterNavItem } from '@/types';

const filePath = path.join(process.cwd(), 'src', 'data', 'footer-content.json');

const defaultFooterContent: FooterContentData = {
  copyrightText: "© {currentYear} Peak Pulse. All rights reserved.",
  navigationSections: [
    { id: "company-default", label: "Company", items: [{ id: "os", name: "Our Story", href: "/our-story" }] },
    { id: "support-default", label: "Support", items: [{ id: "cu", name: "Contact Us", href: "/contact" }] },
    { id: "legal-default", label: "Legal", items: [{ id: "pp", name: "Privacy Policy", href: "/privacy-policy" }] },
  ]
};

// Helper to read existing content or return a default structure
async function getCurrentContent(): Promise<FooterContentData> {
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const parsedData = JSON.parse(fileContent) as Partial<FooterContentData>;
    return {
      copyrightText: parsedData.copyrightText || defaultFooterContent.copyrightText,
      navigationSections: (Array.isArray(parsedData.navigationSections) && parsedData.navigationSections.length > 0) 
                            ? parsedData.navigationSections 
                            : defaultFooterContent.navigationSections,
    };
  } catch (error) {
    console.warn("[Admin API Footer POST] Error reading existing footer content file. Starting with a default structure. Error:", (error as Error).message);
    return JSON.parse(JSON.stringify(defaultFooterContent)); // Deep copy of default
  }
}

export async function GET() {
  console.log("[Admin API Footer GET] Request to fetch footer content.");
  try {
    const content = await getCurrentContent();
    return NextResponse.json(content);
  } catch (error) {
    console.error('[Admin API Footer GET] Error fetching footer content:', error);
    return NextResponse.json({ message: 'Error fetching footer content.', error: (error as Error).message }, { status: 500 });
  }
}


export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
    console.warn("File system write attempts are disabled in Vercel production environment for this demo API.");
    return NextResponse.json({ message: 'Content modification is disabled in this environment for demo purposes.' }, { status: 403 });
  }

  try {
    const newContentFromAdmin = (await request.json()) as Partial<FooterContentData>;
    console.log("[Admin API Footer POST] Received new data:", JSON.stringify(newContentFromAdmin, null, 2));

    // Ensure IDs for sections and items if missing (useful for React keys)
    const processedSections = (newContentFromAdmin.navigationSections || []).map((section: Partial<FooterNavSection>, sectionIndex: number) => ({
      ...section,
      id: section.id || `section-${Date.now()}-${sectionIndex}`,
      label: section.label || "Unnamed Section",
      items: (section.items || []).map((item: Partial<FooterNavItem>, itemIndex: number) => ({
        ...item,
        id: item.id || `item-${Date.now()}-${sectionIndex}-${itemIndex}`,
        name: item.name || "Unnamed Link",
        href: item.href || "#",
      })),
    }));

    const finalDataToWrite: FooterContentData = {
      copyrightText: newContentFromAdmin.copyrightText || defaultFooterContent.copyrightText,
      navigationSections: processedSections,
    };
    
    console.log("[Admin API Footer POST] Writing final data to footer-content.json:", JSON.stringify(finalDataToWrite, null, 2));
    await fs.writeFile(filePath, JSON.stringify(finalDataToWrite, null, 2), 'utf-8');

    return NextResponse.json({ message: 'Footer content updated successfully.' });
  } catch (error) {
    console.error('Error updating footer content:', error);
    return NextResponse.json({ message: 'Error updating footer content.', error: (error as Error).message }, { status: 500 });
  }
}
