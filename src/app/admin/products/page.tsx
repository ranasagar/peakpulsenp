
"use client";

import { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, PlusCircle, Trash2, Edit, XCircle, Paintbrush } from 'lucide-react';
import type { Product, ProductImage, Category as ProductCategoryType, ProductVariant, PrintDesign, ProductCustomizationConfig } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription as DialogFormDescription, 
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox'; 

const imageSchema = z.object({
  id: z.string().optional(),
  url: z.string().url({ message: "Invalid image URL." }).min(1, "Image URL is required."),
  altText: z.string().optional(),
  dataAiHint: z.string().optional(),
});

const categorySchema = z.object({
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
  costPrice: z.coerce.number().min(0, "Cost price must be non-negative.").optional(),
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
  enabled: z.boolean().optional(),
  allowPredefinedDesigns: z.boolean().optional(),
  predefinedDesignsLabel: z.string().optional(),
  allowCustomDescription: z.boolean().optional(),
  customDescriptionLabel: z.string().optional(),
  allowInstructions: z.boolean().optional(),
  instructionsLabel: z.string().optional(),
}).optional();


const productFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, "Product name must be at least 3 characters."),
  slug: z.string().min(3, "Slug must be at least 3 characters.").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens."),
  price: z.coerce.number().min(0, "Price must be a positive number."),
  compareAtPrice: z.coerce.number().min(0, "Compare at price must be non-negative.").optional().nullable(),
  costPrice: z.coerce.number().min(0, "Cost price must be non-negative.").optional().nullable(),
  stock: z.coerce.number().int().min(0, "Base stock must be a non-negative integer.").optional().nullable(),
  shortDescription: z.string().max(200, "Short description must be under 200 characters.").optional(),
  description: z.string().min(10, "Description must be at least 10 characters."),
  images: z.array(imageSchema).min(1, "At least one image is required."),
  categories: z.array(categorySchema).min(1, "At least one category is required."),
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
const defaultCategory: ProductCategoryType = { id: '', name: '', slug: '' };
const defaultVariant: ProductVariant = { id: '', name: 'Size', value: '', sku: '', price: 0, costPrice: 0, stock: 0, imageId: '' };
const defaultPrintDesign: PrintDesign = { id: '', name: '', imageUrl: '', dataAiHint: '' };
const defaultCustomizationConfig: ProductCustomizationConfig = {
  enabled: false,
  allowPredefinedDesigns: false,
  predefinedDesignsLabel: 'Choose a Signature Design',
  allowCustomDescription: false,
  customDescriptionLabel: 'Describe Your Custom Idea',
  allowInstructions: false,
  instructionsLabel: 'Specific Instructions',
};


