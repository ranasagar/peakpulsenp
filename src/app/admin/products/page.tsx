
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel as RHFFormLabel, FormMessage, FormDescription } from '@/components/ui/form'; // Renamed FormLabel to RHFFormLabel to avoid conflict
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, PlusCircle, Trash2, Edit, XCircle, Paintbrush, Package, Tags } from 'lucide-react';
import type { Product, ProductImage, Category as ProductCategoryType, ProductVariant, PrintDesign, ProductCustomizationConfig, AdminCategory } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription as DialogFormDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import Image from 'next/image';
import Link from 'next/link';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';


const imageSchema = z.object({
  id: z.string().optional(),
  url: z.string().url({ message: "Invalid image URL." }).min(1, "Image URL is required."),
  altText: z.string().optional(),
  dataAiHint: z.string().optional(),
});

const categorySchemaForProduct = z.object({
  id: z.string().min(1, "Category ID is required."),
  name: z.string().min(1, "Category name is required."),
  slug: z.string().min(1, "Category slug is required."),
});

const variantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Variant name is required (e.g., Size, Color)."),
  value: z.string().min(1, "Variant value is required (e.g., M, Red)."),
  sku: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be non-negative."),
  costPrice: z.coerce.number().min(0, "Cost price must be non-negative.").optional().nullable(),
  stock: z.coerce.number().int().min(0, "Stock must be a non-negative integer."),
  imageId: z.string().optional(),
});

const printDesignSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Design name is required."),
  imageUrl: z.string().url("Invalid image URL for design.").min(1, "Design image URL is required."),
  dataAiHint: z.string().optional(),
});

const productCustomizationConfigSchema = z.object({
  enabled: z.boolean().default(false).optional(),
  allowPredefinedDesigns: z.boolean().default(false).optional(),
  predefinedDesignsLabel: z.string().optional(),
  allowCustomDescription: z.boolean().default(false).optional(),
  customDescriptionLabel: z.string().optional(),
  allowInstructions: z.boolean().default(false).optional(),
  instructionsLabel: z.string().optional(),
}).optional();


const productFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Product name is required.").default("Untitled Product"),
  slug: z.string().min(1, "Slug is required.").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens.").optional().or(z.literal('')),
  price: z.coerce.number().min(0, "Price must be a positive number."),
  compareAtPrice: z.coerce.number().min(0, "Compare at price must be non-negative.").optional().nullable(),
  costPrice: z.coerce.number().min(0, "Cost price must be non-negative.").optional().nullable(),
  stock: z.coerce.number().int().min(0, "Base stock must be a non-negative integer.").optional().nullable(),
  shortDescription: z.string().max(200, "Short description must be under 200 characters.").optional(),
  description: z.string().min(1, "Description is required."),
  images: z.array(imageSchema).min(1, "At least one image is required."),
  categories: z.array(categorySchemaForProduct).min(1, "At least one category is required."),
  isFeatured: z.boolean().default(false).optional(),
  fabricDetails: z.string().optional(),
  careInstructions: z.string().optional(),
  sustainabilityMetrics: z.string().optional(),
  fitGuide: z.string().optional(),
  variants: z.array(variantSchema).optional(),
  availablePrintDesigns: z.array(printDesignSchema).optional(),
  customizationConfig: productCustomizationConfigSchema,
});

type ProductFormValues = z.infer<typeof productFormSchema>;

const defaultImage: ProductImage = { id: '', url: '', altText: '', dataAiHint: '' };
const defaultVariant: ProductVariant = { id: '', name: 'Size', value: '', sku: '', price: 0, costPrice: 0, stock: 0, imageId: '' };
const defaultPrintDesign: PrintDesign = { id: '', name: '', imageUrl: '', dataAiHint: '' };
const defaultCustomizationConfig: ProductCustomizationConfig = {
  enabled: false,
  allowPredefinedDesigns: false,
  predefinedDesignsLabel: 'Choose a Signature Design',
  allowCustomDescription: false,
  customDescriptionLabel: 'Describe Your Custom Idea',
  allowInstructions: false,
  instructionsLabel: 'Specific Instructions (Placement, Colors, etc.)',
};

