
"use client";

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Youtube, Image as ImageIconLucide, PlusCircle, Trash2, Package, Tv, BookOpen, ExternalLink, ListCollapse, Sprout, Palette, ImagePlay } from 'lucide-react';
import type { HomepageContent, HeroSlide, SocialCommerceItem, ArtisanalRootsSlide } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';

const heroSlideSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, "Slide title must be at least 3 characters.").optional().or(z.literal('')),
  description: z.string().min(5, "Slide description must be at least 5 characters.").optional().or(z.literal('')),
  videoId: z.string().optional().refine(val => !val || /^[a-zA-Z0-9_-]{11}$/.test(val), {
    message: "Must be a valid YouTube Video ID (11 characters) or empty.",
  }).or(z.literal('')),
  imageUrl: z.string().url({ message: "Must be a valid URL or empty." }).optional().or(z.literal('')),
  altText: z.string().optional().or(z.literal('')),
  dataAiHint: z.string().optional().or(z.literal('')),
  ctaText: z.string().optional().or(z.literal('')),
  ctaLink: z.string().optional().refine(val => !val || val.startsWith('/') || val.startsWith('http') || val.startsWith('#'), {
    message: "CTA link must be a relative path (e.g., /products), an anchor (#id), or a full URL."
  }).or(z.literal('')),
});

const artisanalRootsSlideSchema = z.object({
  id: z.string().optional(),
  imageUrl: z.string().url("Image URL is required.").min(1, "Image URL cannot be empty."),
  altText: z.string().optional().or(z.literal('')),
  dataAiHint: z.string().optional().or(z.literal('')),
});

const socialCommerceItemSchema = z.object({
  id: z.string().optional(),
  imageUrl: z.string().url("Image URL is required.").min(1, "Image URL cannot be empty."),
  linkUrl: z.string().url("Link URL to Instagram post is required.").min(1, "Link URL cannot be empty."),
  altText: z.string().optional().or(z.literal('')),
  dataAiHint: z.string().optional().or(z.literal('')),
  displayOrder: z.coerce.number().int().optional().default(0),
});

const homepageContentSchema = z.object({
  heroSlides: z.array(heroSlideSchema).min(0).optional(),
  artisanalRootsTitle: z.string().min(3, "Artisanal roots title is required.").optional().or(z.literal('')),
  artisanalRootsDescription: z.string().min(5, "Artisanal roots description is required.").optional().or(z.literal('')),
  artisanalRootsSlides: z.array(artisanalRootsSlideSchema).optional(),
  socialCommerceItems: z.array(socialCommerceItemSchema).optional(),
  heroVideoId: z.string().optional().refine(val => !val || /^[a-zA-Z0-9_-]{11}$/.test(val), {
    message: "Must be a valid YouTube Video ID (11 characters) or empty.",
  }).or(z.literal('')),
  heroImageUrl: z.string().url({ message: "Must be a valid URL or empty." }).optional().or(z.literal('')),
});

type HomepageContentFormValues = z.infer<typeof homepageContentSchema>;

const defaultHeroSlide: Omit<HeroSlide, 'id'> = {
  title: 'New Slide Title', description: 'Compelling description for the new slide.', videoId: '', imageUrl: '', altText: 'Hero slide image', dataAiHint: 'fashion background', ctaText: 'Shop Now', ctaLink: '/products'
};

const defaultArtisanalRootsSlide: Omit<ArtisanalRootsSlide, 'id'> = {
  imageUrl: '', altText: 'Artisanal background slide', dataAiHint: 'craft culture texture'
};

const defaultSocialCommerceItem: Omit<SocialCommerceItem, 'id'> = {
  imageUrl: '', linkUrl: 'https://instagram.com/peakpulsenp', altText: 'Peak Pulse Style', dataAiHint: 'fashion instagram user', displayOrder: 0
};

