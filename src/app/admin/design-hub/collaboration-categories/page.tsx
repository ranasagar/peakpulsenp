
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, PlusCircle, Trash2, Edit, Tags, Image as ImageIconLucide } from 'lucide-react';
import type { DesignCollaborationCategory } from '@/types';
import {
  Dialog, DialogContent, DialogDescription as DialogFormDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent as AlertDialogDeleteContent,
  AlertDialogDescription as AlertDialogDeleteDescription, AlertDialogFooter as AlertDialogDeleteFooter,
  AlertDialogHeader as AlertDialogDeleteHeader, AlertDialogTitle as AlertDialogDeleteTitle
} from "@/components/ui/alert-dialog";

const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Category name must be at least 2 characters."),
  slug: z.string().min(2, "Slug must be at least 2 characters.").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens.").optional().or(z.literal('')),
  description: z.string().optional(),
  image_url: z.string().url({ message: "Please enter a valid image URL." }).optional().or(z.literal('')),
  ai_image_prompt: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export default function AdminDesignCollaborationCategoriesPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<DesignCollaborationCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingCategory, setEditingCategory] = useState<DesignCollaborationCategory | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<DesignCollaborationCategory | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', slug: '', description: '', image_url: '', ai_image_prompt: '' },
  });

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/design-collaboration-categories');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to fetch categories and parse error."}));
        throw new Error(errorData.message || errorData.rawSupabaseError?.message || `Failed to fetch collaboration categories: ${response.statusText}`);
      }
      const data: DesignCollaborationCategory[] = await response.json();
      setCategories(data);
    } catch (error) {
      toast({ title: "Error Fetching Categories", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleEdit = (category: DesignCollaborationCategory) => {
    setEditingCategory(category);
    form.reset({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        image_url: category.image_url || '',
        ai_image_prompt: category.ai_image_prompt || '',
    });
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingCategory(null);
    form.reset({ name: '', slug: '', description: '', image_url: '', ai_image_prompt: '' });
    setIsFormOpen(true);
  };

  const onSubmit = async (data: CategoryFormValues) => {
    setIsSaving(true);
    const method = editingCategory ? 'PUT' : 'POST';
    const url = editingCategory ? `/api/admin/design-collaboration-categories/${editingCategory.id}` : '/api/admin/design-collaboration-categories';

    const payload = {
      ...data,
      slug: data.slug?.trim() || data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
    };

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        let errorDetail = `Failed to ${editingCategory ? 'update' : 'create'} category. Server responded with ${response.status}.`;
        try {
            const errorText = await response.text();
            if (errorText.trim().startsWith('{') || errorText.trim().startsWith('[')) {
                const errorData = JSON.parse(errorText);
                errorDetail = errorData.message || errorData.rawSupabaseError?.message || errorDetail;
                if (errorData.rawSupabaseError?.hint) errorDetail += ` Hint: ${errorData.rawSupabaseError.hint}`;
            } else {
                console.error("Server returned non-JSON error:", errorText.substring(0, 500));
                errorDetail = `Server error. Please check server logs. Status: ${response.status}`;
            }
        } catch (e) {
            console.error("Failed to parse error response body:", e);
        }
        throw new Error(errorDetail);
      }
      toast({ title: "Success!", description: `Category "${payload.name}" ${editingCategory ? 'updated' : 'created'}.` });
      fetchCategories();
      setIsFormOpen(false);
      setEditingCategory(null);
    } catch (error) {
      toast({ title: "Save Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/design-collaboration-categories/${categoryToDelete.id}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.rawSupabaseError?.message || 'Failed to delete category');
      }
      toast({ title: "Category Deleted", description: `Category "${categoryToDelete.name}" has been deleted.` });
      fetchCategories();
    } catch (error) {
      toast({ title: "Deletion Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSaving(false);
      setIsDeleteAlertOpen(false);
      setCategoryToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-lg flex flex-col h-full">
        <CardHeader><CardTitle className="text-2xl flex items-center"><Tags className="mr-3 h-6 w-6 text-primary"/>Manage Collaboration Categories</CardTitle><CardDescription>Loading categories...</CardDescription></CardHeader>
        <CardContent className="flex-grow flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-lg flex flex-col h-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center"><Tags className="mr-3 h-6 w-6 text-primary"/>Manage Collaboration Categories</CardTitle>
            <CardDescription>Categories for organizing design collaborations and galleries.</CardDescription>
          </div>
          <Button onClick={handleAddNew}><PlusCircle className="mr-2 h-4 w-4"/> Add New Category</Button>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full p-6">
            {categories.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No categories found. Add one to get started.</p>
            ) : (
              <div className="space-y-4">
                {categories.map(category => (
                  <Card key={category.id} className="p-4 flex flex-col sm:flex-row justify-between items-start gap-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4 flex-grow">
                      {category.image_url ? (
                        <Image src={category.image_url} alt={category.name} width={60} height={60} className="rounded-md object-cover aspect-square bg-muted" data-ai-hint={category.ai_image_prompt || 'category image'} />
                      ) : (
                        <div className="w-[60px] h-[60px] bg-muted rounded-md flex items-center justify-center">
                          <ImageIconLucide className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-grow">
                        <h3 className="font-semibold text-lg text-foreground">{category.name} <span className="text-xs text-muted-foreground">({category.slug})</span></h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{category.description || "No description."}</p>
                      </div>
                    </div>
                     <div className="flex space-x-2 flex-shrink-0 pt-2 sm:pt-0">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(category)}><Edit className="mr-1.5 h-3 w-3" /> Edit</Button>
                      <Button variant="destructive" size="sm" onClick={() => { setCategoryToDelete(category); setIsDeleteAlertOpen(true); }}>
                        <Trash2 className="mr-1.5 h-3 w-3" /> Delete
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) { setEditingCategory(null); form.reset(); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Name*</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="slug" render={({ field }) => (
                  <FormItem><FormLabel>Slug</FormLabel><FormControl><Input {...field} placeholder="auto-generated if empty" /></FormControl><FormDescription>Lowercase, hyphens only. Auto-generated from name if empty.</FormDescription><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} rows={3} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="ai_image_prompt" render={({ field }) => (
                    <FormItem><FormLabel>AI Image Prompt</FormLabel><FormControl><Textarea {...field} rows={2} placeholder="Prompt used for image generation..." /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="image_url" render={({ field }) => (
                  <FormItem><FormLabel>Image URL</FormLabel><FormControl><Input {...field} placeholder="https://example.com/image.jpg" /></FormControl>
                  <FormDescription>Tip: Use services like ImgBB.com or Postimages.org for free uploads. Paste the "Direct link" (ending in .jpg, .png, etc.).</FormDescription><FormMessage /></FormItem>
                )} />
                <DialogFooter>
                  <DialogClose asChild><Button type="button" variant="outline" onClick={() => { setIsFormOpen(false); setEditingCategory(null); form.reset(); }}>Cancel</Button></DialogClose>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {editingCategory ? 'Save Changes' : 'Create Category'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={(open) => { setIsDeleteAlertOpen(open); if (!open) setCategoryToDelete(null); }}>
        <AlertDialogDeleteContent>
          <AlertDialogDeleteHeader>
            <AlertDialogDeleteTitle>Are you sure?</AlertDialogDeleteTitle>
            <AlertDialogDeleteDescription>
              This action cannot be undone. This will permanently delete the category "{categoryToDelete?.name}".
            </AlertDialogDeleteDescription>
          </AlertDialogDeleteHeader>
          <AlertDialogDeleteFooter>
            <AlertDialogCancel onClick={() => { setIsDeleteAlertOpen(false); setCategoryToDelete(null); }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isSaving} className="bg-destructive hover:bg-destructive/90">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Delete
            </AlertDialogAction>
          </AlertDialogDeleteFooter>
        </AlertDialogDeleteContent>
      </AlertDialog>
    </>
  );
}
