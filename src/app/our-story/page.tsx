
"use client"; 

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Mountain, Users, Handshake, Sparkles, Facebook, Instagram, Twitter as TwitterIcon, ImageIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import type { OurStoryContentData, OurStorySection } from '@/types';
import { InteractiveExternalLink } from '@/components/interactive-external-link'; 
import { Skeleton } from '@/components/ui/skeleton'; 
import MainLayout from '@/components/layout/main-layout';

const defaultSectionStructure: OurStorySection = { 
    title: 'Loading...', description: 'Please wait while we fetch the details.', paragraph1: '', paragraph2: '', imageUrl: '', imageAltText: '', imageAiHint: '',
    instagramUsername: '', facebookUsername: '', twitterUsername: ''
};

const fallbackContent: OurStoryContentData = {
  hero: { ...defaultSectionStructure, title: "Our Story", description: "<p>Weaving together heritage and vision.</p>" },
  mission: { ...defaultSectionStructure, title: "Our Mission", paragraph1: "<p>Elevating craftsmanship and connecting cultures through unique apparel.</p>", paragraph2: "<p>Every piece tells a story of tradition and modernity.</p>" },
  craftsmanship: { ...defaultSectionStructure, title: "The Art of Creation", paragraph1: "<p>Honoring ancient techniques with a commitment to quality.</p>", paragraph2: "<p>Sustainably sourced materials form the heart of our designs.</p>" },
  valuesSection: { ...defaultSectionStructure, title: "Our Values: Beyond the Seams" },
  joinJourneySection: { 
    ...defaultSectionStructure, 
    title: "Join Our Journey", 
    description: "<p>Follow us for updates and be part of the Peak Pulse story.</p>",
    instagramUsername: 'peakpulsenp', // Default example
    facebookUsername: 'peakpulse',  // Default example
    twitterUsername: 'peakpulse'    // Default example
  }
};

