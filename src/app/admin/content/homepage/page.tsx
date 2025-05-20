
"use client";

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Youtube, Image as ImageIcon, PlusCircle, Trash2, Package } from 'lucide-react';
import type { HomepageContent, HeroSlide, SocialCommerceItem } from '@/types';

const heroSlideSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(5, "Slide title must be at least 5 characters."),
  description: z.string().min(10, "Slide description must be at least 10 characters."),
  videoId: z.string().optional().refine(val => !val || /^[a-zA-Z0-9_-]{11}$/.test(val), {
    message: "Must be a valid YouTube Video ID (11 characters) or empty.",
  }),
  imageUrl: z.string().url({ message: "Must be a valid URL or empty." }).optional().or(z.literal('')),
  altText: z.string().optional(),
  dataAiHint: z.string().optional(),
  ctaText: z.string().optional(),
  ctaLink: z.string().optional().refine(val => !val || val.startsWith('/') || val.startsWith('http'), {
    message: "CTA link must be a relative path (e.g., /products) or a full URL."
  }),
});

const socialCommerceItemSchema = z.object({
  id: z.string().optional(),
  imageUrl: z.string().url("Image URL is required."),
  linkUrl: z.string().url("Link URL to Instagram post is required."),
  altText: z.string().optional(),
  dataAiHint: z.string().optional(),
});

const homepageContentSchema = z.object({
  heroSlides: z.array(heroSlideSchema).min(1, "At least one hero slide is required.").optional(),
  artisanalRootsTitle: z.string().min(5, "Artisanal roots title must be at least 5 characters.").optional(),
  artisanalRootsDescription: z.string().min(10, "Artisanal roots description must be at least 10 characters.").optional(),
  socialCommerceItems: z.array(socialCommerceItemSchema).optional(),
  heroVideoId: z.string().optional().refine(val => !val || /^[a-zA-Z0-9_-]{11}$/.test(val), { // For standalone hero video
    message: "Must be a valid YouTube Video ID (11 characters) or empty.",
  }),
  heroImageUrl: z.string().url({ message: "Must be a valid URL or empty." }).optional().or(z.literal('')), // For standalone hero image
});

type HomepageContentFormValues = z.infer<typeof homepageContentSchema>;

const defaultHeroSlide: HeroSlide = {
  id: '', title: '', description: '', videoId: '', imageUrl: '', altText: '', dataAiHint: '', ctaText: '', ctaLink: ''
};

const defaultSocialCommerceItem: SocialCommerceItem = {
  id: '', imageUrl: '', linkUrl: '', altText: '', dataAiHint: ''
};

