
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <Card className="shadow-xl">
      <CardHeader>
        <div className="flex items-center mb-4">
            <ShieldCheck className="h-10 w-10 mr-4 text-primary" />
            <CardTitle className="text-3xl font-bold text-foreground">Privacy Policy</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="prose prose-lg dark:prose-invert max-w-none text-foreground">
        <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

        <h2>1. Introduction</h2>
        <p>Welcome to Peak Pulse. We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about this privacy notice, or our practices with regards to your personal information, please contact us.</p>

        <h2>2. Information We Collect</h2>
        <p>We collect personal information that you voluntarily provide to us when you register on the website, express an interest in obtaining information about us or our products and services, when you participate in activities on the website or otherwise when you contact us.</p>
        <p>The personal information that we collect depends on the context of your interactions with us and the website, the choices you make and the products and features you use. The personal information we collect may include the following: names, phone numbers, email addresses, mailing addresses, job titles, usernames, passwords, contact preferences, contact or authentication data, billing addresses, and other similar information.</p>

        <h2>3. How We Use Your Information</h2>
        <p>We use personal information collected via our website for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.</p>
        <ul>
          <li>To facilitate account creation and logon process.</li>
          <li>To post testimonials.</li>
          <li>Request feedback.</li>
          <li>To enable user-to-user communications.</li>
          <li>To manage user accounts.</li>
          <li>To send administrative information to you.</li>
          <li>To protect our Services.</li>
          <li>To enforce our terms, conditions and policies for business purposes, to comply with legal and regulatory requirements or in connection with our contract.</li>
          <li>To respond to legal requests and prevent harm.</li>
        </ul>

        <h2>4. Will Your Information Be Shared With Anyone?</h2>
        <p>We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations.</p>
        
        <h2>5. How Long Do We Keep Your Information?</h2>
        <p>We will only keep your personal information for as long as it is necessary for the purposes set out in this privacy notice, unless a longer retention period is required or permitted by law (such as tax, accounting or other legal requirements).</p>

        <h2>6. How Do We Keep Your Information Safe?</h2>
        <p>We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure.</p>
        
        <h2>7. What Are Your Privacy Rights?</h2>
        <p>In some regions (like the European Economic Area and the United Kingdom), you have certain rights under applicable data protection laws. These may include the right (i) to request access and obtain a copy of your personal information, (ii) to request rectification or erasure; (iii) to restrict the processing of your personal information; and (iv) if applicable, to data portability.</p>

        <h2>8. Updates To This Notice</h2>
        <p>We may update this privacy notice from time to time. The updated version will be indicated by an updated "Revised" date and the updated version will be effective as soon as it is accessible.</p>
        
        <h2>9. How Can You Contact Us About This Notice?</h2>
        <p>If you have questions or comments about this notice, you may email us at [contact@peakpulse.com] or by post to: [Peak Pulse Address Placeholder].</p>
      </CardContent>
    </Card>
  );
}