async function getOurStoryContent(): Promise<OurStoryContentData> {
  const fetchUrl = `/api/content/our-story`; 
  try {
    const res = await fetch(fetchUrl, { cache: 'no-store' });

    if (!res.ok) {
      let errorBody = "Could not read error response body from API.";
      let errorJson: any = null;
      try {
        errorJson = await res.json();
        if (errorJson && errorJson.error) {
          errorBody = typeof errorJson.error === 'string' ? errorJson.error : JSON.stringify(errorJson.error);
        } else if (errorJson && errorJson.message) {
          errorBody = errorJson.message;
        } else {
           const textError = await res.text();
           errorBody = textError.substring(0, 500) || errorBody;
        }
      } catch (e) { 
          try {
              const textError = await res.text();
              errorBody = textError.substring(0,500) || `Failed to parse error response: ${res.statusText}`;
          } catch (textFallbackError){
              errorBody = `Failed to parse error response and response body not readable: ${res.statusText}`;
          }
      }
      return {
          ...fallbackContent,
          hero: {...fallbackContent.hero, title: "Error Loading Story", description: `<p>Failed: ${res.statusText}</p>`},
          error: `API Error fetching Our Story content: ${res.status} ${res.statusText}. Details: ${errorBody.substring(0, 200)}`
      };
    }
    const jsonData = await res.json();
    const responseData: OurStoryContentData = {
      hero: { ...defaultOurStoryFormValues.hero, ...jsonData.hero },
      mission: { ...defaultOurStoryFormValues.mission, ...jsonData.mission },
      craftsmanship: { ...defaultOurStoryFormValues.craftsmanship, ...jsonData.craftsmanship },
      valuesSection: { ...defaultOurStoryFormValues.valuesSection, ...jsonData.valuesSection },
      joinJourneySection: { ...defaultOurStoryFormValues.joinJourneySection, ...jsonData.joinJourneySection },
    };
    return responseData;
  } catch (error) {
    console.error('[OurStory Page Client Fetch] CRITICAL ERROR in getOurStoryContent:', error);
    return { ...fallbackContent, error: (error as Error).message };
  }
}
// Helper to get default values for each section in case a section is missing from DB
const defaultOurStoryFormValues: OurStoryContentData = {
  hero: { title: 'Our Story', description: '<p>Weaving together heritage and vision.</p>', imageUrl: '', imageAltText: '', imageAiHint: 'mountains heritage' },
  mission: { title: 'Our Mission', paragraph1: '<p>Elevating craftsmanship and connecting cultures through unique apparel.</p>', paragraph2: '<p>Every piece tells a story of tradition and modernity.</p>', imageUrl: '', imageAltText: '', imageAiHint: 'artisans working' },
  craftsmanship: { title: 'The Art of Creation', paragraph1: '<p>Honoring ancient techniques with a commitment to quality.</p>', paragraph2: '<p>Sustainably sourced materials form the heart of our designs.</p>', imageUrl: '', imageAltText: '', imageAiHint: 'textile detail' },
  valuesSection: { title: 'Our Values: Beyond the Seams' },
  joinJourneySection: { 
    title: 'Join Our Journey', 
    description: '<p>Follow us for updates and be part of the Peak Pulse story.</p>', 
    imageUrl: '', 
    imageAltText: '', 
    imageAiHint: 'community fashion',
    instagramUsername: 'peakpulsenp',
    facebookUsername: 'peakpulse',
    twitterUsername: 'peakpulse'
  },
};


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

  const renderSectionImage = (section?: OurStorySection, defaultHint?: string) => {
    if (!section?.imageUrl) return null;
    return (
      <div className="rounded-xl overflow-hidden shadow-2xl">
        <AspectRatio ratio={16 / 10}>
          <Image
            src={section.imageUrl}
            alt={section.imageAltText || section.title || "Peak Pulse Our Story Image"}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-500 hover:scale-105"
            data-ai-hint={section.imageAiHint || defaultHint || "story image"}
          />
        </AspectRatio>
      </div>
    );
  };


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
            <AspectRatio ratio={16/10}><Skeleton className="w-full h-full rounded-xl" /></AspectRatio>
          </div>
          <Separator className="my-16 md:my-24" />
          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <AspectRatio ratio={16/10} className="md:order-1"><Skeleton className="w-full h-full rounded-xl" /></AspectRatio>
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
        {content.hero?.imageUrl ? (
            <div className="absolute inset-0 z-[-1] opacity-30">
                <Image 
                    src={content.hero.imageUrl} 
                    alt={content.hero.imageAltText || "Our Story Hero Background"} 
                    fill 
                    className="object-cover" 
                    data-ai-hint={content.hero.imageAiHint || "abstract texture"}
                    priority
                />
                 <div className="absolute inset-0 bg-background/70"></div>
            </div>
        ) : (
          <Mountain className="absolute inset-0 w-full h-full text-primary/5 z-[-1]" />
        )}
        <div className="container-wide text-center relative z-10">
          <Mountain className="h-16 w-16 text-primary mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6" dangerouslySetInnerHTML={{ __html: content.hero?.title || "The Heart of Peak Pulse" }} />
          <div className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto prose dark:prose-invert" dangerouslySetInnerHTML={{ __html: content.hero?.description || "<p>Weaving together heritage and vision.</p>" }} />
        </div>
      </section>

      <div className="container-wide section-padding pt-12 md:pt-16">
        <section className="mb-16 md:mb-24">
            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                    <h2 className="text-3xl font-semibold text-foreground mb-6" dangerouslySetInnerHTML={{ __html: content.mission?.title || "Our Mission" }} />
                    <div className="text-lg text-muted-foreground mb-4 leading-relaxed prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: content.mission?.paragraph1 || "<p>Elevating craftsmanship.</p>" }} />
                    <div className="text-lg text-muted-foreground leading-relaxed prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: content.mission?.paragraph2 || "<p>Connecting cultures.</p>" }} />
                </div>
                 {renderSectionImage(content.mission, "artisans nepal craft")}
            </div>
        </section>
        
        <Separator className="my-16 md:my-24" />

        <section className="mb-16 md:mb-24">
            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="md:order-2">
                    <h2 className="text-3xl font-semibold text-foreground mb-6" dangerouslySetInnerHTML={{ __html: content.craftsmanship?.title || "The Art of Creation" }} />
                    <div className="text-lg text-muted-foreground mb-4 leading-relaxed prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: content.craftsmanship?.paragraph1 || "<p>Honoring traditions.</p>" }} />
                    <div className="text-lg text-muted-foreground leading-relaxed prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: content.craftsmanship?.paragraph2 || "<p>Sourcing quality.</p>" }} />
                </div>
                <div className="md:order-1">
                 {renderSectionImage(content.craftsmanship, "textile fabric detail")}
                </div>
            </div>
        </section>

        <Separator className="my-16 md:my-24" />
        
        <section className="text-center mb-16 md:mb-24">
            <h2 className="text-3xl font-semibold text-foreground mb-12" dangerouslySetInnerHTML={{ __html: content.valuesSection?.title || "Our Values: Beyond the Seams" }} />
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
        
         <section className="bg-primary/5 rounded-xl p-10 md:p-16 relative overflow-hidden">
            {content.joinJourneySection?.imageUrl && (
                <div className="absolute inset-0 z-0 opacity-10">
                    <Image 
                        src={content.joinJourneySection.imageUrl} 
                        alt={content.joinJourneySection.imageAltText || "Join our journey background"} 
                        fill 
                        className="object-cover"
                        data-ai-hint={content.joinJourneySection.imageAiHint || "community fashion modern"}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
                </div>
            )}
            <div className="text-center relative z-10">
                <h2 className="text-3xl font-semibold text-foreground mb-6" dangerouslySetInnerHTML={{ __html: content.joinJourneySection?.title || "Join Our Journey" }} />
                <div className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto prose dark:prose-invert" dangerouslySetInnerHTML={{ __html: content.joinJourneySection?.description || "<p>Follow us for updates.</p>" }} />
                <div className="flex flex-wrap justify-center items-center gap-3">
                    {content.joinJourneySection?.instagramUsername && (
                        <InteractiveExternalLink href={`https://instagram.com/${content.joinJourneySection.instagramUsername.replace('@','')}`} showDialog={true}>
                            <Button variant="outline" className="bg-background/80 hover:bg-card"><Instagram className="mr-2 h-5 w-5" /> Instagram</Button>
                        </InteractiveExternalLink>
                    )}
                    {content.joinJourneySection?.facebookUsername && (
                        <InteractiveExternalLink href={`https://facebook.com/${content.joinJourneySection.facebookUsername}`} showDialog={true}>
                            <Button variant="outline" className="bg-background/80 hover:bg-card"><Facebook className="mr-2 h-5 w-5" /> Facebook</Button>
                        </InteractiveExternalLink>
                    )}
                    {content.joinJourneySection?.twitterUsername && (
                        <InteractiveExternalLink href={`https://twitter.com/${content.joinJourneySection.twitterUsername.replace('@','')}`} showDialog={true}>
                            <Button variant="outline" className="bg-background/80 hover:bg-card"><TwitterIcon className="mr-2 h-5 w-5" /> Twitter</Button>
                        </InteractiveExternalLink>
                    )}
                </div>
            </div>
        </section>
      </div>
    </MainLayout>
  );
}
