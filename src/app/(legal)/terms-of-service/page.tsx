
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <Card className="shadow-xl">
      <CardHeader>
        <div className="flex items-center mb-4">
            <FileText className="h-10 w-10 mr-4 text-primary" />
            <CardTitle className="text-3xl font-bold text-foreground">Terms of Service</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="prose prose-lg dark:prose-invert max-w-none text-foreground">
        <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

        <h2>1. Agreement to Terms</h2>
        <p>By using our website and services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.</p>

        <h2>2. Use of Our Services</h2>
        <p>You may use our services only as permitted by law. We may suspend or stop providing our services to you if you do not comply with our terms or policies or if we are investigating suspected misconduct.</p>
        <p>You must be at least 18 years old to create an account and use our services. You are responsible for safeguarding your account and for any activities or actions under your account.</p>

        <h2>3. Products and Orders</h2>
        <p>All purchases through our site or other transactions for the sale of goods formed through the website are governed by our terms of sale, which are hereby incorporated into these Terms of Service.</p>
        <p>We reserve the right to refuse or cancel any order for any reason, including limitations on quantities available for purchase, inaccuracies, or errors in product or pricing information, or problems identified by our credit and fraud avoidance department.</p>

        <h2>4. Intellectual Property</h2>
        <p>The service and its original content (excluding content provided by users), features, and functionality are and will remain the exclusive property of Peak Pulse and its licensors. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of Peak Pulse.</p>

        <h2>5. User Content</h2>
        <p>You may be able to submit content, including reviews, comments, and photos. You retain ownership of any intellectual property rights that you hold in that content. When you upload, submit, store, send or receive content to or through our services, you give Peak Pulse a worldwide license to use, host, store, reproduce, modify, create derivative works, communicate, publish, publicly perform, publicly display and distribute such content.</p>
        
        <h2>6. Prohibited Uses</h2>
        <p>You may use the website only for lawful purposes and in accordance with these Terms. You agree not to use the website:</p>
        <ul>
            <li>In any way that violates any applicable national or international law or regulation.</li>
            <li>For the purpose of exploiting, harming, or attempting to exploit or harm minors in any way.</li>
            <li>To transmit, or procure the sending of, any advertising or promotional material, including any "junk mail," "chain letter," "spam," or any other similar solicitation.</li>
            <li>To impersonate or attempt to impersonate Peak Pulse, a Peak Pulse employee, another user, or any other person or entity.</li>
        </ul>

        <h2>7. Limitation of Liability</h2>
        <p>In no event shall Peak Pulse, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the service.</p>

        <h2>8. Governing Law</h2>
        <p>These Terms shall be governed and construed in accordance with the laws of Nepal, without regard to its conflict of law provisions.</p>

        <h2>9. Changes to Terms</h2>
        <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will provide at least 30 days' notice prior to any new terms taking effect.</p>

        <h2>10. Contact Us</h2>
        <p>If you have any questions about these Terms, please contact us at [contact@peakpulse.com].</p>
      </CardContent>
    </Card>
  );
}
