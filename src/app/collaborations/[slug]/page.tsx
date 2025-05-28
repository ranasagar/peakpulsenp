// /src/app/collaborations/[slug]/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { DesignCollaborationGallery, GalleryImageItem, BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Loader2, Palette, CalendarDays, UserCircle as ArtistIcon, ArrowLeft, Image as ImageIconLucide } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/components/layout/main-layout';
import { formatDisplayDate } from '@/lib/dateUtils';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface CollaborationDetailPageProps {
  params: { slug: string };
}

export default function CollaborationDetailPage({ params }: CollaborationDetailPageProps) {
  const { slug } = params;
  const [gallery, setGallery] = useState<DesignCollaborationGallery | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<GalleryImageItem | null>(null);


  const fetchGallery = useCallback(async () => {
    if (!slug) {
        setError("Collaboration slug not available.");
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/design-collaborations/${slug}`);
      if (!response.ok) {
        let errorMsg = `Collaboration '${slug}' not found or not published.`;
        if (response.status !== 404) {
            try {
                const errorData = await response.json();
                errorMsg = errorData.message || `Error ${response.status}: ${response.statusText}`;
            } catch (e) { /* ignore */ }
        }
        throw new Error(errorMsg);
      }
      const data: DesignCollaborationGallery = await response.json();
      setGallery(data);
      if (data.gallery_images && data.gallery_images.length > 0) {
        // Sort images by displayOrder, then by original index if displayOrder is missing or same
        const sortedImages = data.gallery_images.sort((a, b) => {
            const orderA = a.displayOrder === undefined ? Infinity : a.displayOrder;
            const orderB = b.displayOrder === undefined ? Infinity : b.displayOrder;
            return orderA - orderB;
        });
        setSelectedImage(sortedImages[0]);
      }
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      toast({ title: "Error Loading Collaboration", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [slug, toast]);

  useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container-wide section-padding flex justify-center items-center min-h-[70vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg text-muted-foreground">Loading Collaboration Details...</p>
        </div>
      </MainLayout>
    );
  }

  if (error || !gallery) {
    return (
      <MainLayout>
        <div className="container-slim section-padding text-center">
          <Palette className="h-16 w-16 text-destructive mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-destructive mb-3">Collaboration Not Found</h1>
          <p className="text-muted-foreground mb-6">{error || "The requested collaboration could not be loaded."}</p>
          <Button asChild variant="outline">
            <Link href="/collaborations">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Collaborations
            </Link>
          </Button>
        </div>
      </MainLayout>
    );
  }
  
  const breadcrumbs: BreadcrumbItem[] = [
    { name: 'Home', href: '/' },
    { name: 'Collaborations', href: '/collaborations' },
    { name: gallery.title },
  ];

  const sortedGalleryImages = (gallery.gallery_images || []).sort((a, b) => {
      const orderA = a.displayOrder === undefined ? Infinity : a.displayOrder;
      const orderB = b.displayOrder === undefined ? Infinity : b.displayOrder;
      return orderA - orderB;
  });

  return (
    <MainLayout>
      <div className="container-wide section-padding">
        <div className="mb-8">
          <Breadcrumbs items={breadcrumbs} />
        </div>

        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-4">{gallery.title}</h1>
          {gallery.artist_name && (
            <p className="text-xl text-muted-foreground flex items-center justify-center mb-1">
              <ArtistIcon size={20} className="mr-2 text-primary" /> By {gallery.artist_name}
            </p>
          )}
          {gallery.category_name && (
            <Link href={`/collaborations?category=${gallery.category_slug}`} className="text-sm text-accent hover:underline mb-1">
              Category: {gallery.category_name}
            </Link>
          )}
          {gallery.collaboration_date && (
            <p className="text-sm text-muted-foreground mt-1">
              <CalendarDays size={14} className="inline mr-1.5" />
              {formatDisplayDate(gallery.collaboration_date)}
            </p>
          )}
        </header>

        {gallery.description && <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto mb-10 text-center">{gallery.description}</p>}
        {gallery.artist_statement && (
            <Card className="max-w-3xl mx-auto mb-12 bg-muted/30 border-primary/20 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg font-medium text-primary">Artist's Statement</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground italic leading-relaxed">&ldquo;{gallery.artist_statement}&rdquo;</p>
                </CardContent>
            </Card>
        )}

        <Separator className="my-12" />

        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-foreground mb-8 text-center">Gallery Showcase</h2>
          {(sortedGalleryImages.length > 0) ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Main selected image display */}
              <div className="md:col-span-2">
                <Card className="overflow-hidden shadow-xl rounded-xl sticky top-24">
                  <AspectRatio ratio={4 / 3} className="bg-card">
                    {selectedImage ? (
                      <Image
                        src={selectedImage.url}
                        alt={selectedImage.altText || gallery.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 66vw"
                        className="object-contain"
                        data-ai-hint={selectedImage.dataAiHint || 'gallery image detail'}
                        priority
                      />
                    ) : (
                         <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-background">
                          <ImageIconLucide className="w-24 h-24 text-muted-foreground/30" />
                        </div>
                    )}
                  </AspectRatio>
                   {selectedImage?.altText && <p className="p-3 text-xs text-center text-muted-foreground bg-background/50">{selectedImage.altText}</p>}
                </Card>
              </div>

              {/* Thumbnail list */}
              <div className="md:col-span-1">
                <ScrollArea className="h-auto md:max-h-[calc(100vh-8rem)] md:pr-2"> {/* Adjust max-h as needed */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 gap-3">
                    {sortedGalleryImages.map((img) => (
                      <button
                        key={img.id || img.url}
                        onClick={() => setSelectedImage(img)}
                        className={`rounded-lg overflow-hidden border-2 transition-all duration-150
                          ${selectedImage?.url === img.url ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-transparent hover:border-primary/50 focus:border-primary/70'}`}
                      >
                        <AspectRatio ratio={1 / 1} className="bg-muted">
                          <Image
                            src={img.url}
                            alt={img.altText || `Thumbnail of ${gallery.title}`}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                            className="object-cover hover:opacity-80 transition-opacity"
                            data-ai-hint={img.dataAiHint || 'gallery image thumbnail'}
                          />
                        </AspectRatio>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">This gallery currently has no images.</p>
          )}
        </section>

        <div className="text-center mt-16">
            <Button asChild variant="outline">
                 <Link href="/collaborations"><ArrowLeft className="mr-2 h-4 w-4"/> View Other Collaborations</Link>
            </Button>
        </div>
      </div>
    </MainLayout>
  );
}
