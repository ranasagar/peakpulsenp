
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { BarChart3, Bot, Lightbulb, Loader2, TrendingDown, TrendingUp, Info, RefreshCcw, PlayCircle } from 'lucide-react'; // Added PlayCircle
import { summarizeSiteAnalytics } from '@/ai/flows/site-analytics-flow';
import type { SiteAnalyticsInput, SiteAnalyticsOutput } from '@/ai/flows/site-analytics-flow';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const siteAnalyticsFormSchema = z.object({
  period: z.string().min(1, "Period is required. E.g., 'Last 30 Days'"),
  totalPageViews: z.coerce.number().int().min(0, "Page views must be non-negative."),
  uniqueVisitors: z.coerce.number().int().min(0, "Unique visitors must be non-negative."),
  conversionRate: z.coerce.number().min(0).max(1, "Conversion rate must be between 0 (0%) and 1 (100%). E.g., 0.05 for 5%."),
  topPages: z.string().min(1, "Enter at least one top page/product, comma-separated."),
  newUsers: z.coerce.number().int().min(0, "New users must be non-negative."),
  bounceRate: z.coerce.number().min(0).max(1, "Bounce rate must be between 0 (0%) and 1 (100%). E.g., 0.4 for 40%.").optional().or(z.literal('')),
});

type SiteAnalyticsFormValues = z.infer<typeof siteAnalyticsFormSchema>;

const manualDemoData: SiteAnalyticsFormValues = {
  period: "Last 30 Days (Manual Demo)",
  totalPageViews: 15230,
  uniqueVisitors: 7850,
  newUsers: 3100,
  conversionRate: 0.025,
  bounceRate: 0.45,
  topPages: "/, /products/himalayan-breeze-jacket, /our-story",
};

const automatedDemoMetrics: SiteAnalyticsInput = {
  period: "Last 7 Days (Automated)",
  totalPageViews: 8500,
  uniqueVisitors: 4200,
  newUsers: 1500,
  conversionRate: 0.031, // 3.1%
  bounceRate: 0.38, // 38%
  topPages: ["/products/urban-nomad-pants", "/sale", "/community"],
};