const defaultHomepageFormValues: HomepageContentFormValues = {
  heroSlides: [],
  artisanalRootsTitle: 'Our Artisanal Roots',
  artisanalRootsDescription: 'Discover the heritage and craftsmanship woven into every Peak Pulse piece.',
  artisanalRootsSlides: [],
  socialCommerceItems: [],
  heroVideoId: '',
  heroImageUrl: '',
};

export default function AdminHomepageContentPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<HomepageContentFormValues>({
    resolver: zodResolver(homepageContentSchema),
    defaultValues: defaultHomepageFormValues,
  });

  const { fields: heroSlidesFields, append: appendHeroSlide, remove: removeHeroSlide } = useFieldArray({
    control: form.control, name: "heroSlides", keyName: "fieldId" // Use keyName to avoid conflict with 'id' in data
  });

  const { fields: artisanalRootsSlidesFields, append: appendArtisanalRootsSlide, remove: removeArtisanalRootsSlide } = useFieldArray({
    control: form.control, name: "artisanalRootsSlides", keyName: "fieldId"
  });

  const { fields: socialCommerceFields, append: appendSocialCommerceItem, remove: removeSocialCommerceItem } = useFieldArray({
    control: form.control, name: "socialCommerceItems", keyName: "fieldId"
  });

  useEffect(() => {
    const fetchContent = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/admin/content/homepage'); 
        if (!response.ok) {
          let errorDetail = 'Failed to fetch homepage content.';
           try {
            const errorData = await response.json();
            errorDetail = errorData.message || errorData.rawSupabaseError?.message || `Server error ${response.status}`;
          } catch (e) {/* ignore */}
          throw new Error(errorDetail);
        }
        const data: HomepageContent = await response.json();
        
        const artisanalRootsData = data.artisanalRoots || defaultHomepageFormValues.artisanalRoots!;
        
        form.reset({
          heroSlides: (Array.isArray(data.heroSlides) ? data.heroSlides : []).map(slide => ({ ...defaultHeroSlide, ...slide, id: slide.id || `hs-loaded-${Date.now()}-${Math.random()}` })),
          artisanalRootsTitle: artisanalRootsData.title || defaultHomepageFormValues.artisanalRootsTitle,
          artisanalRootsDescription: artisanalRootsData.description || defaultHomepageFormValues.artisanalRootsDescription,
          artisanalRootsSlides: (Array.isArray(artisanalRootsData.slides) ? artisanalRootsData.slides : []).map(slide => ({ ...defaultArtisanalRootsSlide, ...slide, id: slide.id || `ars-loaded-${Date.now()}-${Math.random()}` })),
          socialCommerceItems: (Array.isArray(data.socialCommerceItems) ? data.socialCommerceItems : []).map(item => ({ ...defaultSocialCommerceItem, ...item, id: item.id || `sc-loaded-${Date.now()}-${Math.random()}` })).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)),
          heroVideoId: data.heroVideoId || defaultHomepageFormValues.heroVideoId,
          heroImageUrl: data.heroImageUrl || defaultHomepageFormValues.heroImageUrl,
        });
      } catch (error) {
        toast({ title: "Error Loading Content", description: (error as Error).message + ". Using default values.", variant: "destructive" });
        form.reset(defaultHomepageFormValues);
      } finally {
        setIsLoading(false);
      }
    };
    fetchContent();
  }, [form, toast]);

  const onSubmit = async (data: HomepageContentFormValues) => {
    setIsSaving(true);
    try {
      const payload: Partial<HomepageContent> = {
        heroSlides: (data.heroSlides || []).map(slide => ({
          ...slide,
          id: slide.id || `slide-submit-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          videoId: slide.videoId || undefined,
          imageUrl: slide.imageUrl || undefined,
        })),
        artisanalRoots: {
          title: data.artisanalRootsTitle || '',
          description: data.artisanalRootsDescription || '',
          slides: (data.artisanalRootsSlides || []).map(slide => ({
            ...slide,
            id: slide.id || `ars-submit-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          }))
        },
        socialCommerceItems: (data.socialCommerceItems || []).map(item => ({
          ...item,
          id: item.id || `social-submit-${Date.now()}-${Math.random().toString(36).substr(2,5)}`,
          displayOrder: Number(item.displayOrder) || 0,
        })).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)),
        heroVideoId: data.heroVideoId || undefined,
        heroImageUrl: data.heroImageUrl || undefined,
      };

      const response = await fetch('/api/admin/content/homepage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorDetail = 'Failed to save homepage content.';
        try {
            const errorData = await response.json();
            if(errorData.rawSupabaseError && errorData.rawSupabaseError.message) {
                 errorDetail = `Database error: ${errorData.rawSupabaseError.message}${errorData.rawSupabaseError.hint ? ` Hint: ${errorData.rawSupabaseError.hint}` : ''}`;
            } else if (errorData.message) {
                errorDetail = errorData.message;
            } else {
                 errorDetail = `${response.status}: ${response.statusText || errorDetail}`;
            }
        } catch (e) {
             try {
                const textError = await response.text();
                errorDetail = `Server error: ${textError.substring(0,500)}`;
            } catch (textFallbackError){ /* ignore */ }
        }
        throw new Error(errorDetail);
      }

      toast({ title: "Content Saved!", description: "Homepage content has been updated successfully." });
    } catch (error) {
      toast({ title: "Save Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <Card className="shadow-xl flex flex-col h-full">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center"><Tv className="mr-3 h-6 w-6 text-primary"/>Edit Homepage Content</CardTitle>
          <CardDescription>Loading content from Supabase...</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl flex flex-col h-full">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center"><Tv className="mr-3 h-6 w-6 text-primary"/>Edit Homepage Content</CardTitle>
        <CardDescription>Modify text, media, and links for various sections. Data is saved to Supabase.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">

                <div className="space-y-6 p-4 border border-border rounded-lg shadow-sm bg-card">
                  <h3 className="text-xl font-semibold text-foreground flex items-center">
                    <ListCollapse className="mr-3 h-5 w-5 text-primary" /> Hero Section Carousel Slides
                  </h3>
                  <ScrollArea className="max-h-[60vh]">
                    <div className="space-y-4 p-1">
                      {heroSlidesFields.map((field, index) => (
                        <Card key={field.fieldId} className="p-4 space-y-3 bg-muted/30">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium text-lg text-foreground">Slide {index + 1}</h4>
                            <Button type="button" variant="destructive" size="sm" onClick={() => removeHeroSlide(index)} disabled={heroSlidesFields.length <= 0 && !(form.getValues('heroVideoId') || form.getValues('heroImageUrl'))}>
                              <Trash2 className="mr-1 h-4 w-4" /> Remove Slide
                            </Button>
                          </div>
                          <FormField control={form.control} name={`heroSlides.${index}.title`} render={({ field }) => (
                            <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} placeholder="e.g., New Collection Arrived" value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={form.control} name={`heroSlides.${index}.description`} render={({ field }) => (
                            <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} rows={2} placeholder="e.g., Discover fresh styles..." value={field.value || ''}/></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={form.control} name={`heroSlides.${index}.imageUrl`} render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center"><ImageIconLucide className="mr-2 h-4 w-4 text-muted-foreground"/> Background Image URL</FormLabel>
                              <FormControl><Input {...field} placeholder="e.g. https://example.com/hero-image.jpg" value={field.value || ''} /></FormControl>
                              <FormDescription>Tip: Use ImgBB.com or Postimages.org. Paste the "Direct link".</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name={`heroSlides.${index}.altText`} render={({ field }) => (
                            <FormItem><FormLabel>Image Alt Text</FormLabel><FormControl><Input {...field} placeholder="Describe the image for accessibility" value={field.value || ''}/></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={form.control} name={`heroSlides.${index}.dataAiHint`} render={({ field }) => (
                            <FormItem><FormLabel>Image AI Hint (for placeholder)</FormLabel><FormControl><Input {...field} placeholder="e.g., fashion model mountains" value={field.value || ''}/></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={form.control} name={`heroSlides.${index}.videoId`} render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center"><Youtube className="mr-2 h-4 w-4 text-muted-foreground"/> YouTube Video ID (Overrides Image)</FormLabel>
                              <FormControl><Input {...field} placeholder="e.g. gCRNEJxDJKM (11 characters)" value={field.value || ''} /></FormControl>
                              <FormDescription>The 11-character ID from a YouTube video URL.</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name={`heroSlides.${index}.ctaText`} render={({ field }) => (
                            <FormItem><FormLabel>CTA Button Text</FormLabel><FormControl><Input {...field} placeholder="e.g., Shop Now" value={field.value || ''}/></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={form.control} name={`heroSlides.${index}.ctaLink`} render={({ field }) => (
                            <FormItem><FormLabel>CTA Button Link</FormLabel><FormControl><Input {...field} placeholder="/products or https://example.com" value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                          )} />
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                  <Button type="button" variant="outline" size="sm" onClick={() => appendHeroSlide({ ...defaultHeroSlide, id: `slide-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` })} className="mt-4">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Hero Slide
                  </Button>
                </div>

                <div className="space-y-6 p-4 border border-border rounded-lg shadow-sm bg-card">
                  <h3 className="text-xl font-semibold text-foreground flex items-center">
                    <ImagePlay className="mr-3 h-5 w-5 text-primary" /> Standalone Hero Background (Fallback/Alternative)
                  </h3>
                  <p className="text-sm text-muted-foreground">Used if no carousel slides are active/defined, or for a simpler hero. Video ID takes precedence over Image URL if both are set.</p>
                  <FormField control={form.control} name="heroImageUrl" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center"><ImageIconLucide className="mr-2 h-4 w-4 text-muted-foreground"/> Image URL</FormLabel>
                      <FormControl><Input {...field} placeholder="https://example.com/main-hero-image.jpg" value={field.value || ''} /></FormControl>
                      <FormDescription>Tip: Use ImgBB.com or Postimages.org. Paste the "Direct link".</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="heroVideoId" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center"><Youtube className="mr-2 h-4 w-4 text-muted-foreground"/> YouTube Video ID</FormLabel>
                      <FormControl><Input {...field} placeholder="e.g. gCRNEJxDJKM (11 characters)" value={field.value || ''} /></FormControl>
                      <FormDescription>The 11-character ID from a YouTube video URL.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="space-y-6 p-4 border border-border rounded-lg shadow-sm bg-card">
                  <h3 className="text-xl font-semibold text-foreground flex items-center">
                    <Sprout className="mr-3 h-5 w-5 text-primary" /> Artisanal Roots Section
                  </h3>
                  <FormField control={form.control} name="artisanalRootsTitle" render={({ field }) => (
                    <FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="Enter title" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="artisanalRootsDescription" render={({ field }) => (
                    <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Enter description" {...field} rows={3} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                  )} />
                  
                  <div className="space-y-2 pt-2 border-t border-border/50 mt-4">
                     <h4 className="text-md font-medium text-foreground pt-2">Background Slides for Artisanal Roots Section</h4>
                     <ScrollArea className="max-h-96">
                        <div className="space-y-3 p-1">
                        {artisanalRootsSlidesFields.map((field, index) => (
                            <Card key={field.fieldId} className="p-3 space-y-2 bg-muted/30">
                                <div className="flex justify-between items-center mb-1">
                                    <FormLabel className="text-sm">Slide {index + 1}</FormLabel>
                                    <Button type="button" variant="destructive" size="xs" onClick={() => removeArtisanalRootsSlide(index)}>
                                        <Trash2 className="mr-1 h-3 w-3" /> Remove
                                    </Button>
                                </div>
                                <FormField control={form.control} name={`artisanalRootsSlides.${index}.imageUrl`} render={({ field }) => (
                                    <FormItem><FormLabel className="text-xs">Image URL*</FormLabel><FormControl><Input {...field} placeholder="https://example.com/artisanal-slide.jpg" value={field.value || ''} /></FormControl><FormDescription>Direct link to image.</FormDescription><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name={`artisanalRootsSlides.${index}.altText`} render={({ field }) => (
                                    <FormItem><FormLabel className="text-xs">Alt Text</FormLabel><FormControl><Input {...field} placeholder="Describe the image" value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name={`artisanalRootsSlides.${index}.dataAiHint`} render={({ field }) => (
                                    <FormItem><FormLabel className="text-xs">AI Hint</FormLabel><FormControl><Input {...field} placeholder="e.g., nepali craft texture" value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </Card>
                        ))}
                        </div>
                     </ScrollArea>
                     <Button type="button" variant="outline" size="sm" onClick={() => appendArtisanalRootsSlide({ ...defaultArtisanalRootsSlide, id: `ars-${Date.now()}-${Math.random().toString(36).substr(2,5)}` })} className="mt-2">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Background Slide
                     </Button>
                  </div>
                </div>

                <div className="space-y-6 p-4 border border-border rounded-lg shadow-sm bg-card">
                  <h3 className="text-xl font-semibold text-foreground flex items-center">
                    <Package className="mr-3 h-5 w-5 text-primary" /> Social Commerce Section (#PeakPulseStyle)
                  </h3>
                    <ScrollArea className="max-h-[60vh]">
                        <div className="space-y-4 p-1">
                        {socialCommerceFields.map((field, index) => (
                            <Card key={field.fieldId} className="p-4 space-y-3 bg-muted/30">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-medium text-lg text-foreground">Instagram Post {index + 1}</h4>
                                <Button type="button" variant="destructive" size="sm" onClick={() => removeSocialCommerceItem(index)}>
                                <Trash2 className="mr-1 h-4 w-4" /> Remove Post
                                </Button>
                            </div>
                            <FormField control={form.control} name={`socialCommerceItems.${index}.displayOrder`} render={({ field }) => (
                                <FormItem>
                                <FormLabel className="flex items-center"><Palette size={14} className="mr-1.5 text-muted-foreground"/> Display Order</FormLabel>
                                <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value,10) || 0)} value={field.value ?? 0} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name={`socialCommerceItems.${index}.imageUrl`} render={({ field }) => (
                                <FormItem>
                                <FormLabel>Image URL*</FormLabel>
                                <FormControl><Input {...field} placeholder="https://example.com/insta-image.jpg" value={field.value || ''} /></FormControl>
                                <FormDescription>Tip: Use ImgBB.com or Postimages.org. Paste the "Direct link".</FormDescription>
                                <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name={`socialCommerceItems.${index}.linkUrl`} render={({ field }) => (
                                <FormItem><FormLabel>Link to Instagram Post* <ExternalLink className="inline h-3 w-3 ml-1 text-muted-foreground"/></FormLabel><FormControl><Input {...field} placeholder="https://instagram.com/p/yourpostid" value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name={`socialCommerceItems.${index}.altText`} render={({ field }) => (
                                <FormItem><FormLabel>Image Alt Text</FormLabel><FormControl><Input {...field} placeholder="Describe the image" value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name={`socialCommerceItems.${index}.dataAiHint`} render={({ field }) => (
                                <FormItem><FormLabel>Image AI Hint (for placeholder)</FormLabel><FormControl><Input {...field} placeholder="e.g. instagram fashion user" value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                            )} />
                            </Card>
                        ))}
                        </div>
                    </ScrollArea>
                  <Button type="button" variant="outline" size="sm" onClick={() => appendSocialCommerceItem({ ...defaultSocialCommerceItem, displayOrder: (socialCommerceFields.length + 1) * 10, id: `social-${Date.now()}-${Math.random().toString(36).substr(2,5)}`})} className="mt-4">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Instagram Post Item
                  </Button>
                </div>

                <Button type="submit" disabled={isSaving || isLoading} className="w-full sm:w-auto !mt-8" size="lg">
                  {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                  Save Homepage Content
                </Button>
              </form>
            </Form>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
