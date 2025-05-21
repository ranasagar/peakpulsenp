
"use client";

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// import { Textarea } from '@/components/ui/textarea'; // Not used for copyright
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, PlusCircle, Trash2, ListChecks } from 'lucide-react';
import type { FooterContentData, FooterNavSection, FooterNavItem } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';

const footerNavItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Link name is required."),
  href: z.string().min(1, "Link URL is required (e.g., /about or https://example.com)."),
});

const footerNavSectionSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1, "Section label is required."),
  items: z.array(footerNavItemSchema).min(1, "Each section must have at least one link.").optional(),
});

const footerContentSchema = z.object({
  copyrightText: z.string().min(5, "Copyright text is required.").optional(),
  navigationSections: z.array(footerNavSectionSchema).optional(),
});

type FooterContentFormValues = z.infer<typeof footerContentSchema>;

const defaultNavItem: FooterNavItem = { id: `item-new-${Date.now()}`, name: '', href: '/' };
const defaultNavSection: FooterNavSection = { id: `section-new-${Date.now()}`, label: '', items: [{ ...defaultNavItem }] };

const defaultFooterData: FooterContentData = {
  copyrightText: `© ${new Date().getFullYear()} Peak Pulse. All rights reserved.`,
  navigationSections: [{...defaultNavSection}]
};

export default function AdminFooterContentPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<FooterContentFormValues>({
    resolver: zodResolver(footerContentSchema),
    defaultValues: defaultFooterData,
  });

  const { fields: navSectionsFields, append: appendNavSection, remove: removeNavSection } = useFieldArray({
    control: form.control,
    name: "navigationSections",
  });

  useEffect(() => {
    const fetchContent = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/admin/content/footer'); // Use admin API
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to fetch footer content');
        }
        const data: FooterContentData = await response.json();
        form.reset({
          copyrightText: data.copyrightText || defaultFooterData.copyrightText,
          navigationSections: (data.navigationSections && data.navigationSections.length > 0 
            ? data.navigationSections.map(section => ({
                ...section,
                id: section.id || `section-${Date.now()}-${Math.random()}`,
                items: (section.items || []).map(item => ({ ...item, id: item.id || `item-${Date.now()}-${Math.random()}`})) 
              }))
            : defaultFooterData.navigationSections),
        });
      } catch (error) {
        toast({ title: "Error Loading Content", description: (error as Error).message, variant: "destructive" });
        form.reset(defaultFooterData); // Reset to hardcoded defaults on error
      } finally {
        setIsLoading(false);
      }
    };
    fetchContent();
  }, [form, toast]);

  const onSubmit = async (data: FooterContentFormValues) => {
    setIsSaving(true);
    try {
      const payload = {
        ...data,
        // Ensure IDs are strings for items and sections if they were just generated client-side
        navigationSections: data.navigationSections?.map(section => ({
          ...section,
          id: String(section.id || `section-submit-${Date.now()}`),
          items: section.items?.map(item => ({ ...item, id: String(item.id || `item-submit-${Date.now()}`) })) || [],
        })) || []
      };
      const response = await fetch('/api/admin/content/footer', { // Use admin API
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save footer content');
      }
      toast({ title: "Footer Content Saved!", description: "Your footer content has been updated." });
    } catch (error) {
      toast({ title: "Save Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader><CardTitle className="text-2xl flex items-center"><ListChecks className="mr-3 h-6 w-6 text-primary"/>Edit Footer Content</CardTitle></CardHeader>
        <CardContent className="flex justify-center items-center py-20"><Loader2 className="h-12 w-12 animate-spin text-primary" /></CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center"><ListChecks className="mr-3 h-6 w-6 text-primary"/>Edit Footer Content</CardTitle>
        <CardDescription>Manage the copyright text and navigation links displayed in your website footer.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="copyrightText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Copyright Text</FormLabel>
                  <FormControl><Input {...field} placeholder="e.g., © {currentYear} Peak Pulse. All rights reserved." /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <fieldset className="space-y-4 p-4 border rounded-md">
              <legend className="text-lg font-semibold px-1 -mt-1.5">Footer Navigation Sections</legend>
              <ScrollArea className="max-h-[50vh] pr-3">
                <div className="space-y-4">
                {navSectionsFields.map((sectionField, sectionIndex) => (
                  <NavSectionControl
                    key={sectionField.id}
                    control={form.control}
                    sectionIndex={sectionIndex}
                    removeNavSection={() => removeNavSection(sectionIndex)}
                    canRemove={navSectionsFields.length > 0} // Allow removing if at least one section exists
                  />
                ))}
                </div>
              </ScrollArea>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendNavSection({ ...defaultNavSection, id: `section-new-${Date.now()}-${Math.random()}`, items: [{...defaultNavItem, id: `item-new-${Date.now()}-${Math.random()}`}] })}
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Navigation Section
              </Button>
            </fieldset>
            
            <Button type="submit" disabled={isSaving} size="lg" className="w-full sm:w-auto">
              {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
              Save Footer Content
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

interface NavSectionControlProps {
  control: any; 
  sectionIndex: number;
  removeNavSection: () => void;
  canRemove: boolean;
}

function NavSectionControl({ control, sectionIndex, removeNavSection, canRemove }: NavSectionControlProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `navigationSections.${sectionIndex}.items`,
  });

  return (
    <Card className="p-4 bg-muted/30 space-y-3">
      <div className="flex justify-between items-center mb-2">
        <FormField
          control={control}
          name={`navigationSections.${sectionIndex}.label`}
          render={({ field }) => (
            <FormItem className="flex-grow mr-2">
              <FormLabel>Section Label {sectionIndex + 1}</FormLabel>
              <FormControl><Input {...field} placeholder="e.g., Company" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {canRemove && (
            <Button type="button" variant="ghost" size="icon" onClick={removeNavSection} className="text-destructive hover:bg-destructive/10 mt-6">
                <Trash2 className="h-4 w-4" />
            </Button>
        )}
      </div>
      <div className="space-y-2 pl-4 border-l-2 border-primary/30">
        <FormLabel className="text-sm font-medium">Links in this section:</FormLabel>
        {fields.map((itemField, itemIndex) => (
          <Card key={itemField.id} className="p-3 bg-card space-y-2">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                <FormField
                control={control}
                name={`navigationSections.${sectionIndex}.items.${itemIndex}.name`}
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Link Text</FormLabel>
                    <FormControl><Input {...field} placeholder="e.g., Our Story" /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={control}
                name={`navigationSections.${sectionIndex}.items.${itemIndex}.href`}
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Link Href (Path)</FormLabel>
                    <FormControl><Input {...field} placeholder="e.g., /our-story" /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <Button type="button" variant="destructive" size="xs" onClick={() => remove(itemIndex)} disabled={fields.length <= 1 && sectionIndex === 0 && navSectionsFields.length <=1}> {/* Prevent removing the very last item of the very last section */}
                <Trash2 className="mr-1 h-3 w-3" /> Remove Link
            </Button>
          </Card>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => append({ ...defaultNavItem, id: `item-new-${Date.now()}-${Math.random()}` })}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Link to Section
        </Button>
      </div>
    </Card>
  );
}

// Helper access to navSectionsFields from parent form - not directly needed here
// This declaration is usually to satisfy TypeScript if used, but not needed for this component's logic directly
declare const navSectionsFields: any[];
