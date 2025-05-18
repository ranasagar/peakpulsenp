
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { BarChart3, Bot, Lightbulb, Loader2, TrendingDown, TrendingUp } from 'lucide-react';
import { summarizeSiteAnalytics } from '@/ai/flows/site-analytics-flow';
import type { SiteAnalyticsInput, SiteAnalyticsOutput } from '@/ai/flows/site-analytics-flow';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Mock data for demonstration
const mockAnalyticsInput: SiteAnalyticsInput = {
  period: "Last 30 Days",
  totalPageViews: 15230,
  uniqueVisitors: 7850,
  newUsers: 3100,
  conversionRate: 0.025, // 2.5%
  bounceRate: 0.45, // 45%
  topPages: ["/", "/products/himalayan-breeze-jacket", "/our-story"],
};

export default function AdminAnalyticsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SiteAnalyticsOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAnalyzeData = async () => {
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    try {
      // In a real scenario, you might fetch this data or allow user input
      const result = await summarizeSiteAnalytics(mockAnalyticsInput);
      setAnalysisResult(result);
      toast({ title: "Analysis Complete", description: "AI insights generated." });
    } catch (err) {
      console.error("Analytics flow error:", err);
      const errorMessage = (err as Error).message || "Failed to generate AI analysis.";
      setError(errorMessage);
      toast({ title: "Analysis Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <BarChart3 className="mr-3 h-6 w-6 text-primary" />
            AI-Powered Site Analytics (Demo)
          </CardTitle>
          <CardDescription>
            Generate a summary and recommendations based on mock site performance metrics.
            This is a demonstration of AI capabilities for data interpretation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 border rounded-md bg-muted/50">
            <h4 className="font-semibold mb-2 text-foreground">Mock Data for {mockAnalyticsInput.period}:</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Total Page Views: {mockAnalyticsInput.totalPageViews.toLocaleString()}</li>
              <li>Unique Visitors: {mockAnalyticsInput.uniqueVisitors.toLocaleString()}</li>
              <li>New Users: {mockAnalyticsInput.newUsers.toLocaleString()}</li>
              <li>Conversion Rate: {(mockAnalyticsInput.conversionRate * 100).toFixed(1)}%</li>
              {mockAnalyticsInput.bounceRate && <li>Bounce Rate: {(mockAnalyticsInput.bounceRate * 100).toFixed(1)}%</li>}
              <li>Top Pages: {mockAnalyticsInput.topPages.join(', ')}</li>
            </ul>
          </div>

          <Button onClick={handleAnalyzeData} disabled={isLoading} size="lg">
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Bot className="mr-2 h-5 w-5" />
            )}
            Generate AI Analysis
          </Button>

          {error && (
            <Alert variant="destructive" className="mt-6">
              <AlertTitle>Error Generating Analysis</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {analysisResult && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">AI Analysis & Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold text-lg mb-2 text-foreground">Overall Summary:</h4>
              <p className="text-muted-foreground whitespace-pre-line">{analysisResult.summary}</p>
            </div>

            {analysisResult.positiveObservations && analysisResult.positiveObservations.length > 0 && (
              <div>
                <h4 className="font-semibold text-lg mb-2 text-green-600 flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5"/> Positive Observations:
                </h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-4">
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
                <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-4">
                  {analysisResult.areasForImprovement.map((area, index) => (
                    <li key={`imp-${index}`}>{area}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysisResult.actionableRecommendations && analysisResult.actionableRecommendations.length > 0 && (
              <div>
                <h4 className="font-semibold text-lg mb-2 text-blue-600 flex items-center">
                  <Lightbulb className="mr-2 h-5 w-5"/> Actionable Recommendations:
                </h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-4">
                  {analysisResult.actionableRecommendations.map((rec, index) => (
                    <li key={`rec-${index}`}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
           <CardFooter>
            <p className="text-xs text-muted-foreground italic">
                Note: This analysis is AI-generated based on mock data and should be used for illustrative purposes.
            </p>
           </CardFooter>
        </Card>
      )}
    </div>
  );
}