export default function AdminProductsPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<AdminCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '', slug: '', price: 0, compareAtPrice: null, costPrice: null, stock: 0, shortDescription: '', description: '',
      images: [{...defaultImage, id: `img-${Date.now()}`}],
      categories: [],
      isFeatured: false,
      fabricDetails: '', careInstructions: '', sustainabilityMetrics: '', fitGuide: '',
      variants: [],
      availablePrintDesigns: [],
      customizationConfig: {...defaultCustomizationConfig},
    },
  });

  const { fields: imagesFields, append: appendImage, remove: removeImage } = useFieldArray({ control: form.control, name: "images" });
  const { fields: variantsFields, append: appendVariant, remove: removeVariant } = useFieldArray({ control: form.control, name: "variants" });
  const { fields: printDesignsFields, append: appendPrintDesign, remove: removePrintDesign } = useFieldArray({ control: form.control, name: "availablePrintDesigns" });

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/products');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.rawSupabaseError?.message || `Failed to fetch products: ${response.statusText}`);
      }
      const data: Product[] = await response.json();
      setProducts(data);
    } catch (error) {
      toast({ title: "Error Fetching Products", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchAvailableCategories = useCallback(async () => {
    setIsLoadingCategories(true);
    try {
      const response = await fetch('/api/categories'); // Fetches from the public categories endpoint
      if (!response.ok) throw new Error("Failed to fetch available categories");
      const data: AdminCategory[] = await response.json();
      setAvailableCategories(data);
    } catch (error) {
      toast({ title: "Error Fetching Categories", description: (error as Error).message, variant: "destructive" });
      setAvailableCategories([]);
    } finally {
      setIsLoadingCategories(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleOpenFormDialog = async () => {
    await fetchAvailableCategories(); // Ensure categories are loaded before opening dialog
    setIsFormOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    const productCategoriesForForm = product.categories.map(cat => ({
        id: cat.id, name: cat.name, slug: cat.slug
    }));
    form.reset({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      compareAtPrice: product.compareAtPrice === undefined ? null : product.compareAtPrice,
      costPrice: product.costPrice === undefined ? null : product.costPrice,
      stock: product.variants && product.variants.length > 0 ? null : (product.stock === undefined ? null : product.stock),
      shortDescription: product.shortDescription || '',
      description: product.description,
      images: product.images.length > 0 ? product.images.map(img => ({ ...defaultImage, ...img, id: img.id || `img-loaded-${Date.now()}-${Math.random()}` })) : [{...defaultImage, id: `img-${Date.now()}-${Math.random()}`}],
      categories: productCategoriesForForm,
      isFeatured: product.isFeatured || false,
      fabricDetails: product.fabricDetails || '',
      careInstructions: product.careInstructions || '',
      sustainabilityMetrics: product.sustainabilityMetrics || '',
      fitGuide: product.fitGuide || '',
      variants: product.variants ? product.variants.map(v => ({...defaultVariant, ...v, id: v.id || `var-loaded-${Date.now()}-${Math.random()}`, costPrice: v.costPrice === undefined ? null : v.costPrice })) : [],
      availablePrintDesigns: product.availablePrintDesigns ? product.availablePrintDesigns.map(d => ({...defaultPrintDesign, ...d, id: d.id || `design-loaded-${Date.now()}-${Math.random()}`})) : [],
      customizationConfig: product.customizationConfig ? {...defaultCustomizationConfig, ...product.customizationConfig} : {...defaultCustomizationConfig},
    });
    handleOpenFormDialog();
  };

  const handleAddNew = () => {
    setEditingProduct(null);
    const newProductName = `Untitled Product ${Date.now()}`;
    form.reset({
      name: newProductName,
      slug: '', // API will generate slug if empty
      price: 0, compareAtPrice: null, costPrice: null, stock: 0, shortDescription: '', description: '',
      images: [{...defaultImage, id: `img-${Date.now()}-${Math.random()}`}],
      categories: [],
      isFeatured: false,
      fabricDetails: '', careInstructions: '', sustainabilityMetrics: '', fitGuide: '',
      variants: [],
      availablePrintDesigns: [],
      customizationConfig: {...defaultCustomizationConfig},
    });
    handleOpenFormDialog();
  };

  const onSubmit = async (data: ProductFormValues) => {
    setIsSaving(true);
    try {
      const payload = { 
        ...data, 
        id: editingProduct?.id, // Include ID for updates, undefined for new products
        slug: data.slug?.trim() || data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
      };
      const response = await fetch('/api/admin/products', { // Single endpoint for create/update
        method: 'POST', // Let the backend decide create vs update based on ID
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorDetail = `Failed to ${editingProduct ? 'update' : 'create'} product.`;
        try {
            const errorData = await response.json();
            errorDetail = errorData.message || errorData.rawSupabaseError?.message || `Server responded with ${response.status}`;
        } catch (e) { /* ignore */ }
        throw new Error(errorDetail);
      }
      toast({ title: "Success!", description: `Product "${data.name}" ${editingProduct ? 'updated' : 'created'} successfully.` });
      fetchProducts();
      setIsFormOpen(false);
    } catch (error) {
      toast({ title: "Save Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const selectedCategoryIds = useMemo(() => {
    return (form.watch('categories') || []).map(cat => cat.id);
  }, [form.watch('categories')]);

  const handleCategorySelection = (categoryId: string, categoryName: string, categorySlug: string, checked: boolean) => {
    const currentCategories = form.getValues('categories') || [];
    let newCategories: ProductCategoryType[];
    if (checked) {
      if (!currentCategories.find(cat => cat.id === categoryId)) {
        newCategories = [...currentCategories, { id: categoryId, name: categoryName, slug: categorySlug }];
      } else {
        newCategories = currentCategories; // Already exists
      }
    } else {
      newCategories = currentCategories.filter(cat => cat.id !== categoryId);
    }
    form.setValue('categories', newCategories, { shouldValidate: true, shouldDirty: true });
  };


  const hasVariants = (form.watch('variants') || []).length > 0;
  const customizationEnabled = form.watch('customizationConfig.enabled');

  if (isLoading) {
    return (
      <Card className="shadow-lg flex flex-col h-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center">
             <Package className="mr-3 h-6 w-6 text-primary"/>
            <CardTitle className="text-2xl">Manage Products</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex-grow flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center">
            <Package className="mr-3 h-6 w-6 text-primary"/>
            <CardTitle className="text-2xl">Manage Products</CardTitle>
          </div>
          <Button onClick={handleAddNew}><PlusCircle className="mr-2 h-4 w-4"/> Add New Product</Button>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No products found. Add a new product to get started.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Price (NPR)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Stock</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Featured</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-background divide-y divide-border">
                  {products.map(product => (
                    <tr key={product.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-foreground">{product.name}</div>
                        <div className="text-xs text-muted-foreground">{product.slug}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">रू{product.price.toLocaleString()}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground hidden md:table-cell">
                        {product.variants && product.variants.length > 0
                           ? product.variants.reduce((sum, v) => sum + (v.stock || 0), 0)
                           : (product.stock ?? 'N/A')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground hidden lg:table-cell">{product.isFeatured ? 'Yes' : 'No'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(product)} className="h-8 text-xs"><Edit className="mr-1.5 h-3 w-3"/> Edit</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(open) => {setIsFormOpen(open); if(!open) form.reset();}}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingProduct ? `Edit: ${form.getValues('name') || editingProduct.name}` : 'Add New Product'}</DialogTitle>
            <DialogFormDescription>
              {editingProduct ? `Modifying details for ${form.getValues('name') || editingProduct.name}.` : 'Fill in the details for the new product.'}
            </DialogFormDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] p-1 -mx-1">
            <div className="p-5">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Accordion type="multiple" defaultValue={['basic-info', 'descriptions', 'images', 'categories']} className="w-full">
                  <AccordionItem value="basic-info">
                    <AccordionTrigger className="text-lg font-semibold">Basic Information</AccordionTrigger>
                    <AccordionContent className="pt-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                          <FormItem><RHFFormLabel>Name*</RHFFormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="slug" render={({ field }) => (
                          <FormItem><RHFFormLabel>Slug</RHFFormLabel><FormControl><Input {...field} placeholder="auto-generated if empty" /></FormControl><FormDescription>Lowercase, hyphens only.</FormDescription><FormMessage /></FormItem>
                        )} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField control={form.control} name="price" render={({ field }) => (
                              <FormItem><RHFFormLabel>Price (NPR)*</RHFFormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={form.control} name="compareAtPrice" render={({ field }) => (
                              <FormItem><RHFFormLabel>Compare At Price (Optional)</RHFFormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>
                          )} />
                           <FormField control={form.control} name="costPrice" render={({ field }) => (
                              <FormItem><RHFFormLabel>Cost Price (NPR)</RHFFormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value ?? ''}  onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}/></FormControl><FormMessage /></FormItem>
                          )} />
                      </div>

                      {!hasVariants && (
                           <FormField control={form.control} name="stock" render={({ field }) => (
                              <FormItem><RHFFormLabel>Base Stock (if no variants)</RHFFormLabel><FormControl><Input type="number" {...field} value={field.value ?? 0} onChange={e => field.onChange(e.target.value === '' ? null : parseInt(e.target.value, 10))} /></FormControl><FormMessage /></FormItem>
                          )} />
                      )}
                       <FormField control={form.control} name="isFeatured" render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 shadow-sm">
                              <FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
                              <div className="space-y-0.5 leading-none">
                                <RHFFormLabel className="font-normal cursor-pointer">Mark as Featured Product</RHFFormLabel>
                              </div>
                          </FormItem>
                        )} />
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="descriptions">
                    <AccordionTrigger className="text-lg font-semibold">Descriptions</AccordionTrigger>
                    <AccordionContent className="pt-4 space-y-4">
                      <FormField control={form.control} name="shortDescription" render={({ field }) => (
                        <FormItem><RHFFormLabel>Short Description</RHFFormLabel><FormControl><Textarea {...field} rows={2} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="description" render={({ field }) => (
                        <FormItem>
                          <RHFFormLabel>Full Description</RHFFormLabel>
                          <FormControl><Textarea {...field} rows={5} /></FormControl>
                          <FormDescription>HTML is allowed for rich formatting.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="images">
                    <AccordionTrigger className="text-lg font-semibold">Images (First image is main)</AccordionTrigger>
                    <AccordionContent className="pt-4 space-y-3">
                      {imagesFields.map((field, index) => (
                        <Card key={field.id} className="p-3 space-y-2 bg-muted/30">
                          <RHFFormLabel className="text-sm">Image {index + 1}</RHFFormLabel>
                          <FormField control={form.control} name={`images.${index}.url`} render={({ field }) => (
                            <FormItem>
                                <RHFFormLabel className="text-xs">Image URL*</RHFFormLabel>
                                <FormControl><Input {...field} placeholder="https://example.com/image.jpg" /></FormControl>
                                <FormDescription>Tip: Use ImgBB.com or Postimages.org for free uploads. Paste the "Direct link".</FormDescription>
                                <FormMessage />
                            </FormItem>
                          )} />
                          <div className="grid grid-cols-2 gap-2">
                            <FormField control={form.control} name={`images.${index}.altText`} render={({ field }) => (
                                <FormItem><RHFFormLabel className="text-xs">Alt Text</RHFFormLabel><FormControl><Input {...field} placeholder="Descriptive alt text" /></FormControl></FormItem>
                            )} />
                            <FormField control={form.control} name={`images.${index}.dataAiHint`} render={({ field }) => (
                                <FormItem><RHFFormLabel className="text-xs">AI Hint</RHFFormLabel><FormControl><Input {...field} placeholder="e.g. jacket fashion" /></FormControl></FormItem>
                            )} />
                          </div>
                          <Button type="button" variant="destructive" size="xs" onClick={() => removeImage(index)} disabled={imagesFields.length <= 1}><Trash2 className="mr-1 h-3 w-3"/>Remove Image</Button>
                        </Card>
                      ))}
                      <Button type="button" variant="outline" size="sm" onClick={() => appendImage({...defaultImage, id: `img-${Date.now()}-${Math.random()}`})}><PlusCircle className="mr-2 h-4 w-4"/>Add Image</Button>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="categories">
                    <AccordionTrigger className="text-lg font-semibold flex items-center"><Tags className="mr-2 h-5 w-5 text-primary" />Categories*</AccordionTrigger>
                    <AccordionContent className="pt-4 space-y-3">
                        {isLoadingCategories ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> :
                          availableCategories.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-48 overflow-y-auto p-1 border rounded-md">
                              {availableCategories.map(category => (
                                <FormField
                                  key={category.id}
                                  control={form.control}
                                  name="categories"
                                  render={() => ( // No 'field' needed directly here for a group of checkboxes
                                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                      <FormControl>
                                        <Checkbox
                                          checked={selectedCategoryIds.includes(category.id)}
                                          onCheckedChange={(checked) => {
                                            handleCategorySelection(category.id, category.name, category.slug, !!checked);
                                          }}
                                          id={`category-select-${category.id}`}
                                        />
                                      </FormControl>
                                      <Label htmlFor={`category-select-${category.id}`} className="text-sm font-normal cursor-pointer">
                                        {category.name}
                                      </Label>
                                    </FormItem>
                                  )}
                                />
                              ))}
                            </div>
                          ) : <p className="text-sm text-muted-foreground">No categories available. Please <Link href="/admin/categories" className="text-primary hover:underline">create categories</Link> first.</p>
                        }
                         <FormMessage>{form.formState.errors.categories?.message || form.formState.errors.categories?.root?.message}</FormMessage>
                         <FormDescription>Select at least one category for this product.</FormDescription>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="additional-details">
                    <AccordionTrigger className="text-lg font-semibold">Additional Details</AccordionTrigger>
                    <AccordionContent className="pt-4 space-y-4">
                      <FormField control={form.control} name="fabricDetails" render={({ field }) => (
                        <FormItem><RHFFormLabel>Fabric Details</RHFFormLabel><FormControl><Textarea {...field} rows={2} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="careInstructions" render={({ field }) => (
                        <FormItem><RHFFormLabel>Care Instructions</RHFFormLabel><FormControl><Textarea {...field} rows={2} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="sustainabilityMetrics" render={({ field }) => (
                        <FormItem><RHFFormLabel>Sustainability Metrics</RHFFormLabel><FormControl><Textarea {...field} rows={2} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="fitGuide" render={({ field }) => (
                        <FormItem><RHFFormLabel>Fit Guide</RHFFormLabel><FormControl><Textarea {...field} rows={2} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="variants">
                    <AccordionTrigger className="text-lg font-semibold">Variants (Optional)</AccordionTrigger>
                    <AccordionContent className="pt-4 space-y-3">
                      {variantsFields.map((field, index) => (
                        <Card key={field.id} className="p-3 space-y-2 bg-muted/30">
                          <RHFFormLabel className="text-sm">Variant {index + 1}</RHFFormLabel>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            <FormField control={form.control} name={`variants.${index}.name`} render={({ field }) => (
                              <FormItem><RHFFormLabel className="text-xs">Type (e.g. Size)*</RHFFormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name={`variants.${index}.value`} render={({ field }) => (
                              <FormItem><RHFFormLabel className="text-xs">Value (e.g. M)*</RHFFormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name={`variants.${index}.sku`} render={({ field }) => (
                              <FormItem><RHFFormLabel className="text-xs">SKU</RHFFormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name={`variants.${index}.price`} render={({ field }) => (
                              <FormItem><RHFFormLabel className="text-xs">Variant Price*</RHFFormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value ?? 0} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} placeholder="Overrides base price if set" /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name={`variants.${index}.costPrice`} render={({ field }) => (
                              <FormItem><RHFFormLabel className="text-xs">Variant Cost Price</RHFFormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value ?? ''}  onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name={`variants.${index}.stock`} render={({ field }) => (
                              <FormItem><RHFFormLabel className="text-xs">Stock*</RHFFormLabel><FormControl><Input type="number" {...field} value={field.value ?? 0} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name={`variants.${index}.imageId`} render={({ field }) => (
                              <FormItem><RHFFormLabel className="text-xs">Image ID (Optional)</RHFFormLabel><FormControl><Input {...field} placeholder="img-variant-id" /></FormControl><FormDescription>ID of an image from the main list above.</FormDescription><FormMessage /></FormItem>
                            )} />
                          </div>
                          <Button type="button" variant="destructive" size="xs" onClick={() => removeVariant(index)}><Trash2 className="mr-1 h-3 w-3"/>Remove Variant</Button>
                        </Card>
                      ))}
                      <Button type="button" variant="outline" size="sm" onClick={() => appendVariant({...defaultVariant, id: `var-${Date.now()}-${Math.random()}`})}><PlusCircle className="mr-2 h-4 w-4"/>Add Variant</Button>
                       {hasVariants && <p className="text-xs text-muted-foreground p-1">If variants are used, their prices override the base product price. Variant stock is summed for total product stock. Base stock field will be ignored.</p>}
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="customization">
                    <AccordionTrigger className="text-lg font-semibold flex items-center"><Paintbrush className="mr-2 h-5 w-5 text-primary"/>Product Customization Options</AccordionTrigger>
                    <AccordionContent className="pt-4 space-y-4">
                         <FormField
                            control={form.control}
                            name="customizationConfig.enabled"
                            render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-muted/30">
                                <div className="space-y-0.5">
                                <RHFFormLabel className="cursor-pointer">Enable Customization for this Product</RHFFormLabel>
                                <FormMessage />
                                </div>
                                <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                            </FormItem>
                            )}
                        />
                        {customizationEnabled && (
                            <div className="space-y-4 pl-4 border-l-2 border-primary/30 ml-2">
                                <FormField
                                    control={form.control}
                                    name="customizationConfig.allowPredefinedDesigns"
                                    render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                        <RHFFormLabel className="font-normal cursor-pointer">Allow Predefined Designs</RHFFormLabel>
                                    </FormItem>
                                    )}
                                />
                                {form.watch("customizationConfig.allowPredefinedDesigns") && (
                                    <FormField control={form.control} name="customizationConfig.predefinedDesignsLabel" render={({ field }) => (
                                        <FormItem className="ml-6">
                                            <RHFFormLabel>Label for 'Signature Peak Design' Section</RHFFormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormDescription>This is the title shown above the selectable predefined designs on the product page (e.g., &quot;Choose a Signature Peak Design&quot;).</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                )}

                                <FormField
                                    control={form.control}
                                    name="customizationConfig.allowCustomDescription"
                                    render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                        <RHFFormLabel className="font-normal cursor-pointer">Allow User Custom Design Description</RHFFormLabel>
                                    </FormItem>
                                    )}
                                />
                                {form.watch("customizationConfig.allowCustomDescription") && (
                                    <FormField control={form.control} name="customizationConfig.customDescriptionLabel" render={({ field }) => (
                                         <FormItem className="ml-6"><RHFFormLabel>Label for Custom Design Description Input</RHFFormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                )}

                                <FormField
                                    control={form.control}
                                    name="customizationConfig.allowInstructions"
                                    render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                        <RHFFormLabel className="font-normal cursor-pointer">Allow User Instructions</RHFFormLabel>
                                    </FormItem>
                                    )}
                                />
                                {form.watch("customizationConfig.allowInstructions") && (
                                    <FormField control={form.control} name="customizationConfig.instructionsLabel" render={({ field }) => (
                                         <FormItem className="ml-6"><RHFFormLabel>Label for Instructions Input</RHFFormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                )}
                            </div>
                        )}
                    </AccordionContent>
                  </AccordionItem>

                  {customizationEnabled && form.watch("customizationConfig.allowPredefinedDesigns") && (
                      <AccordionItem value="predefined-designs">
                          <AccordionTrigger className="text-lg font-semibold">Available Predefined Print Designs</AccordionTrigger>
                          <AccordionContent className="pt-4 space-y-3">
                            {printDesignsFields.map((field, index) => (
                                <Card key={field.id} className="p-3 space-y-2 bg-muted/30">
                                  <RHFFormLabel className="text-sm">Design {index + 1}</RHFFormLabel>
                                  <FormField control={form.control} name={`availablePrintDesigns.${index}.name`} render={({ field }) => (
                                      <FormItem><RHFFormLabel className="text-xs">Design Name*</RHFFormLabel><FormControl><Input {...field} placeholder="e.g. Everest Peak Outline" /></FormControl><FormMessage /></FormItem>
                                  )} />
                                  <FormField control={form.control} name={`availablePrintDesigns.${index}.imageUrl`} render={({ field }) => (
                                      <FormItem>
                                        <RHFFormLabel className="text-xs">Design Image URL*</RHFFormLabel>
                                        <FormControl><Input {...field} placeholder="https://example.com/design.png" /></FormControl>
                                        <FormDescription>Tip: Use ImgBB.com or Postimages.org for free uploads. Paste the "Direct link".</FormDescription>
                                        <FormMessage />
                                      </FormItem>
                                  )} />
                                  <FormField control={form.control} name={`availablePrintDesigns.${index}.dataAiHint`} render={({ field }) => (
                                      <FormItem><RHFFormLabel className="text-xs">AI Hint for Design Image</RHFFormLabel><FormControl><Input {...field} placeholder="e.g. mountain lineart" /></FormControl><FormMessage /></FormItem>
                                  )} />
                                  <Button type="button" variant="destructive" size="xs" onClick={() => removePrintDesign(index)}><Trash2 className="mr-1 h-3 w-3"/>Remove Design</Button>
                                </Card>
                            ))}
                            <Button type="button" variant="outline" size="sm" onClick={() => appendPrintDesign({...defaultPrintDesign, id: `print-${Date.now()}-${Math.random()}`})}><PlusCircle className="mr-2 h-4 w-4"/>Add Predefined Design</Button>
                          </AccordionContent>
                      </AccordionItem>
                  )}
                </Accordion>

                <DialogFooter className="pt-4">
                  <DialogClose asChild>
                     <Button type="button" variant="outline" onClick={() => {setIsFormOpen(false); form.reset();}}>Cancel</Button>
                  </DialogClose>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {editingProduct ? 'Save Changes' : 'Create Product'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
