
"use client";

// This page's access control is primarily handled by src/app/(account)/layout.tsx
// That layout checks for authentication and user roles ('affiliate' or 'admin').
// If the user doesn't meet criteria, they'll see an access denied message from the layout.

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, DollarSign, Link as LinkIcon, Users, BarChart3 } from 'lucide-react';
import Link from 'next/link';

// Mock Data - Replace with actual data fetching for the affiliate
const mockAffiliateData = {
  totalReferrals: 25,
  totalSales: 15,
  commissionEarned: 75000, // NPR
  conversionRate: '60%', // (Sales / Referrals) * 100
  uniqueLink: 'https://peakpulse.com/ref/your-unique-code'
};

export default function AffiliatePortalPage() {
  // The layout already handles auth and role checks.
  // If we reach here, the user is authenticated and has 'affiliate' or 'admin' role.

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
          <input 
            type="text" 
            readOnly 
            value={mockAffiliateData.uniqueLink} 
            className="flex-grow p-2 border rounded-md bg-muted text-sm text-muted-foreground"
          />
          <Button 
            onClick={() => { 
                navigator.clipboard.writeText(mockAffiliateData.uniqueLink);
                // toast({ title: "Link Copied!" }); // Assuming toast is available
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
                {/* Placeholder for links to resources */}
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                    <li><Link href="#" className="hover:text-primary hover:underline">Download Brand Assets</Link></li>
                    <li><Link href="#" className="hover:text-primary hover:underline">Affiliate Program Terms & Conditions</Link></li>
                    <li><Link href="#" className="hover:text-primary hover:underline">Content Creation Guidelines</Link></li>
                </ul>
            </CardContent>
        </Card>
         <Card className="shadow-md">
            <CardHeader>
                <CardTitle className="text-xl">Payout Information</CardTitle>
                <CardDescription>Manage your payment details and view payout history.</CardDescription>
            </CardHeader>
            <CardContent>
                {/* Placeholder for payout info */}
                <p className="text-sm text-muted-foreground mb-3">Next Payout Date: July 30, 2024 (Example)</p>
                <Button variant="secondary" asChild>
                    <Link href="#">View Payout History (Placeholder)</Link>
                </Button>
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
