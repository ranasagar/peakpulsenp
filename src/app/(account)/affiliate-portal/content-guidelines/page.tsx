
"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, CheckCircle, XCircle, Image as ImageIconLucide } from 'lucide-react';

export default function AffiliateContentGuidelinesPage() {
  return (
    <div className="container-slim section-padding">
      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex items-center mb-4">
              <Lightbulb className="h-10 w-10 mr-4 text-primary" />
              <CardTitle className="text-3xl font-bold text-foreground">Affiliate Content Creation Guidelines</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="prose prose-lg dark:prose-invert max-w-none text-foreground">
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

          <p>Welcome, Peak Pulse Affiliate! We're thrilled to have you on board. To ensure a consistent and positive brand image, please follow these guidelines when creating content to promote Peak Pulse.</p>

          <h2><ImageIconLucide className="inline-block h-6 w-6 mr-2 text-primary" /> General Principles</h2>
          <ul>
            <li><strong>Authenticity:</strong> Be genuine and share your honest opinions about Peak Pulse products. Your audience trusts your recommendations.</li>
            <li><strong>Transparency:</strong> Always disclose your affiliate relationship clearly and conspicuously. Use hashtags like #PeakPulseAffiliate, #Ad, #Sponsored, or phrases like "Affiliate Link" as per FTC guidelines.</li>
            <li><strong>Brand Voice:</strong> Reflect Peak Pulse's values: quality, craftsmanship, cultural heritage, contemporary style, and sustainability. Maintain a positive and respectful tone.</li>
            <li><strong>Accuracy:</strong> Ensure all product information, pricing, and promotional details are accurate and up-to-date. Refer to our website for the latest information.</li>
          </ul>

          <h2><CheckCircle className="inline-block h-6 w-6 mr-2 text-green-500" /> Do's:</h2>
          <ul>
            <li>Showcase Peak Pulse products in high-quality photos and videos.</li>
            <li>Highlight the unique aspects of our products, such as Nepali craftsmanship, unique materials, and design details.</li>
            <li>Share your personal experiences with Peak Pulse items.</li>
            <li>Explain how Peak Pulse products fit into a modern lifestyle while honoring tradition.</li>
            <li>Use approved <Link href="/account/affiliate-portal/brand-assets" className="text-primary hover:underline">Brand Assets</Link> correctly.</li>
            <li>Link directly to product pages or relevant collection pages on the PeakPulse.com website using your unique affiliate link.</li>
            <li>Encourage engagement by asking questions and responding to comments.</li>
            <li>Create content that is visually appealing and aligns with Peak Pulse's aesthetic (e.g., clean, modern, with a touch of cultural richness).</li>
          </ul>

          <h2><XCircle className="inline-block h-6 w-6 mr-2 text-destructive" /> Don'ts:</h2>
          <ul>
            <li>Make false or misleading claims about Peak Pulse products or the company.</li>
            <li>Alter Peak Pulse logos or Brand Assets without permission.</li>
            <li>Use Peak Pulse Brand Assets in a way that implies endorsement by Peak Pulse for non-Peak Pulse products or services.</li>
            <li>Promote Peak Pulse on websites or platforms that contain offensive, illegal, or inappropriate content.</li>
            <li>Engage in spamming or unsolicited messaging to promote your affiliate links.</li>
            <li>Use link cloaking techniques that hide the destination of your affiliate link in a misleading way.</li>
            <li>Offer unofficial discounts or coupons. Only promote offers officially provided by Peak Pulse.</li>
            <li>Compare Peak Pulse products negatively against competitors in a disparaging manner. Focus on our strengths.</li>
            <li>Repost content from Peak Pulse's official channels without proper attribution or modification that adds your unique perspective.</li>
          </ul>

          <h2><ImageIconLucide className="inline-block h-6 w-6 mr-2 text-primary" /> Visual Content</h2>
          <ul>
            <li><strong>Photography/Videography:</strong> Aim for well-lit, clear, and aesthetically pleasing visuals. Lifestyle shots showing products in use are highly encouraged.</li>
            <li><strong>Respectful Representation:</strong> If featuring models or cultural elements, ensure they are portrayed respectfully and accurately.</li>
          </ul>
          
          <h2>Compliance</h2>
          <p>Failure to comply with these guidelines may result in termination from the Peak Pulse Affiliate Program. We reserve the right to update these guidelines at any time.</p>
          <p>If you have any questions about these guidelines or need clarification, please don't hesitate to reach out to our affiliate support team at <a href="mailto:affiliates@peakpulse.com" className="text-primary hover:underline">affiliates@peakpulse.com</a>.</p>
          <p>Thank you for helping us share the Peak Pulse story!</p>
        </CardContent>
      </Card>
    </div>
  );
}

    