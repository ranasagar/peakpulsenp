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
    // Ensure a valid JSON response for errors too
    return NextResponse.json({ message: 'Error fetching content', error: (error as Error).message }, { status: 500 });
  }
}
