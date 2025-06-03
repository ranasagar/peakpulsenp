
"use client";

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form'; // Added useFieldArray
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, BookOpenText, Image as ImageIconLucide } from 'lucide-react'; 
import type { OurStoryContentData, OurStorySection } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

// Updated Zod schema for a section
const ourStorySectionSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters.").optional().or(z.literal('')),
  description: z.string().min(5, "Description must be at least 5 characters.").optional().or(z.literal('')),
  paragraph1: z.string().min(5, "Paragraph 1 must be at least 5 characters.").optional().or(z.literal('')),
  paragraph2: z.string().min(5, "Paragraph 2 must be at least 5 characters.").optional().or(z.literal('')),
  imageUrl: z.string().url("Must be a valid URL or empty.").optional().or(z.literal('')),
  imageAltText: z.string().optional().or(z.literal('')),
  imageAiHint: z.string().optional().or(z.literal('')),
});

// Main schema for the Our Story page content
const ourStoryContentFormSchema = z.object({
  hero: ourStorySectionSchema.optional(),
  mission: ourStorySectionSchema.optional(),
  craftsmanship: ourStorySectionSchema.optional(),
  valuesSection: ourStorySectionSchema.optional(), // Might just use title
  joinJourneySection: ourStorySectionSchema.optional(),
});

type OurStoryContentFormValues = z.infer<typeof ourStoryContentFormSchema>;

// Default values now align with the OurStorySection structure
const defaultOurStoryFormValues: OurStoryContentFormValues = {
  hero: { title: 'Our Story', description: 'Weaving together heritage and vision.', imageUrl: '', imageAltText: '', imageAiHint: 'mountains heritage' },
  mission: { title: 'Our Mission', paragraph1: 'Elevating craftsmanship and connecting cultures through unique apparel.', paragraph2: 'Every piece tells a story of tradition and modernity.', imageUrl: '', imageAltText: '', imageAiHint: 'artisans working' },
  craftsmanship: { title: 'The Art of Creation', paragraph1: 'Honoring ancient techniques with a commitment to quality.', paragraph2: 'Sustainably sourced materials form the heart of our designs.', imageUrl: '', imageAltText: '', imageAiHint: 'textile detail' },
  valuesSection: { title: 'Our Values: Beyond the Seams' }, // Only title needed here as per current design
  joinJourneySection: { title: 'Join Our Journey', description: 'Follow us for updates and be part of the Peak Pulse story.', imageUrl: '', imageAltText: '', imageAiHint: 'community fashion' },
};

// Helper component for rendering section form fields
interface SectionFormProps {
  control: any; // Control object from react-hook-form
  sectionName: keyof OurStoryContentFormValues; // e.g., "hero", "mission"
  // sectionDisplayName: string; // No longer needed as AccordionTrigger will have this
  hasDescription?: boolean; // Does this section use 'description' field?
  hasParagraphs?: boolean;  // Does this section use 'paragraph1' and 'paragraph2'?
}

const SectionFormControl: React.FC<SectionFormProps> = ({ 
  control, sectionName, hasDescription = false, hasParagraphs = false 
}) => {
  return (
    <>
      <FormField 
        control={control} 
        name={`${sectionName}.title`}
        render={({ field }) => (
          <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
        )} 
      />
      {hasDescription && (
        <FormField 
          control={control} 
          name={`${sectionName}.description`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl><Textarea {...field} rows={3} value={field.value || ''} /></FormControl>
              <FormDescription>HTML is allowed for formatting.</FormDescription>
              <FormMessage />
            </FormItem>
          )} 
        />
      )}
      {hasParagraphs && (
        <>
          <FormField 
            control={control} 
            name={`${sectionName}.paragraph1`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Paragraph 1</FormLabel>
                <FormControl><Textarea {...field} rows={4} value={field.value || ''} /></FormControl>
                <FormDescription>HTML is allowed for formatting.</FormDescription>
                <FormMessage />
              </FormItem>
            )} 
          />
          <FormField 
            control={control} 
            name={`${sectionName}.paragraph2`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Paragraph 2</FormLabel>
                <FormControl><Textarea {...field} rows={4} value={field.value || ''} /></FormControl>
                <FormDescription>HTML is allowed for formatting.</FormDescription>
                <FormMessage />
              </FormItem>
            )} 
          />
        </>
      )}
      <FormField 
        control={control} 
        name={`${sectionName}.imageUrl`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center"><ImageIconLucide className="mr-2 h-4 w-4 text-muted-foreground" /> Image URL (Optional)</FormLabel>
            <FormControl><Input {...field} placeholder="https://example.com/image.jpg" value={field.value || ''}/></FormControl>
            <FormDescription>Paste direct link. Use ImgBB or Postimages for free uploads.</FormDescription>
            <FormMessage />
          </FormItem>
        )} 
      />
      <FormField 
        control={control} 
        name={`${sectionName}.imageAltText`}
        render={({ field }) => (
          <FormItem><FormLabel>Image Alt Text</FormLabel><FormControl><Input {...field} placeholder="Descriptive text for the image" value={field.value || ''}/></FormControl><FormMessage /></FormItem>
        )} 
      />
       <FormField 
        control={control} 
        name={`${sectionName}.imageAiHint`}
        render={({ field }) => (
          <FormItem><FormLabel>Image AI Hint (for placeholder)</FormLabel><FormControl><Input {...field} placeholder="e.g., mountain landscape" value={field.value || ''}/></FormControl><FormMessage /></FormItem>
        )} 
      />
    </>
  );
};


