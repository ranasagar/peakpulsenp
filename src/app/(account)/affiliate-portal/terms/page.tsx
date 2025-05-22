
"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import Link from 'next/link'; // Added Link import

export default function AffiliateTermsPage() {
  return (
    <div className="container-slim section-padding">
      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex items-center mb-4">
              <FileText className="h-10 w-10 mr-4 text-primary" />
              <CardTitle className="text-3xl font-bold text-foreground">Affiliate Program Terms & Conditions</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="prose prose-lg dark:prose-invert max-w-none text-foreground">
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

          <h2>1. Agreement to Terms</h2>
          <p>By participating in the Peak Pulse Affiliate Program ("Program"), you agree to these Affiliate Program Terms & Conditions ("Terms"). If you do not agree, do not participate in the Program. "Peak Pulse," "we," "us," or "our" refers to Peak Pulse brand, and "you" or "your" refers to the affiliate.</p>

          <h2>2. Enrollment in the Program</h2>
          <p>To enroll, you must submit an application through our affiliate portal. We reserve the right to approve or reject any application in our sole discretion. You must provide accurate and complete information.</p>

          <h2>3. Affiliate Responsibilities</h2>
          <ul>
            <li>You will promote Peak Pulse products to your audience using your unique referral link and approved marketing materials.</li>
            <li>You must comply with all applicable laws, regulations, and FTC guidelines regarding endorsements and testimonials, including clear disclosure of your affiliate relationship (e.g., #ad, #sponsored, "Affiliate Link").</li>
            <li>You will not engage in any fraudulent, misleading, or unethical practices. This includes, but is not limited to, cookie stuffing, spamming, or using misleading claims.</li>
            <li>You are responsible for your own website/social media content and ensuring it does not contain offensive, illegal, or inappropriate material.</li>
            <li>You will not bid on Peak Pulse brand keywords or any variations/misspellings thereof in any pay-per-click advertising.</li>
          </ul>

          <h2>4. Commission and Payouts</h2>
          <ul>
            <li>You will earn a commission (as specified in your affiliate dashboard) on qualifying sales made through your unique referral link. A "qualifying sale" is a sale that meets all criteria set by Peak Pulse, including but not limited to, successful payment and not being a fraudulent transaction or subsequently refunded.</li>
            <li>Commissions are tracked through our affiliate system. The cookie duration for tracking referrals is [e.g., 30 days].</li>
            <li>Payouts will be made on a [e.g., monthly] basis, provided your earned commissions meet the minimum payout threshold of [e.g., NPR 5,000 or $50 USD].</li>
            <li>Payouts will be made via [e.g., bank transfer, PayPal - specify methods]. You are responsible for any transaction fees.</li>
            <li>We reserve the right to reverse commissions due to returns, cancellations, or fraudulent activity.</li>
          </ul>

          <h2>5. Use of Brand Assets</h2>
          <p>Peak Pulse grants you a non-exclusive, non-transferable, revocable right to use our logos, banners, and other marketing materials ("Brand Assets") provided through the affiliate portal solely for the purpose of promoting our products under this Program. You must adhere to our <Link href="/account/affiliate-portal/content-guidelines" className="text-primary hover:underline">Content Creation Guidelines</Link>.</p>

          <h2>6. Termination</h2>
          <p>Either party may terminate this agreement at any time, with or without cause, by giving the other party written notice. Upon termination, you must immediately cease using all Brand Assets and referral links. Commissions earned up to the termination date will be paid according to the payout schedule, provided they meet the threshold and are not subject to reversal.</p>
          <p>We reserve the right to terminate your participation immediately if you breach any of these Terms.</p>

          <h2>7. Limitation of Liability</h2>
          <p>Peak Pulse will not be liable for indirect, special, or consequential damages (or any loss of revenue, profits, or data) arising in connection with this Agreement or the Program, even if we have been advised of the possibility of such damages.</p>

          <h2>8. Modification</h2>
          <p>We may modify any of the terms and conditions in this Agreement at any time and in our sole discretion. If any modification is unacceptable to you, your only recourse is to terminate your participation. Your continued participation in the Program following our posting of a change notice or new agreement will constitute binding acceptance of the change.</p>

          <h2>9. Governing Law</h2>
          <p>This Agreement will be governed by the laws of Nepal without reference to rules governing choice of laws.</p>
          
          <h2>10. Contact</h2>
          <p>For any questions regarding the Affiliate Program, please contact us at <a href="mailto:affiliates@peakpulse.com" className="text-primary hover:underline">affiliates@peakpulse.com</a>.</p>
        </CardContent>
      </Card>
    </div>
  );
}
