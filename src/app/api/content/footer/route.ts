
// /src/app/api/content/footer/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { FooterContentData } from '@/types';

export const dynamic = 'force-dynamic';

const filePath = path.join(process.cwd(), 'src', 'data', 'footer-content.json');

const defaultFooterContent: FooterContentData = {
  copyrightText: "© {currentYear} Peak Pulse. All rights reserved.",
  navigationSections: [
    { id: "company-default", label: "Company", items: [{ id: "os", name: "Our Story", href: "/our-story" }] },
    { id: "support-default", label: "Support", items: [{ id: "cu", name: "Contact Us", href: "/contact" }] },
    { id: "legal-default", label: "Legal", items: [{ id: "pp", name: "Privacy Policy", href: "/privacy-policy" }] },
  ]
};

export async function GET() {
  console.log("[API /api/content/footer] GET request received.");
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const jsonData = JSON.parse(fileContent) as Partial<FooterContentData>;
    console.log("[API /api/content/footer] Successfully read and parsed footer-content.json");

    // Merge with defaults to ensure all parts are present
    const responseData: FooterContentData = {
      copyrightText: jsonData.copyrightText || defaultFooterContent.copyrightText,
      navigationSections: (Array.isArray(jsonData.navigationSections) && jsonData.navigationSections.length > 0)
        ? jsonData.navigationSections
        : defaultFooterContent.navigationSections,
    };
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('[API /api/content/footer] Error reading or parsing footer-content.json, returning default. Error:', (error as Error).message);
    return NextResponse.json(defaultFooterContent, { status: 500 });
  }
}