export default function AdminAnalyticsPage() {
  const [isLoadingManual, setIsLoadingManual] = useState(false);
  const [isLoadingAutomated, setIsLoadingAutomated] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SiteAnalyticsOutput | null>(null);
  const [analysisPeriod, setAnalysisPeriod] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<SiteAnalyticsFormValues>({
    resolver: zodResolver(siteAnalyticsFormSchema),
    defaultValues: {
      period: '',
      totalPageViews: 0,
      uniqueVisitors: 0,
      newUsers: 0,
      conversionRate: 0.0,
      bounceRate: undefined,
      topPages: '',
    },
  });

  const handleLoadDemoData = () => {
    form.reset(manualDemoData);
    toast({ title: "Demo Data Loaded", description: "Form fields populated with sample analytics data for manual submission." });
  };

  const onManualSubmit = async (values: SiteAnalyticsFormValues) => {
    setIsLoadingManual(true);
    setError(null);
    setAnalysisResult(null);
    try {
      const inputForAI: SiteAnalyticsInput = {
        ...values,
        topPages: values.topPages.split(',').map(page => page.trim()).filter(page => page),
        bounceRate: values.bounceRate === '' || values.bounceRate === undefined ? undefined : Number(values.bounceRate),
      };
      const result = await summarizeSiteAnalytics(inputForAI);
      setAnalysisResult(result);
      setAnalysisPeriod(inputForAI.period);
      toast({ title: "Analysis Complete", description: "AI insights generated based on your custom input." });
    } catch (err) {
      console.error("Manual analytics flow error:", err);
      const errorMessage = (err as Error).message || "Failed to generate AI analysis for custom data.";
      setError(errorMessage);
      toast({ title: "Analysis Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoadingManual(false);
    }
  };

  const handleAutomatedAnalysis = async () => {
    setIsLoadingAutomated(true);
    setError(null);
    setAnalysisResult(null);
    try {
      const result = await summarizeSiteAnalytics(automatedDemoMetrics);
      setAnalysisResult(result);
      setAnalysisPeriod(automatedDemoMetrics.period);
      toast({ title: "Automated Analysis Complete", description: "AI insights generated using demo metrics." });
    } catch (err) {
      console.error("Automated analytics flow error:", err);
      const errorMessage = (err as Error).message || "Failed to generate automated AI analysis.";
      setError(errorMessage);
      toast({ title: "Automated Analysis Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoadingAutomated(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <BarChart3 className="mr-3 h-6 w-6 text-primary" />
            AI-Powered Site Analytics Demo
          </CardTitle>
          <CardDescription>
            Generate an AI-powered summary and recommendations. You can input custom metrics or run an automated analysis with demo data.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Button onClick={handleAutomatedAnalysis} size="lg" className="w-full sm:w-auto mb-6 bg-green-600 hover:bg-green-700" disabled={isLoadingAutomated || isLoadingManual}>
              {isLoadingAutomated ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PlayCircle className="mr-2 h-5 w-5" />}
              Run Automated Demo Analysis
            </Button>

          <p className="text-sm text-muted-foreground text-center my-4">OR</p>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onManualSubmit)} className="space-y-6">
              <h4 className="text-lg font-medium text-foreground border-b pb-2">Input Custom Metrics:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="period" render={({ field }) => (
                  <FormItem><FormLabel>Period*</FormLabel><FormControl><Input placeholder="e.g., Last 30 Days" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="totalPageViews" render={({ field }) => (
                  <FormItem><FormLabel>Total Page Views*</FormLabel><FormControl><Input type="number" placeholder="e.g., 15000" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="uniqueVisitors" render={({ field }) => (
                  <FormItem><FormLabel>Unique Visitors*</FormLabel><FormControl><Input type="number" placeholder="e.g., 7500" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="newUsers" render={({ field }) => (
                  <FormItem><FormLabel>New Users*</FormLabel><FormControl><Input type="number" placeholder="e.g., 3000" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="conversionRate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conversion Rate (0-1)*</FormLabel>
                    <FormControl><Input type="number" step="0.001" placeholder="e.g., 0.025 for 2.5%" {...field} /></FormControl>
                    <FormDescription>Enter as a decimal (e.g., 0.05 for 5%).</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="bounceRate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bounce Rate (0-1, Optional)</FormLabel>
                    <FormControl><Input type="number" step="0.01" placeholder="e.g., 0.45 for 45%" {...field} value={field.value ?? ''} /></FormControl>
                    <FormDescription>Enter as a decimal. Leave blank if not applicable.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="topPages" render={({ field }) => (
                <FormItem>
                  <FormLabel>Top Pages/Products (comma-separated)*</FormLabel>
                  <FormControl><Textarea placeholder="e.g., /, /products/cool-jacket, /our-story" {...field} rows={3} /></FormControl>
                  <FormDescription>List 2-5 of your most visited pages or products.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button type="submit" size="lg" disabled={isLoadingManual || isLoadingAutomated}>
                  {isLoadingManual ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Bot className="mr-2 h-5 w-5" />}
                  Analyze Custom Data
                </Button>
                <Button type="button" variant="outline" size="lg" onClick={handleLoadDemoData} disabled={isLoadingManual || isLoadingAutomated}>
                  <RefreshCcw className="mr-2 h-5 w-5" /> Load Manual Demo Data
                </Button>
              </div>
            </form>
          </Form>

          {error && (
            <Alert variant="destructive" className="mt-6">
              <AlertTitle>Error Generating Analysis</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {(isLoadingManual || isLoadingAutomated) && !analysisResult && (
         <Card className="shadow-lg mt-8">
            <CardContent className="p-8 text-center">
                <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary mb-3" />
                <p className="text-muted-foreground">AI is analyzing the data, please wait...</p>
            </CardContent>
         </Card>
      )}

      {analysisResult && (
        <Card className="shadow-lg mt-8">
          <CardHeader>
            <CardTitle className="text-xl flex items-center"><Lightbulb className="mr-2 h-5 w-5 text-primary"/>AI Analysis & Recommendations</CardTitle>
            <CardDescription>Based on the metrics for: {analysisPeriod || "the provided data"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold text-lg mb-2 text-foreground">Overall Summary:</h4>
              <p className="text-muted-foreground whitespace-pre-line bg-muted/50 p-3 rounded-md">{analysisResult.summary}</p>
            </div>

            {analysisResult.positiveObservations && analysisResult.positiveObservations.length > 0 && (
              <div>
                <h4 className="font-semibold text-lg mb-2 text-green-600 flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5"/> Positive Observations:
                </h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-5 bg-muted/30 p-3 rounded-md">
                  {analysisResult.positiveObservations.map((obs, index) => (
                    <li key={`pos-${index}`}>{obs}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysisResult.areasForImprovement && analysisResult.areasForImprovement.length > 0 && (
              <div>
                <h4 className="font-semibold text-lg mb-2 text-amber-600 flex items-center">
                  <TrendingDown className="mr-2 h-5 w-5"/> Areas for Improvement:
                </h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-5 bg-muted/30 p-3 rounded-md">
                  {analysisResult.areasForImprovement.map((area, index) => (
                    <li key={`imp-${index}`}>{area}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysisResult.actionableRecommendations && analysisResult.actionableRecommendations.length > 0 && (
              <div>
                <h4 className="font-semibold text-lg mb-2 text-blue-600 flex items-center">
                  <Bot className="mr-2 h-5 w-5"/> Actionable Recommendations:
                </h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-5 bg-muted/30 p-3 rounded-md">
                  {analysisResult.actionableRecommendations.map((rec, index) => (
                    <li key={`rec-${index}`}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
           <CardFooter>
            <p className="text-xs text-muted-foreground italic flex items-start">
                <Info size={14} className="mr-1.5 mt-0.5 shrink-0"/> This analysis is AI-generated and should be used for insights and guidance. Always cross-reference with other data sources and your business context.
            </p>
           </CardFooter>
        </Card>
      )}
    </div>
  );
}

