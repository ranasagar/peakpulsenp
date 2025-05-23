
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem as RHFFormItem, FormLabel as RHFFormLabel, FormMessage } from '@/components/ui/form'; // Renamed to avoid conflict
import { Label } from '@/components/ui/label'; // Use basic Label for non-form elements
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, FileText } from 'lucide-react';
import type { PageContent } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';

const pageContentFormSchema = z.object({
  content: z.string().min(10, "Content must be at least 10 characters.").optional().or(z.literal('')),
});

type PageContentFormValues = z.infer<typeof pageContentFormSchema>;

const manageablePages = [
  { key: 'privacyPolicyPageContent', name: 'Privacy Policy' },
  { key: 'termsOfServicePageContent', name: 'Terms of Service' },
  { key: 'shippingReturnsPageContent', name: 'Shipping & Returns Policy' },
  { key: 'accessibilityPageContent', name: 'Accessibility Statement' },
];

export default function AdminSitePagesContentPage() {
  const { toast } = useToast();
  const [selectedPageKey, setSelectedPageKey] = useState<string>(manageablePages[0].key);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<PageContentFormValues>({
    resolver: zodResolver(pageContentFormSchema),
    defaultValues: { content: '' },
  });

  useEffect(() => {
    const fetchPageContent = async () => {
      if (!selectedPageKey) return;
      setIsLoading(true);
      try {
        const response = await fetch(`/api/admin/content/page/${selectedPageKey}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.rawSupabaseError?.message || `Failed to fetch content for ${selectedPageKey}`);
        }
        const data: PageContent = await response.json();
        form.reset({ content: data.content || `<!-- Default content for ${selectedPageKey}. Please edit. -->` });
      } catch (error) {
        toast({ title: "Error Loading Content", description: (error as Error).message, variant: "destructive" });
        form.reset({ content: `Error loading content for ${selectedPageKey}. Please try again or set initial content.` });
      } finally {
        setIsLoading(false);
      }
    };
    fetchPageContent();
  }, [selectedPageKey, form, toast]);

  const onSubmit = async (data: PageContentFormValues) => {
    if (!selectedPageKey) {
      toast({ title: "Error", description: "No page selected to save.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/content/page/${selectedPageKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: data.content || '' }), 
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Failed to save content for ${selectedPageKey}. Status: ${response.status}` }));
        throw new Error(errorData.message || errorData.rawSupabaseError?.message || `Failed to save content for ${selectedPageKey}`);
      }
      toast({ title: "Content Saved!", description: `${manageablePages.find(p=>p.key === selectedPageKey)?.name || selectedPageKey} content has been updated.` });
    } catch (error) {
      toast({ title: "Save Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const selectedPageName = manageablePages.find(p => p.key === selectedPageKey)?.name || "Selected Page";

  return (
    <Card className="shadow-xl flex flex-col h-full">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center"><FileText className="mr-3 h-6 w-6 text-primary"/>Edit Site Page Content</CardTitle>
        <CardDescription>Select a page and modify its text content. You can use HTML for formatting. Data is saved to Supabase.</CardDescription>
      </CardHeader>
      <div className="p-6 border-b">
            <Label htmlFor="page-select">Select Page to Edit</Label>
            <Select value={selectedPageKey} onValueChange={setSelectedPageKey} name="page-select" >
                <SelectTrigger className="w-full md:w-[300px] mt-1">
                <SelectValue placeholder="Select a page" />
                </SelectTrigger>
                <SelectContent>
                {manageablePages.map(page => (
                    <SelectItem key={page.key} value={page.key}>{page.name}</SelectItem>
                ))}
                </SelectContent>
            </Select>
        </div>
      <CardContent className="flex-1 overflow-hidden p-0">
        {isLoading ? (
          <div className="flex-grow flex justify-center items-center py-10 h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2">Loading content for {selectedPageName}...</p>
          </div>
        ) : (
          <ScrollArea className="h-full p-6 pt-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <RHFFormItem>
                      <RHFFormLabel>Content for {selectedPageName}</RHFFormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={20} 
                          placeholder={`Enter content for ${selectedPageName} here. You can use HTML for formatting.`}
                          className="font-mono text-sm leading-relaxed min-h-[400px]" 
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </RHFFormItem>
                  )}
                />
                <Button type="submit" disabled={isSaving || isLoading} size="lg">
                  {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                  Save {selectedPageName} Content
                </Button>
              </form>
            </Form>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

    