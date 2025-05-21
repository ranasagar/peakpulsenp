
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, FileText } from 'lucide-react';
import type { PageContent } from '@/types';

const pageContentFormSchema = z.object({
  content: z.string().min(10, "Content must be at least 10 characters."),
});

type PageContentFormValues = z.infer<typeof pageContentFormSchema>;

const manageablePages = [
  { key: 'privacyPolicyPageContent', name: 'Privacy Policy' },
  { key: 'termsOfServicePageContent', name: 'Terms of Service' },
  { key: 'shippingReturnsPageContent', name: 'Shipping & Returns Policy' },
  { key: 'accessibilityPageContent', name: 'Accessibility Statement' },
  // Add other pages here as they become manageable
  // e.g. { key: 'sustainabilityPageContent', name: 'Sustainability Page' },
  //      { key: 'careersPageContent', name: 'Careers Page' },
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
          const errorData = await response.json().catch(() => ({ message: "Failed to fetch page content and parse error" }));
          throw new Error(errorData.message || `Failed to fetch content for ${selectedPageKey}`);
        }
        const data: PageContent = await response.json();
        form.reset({ content: data.content || '' });
      } catch (error) {
        toast({ title: "Error Loading Content", description: (error as Error).message, variant: "destructive" });
        form.reset({ content: `Error loading content for ${selectedPageKey}.` });
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
        body: JSON.stringify({ content: data.content }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to save page content and parse error" }));
        throw new Error(errorData.message || `Failed to save content for ${selectedPageKey}`);
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
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center"><FileText className="mr-3 h-6 w-6 text-primary"/>Edit Site Page Content</CardTitle>
        <CardDescription>Select a page and modify its text content. You can use HTML for formatting.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormItem>
          <FormLabel>Select Page to Edit</FormLabel>
          <Select value={selectedPageKey} onValueChange={setSelectedPageKey}>
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder="Select a page" />
            </SelectTrigger>
            <SelectContent>
              {manageablePages.map(page => (
                <SelectItem key={page.key} value={page.key}>{page.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormItem>

        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2">Loading content for {selectedPageName}...</p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content for {selectedPageName}</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={20}
                        placeholder={`Enter content for ${selectedPageName} here. You can use HTML for formatting.`}
                        className="font-mono text-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSaving || isLoading} size="lg">
                {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                Save {selectedPageName} Content
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