export default function AdminProductsPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '', slug: '', price: 0, compareAtPrice: undefined, costPrice: undefined, stock: 0, shortDescription: '', description: '',
      images: [{...defaultImage}],
      categories: [{...defaultCategory}],
      fabricDetails: '', careInstructions: '', sustainabilityMetrics: '', fitGuide: '',
      variants: [],
      availablePrintDesigns: [],
      customizationConfig: {...defaultCustomizationConfig},
    },
  });

  const { fields: imagesFields, append: appendImage, remove: removeImage } = useFieldArray({ control: form.control, name: "images" });
  const { fields: categoriesFields, append: appendCategory, remove: removeCategory } = useFieldArray({ control: form.control, name: "categories" });
  const { fields: variantsFields, append: appendVariant, remove: removeVariant } = useFieldArray({ control: form.control, name: "variants" });
  const { fields: printDesignsFields, append: appendPrintDesign, remove: removePrintDesign } = useFieldArray({ control: form.control, name: "availablePrintDesigns" });


  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      const data: Product[] = await response.json();
      setProducts(data);
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []); 

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
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
      images: product.images.length > 0 ? product.images.map(img => ({ ...defaultImage, ...img })) : [{...defaultImage}],
      categories: product.categories.length > 0 ? product.categories.map(cat => ({ ...defaultCategory, ...cat })) : [{...defaultCategory}],
      fabricDetails: product.fabricDetails || '',
      careInstructions: product.careInstructions || '',
      sustainabilityMetrics: product.sustainabilityMetrics || '',
      fitGuide: product.fitGuide || '',
      variants: product.variants ? product.variants.map(v => ({...defaultVariant, ...v, costPrice: v.costPrice === undefined ? undefined : v.costPrice })) : [],
      availablePrintDesigns: product.availablePrintDesigns ? product.availablePrintDesigns.map(d => ({...defaultPrintDesign, ...d})) : [],
      customizationConfig: product.customizationConfig ? {...defaultCustomizationConfig, ...product.customizationConfig} : {...defaultCustomizationConfig},
    });
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingProduct(null);
    form.reset({
      id: `prod-${Date.now()}`, 
      name: '', slug: '', price: 0, compareAtPrice: null, costPrice: null, stock: 0, shortDescription: '', description: '',
      images: [{...defaultImage}],
      categories: [{...defaultCategory}],
      fabricDetails: '', careInstructions: '', sustainabilityMetrics: '', fitGuide: '',
      variants: [],
      availablePrintDesigns: [],
      customizationConfig: {...defaultCustomizationConfig},
    });
    setIsFormOpen(true);
  };

  const onSubmit = async (data: ProductFormValues) => {
    setIsSaving(true);
    try {
      const productToSave: Product = {
        ...(editingProduct || {}), 
        ...data,
        id: editingProduct?.id || data.id || `prod-${Date.now()}`,
        slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
        createdAt: editingProduct?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        images: data.images.map(img => ({ ...img, id: img.id || `img-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` })),
        categories: data.categories.map(cat => ({ ...cat, id: cat.id || `cat-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`})),
        variants: data.variants?.map(v => ({ ...v, id: v.id || `var-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`})),
        availablePrintDesigns: data.availablePrintDesigns?.map(d => ({...d, id: d.id || `print-${Date.now()}-${Math.random().toString(36).substr(2,5)}`})),
        customizationConfig: data.customizationConfig,
        stock: (data.variants && data.variants.length > 0) ? data.variants.reduce((sum, v) => sum + v.stock, 0) : data.stock || 0,
        averageRating: editingProduct?.averageRating || 0,
        reviewCount: editingProduct?.reviewCount || 0,
        isFeatured: editingProduct?.isFeatured || false,
      };

      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productToSave),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save product');
      }
      toast({ title: "Success!", description: `Product "${data.name}" saved.` });
      fetchProducts(); 
      setIsFormOpen(false);
      setEditingProduct(null);
    } catch (error) {
      toast({ title: "Save Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const hasVariants = form.watch('variants', []).length > 0;
  const customizationEnabled = form.watch('customizationConfig.enabled');

  if (isLoading) {
    return <Card><CardHeader><CardTitle>Loading Products...</CardTitle></CardHeader><CardContent className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Manage Products</CardTitle>
            <CardDescription>Add, edit, or view product details.</CardDescription>
          </div>
          <Button onClick={handleAddNew}><PlusCircle className="mr-2 h-4 w-4"/> Add New Product</Button>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="text-muted-foreground">No products found. Add a new product to get started.</p>
          ) : (
            <ul className="space-y-3">
              {products.map(product => (
                <li key={product.id} className="p-3 border rounded-md flex justify-between items-center bg-card hover:bg-muted/50">
                  <div>
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="text-xs text-muted-foreground">ID: {product.id} | Slug: {product.slug} | Price: रू{product.price} | Cost: रू{product.costPrice ?? 'N/A'} | Stock: {product.stock ?? 'N/A'}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(product)}><Edit className="mr-2 h-3 w-3"/> Edit</Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogFormDescription>
              {editingProduct ? `Editing details for ${editingProduct.name}.` : 'Fill in the details for the new product.'}
            </DialogFormDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] p-1">
            <div className="p-5">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="slug" render={({ field }) => (
                    <FormItem><FormLabel>Slug</FormLabel><FormControl><Input {...field} placeholder="auto-generated if empty" /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="price" render={({ field }) => (
                        <FormItem><FormLabel>Price (NPR)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="compareAtPrice" render={({ field }) => (
                        <FormItem><FormLabel>Compare At Price (Optional)</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>
                    )} />
                     <FormField control={form.control} name="costPrice" render={({ field }) => (
                        <FormItem><FormLabel>Cost Price (NPR)</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}/></FormControl><FormMessage /></FormItem>
                    )} />
                </div>

                {!hasVariants && (
                     <FormField control={form.control} name="stock" render={({ field }) => (
                        <FormItem><FormLabel>Base Stock (if no variants)</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? null : parseInt(e.target.value, 10))} /></FormControl><FormMessage /></FormItem>
                    )} />
                )}


                <FormField control={form.control} name="shortDescription" render={({ field }) => (
                  <FormItem><FormLabel>Short Description</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Full Description (HTML allowed)</FormLabel><FormControl><Textarea {...field} rows={5} /></FormControl><FormMessage /></FormItem>
                )} />

                <fieldset className="space-y-3 p-3 border rounded-md">
                  <legend className="text-md font-medium px-1">Images</legend>
                  {imagesFields.map((field, index) => (
                    <div key={field.id} className="space-y-2 p-2 border rounded bg-muted/30">
                      <FormField control={form.control} name={`images.${index}.url`} render={({ field }) => (
                        <FormItem>
                            <FormLabel>Image URL {index + 1}</FormLabel>
                            <FormControl><Input {...field} placeholder="https://example.com/image.jpg" /></FormControl>
                            <FormDescription>Tip: Upload your image to a free hosting service (e.g., Imgur, Cloudinary free tier, Firebase Storage) then paste the direct image URL (ending in .jpg, .png, .gif, etc.) here.</FormDescription>
                            <FormMessage />
                        </FormItem>
                      )} />
                      <div className="grid grid-cols-2 gap-2">
                        <FormField control={form.control} name={`images.${index}.altText`} render={({ field }) => (
                            <FormItem><FormLabel>Alt Text</FormLabel><FormControl><Input {...field} placeholder="Descriptive alt text" /></FormControl></FormItem>
                        )} />
                        <FormField control={form.control} name={`images.${index}.dataAiHint`} render={({ field }) => (
                            <FormItem><FormLabel>AI Hint</FormLabel><FormControl><Input {...field} placeholder="e.g. jacket fashion" /></FormControl></FormItem>
                        )} />
                      </div>
                      <Button type="button" variant="destructive" size="sm" onClick={() => removeImage(index)} disabled={imagesFields.length <= 1}><Trash2 className="mr-1 h-3 w-3"/>Remove Image</Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => appendImage({...defaultImage})}><PlusCircle className="mr-2 h-4 w-4"/>Add Image</Button>
                </fieldset>

                <fieldset className="space-y-3 p-3 border rounded-md">
                    <legend className="text-md font-medium px-1">Categories</legend>
                    {categoriesFields.map((field, index) => (
                        <div key={field.id} className="space-y-2 p-2 border rounded bg-muted/30">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                                <FormField control={form.control} name={`categories.${index}.id`} render={({ field }) => (
                                    <FormItem><FormLabel>Category ID</FormLabel><FormControl><Input {...field} placeholder="e.g. cat-outerwear" /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name={`categories.${index}.name`} render={({ field }) => (
                                    <FormItem><FormLabel>Category Name</FormLabel><FormControl><Input {...field} placeholder="e.g. Outerwear" /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name={`categories.${index}.slug`} render={({ field }) => (
                                    <FormItem><FormLabel>Category Slug</FormLabel><FormControl><Input {...field} placeholder="e.g. outerwear" /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                             <Button type="button" variant="destructive" size="sm" onClick={() => removeCategory(index)} disabled={categoriesFields.length <=1}><Trash2 className="mr-1 h-3 w-3"/>Remove Category</Button>
                        </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => appendCategory({...defaultCategory})}><PlusCircle className="mr-2 h-4 w-4"/>Add Category</Button>
                </fieldset>

                <FormField control={form.control} name="fabricDetails" render={({ field }) => (
                  <FormItem><FormLabel>Fabric Details</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="careInstructions" render={({ field }) => (
                  <FormItem><FormLabel>Care Instructions</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="sustainabilityMetrics" render={({ field }) => (
                  <FormItem><FormLabel>Sustainability Metrics</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="fitGuide" render={({ field }) => (
                  <FormItem><FormLabel>Fit Guide</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl><FormMessage /></FormItem>
                )} />

                <fieldset className="space-y-3 p-3 border rounded-md">
                  <legend className="text-md font-medium px-1">Variants (Optional)</legend>
                  {variantsFields.map((field, index) => (
                    <div key={field.id} className="space-y-2 p-3 border rounded bg-muted/30">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        <FormField control={form.control} name={`variants.${index}.name`} render={({ field }) => (
                          <FormItem><FormLabel>Type (e.g. Size)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name={`variants.${index}.value`} render={({ field }) => (
                          <FormItem><FormLabel>Value (e.g. M)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name={`variants.${index}.sku`} render={({ field }) => (
                          <FormItem><FormLabel>SKU</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name={`variants.${index}.price`} render={({ field }) => (
                          <FormItem><FormLabel>Variant Price</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value ?? 0} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} placeholder="Overrides base price if set" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name={`variants.${index}.costPrice`} render={({ field }) => (
                          <FormItem><FormLabel>Variant Cost Price</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value ?? ''}  onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name={`variants.${index}.stock`} render={({ field }) => (
                          <FormItem><FormLabel>Stock</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? 0} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name={`variants.${index}.imageId`} render={({ field }) => (
                          <FormItem><FormLabel>Image ID (Optional)</FormLabel><FormControl><Input {...field} placeholder="img-variant-id" /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                      <Button type="button" variant="destructive" size="sm" onClick={() => removeVariant(index)}><Trash2 className="mr-1 h-3 w-3"/>Remove Variant</Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => appendVariant({...defaultVariant})}><PlusCircle className="mr-2 h-4 w-4"/>Add Variant</Button>
                   {hasVariants && <p className="text-xs text-muted-foreground p-1">If variants are used, their prices override the base product price. Variant stock is summed for total product stock.</p>}
                </fieldset>

                <fieldset className="space-y-4 p-4 border rounded-md">
                    <legend className="text-lg font-semibold px-1 flex items-center"><Paintbrush className="mr-2 h-5 w-5 text-primary"/>Product Customization Options</legend>
                     <FormField
                        control={form.control}
                        name="customizationConfig.enabled"
                        render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-muted/30">
                            <div className="space-y-0.5">
                            <FormLabel>Enable Customization for this Product</FormLabel>
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
                                    <FormLabel className="font-normal">Allow Predefined Designs</FormLabel>
                                </FormItem>
                                )}
                            />
                            {form.watch("customizationConfig.allowPredefinedDesigns") && (
                                <FormField control={form.control} name="customizationConfig.predefinedDesignsLabel" render={({ field }) => (
                                    <FormItem className="ml-6">
                                        <FormLabel>Label for &apos;Signature Peak Design&apos; Section</FormLabel>
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
                                    <FormLabel className="font-normal">Allow User Custom Design Description</FormLabel>
                                </FormItem>
                                )}
                            />
                            {form.watch("customizationConfig.allowCustomDescription") && (
                                <FormField control={form.control} name="customizationConfig.customDescriptionLabel" render={({ field }) => (
                                     <FormItem className="ml-6"><FormLabel>Label for Custom Design Description Input</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            )}

                            <FormField
                                control={form.control}
                                name="customizationConfig.allowInstructions"
                                render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                    <FormLabel className="font-normal">Allow User Instructions</FormLabel>
                                </FormItem>
                                )}
                            />
                            {form.watch("customizationConfig.allowInstructions") && (
                                <FormField control={form.control} name="customizationConfig.instructionsLabel" render={({ field }) => (
                                     <FormItem className="ml-6"><FormLabel>Label for Instructions Input</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            )}
                        </div>
                    )}
                </fieldset>

                {customizationEnabled && form.watch("customizationConfig.allowPredefinedDesigns") && (
                    <fieldset className="space-y-3 p-3 border rounded-md">
                        <legend className="text-md font-medium px-1">Available Predefined Print Designs</legend>
                        {printDesignsFields.map((field, index) => (
                            <div key={field.id} className="space-y-2 p-2 border rounded bg-muted/30">
                            <FormField control={form.control} name={`availablePrintDesigns.${index}.name`} render={({ field }) => (
                                <FormItem><FormLabel>Design Name {index + 1}</FormLabel><FormControl><Input {...field} placeholder="e.g. Everest Peak Outline" /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name={`availablePrintDesigns.${index}.imageUrl`} render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Design Image URL</FormLabel>
                                  <FormControl><Input {...field} placeholder="https://example.com/design.png" /></FormControl>
                                  <FormDescription>Tip: Upload your image to a free hosting service (e.g., Imgur, Cloudinary free tier, Firebase Storage) then paste the direct image URL (ending in .jpg, .png, .gif, etc.) here.</FormDescription>
                                  <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name={`availablePrintDesigns.${index}.dataAiHint`} render={({ field }) => (
                                <FormItem><FormLabel>AI Hint for Design Image</FormLabel><FormControl><Input {...field} placeholder="e.g. mountain lineart" /></FormControl><FormMessage /></FormItem>
                            )} />
                            <Button type="button" variant="destructive" size="sm" onClick={() => removePrintDesign(index)}><Trash2 className="mr-1 h-3 w-3"/>Remove Design</Button>
                            </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={() => appendPrintDesign({...defaultPrintDesign})}><PlusCircle className="mr-2 h-4 w-4"/>Add Predefined Design</Button>
                    </fieldset>
                )}


                <DialogFooter className="pt-4">
                  <DialogClose asChild>
                     <Button type="button" variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Product
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