export default function AdminOurStoryContentPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<OurStoryContentFormValues>({
    resolver: zodResolver(ourStoryContentFormSchema),
    defaultValues: defaultOurStoryFormValues,
  });

  useEffect(() => {
    const fetchContent = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/admin/content/our-story'); 
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || errorData.rawSupabaseError?.message || 'Failed to fetch Our Story content');
        }
        const data: OurStoryContentData = await response.json();
        const formData: OurStoryContentFormValues = {
            hero: { ...defaultOurStoryFormValues.hero, ...data.hero },
            mission: { ...defaultOurStoryFormValues.mission, ...data.mission },
            craftsmanship: { ...defaultOurStoryFormValues.craftsmanship, ...data.craftsmanship },
            valuesSection: { ...defaultOurStoryFormValues.valuesSection, ...data.valuesSection },
            joinJourneySection: { ...defaultOurStoryFormValues.joinJourneySection, ...data.joinJourneySection },
        };
        form.reset(formData);
      } catch (error) {
        console.error("Error fetching Our Story content:", error);
        toast({ title: "Error Loading Content", description: (error as Error).message + ". Displaying defaults.", variant: "destructive" });
        form.reset(defaultOurStoryFormValues);
      } finally {
        setIsLoading(false);
      }
    };
    fetchContent();
  }, [form, toast]);

  const onSubmit = async (data: OurStoryContentFormValues) => {
    setIsSaving(true);
    try {
       const payload: OurStoryContentData = { 
        hero: data.hero,
        mission: data.mission,
        craftsmanship: data.craftsmanship,
        valuesSection: data.valuesSection,
        joinJourneySection: data.joinJourneySection,
      };
      const response = await fetch('/api/admin/content/our-story', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        let errorDetail = 'Failed to save Our Story content.';
        try {
            const errorData = await response.json();
            errorDetail = errorData.message || errorData.rawSupabaseError?.message || `Server responded with ${response.status}`;
        } catch (e) {
             errorDetail = `Server responded with ${response.status}: ${response.statusText || 'Failed to process error response.'}`;
        }
        throw new Error(errorDetail);
      }
      toast({ title: "Content Saved!", description: "Our Story page content has been updated." });
    } catch (error) {
      console.error("Error saving Our Story content:", error);
      toast({ title: "Save Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-xl flex flex-col h-full">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center"><BookOpenText className="mr-3 h-6 w-6 text-primary"/>Edit Our Story Page Content</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl flex flex-col h-full">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center"><BookOpenText className="mr-3 h-6 w-6 text-primary"/>Edit Our Story Page Content</CardTitle>
        <CardDescription>Modify text content and images for various sections. Data is saved to Supabase.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Accordion type="multiple" defaultValue={['hero-section']} className="w-full">
                <AccordionItem value="hero-section">
                  <AccordionTrigger className="text-xl font-semibold">Hero Section</AccordionTrigger>
                  <AccordionContent className="pt-4 space-y-4">
                    <SectionFormControl control={form.control} sectionName="hero" hasDescription />
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="mission-section">
                  <AccordionTrigger className="text-xl font-semibold">Mission Section</AccordionTrigger>
                  <AccordionContent className="pt-4 space-y-4">
                    <SectionFormControl control={form.control} sectionName="mission" hasParagraphs />
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="craftsmanship-section">
                  <AccordionTrigger className="text-xl font-semibold">Craftsmanship Section</AccordionTrigger>
                  <AccordionContent className="pt-4 space-y-4">
                    <SectionFormControl control={form.control} sectionName="craftsmanship" hasParagraphs />
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="values-section">
                  <AccordionTrigger className="text-xl font-semibold">Values Section</AccordionTrigger>
                  <AccordionContent className="pt-4 space-y-4">
                    <SectionFormControl control={form.control} sectionName="valuesSection" />
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="join-journey-section">
                  <AccordionTrigger className="text-xl font-semibold">Join Our Journey Section</AccordionTrigger>
                  <AccordionContent className="pt-4 space-y-4">
                    <SectionFormControl control={form.control} sectionName="joinJourneySection" hasDescription />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            
            <Button type="submit" disabled={isSaving || isLoading} className="w-full sm:w-auto !mt-8" size="lg"> 
              {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
              Save Our Story Content
            </Button>
          </form>
        </Form>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
