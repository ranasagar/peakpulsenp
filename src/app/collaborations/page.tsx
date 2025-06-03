
// /src/app/collaborations/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { DesignCollaborationGallery } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Loader2, Palette, CalendarDays, UserCircle as ArtistIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/components/layout/main-layout';
import { formatDisplayDate } from '@/lib/dateUtils';
import { Badge } from '@/components/ui/badge';

// Metadata export removed as this is a client component

async function fetchCollaborations(): Promise<DesignCollaborationGallery[]> {
  const response = await fetch('/api/design-collaborations');
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Failed to fetch collaborations and parse error."}));
    throw new Error(errorData.message || `Failed to fetch collaborations: ${response.statusText}`);
  }
  return response.json();
}

export default function CollaborationsPage() {
  const [collaborations, setCollaborations] = useState<DesignCollaborationGallery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedCollaborations = await fetchCollaborations();
        setCollaborations(fetchedCollaborations);
      } catch (err) {
        const errorMessage = (err as Error).message;
        setError(errorMessage);
        toast({
          title: "Error Loading Collaborations",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [toast]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container-wide section-padding flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg text-muted-foreground">Loading Collaborations...</p>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="container-wide section-padding text-center">
          <p className="text-destructive text-lg">Error: {error}</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container-wide section-padding">
        <div className="text-center mb-12 md:mb-16">
          <Palette className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Design Collaborations & Galleries
          </h1>
          <p className="text-lg text-muted-foreground mt-3 max-w-xl mx-auto">
            Explore unique artistic visions and creative partnerships.
          </p>
        </div>

        {collaborations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">No collaborations available at the moment. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {collaborations.map((gallery) => (
              <Link key={gallery.id} href={`/collaborations/${gallery.slug}`} passHref legacyBehavior>
                <a className="block group">
                  <Card className="overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 h-full flex flex-col">
                    <AspectRatio ratio={16 / 10} className="relative bg-muted">
                      {gallery.cover_image_url ? (
                        <Image
                          src={gallery.cover_image_url}
                          alt={gallery.title || 'Collaboration cover image'}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          data-ai-hint={gallery.ai_cover_image_prompt || gallery.title?.toLowerCase() || 'design art gallery'}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                          <Palette className="w-16 h-16 text-primary/30" />
                        </div>
                      )}
                    </AspectRatio>
                    <CardContent className="p-4 md:p-6 flex-grow flex flex-col justify-between">
                      <div>
                        {gallery.category_name && <Badge variant="outline" className="mb-2 text-xs">{gallery.category_name}</Badge>}
                        <h2 className="text-xl font-semibold text-foreground tracking-tight mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                          {gallery.title}
                        </h2>
                        {gallery.artist_name && (
                          <p className="text-sm text-muted-foreground mb-1 flex items-center">
                            <ArtistIcon size={14} className="mr-1.5 text-accent" /> {gallery.artist_name}
                          </p>
                        )}
                        {gallery.collaboration_date && (
                           <p className="text-xs text-muted-foreground flex items-center">
                            <CalendarDays size={12} className="mr-1.5" /> {formatDisplayDate(gallery.collaboration_date)}
                          </p>
                        )}
                      </div>
                      <p className="text-primary text-sm font-medium mt-3 self-start group-hover:underline">
                        View Gallery &rarr;
                      </p>
                    </CardContent>
                  </Card>
                </a>
              </Link>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