export default function AdminHomepageContentPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<HomepageContentFormValues>({
    resolver: zodResolver(homepageContentSchema),
    defaultValues: {
      heroSlides: [{ ...defaultHeroSlide }],
      artisanalRootsTitle: '',
      artisanalRootsDescription: '',
      socialCommerceItems: [],
      heroVideoId: '',
      heroImageUrl: '',
    },
  });

  const { fields: heroSlidesFields, append: appendHeroSlide, remove: removeHeroSlide } = useFieldArray({
    control: form.control,
    name: "heroSlides",
  });

  const { fields: socialCommerceFields, append: appendSocialCommerceItem, remove: removeSocialCommerceItem } = useFieldArray({
    control: form.control,
    name: "socialCommerceItems",
  });

  useEffect(() => {
    const fetchContent = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/content/homepage');
        if (!response.ok) {
          throw new Error('Failed to fetch homepage content');
        }
        const data: HomepageContent = await response.json();
        form.reset({
          heroSlides: data.heroSlides && data.heroSlides.length > 0 ? data.heroSlides.map(slide => ({ ...defaultHeroSlide, ...slide })) : [{ ...defaultHeroSlide }],
          artisanalRootsTitle: data.artisanalRoots?.title || '',
          artisanalRootsDescription: data.artisanalRoots?.description || '',
          socialCommerceItems: data.socialCommerceItems ? data.socialCommerceItems.map(item => ({ ...defaultSocialCommerceItem, ...item })) : [],
          heroVideoId: data.heroVideoId || '', // Handle case where videoId might be undefined in JSON
          heroImageUrl: data.heroImageUrl || '', // Handle case where imageUrl might be undefined
        });
      } catch (error) {
        console.error("Error fetching content:", error);
        toast({
          title: "Error",
          description: (error as Error).message || "Could not load content.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchContent();
  }, [form, toast]);

  const onSubmit = async (data: HomepageContentFormValues) => {
    setIsSaving(true);
    try {
      const payload: HomepageContent = {
        heroSlides: (data.heroSlides || []).map(slide => ({
          ...slide,
          id: slide.id || `slide-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          videoId: slide.videoId || undefined,
          imageUrl: slide.imageUrl || undefined,
        })),
        artisanalRoots: {
          title: data.artisanalRootsTitle || '',
          description: data.artisanalRootsDescription || '',
        },
        socialCommerceItems: (data.socialCommerceItems || []).map(item => ({
          ...item,
          id: item.id || `social-${Date.now()}-${Math.random().toString(36).substr(2,5)}`,
        })),
        heroVideoId: data.heroVideoId || undefined,
        heroImageUrl: data.heroImageUrl || undefined,
      };

      const response = await fetch('/api/admin/content/homepage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save content');
      }

      toast({
        title: "Content Saved!",
        description: "Homepage content has been updated.",
      });
    } catch (error) {
      console.error("Error saving content:", error);
      toast({
        title: "Save Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Loading Content...</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Edit Homepage Content</CardTitle>
        <CardDescription>
          Modify the text and media for various sections of the homepage.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            <fieldset className="space-y-4 p-4 border rounded-md">
              <legend className="text-xl font-semibold px-1 mb-2">Hero Section Carousel Slides</legend>
              {heroSlidesFields.map((field, index) => (
                <Card key={field.id} className="p-4 space-y-3 bg-muted/30">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-lg">Slide {index + 1}</h4>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeHeroSlide(index)}
                      disabled={heroSlidesFields.length <= 1 && !(form.getValues('heroVideoId') || form.getValues('heroImageUrl'))}
                    >
                      <Trash2 className="mr-1 h-4 w-4" /> Remove Slide
                    </Button>
                  </div>
                  <FormField
                    control={form.control}
                    name={`heroSlides.${index}.title`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`heroSlides.${index}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl><Textarea {...field} rows={2} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`heroSlides.${index}.imageUrl`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center"><ImageIcon className="mr-2 h-5 w-5 text-blue-500"/> Background Image URL</FormLabel>
                        <FormControl><Input {...field} placeholder="e.g. https://example.com/hero-image.jpg" /></FormControl>
                        <FormDescription>Tip: For quick uploads, try free sites like ImgBB.com or Postimages.org. Upload your image, then copy and paste the "Direct link" (ending in .jpg, .png, .gif, etc.) here.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name={`heroSlides.${index}.altText`}
                    render={({ field }) => (
                      <FormItem><FormLabel>Image Alt Text</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`heroSlides.${index}.dataAiHint`}
                    render={({ field }) => (
                      <FormItem><FormLabel>Image AI Hint (for placeholder)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name={`heroSlides.${index}.videoId`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center"><Youtube className="mr-2 h-5 w-5 text-red-600"/> YouTube Video ID (Overrides Image)</FormLabel>
                        <FormControl><Input {...field} placeholder="e.g. gCRNEJxDJKM (11 characters)" /></FormControl>
                         <FormDescription>The 11-character ID from a YouTube video URL (e.g., the XXXXXXXXXXX in youtu.be/XXXXXXXXXXX).</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`heroSlides.${index}.ctaText`}
                    render={({ field }) => (
                      <FormItem><FormLabel>CTA Button Text</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`heroSlides.${index}.ctaLink`}
                    render={({ field }) => (
                      <FormItem><FormLabel>CTA Button Link</FormLabel><FormControl><Input {...field} placeholder="/products or https://example.com" /></FormControl><FormMessage /></FormItem>
                    )}
                  />
                </Card>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendHeroSlide({ ...defaultHeroSlide, id: `slide-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` })}
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Hero Slide
              </Button>
            </fieldset>

            <fieldset className="space-y-4 p-4 border rounded-md">
               <legend className="text-xl font-semibold px-1 mb-2">Standalone Hero Background (If not using Carousel)</legend>
                 <FormField
                    control={form.control}
                    name="heroImageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center"><ImageIcon className="mr-2 h-5 w-5 text-blue-500"/> Standalone Hero Background Image URL</FormLabel>
                        <FormControl><Input {...field} placeholder="e.g. https://example.com/main-hero-image.jpg" /></FormControl>
                        <FormDescription>Used if no carousel slides are active or if you prefer a single static image. Tip: For quick uploads, try free sites like ImgBB.com or Postimages.org. Upload your image, then copy and paste the "Direct link" here.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="heroVideoId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center"><Youtube className="mr-2 h-5 w-5 text-red-600"/> Standalone Hero YouTube Video ID (Overrides Image)</FormLabel>
                        <FormControl><Input {...field} placeholder="e.g. gCRNEJxDJKM (11 characters)" /></FormControl>
                        <FormDescription>Used if no carousel slides are active and you prefer a single video. The 11-character ID from a YouTube video URL.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
            </fieldset>


            <fieldset className="space-y-4 p-4 border rounded-md">
              <legend className="text-lg font-semibold px-1">Artisanal Roots Section</legend>
              <FormField
                control={form.control}
                name="artisanalRootsTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter title for artisanal roots section" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="artisanalRootsDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter description for artisanal roots section" {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </fieldset>

            <fieldset className="space-y-4 p-4 border rounded-md">
              <legend className="text-xl font-semibold px-1 mb-2 flex items-center"><Package className="mr-2 h-5 w-5 text-pink-500"/>Social Commerce Section (#PeakPulseStyle)</legend>
              {socialCommerceFields.map((field, index) => (
                <Card key={field.id} className="p-4 space-y-3 bg-muted/30">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-lg">Instagram Post {index + 1}</h4>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeSocialCommerceItem(index)}
                    >
                      <Trash2 className="mr-1 h-4 w-4" /> Remove Post
                    </Button>
                  </div>
                  <FormField
                    control={form.control}
                    name={`socialCommerceItems.${index}.imageUrl`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image URL</FormLabel>
                        <FormControl><Input {...field} placeholder="https://example.com/insta-image.jpg" /></FormControl>
                         <FormDescription>Tip: For quick uploads, try free sites like ImgBB.com or Postimages.org. Upload your image, then copy and paste the "Direct link" here.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`socialCommerceItems.${index}.linkUrl`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Link to Instagram Post</FormLabel>
                        <FormControl><Input {...field} placeholder="https://instagram.com/p/yourpostid" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`socialCommerceItems.${index}.altText`}
                    render={({ field }) => (
                      <FormItem><FormLabel>Image Alt Text</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`socialCommerceItems.${index}.dataAiHint`}
                    render={({ field }) => (
                      <FormItem><FormLabel>Image AI Hint (for placeholder)</FormLabel><FormControl><Input {...field} placeholder="e.g. instagram fashion user" /></FormControl><FormMessage /></FormItem>
                    )}
                  />
                </Card>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendSocialCommerceItem({ ...defaultSocialCommerceItem, id: `social-${Date.now()}-${Math.random().toString(36).substr(2,5)}`})}
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Instagram Post Item
              </Button>
            </fieldset>
            
            <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Homepage Content
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
