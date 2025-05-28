
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
import { Loader2, Save, PlusCircle, Trash2, Edit, Tags, Image as ImageIconLucide, Network, ArrowUpDown } from 'lucide-react';
import type { AdminCategory } from '@/types';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const NO_PARENT_ID_VALUE = "__NONE__";

const categoryFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Category name cannot be empty.").default(`Untitled Category ${Date.now()}`),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens.").optional().or(z.literal('')),
  description: z.string().optional(),
  imageUrl: z.string().url({ message: "Please enter a valid image URL." }).optional().or(z.literal('')),
  aiImagePrompt: z.string().optional(),
  parentId: z.string().nullable().optional(),
  displayOrder: z.coerce.number().int().optional().default(0),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export default function AdminCategoriesPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<AdminCategory | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: '', slug: '', description: '', imageUrl: '', aiImagePrompt: '', parentId: null, displayOrder: 0,
    },
  });

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/categories');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.rawSupabaseError?.message ||'Failed to fetch categories');
      }
      const data: AdminCategory[] = await response.json();
      // Sort by displayOrder, then by name for consistent listing
      data.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0) || a.name.localeCompare(b.name));
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

  const handleEdit = (category: AdminCategory) => {
    setEditingCategory(category);
    form.reset({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      imageUrl: category.imageUrl || '',
      aiImagePrompt: category.aiImagePrompt || '',
      parentId: category.parentId || null,
      displayOrder: category.displayOrder || 0,
    });
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingCategory(null);
    form.reset({
      id: undefined,
      name: `Untitled Category ${Date.now()}`,
      slug: '',
      description: '',
      imageUrl: '',
      aiImagePrompt: '',
      parentId: null,
      displayOrder: Math.max(0, ...categories.map(c => c.displayOrder || 0)) + 10, // Default to end of list
    });
    setIsFormOpen(true);
  };

  const onSubmit = async (data: CategoryFormValues) => {
    setIsSaving(true);
    const method = editingCategory ? 'PUT' : 'POST';
    const url = editingCategory ? `/api/admin/categories/${editingCategory.id}` : '/api/admin/categories';

    const payload = {
      ...data,
      slug: data.slug?.trim() || data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
      parentId: data.parentId === NO_PARENT_ID_VALUE ? null : data.parentId,
      displayOrder: data.displayOrder === undefined ? 0 : Number(data.displayOrder),
    };

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorDetail = `Failed to ${editingCategory ? 'update' : 'create'} category.`;
        try {
            const errorData = await response.json();
            errorDetail = errorData.message || errorData.rawSupabaseError?.message || `Server responded with ${response.status}`;
        } catch (e) { /* ignore */ }
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
      const response = await fetch(`/api/admin/categories/${categoryToDelete.id}`, {
        method: 'DELETE',
      });
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
      setCategoryToDelete(null);
      setIsDeleteAlertOpen(false);
    }
  };

  const getParentCategoryName = (parentId: string | null | undefined): string => {
    if (!parentId) return 'None (Top-Level)';
    const parent = categories.find(cat => cat.id === parentId);
    return parent ? parent.name : 'Unknown Parent';
  };

  if (isLoading) {
    return (
      <Card className="shadow-xl flex flex-col h-full">
        <CardHeader><CardTitle className="text-2xl flex items-center"><Tags className="mr-3 h-6 w-6 text-primary" />Manage Product Categories</CardTitle><CardDescription>Loading categories...</CardDescription></CardHeader>
        <CardContent className="flex-1 flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-xl flex flex-col h-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center"><Tags className="mr-3 h-6 w-6 text-primary" />Manage Product Categories</CardTitle>
            <CardDescription>Add, edit, or delete product categories. Use Display Order to sort them on the frontend.</CardDescription>
          </div>
          <Button onClick={handleAddNew}><PlusCircle className="mr-2 h-4 w-4" /> Add New Category</Button>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full p-6">
            {categories.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No categories found. Add a new category to get started.</p>
            ) : (
              <div className="space-y-4">
                {categories.map(category => (
                  <Card key={category.id} className="p-4 flex flex-col sm:flex-row justify-between items-start gap-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4 flex-grow">
                      {category.imageUrl ? (
                        <Image src={category.imageUrl} alt={category.name} width={80} height={80} className="rounded-md object-cover aspect-square bg-muted" data-ai-hint={category.aiImagePrompt || 'category image'} />
                      ) : (
                        <div className="w-20 h-20 bg-muted rounded-md flex items-center justify-center">
                          <ImageIconLucide className="w-10 h-10 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-grow">
                        <h3 className="font-semibold text-lg text-foreground">{category.name} <span className="text-xs text-muted-foreground">({category.slug})</span></h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{category.description || "No description."}</p>
                        {category.parentId !== undefined && (
                          <p className="text-xs text-accent mt-1 flex items-center">
                            <Network size={12} className="mr-1"/> Parent: {getParentCategoryName(category.parentId)}
                          </p>
                        )}
                        {category.aiImagePrompt && <p className="text-xs text-accent mt-1 flex items-center"><ImageIconLucide size={12} className="mr-1"/> Prompt: <span className="italic line-clamp-1">{category.aiImagePrompt}</span></p>}
                         <p className="text-xs text-muted-foreground mt-1 flex items-center">
                            <ArrowUpDown size={12} className="mr-1"/> Order: {category.displayOrder ?? 0}
                          </p>
                      </div>
                    </div>
                    <div className="flex space-x-2 flex-shrink-0 pt-2 sm:pt-0">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(category)}><Edit className="mr-1.5 h-3 w-3" /> Edit</Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setCategoryToDelete(category);
                          setIsDeleteAlertOpen(true);
                        }}
                      >
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

      <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) form.reset(); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
            <DialogFormDescription>
              {editingCategory ? `Editing details for ${editingCategory.name}.` : 'Fill in the details for the new category.'}
            </DialogFormDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] p-1">
            <div className="p-5">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Category Name*</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="slug" render={({ field }) => (
                    <FormItem><FormLabel>Slug</FormLabel><FormControl><Input {...field} placeholder="auto-generated if empty" /></FormControl><FormDescription>Lowercase alphanumeric with hyphens (e.g., 'summer-collection'). Auto-generated from name if left empty.</FormDescription><FormMessage /></FormItem>
                  )} />
                  <FormField
                    control={form.control}
                    name="parentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parent Category (Optional)</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(value === NO_PARENT_ID_VALUE ? null : value)}
                          value={field.value === null || field.value === undefined ? NO_PARENT_ID_VALUE : field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a parent category (or leave for top-level)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={NO_PARENT_ID_VALUE}>None (Top-Level Category)</SelectItem>
                            {categories
                              .filter(cat => cat.id !== editingCategory?.id) // Prevent self-parenting
                              .map(cat => (
                                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>Select a parent to make this a subcategory.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField control={form.control} name="displayOrder" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Order</FormLabel>
                      <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} /></FormControl>
                      <FormDescription>Lower numbers appear first. Used for sorting on frontend.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Description (Optional)</FormLabel><FormControl><Textarea {...field} rows={3} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="aiImagePrompt" render={({ field }) => (
                    <FormItem>
                      <FormLabel>AI Image Generation Prompt (Optional)</FormLabel>
                      <FormControl><Textarea {...field} rows={3} placeholder="e.g., 'Vibrant streetwear suitable for Holi festival, paint splashes, dynamic pose'" /></FormControl>
                      <FormDescription>Describe the image you want for this category. Use this prompt with an AI image generator. Paste the generated image URL below.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="imageUrl" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL (Optional)</FormLabel>
                      <FormControl><Input {...field} placeholder="https://example.com/category-image.jpg" /></FormControl>
                      <FormDescription>Tip: For quick uploads, use services like ImgBB.com or Postimages.org. Paste the "Direct link" (ending in .jpg, .png, etc.).</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <DialogFooter className="pt-4">
                    <DialogClose asChild><Button type="button" variant="outline" onClick={() => {setIsFormOpen(false); form.reset();}}>Cancel</Button></DialogClose>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      {editingCategory ? 'Save Changes' : 'Create Category'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeleteAlertOpen}
        onOpenChange={(open) => {
          setIsDeleteAlertOpen(open);
          if (!open) setCategoryToDelete(null);
        }}
      >
        <AlertDialogDeleteContent>
          <AlertDialogDeleteHeader>
            <AlertDialogDeleteTitle>Are you sure you want to delete this category?</AlertDialogDeleteTitle>
            <AlertDialogDeleteDescription>
              This action cannot be undone. This will permanently delete the category: "{categoryToDelete?.name}".
              If this category is a parent, its children will become top-level categories (their `parentId` will be set to NULL due to the ON DELETE SET NULL constraint in Supabase). Products associated with this category will need to be manually reassigned.
            </AlertDialogDeleteDescription>
          </AlertDialogDeleteHeader>
          <AlertDialogDeleteFooter>
            <AlertDialogCancel onClick={() => { setCategoryToDelete(null); setIsDeleteAlertOpen(false); }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isSaving} className="bg-destructive hover:bg-destructive/90">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogDeleteFooter>
        </AlertDialogDeleteContent>
      </AlertDialog>
    </>
  );
}
