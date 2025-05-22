
"use client"; 

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Mountain, Users, Handshake, Sparkles, Facebook, Instagram, Twitter } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import type { OurStoryContentData } from '@/types';
import { InteractiveExternalLink } from '@/components/interactive-external-link'; 
import { Skeleton } from '@/components/ui/skeleton'; 
import MainLayout from '@/components/layout/main-layout';

const fallbackContent: OurStoryContentData = {
  hero: { title: "Our Story (Loading...)", description: "Weaving together heritage and vision." },
  mission: { title: "Our Mission", paragraph1: "Elevating craftsmanship.", paragraph2: "Connecting cultures." },
  craftsmanship: { title: "The Art of Creation", paragraph1: "Honoring traditions.", paragraph2: "Sourcing quality." },
  valuesSection: { title: "Our Values: Beyond the Seams" },
  joinJourneySection: { title: "Join Our Journey", description: "Follow us for updates." }
};

async function getOurStoryContent(): Promise<OurStoryContentData> {
  const fetchUrl = `/api/content/our-story`; 
  console.log(`[OurStory Page Server Fetch] Attempting to fetch from: ${fetchUrl}`);
  const res = await fetch(fetchUrl, { cache: 'no-store' });

  if (!res.ok) {
    let errorBody = "Could not read error response body.";
    let errorJson = null;
    try {
      errorJson = await res.json();
      if (errorJson && errorJson.error) {
        errorBody = errorJson.error;
      } else if (errorJson && errorJson.message) {
        errorBody = errorJson.message;
      } else {
         errorBody = await res.text(); 
      }
    } catch (e) { 
        try {
            errorBody = await res.text();
        } catch (textErr) {
            // ignore if response is not text either
        }
    }
    console.error(`[OurStory Page Server Fetch] Failed to fetch content. Status: ${res.status} ${res.statusText}. Body:`, errorBody.substring(0, 500));
    return {
        ...fallbackContent,
        hero: {...fallbackContent.hero, title: "Error Loading Story", description: `Failed: ${res.statusText}`},
        error: `API Error fetching Our Story content: ${res.status} ${res.statusText}. Details: ${errorBody.substring(0, 200)}`
    };
  }
  const jsonData = await res.json();
  const responseData: OurStoryContentData = {
    hero: { ...fallbackContent.hero, ...jsonData.hero },
    mission: { ...fallbackContent.mission, ...jsonData.mission },
    craftsmanship: { ...fallbackContent.craftsmanship, ...jsonData.craftsmanship },
    valuesSection: { ...fallbackContent.valuesSection, ...jsonData.valuesSection },
    joinJourneySection: { ...fallbackContent.joinJourneySection, ...jsonData.joinJourneySection },
  };
  return responseData;
}

