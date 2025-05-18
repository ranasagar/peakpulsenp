
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, ImageIcon, Palette, Type } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const brandAssets = [
  {
    title: 'Peak Pulse Logos (PNG, SVG)',
    description: 'High-resolution logos in various formats for web and print.',
    downloadLink: '#', // Placeholder download link
    previewImage: 'https://placehold.co/300x200.png',
    dataAiHint: 'logo brand',
    icon: ImageIcon,
  },
  {
    title: 'Brand Color Palette',
    description: 'Official HEX, RGB, and HSL color codes for consistent branding.',
    downloadLink: '#', // Placeholder download link
    previewImage: 'https://placehold.co/300x200.png',
    dataAiHint: 'color palette swatches',
    icon: Palette,
  },
  {
    title: 'Typography Guidelines',
    description: 'Information on primary and secondary fonts used by Peak Pulse.',
    downloadLink: '#', // Placeholder download link
    previewImage: 'https://placehold.co/300x200.png',
    dataAiHint: 'typography font style',
    icon: Type,
  },
  {
    title: 'Lifestyle Imagery Pack',
    description: 'A selection of approved lifestyle photos featuring Peak Pulse products.',
    downloadLink: '#', // Placeholder download link
    previewImage: 'https://placehold.co/300x200.png',
    dataAiHint: 'lifestyle fashion photo',
    icon: ImageIcon,
  }
];

export default function BrandAssetsPage() {
  return (
    <div className="container-wide section-padding">
      <div className="mb-12">
        <div className="flex items-center mb-3">
            <Download className="h-10 w-10 mr-4 text-primary" />
            <div>
                <h1 className="text-4xl font-bold text-foreground">Brand Assets</h1>
                <p className="text-lg text-muted-foreground">Download official Peak Pulse logos, color palettes, and other marketing materials.</p>
            </div>
        </div>
         <p className="text-sm text-muted-foreground mt-4">
            Please adhere to our <Link href="/account/affiliate-portal/content-guidelines" className="text-primary hover:underline">Content Creation Guidelines</Link> when using these assets.
          </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {brandAssets.map((asset, index) => (
          <Card key={index} className="shadow-md hover:shadow-lg transition-shadow flex flex-col">
            <CardHeader className="flex-shrink-0">
              <div className="flex items-center mb-3">
                <asset.icon className="h-6 w-6 mr-3 text-primary" />
                <CardTitle className="text-xl">{asset.title}</CardTitle>
              </div>
              <CardDescription>{asset.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-center items-center">
              <div className="w-full aspect-video bg-muted rounded-md overflow-hidden mb-4">
                <Image
                  src={asset.previewImage}
                  alt={`${asset.title} preview`}
                  width={300}
                  height={200}
                  className="w-full h-full object-cover"
                  data-ai-hint={asset.dataAiHint}
                />
              </div>
              <Button asChild className="w-full" disabled={asset.downloadLink === '#'}>
                <a href={asset.downloadLink} download target="_blank" rel="noopener noreferrer">
                  <Download className="mr-2 h-4 w-4" /> Download
                </a>
              </Button>
               {asset.downloadLink === '#' && <p className="text-xs text-muted-foreground mt-2 text-center">Download link coming soon.</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

    