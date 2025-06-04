
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, CreditCard, Edit, Settings, AlertTriangle } from 'lucide-react';
import type { PaymentGatewaySetting } from '@/types';
import { Dialog, DialogContent, DialogDescription as DialogFormDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle as AlertBoxTitle } from "@/components/ui/alert";

const gatewaySettingSchema = z.object({
  gateway_key: z.string(), // Readonly
  display_name: z.string().min(3, "Display name must be at least 3 characters."),
  description: z.string().optional().nullable(),
  icon_name: z.string().optional().nullable(),
  is_enabled: z.boolean().default(false),
  is_domestic_only: z.boolean().default(true),
  is_international_only: z.boolean().default(false),
  credentials_config: z.record(z.string(), z.any()).optional().nullable(), // Simplified for text area
  environment: z.enum(['test', 'production']).default('test'),
  notes: z.string().optional().nullable(),
  display_order: z.coerce.number().int().optional().default(0),
});

type GatewaySettingFormValues = z.infer<typeof gatewaySettingSchema>;

export default function AdminPaymentGatewaysPage() {
  const { toast } = useToast();
  const [gateways, setGateways] = useState<PaymentGatewaySetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingGateway, setEditingGateway] = useState<PaymentGatewaySetting | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const form = useForm<GatewaySettingFormValues>({
    resolver: zodResolver(gatewaySettingSchema),
  });

  const fetchGateways = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/payment-gateways');
      if (!response.ok) throw new Error('Failed to fetch payment gateways');
      const data: PaymentGatewaySetting[] = await response.json();
      setGateways(data.sort((a, b) => (a.display_order || 0) - (b.display_order || 0)));
    } catch (error) {
      toast({ title: "Error Fetching Gateways", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchGateways();
  }, [fetchGateways]);

  const handleEdit = (gateway: PaymentGatewaySetting) => {
    setEditingGateway(gateway);
    form.reset({
      ...gateway,
      credentials_config: gateway.credentials_config || {}, // Ensure it's an object for the form
    });
    setIsFormOpen(true);
  };

  const onSubmit = async (data: GatewaySettingFormValues) => {
    if (!editingGateway) return;
    setIsSaving(true);
    
    const payload = { ...data };
    // Convert credentials_config back to string for JSONB if it was stringified, or keep as object
    // The API expects a JSON object for credentials_config

    try {
      const response = await fetch(`/api/admin/payment-gateways/${editingGateway.gateway_key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update gateway ${editingGateway.display_name}`);
      }
      toast({ title: "Success!", description: `Gateway "${editingGateway.display_name}" updated.` });
      fetchGateways();
      setIsFormOpen(false);
    } catch (error) {
      toast({ title: "Save Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader><CardTitle className="text-2xl flex items-center"><Settings className="mr-3 h-6 w-6 text-primary"/>Payment Gateway Settings</CardTitle><CardDescription>Loading gateway configurations...</CardDescription></CardHeader>
        <CardContent className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center"><Settings className="mr-3 h-6 w-6 text-primary"/>Payment Gateway Settings</CardTitle>
          <CardDescription>Manage payment gateways available on your store. Credentials are placeholders and should be managed securely in a real environment.</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertBoxTitle>Security Warning</AlertBoxTitle>
            <AlertDescription>
              The API key and secret fields in this demo are for illustrative purposes only. In a production environment, 
              **never store or manage live API keys directly in the database or client-side forms like this.** 
              Use secure server-side environment variables or a dedicated secrets management service.
            </AlertDescription>
          </Alert>
          <div className="space-y-4">
            {gateways.map(gateway => (
              <Card key={gateway.gateway_key} className="p-4 flex flex-col sm:flex-row justify-between items-start gap-4 hover:shadow-md transition-shadow bg-muted/30">
                <div className="flex-grow">
                  <h3 className="font-semibold text-lg text-foreground">{gateway.display_name} <span className="text-xs text-muted-foreground">({gateway.gateway_key})</span></h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{gateway.description || "No description."}</p>
                  <div className="mt-1">
                    <Badge variant={gateway.is_enabled ? "default" : "outline"} className={gateway.is_enabled ? "bg-green-500/20 text-green-700 border-green-500/30" : ""}>
                      {gateway.is_enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                    <Badge variant="secondary" className="ml-2">{gateway.environment}</Badge>
                    {gateway.is_domestic_only && <Badge variant="secondary" className="ml-2">Domestic</Badge>}
                    {gateway.is_international_only && <Badge variant="secondary" className="ml-2">International</Badge>}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleEdit(gateway)} className="flex-shrink-0 mt-2 sm:mt-0"><Edit className="mr-1.5 h-3 w-3" /> Configure</Button>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) form.reset(); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configure: {editingGateway?.display_name}</DialogTitle>
            <DialogFormDescription>Modify settings for this payment gateway.</DialogFormDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] p-1 -mx-1"><div className="p-5">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField control={form.control} name="display_name" render={({ field }) => (<FormItem><FormLabel>Display Name*</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} value={field.value || ''} rows={2} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="icon_name" render={({ field }) => (<FormItem><FormLabel>Icon Name (Lucide)</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="e.g., CreditCard" /></FormControl><FormDescription>Enter a valid Lucide icon name.</FormDescription><FormMessage /></FormItem>)} />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    <FormField control={form.control} name="is_enabled" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 shadow-sm h-10"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal cursor-pointer">Enable this Gateway</FormLabel></FormItem>)} />
                    <FormField control={form.control} name="environment" render={({ field }) => (<FormItem><FormLabel>Environment</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select environment" /></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="test">Test</SelectItem><SelectItem value="production">Production</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                    )} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    <FormField control={form.control} name="is_domestic_only" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 shadow-sm h-10"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal cursor-pointer">Domestic Only (Nepal)</FormLabel></FormItem>)} />
                    <FormField control={form.control} name="is_international_only" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 shadow-sm h-10"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal cursor-pointer">International Only</FormLabel></FormItem>)} />
                </div>

                <FormField
                  control={form.control}
                  name="credentials_config"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Credentials Config (JSON - Placeholder)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={5}
                          placeholder='e.g., {"apiKey": "YOUR_KEY", "secret": "YOUR_SECRET"}'
                          value={typeof field.value === 'string' ? field.value : JSON.stringify(field.value || {}, null, 2)}
                          onChange={(e) => {
                            try {
                              const parsedJson = JSON.parse(e.target.value);
                              field.onChange(parsedJson);
                            } catch (error) {
                              // If parsing fails, it means it's likely not valid JSON yet,
                              // so keep the string value for now, validation will catch it.
                              field.onChange(e.target.value); 
                            }
                          }}
                        />
                      </FormControl>
                      <FormDescription>Enter JSON for API keys, etc. For complex objects, ensure valid JSON. Example: {"{\"apiKey\": \"value\", \"isTest\": true}"}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="display_order" render={({ field }) => (<FormItem><FormLabel>Display Order</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormDescription>Lower numbers appear first on checkout.</FormDescription><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>Admin Notes</FormLabel><FormControl><Textarea {...field} value={field.value || ''} rows={2} placeholder="Internal notes about this gateway..."/></FormControl><FormMessage /></FormItem>)} />
                
                <DialogFooter className="pt-4">
                  <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                  <Button type="submit" disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save Changes</Button>
                </DialogFooter>
              </form>
            </Form>
          </div></ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