export default function OurStoryPage() {
  const [content, setContent] = useState<OurStoryContentData>(fallbackContent);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadContent = async () => {
      setIsLoading(true);
      try {
        const fetchedContent = await getOurStoryContent();
        setContent(fetchedContent);
        if (fetchedContent.error) {
             toast({
                title: "Content Load Issue",
                description: fetchedContent.error,
                variant: "default" 
            });
        }
      } catch (error) {
        toast({
          title: "Error Loading Content",
          description: (error as Error).message || "Could not load Our Story content. Displaying defaults.",
          variant: "destructive"
        });
        setContent(fallbackContent); 
      } finally {
        setIsLoading(false);
      }
    };
    loadContent();
  }, [toast]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container-wide section-padding space-y-12">
          <Skeleton className="h-20 w-1/2 mx-auto mb-6" />
          <Skeleton className="h-8 w-3/4 mx-auto mb-16" />
          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <Skeleton className="h-10 w-1/3 mb-6" />
              <Skeleton className="h-6 w-full mb-4" />
              <Skeleton className="h-6 w-5/6 mb-4" />
              <Skeleton className="h-6 w-full" />
            </div>
            <AspectRatio ratio={4/3}><Skeleton className="w-full h-full rounded-xl" /></AspectRatio>
          </div>
          <Separator className="my-16 md:my-24" />
          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <AspectRatio ratio={4/3} className="md:order-1"><Skeleton className="w-full h-full rounded-xl" /></AspectRatio>
            <div className="md:order-2">
              <Skeleton className="h-10 w-1/3 mb-6" />
              <Skeleton className="h-6 w-full mb-4" />
              <Skeleton className="h-6 w-5/6 mb-4" />
              <Skeleton className="h-6 w-full" />
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }


  return (
    <MainLayout> 
      <section className="relative py-16 md:py-24 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container-wide text-center">
          <Mountain className="h-16 w-16 text-primary mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
            {content.hero?.title || "The Heart of Peak Pulse"}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            {content.hero?.description || "Weaving together heritage and vision."}
          </p>
        </div>
      </section>

      <div className="container-wide section-padding pt-12 md:pt-16">
        <section className="mb-16 md:mb-24">
            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                    <h2 className="text-3xl font-semibold text-foreground mb-6">{content.mission?.title || "Our Mission"}</h2>
                    <p className="text-lg text-muted-foreground mb-4 leading-relaxed">
                    {content.mission?.paragraph1 || "Elevating craftsmanship."}
                    </p>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                    {content.mission?.paragraph2 || "Connecting cultures."}
                    </p>
                </div>
                 <div className="rounded-xl overflow-hidden shadow-2xl">
                    <AspectRatio ratio={4/3}>
                    <Image 
                        src="https://placehold.co/800x600.png"
                        alt="Nepali artisans crafting traditional textiles" 
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover transition-transform duration-500 hover:scale-105"
                        data-ai-hint="artisans nepal craft"
                    />
                    </AspectRatio>
                 </div>
            </div>
        </section>
        
        <Separator className="my-16 md:my-24" />

        <section className="mb-16 md:mb-24">
            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="md:order-2">
                    <h2 className="text-3xl font-semibold text-foreground mb-6">{content.craftsmanship?.title || "The Art of Creation"}</h2>
                    <p className="text-lg text-muted-foreground mb-4 leading-relaxed">
                    {content.craftsmanship?.paragraph1 || "Honoring traditions."}
                    </p>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                    {content.craftsmanship?.paragraph2 || "Sourcing quality."}
                    </p>
                </div>
                <div className="rounded-xl overflow-hidden shadow-2xl md:order-1">
                    <AspectRatio ratio={4/3}>
                    <Image 
                        src="https://placehold.co/800x600.png"
                        alt="Detailed view of hand-woven fabric or intricate embroidery" 
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover transition-transform duration-500 hover:scale-105"
                        data-ai-hint="textile fabric detail"
                    />
                    </AspectRatio>
                </div>
            </div>
        </section>

        <Separator className="my-16 md:my-24" />
        
        <section className="text-center mb-16 md:mb-24">
            <h2 className="text-3xl font-semibold text-foreground mb-12">{content.valuesSection?.title || "Our Values: Beyond the Seams"}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <Card className="p-8 bg-card hover:shadow-xl transition-shadow">
                    <Handshake className="h-12 w-12 text-primary mx-auto mb-5" />
                    <h3 className="text-xl font-semibold text-foreground mb-3">Ethical Partnerships</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">We collaborate directly with artisan cooperatives, ensuring fair wages, safe working conditions, and sustainable livelihoods.</p>
                </Card>
                <Card className="p-8 bg-card hover:shadow-xl transition-shadow">
                    <Sparkles className="h-12 w-12 text-accent mx-auto mb-5" />
                    <h3 className="text-xl font-semibold text-foreground mb-3">Cultural Preservation</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">Our designs celebrate and help preserve Nepal&apos;s rich artistic heritage for future generations to appreciate and continue.</p>
                </Card>
                <Card className="p-8 bg-card hover:shadow-xl transition-shadow">
                    <Users className="h-12 w-12 text-green-500 mx-auto mb-5" />
                    <h3 className="text-xl font-semibold text-foreground mb-3">Community Empowerment</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">A portion of our profits is reinvested into community projects focused on education and skill development in artisan communities.</p>
                </Card>
            </div>
        </section>
        
         <section className="bg-primary/5 rounded-xl p-10 md:p-16">
            <div className="text-center">
                <h2 className="text-3xl font-semibold text-foreground mb-6">{content.joinJourneySection?.title || "Join Our Journey"}</h2>
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                {content.joinJourneySection?.description || "Follow us for updates."}
                </p>
                <div className="flex justify-center space-x-4">
                    <InteractiveExternalLink href="https://instagram.com/peakpulsenp" showDialog={true}>
                        <Button variant="outline"><Instagram className="mr-2 h-5 w-5" /> Instagram</Button>
                    </InteractiveExternalLink>
                     <InteractiveExternalLink href="https://facebook.com/peakpulse" showDialog={true}>
                        <Button variant="outline"><Facebook className="mr-2 h-5 w-5" /> Facebook</Button>
                    </InteractiveExternalLink>
                     <InteractiveExternalLink href="https://twitter.com/peakpulse" showDialog={true}>
                       <Button variant="outline"><Twitter className="mr-2 h-5 w-5" /> Twitter</Button>
                    </InteractiveExternalLink>
                </div>
            </div>
        </section>
      </div>
    </MainLayout>
  );
}
    