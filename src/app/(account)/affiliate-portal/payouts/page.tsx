
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Banknote, Settings, Download, CalendarDays, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Payout {
  id: string;
  date: string; // ISO Date string
  amountNPR: number;
  status: 'Pending' | 'Processing' | 'Paid' | 'Failed';
  method: string; // e.g., 'Bank Transfer', 'eSewa'
  transactionId?: string;
}

// Mock Data - Replace with actual data fetching for the affiliate
const mockPayouts: Payout[] = [
  { id: 'PAY-001', date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), amountNPR: 55000, status: 'Paid', method: 'Bank Transfer', transactionId: 'TXN12345XYZ' },
  { id: 'PAY-002', date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), amountNPR: 48000, status: 'Paid', method: 'eSewa', transactionId: 'ESW98765ABC' },
  { id: 'PAY-003', date: new Date().toISOString(), amountNPR: 62000, status: 'Pending', method: 'Bank Transfer' },
];

const mockAffiliateAccount = {
    currentBalanceNPR: 62000, // Example current unpaid balance
    nextPayoutDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString(), // Example next payout date
    payoutMethod: 'Bank Transfer', // Example
    minimumPayoutThresholdNPR: 5000,
};

export default function PayoutInformationPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setPayouts(mockPayouts);
      setIsLoading(false);
    }, 500);
  }, []);

  const getStatusBadgeVariant = (status: Payout['status']) => {
    switch (status) {
      case 'Paid': return 'default'; // Using primary color for paid
      case 'Pending': return 'outline';
      case 'Processing': return 'secondary';
      case 'Failed': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="container-wide section-padding">
      <div className="mb-12">
        <div className="flex items-center mb-3">
            <DollarSign className="h-10 w-10 mr-4 text-primary" />
            <div>
                <h1 className="text-4xl font-bold text-foreground">Payout Information</h1>
                <p className="text-lg text-muted-foreground">Manage your payment details and view your payout history.</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <Card className="shadow-md lg:col-span-1">
            <CardHeader>
                <CardTitle className="text-xl flex items-center"><Banknote className="mr-2 h-5 w-5 text-green-500"/>Current Balance</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-4xl font-bold text-green-600 mb-2">रू{mockAffiliateAccount.currentBalanceNPR.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">This is your current unpaid commission balance.</p>
            </CardContent>
        </Card>
         <Card className="shadow-md lg:col-span-1">
            <CardHeader>
                <CardTitle className="text-xl flex items-center"><CalendarDays className="mr-2 h-5 w-5 text-primary"/>Next Payout</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-semibold text-foreground mb-2">{mockAffiliateAccount.nextPayoutDate}</div>
                <p className="text-xs text-muted-foreground">Minimum Payout: रू{mockAffiliateAccount.minimumPayoutThresholdNPR.toLocaleString()}</p>
                 <p className="text-xs text-muted-foreground">Payout Method: {mockAffiliateAccount.payoutMethod}</p>
            </CardContent>
        </Card>
        <Card className="shadow-md lg:col-span-1">
            <CardHeader>
                 <CardTitle className="text-xl flex items-center"><Settings className="mr-2 h-5 w-5 text-muted-foreground"/>Payment Settings</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-3">Update your preferred payout method and details.</p>
                {/* This would ideally link to a form or modal to update settings */}
                <Button variant="outline" disabled>
                    <Settings className="mr-2 h-4 w-4" /> Update Settings (UI Only)
                </Button>
            </CardContent>
        </Card>
      </div>
      
      <Alert className="mb-10 bg-primary/5 border-primary/20">
        <Info className="h-5 w-5 text-primary" />
        <AlertTitle className="text-primary font-semibold">Important Payout Information</AlertTitle>
        <AlertDescription className="text-primary/80 text-sm">
          Payouts are processed around the 15th of each month for commissions earned in the previous month, provided the minimum threshold of रू{mockAffiliateAccount.minimumPayoutThresholdNPR.toLocaleString()} is met. Ensure your payment details are accurate to avoid delays.
        </AlertDescription>
      </Alert>

      <Card className="shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Payout History</CardTitle>
            <CardDescription>A record of all your past and pending commission payouts.</CardDescription>
          </div>
          <Button variant="outline" disabled>
            <Download className="mr-2 h-4 w-4" /> Export History (UI Only)
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading payout history...</p>
          ) : payouts.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payout ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Amount (NPR)</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>Transaction ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.map((payout) => (
                    <TableRow key={payout.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">{payout.id}</TableCell>
                      <TableCell>{new Date(payout.date).toLocaleDateString()}</TableCell>
                      <TableCell>{payout.method}</TableCell>
                      <TableCell className="text-right font-semibold">रू{payout.amountNPR.toLocaleString()}</TableCell>
                      <TableCell className="text-center">
                        <Badge 
                            variant={getStatusBadgeVariant(payout.status)}
                            className={payout.status === 'Paid' ? 'bg-green-500/20 text-green-700 border-green-500/30' : ''}
                        >
                          {payout.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{payout.transactionId || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <DollarSign className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-xl font-semibold text-foreground mb-2">No Payouts Yet</p>
              <p className="text-muted-foreground">Your payout history will appear here once payments are processed.</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
            If you have any questions about your payouts, please contact <a href="mailto:affiliatesupport@peakpulse.com" className="text-primary hover:underline">affiliatesupport@peakpulse.com</a>.
        </CardFooter>
      </Card>
    </div>
  );
}

    