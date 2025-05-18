
'use server';

import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    // Construct the absolute path to the JSON file
    // process.cwd() gives the root of the project
    const filePath = path.join(process.cwd(), 'src', 'data', 'homepage-content.json');
    const jsonData = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(jsonData);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to read homepage content:', error);
    // Fallback content in case of an error (e.g., file not found or malformed JSON)
    const fallbackContent = {
      hero: {
        title: "Peak Pulse (Error)",
        description: "Welcome! Content is temporarily unavailable."
      },
      artisanalRoots: {
        title: "Our Heritage (Error)",
        description: "Details about our craftsmanship are currently unavailable."
      }
    };
    return NextResponse.json(fallbackContent, { status: 500 });
  }
}
