
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, DollarSign, Link as LinkIcon, Users, BarChart3, Download, FileText, Edit3 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
// Access control for this page is primarily handled by src/app/(account)/layout.tsx

const mockAffiliateData = {
  totalReferrals: 25,
  totalSales: 15,
  commissionEarned: 75000, // NPR
  conversionRate: '60%', // (Sales / Referrals) * 100
  uniqueLink: 'https://peakpulse.com/ref/your-unique-code' // This would come from user's profile or affiliate specific data
};

export default function AffiliatePortalPage() {
  const { toast } = useToast();

  // In a real app, you'd fetch affiliate-specific data here, perhaps based on user.id

  return (
    <div className="container-wide section-padding">
      <div className="mb-12">
        <div className="flex items-center mb-3">
            <Briefcase className="h-10 w-10 mr-4 text-primary" />
            <div>
                <h1 className="text-4xl font-bold text-foreground">Affiliate Dashboard</h1>
                <p className="text-lg text-muted-foreground">Track your referrals, sales, and earnings.</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Referrals</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{mockAffiliateData.totalReferrals}</div>
            <p className="text-xs text-muted-foreground">Clicks on your unique link</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Converted Sales</CardTitle>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{mockAffiliateData.totalSales}</div>
            <p className="text-xs text-muted-foreground">Successful purchases via your link</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Commission Earned</CardTitle>
            <DollarSign className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">रू{mockAffiliateData.commissionEarned.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total earnings this period</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{mockAffiliateData.conversionRate}</div>
            <p className="text-xs text-muted-foreground">Referrals to sales percentage</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg mb-10">
        <CardHeader>
          <CardTitle className="text-xl flex items-center"><LinkIcon className="mr-3 h-5 w-5 text-primary"/>Your Unique Referral Link</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-center gap-4">
          <Input 
            type="text" 
            readOnly 
            value={mockAffiliateData.uniqueLink} 
            className="flex-grow p-2 border rounded-md bg-muted text-sm text-muted-foreground"
          />
          <Button 
            onClick={() => { 
                navigator.clipboard.writeText(mockAffiliateData.uniqueLink);
                toast({ title: "Link Copied!", description: "Your referral link has been copied to the clipboard." });
            }}
            variant="outline"
            size="sm"
          >
            Copy Link
          </Button>
        </CardContent>
        <CardFooter>
            <p className="text-xs text-muted-foreground">Share this link to earn commissions on sales. Track your performance above.</p>
        </CardFooter>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <Card className="shadow-md">
            <CardHeader>
                <CardTitle className="text-xl">Resources & Guidelines</CardTitle>
                <CardDescription>Find marketing materials and best practices.</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="list-disc list-inside space-y-3 text-sm">
                    <li><Link href="/account/affiliate-portal/brand-assets" className="text-muted-foreground hover:text-primary hover:underline flex items-center"><Download className="mr-2 h-4 w-4"/>Download Brand Assets</Link></li>
                    <li><Link href="/account/affiliate-portal/terms" className="text-muted-foreground hover:text-primary hover:underline flex items-center"><FileText className="mr-2 h-4 w-4"/>Affiliate Program Terms & Conditions</Link></li>
                    <li><Link href="/account/affiliate-portal/content-guidelines" className="text-muted-foreground hover:text-primary hover:underline flex items-center"><Edit3 className="mr-2 h-4 w-4"/>Content Creation Guidelines</Link></li>
                </ul>
            </CardContent>
        </Card>
         <Card className="shadow-md">
            <CardHeader>
                <CardTitle className="text-xl">Payout Information</CardTitle>
                <CardDescription>Manage your payment details and view payout history.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-3">Next Payout Date: {new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString()} (Example)</p>
                <Button variant="secondary" asChild>
                    <Link href="/account/affiliate-portal/payouts">View Payout History</Link>
                </Button>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
