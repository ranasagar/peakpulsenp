
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, PlusCircle, Trash2, Edit, Landmark, Sparkles, AlertTriangle } from 'lucide-react';
import type { Loan } from '@/types';
import { format, parseISO, isValid } from 'date-fns';
import { getAiLoanAnalysis } from './actions';
import type { LoanFinancialForecastingOutput } from '@/ai/flows/loan-financial-forecasting-flow';

import {
  Dialog,
  DialogContent,
  DialogDescription as DialogFormDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent as AlertDialogDeleteContent,
  AlertDialogDescription as AlertDialogDeleteDescription,
  AlertDialogFooter as AlertDialogDeleteFooter,
  AlertDialogHeader as AlertDialogDeleteHeader,
  AlertDialogTitle as AlertDialogDeleteTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle as AlertBoxTitle } from "@/components/ui/alert";


const loanFormSchema = z.object({
  id: z.string().optional(),
  loan_name: z.string().min(3, "Loan name must be at least 3 characters."),
  lender_name: z.string().min(2, "Lender name is required."),
  principal_amount: z.coerce.number().positive("Principal amount must be positive."),
  interest_rate: z.coerce.number().min(0).max(100, "Interest rate must be between 0 and 100."),
  loan_term_months: z.coerce.number().int().positive("Loan term must be a positive integer of months."),
  start_date: z.string().refine((date) => isValid(parseISO(date)), { message: "Invalid start date." }),
  status: z.string().min(1, "Status is required."),
  notes: z.string().optional(),
});

type LoanFormValues = z.infer<typeof loanFormSchema>;

const LOAN_STATUS_OPTIONS = ['Active', 'Paid Off', 'Pending', 'Defaulted', 'Restructured'];

export default function AdminLoansPage() {
  const { toast } = useToast();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loanToDelete, setLoanToDelete] = useState<Loan | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false); // New state for delete dialog

  const [selectedLoanForAnalysis, setSelectedLoanForAnalysis] = useState<Loan | null>(null);
  const [isAiAnalysisDialogOpen, setIsAiAnalysisDialogOpen] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<LoanFinancialForecastingOutput | null>(null);
  const [aiAnalysisError, setAiAnalysisError] = useState<string | null>(null);
  const [isAiAnalysisLoading, setIsAiAnalysisLoading] = useState(false);

  const form = useForm<LoanFormValues>({
    resolver: zodResolver(loanFormSchema),
    defaultValues: {
      loan_name: '',
      lender_name: '',
      principal_amount: 0,
      interest_rate: 0,
      loan_term_months: 12,
      start_date: format(new Date(), 'yyyy-MM-dd'),
      status: 'Active',
      notes: '',
    },
  });

  const fetchLoans = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/loans');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch loans');
      }
      const data: Loan[] = await response.json();
      setLoans(data);
    } catch (error) {
      toast({ title: "Error Fetching Loans", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  const handleEdit = (loan: Loan) => {
    setEditingLoan(loan);
    form.reset({
      ...loan,
      start_date: loan.start_date ? format(parseISO(loan.start_date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      principal_amount: Number(loan.principal_amount),
      interest_rate: Number(loan.interest_rate),
      loan_term_months: Number(loan.loan_term_months),
    });
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingLoan(null);
    form.reset({
      loan_name: '',
      lender_name: '',
      principal_amount: 0,
      interest_rate: 0,
      loan_term_months: 12,
      start_date: format(new Date(), 'yyyy-MM-dd'),
      status: 'Active',
      notes: '',
    });
    setIsFormOpen(true);
  };

  const onSubmit = async (data: LoanFormValues) => {
    setIsSaving(true);
    const method = editingLoan ? 'PUT' : 'POST';
    const url = editingLoan ? `/api/admin/loans/${editingLoan.id}` : '/api/admin/loans';
    
    const payload = {
        ...data,
        principal_amount: Number(data.principal_amount),
        interest_rate: Number(data.interest_rate),
        loan_term_months: Number(data.loan_term_months),
    };

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${editingLoan ? 'update' : 'create'} loan`);
      }
      toast({ title: "Success!", description: `Loan "${payload.loan_name}" ${editingLoan ? 'updated' : 'created'}.` });
      fetchLoans();
      setIsFormOpen(false);
      setEditingLoan(null);
    } catch (error) {
      toast({ title: `${editingLoan ? 'Update' : 'Creation'} Failed`, description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!loanToDelete) return;
    setIsSaving(true); // Use same saving state for delete operation
    try {
      const response = await fetch(`/api/admin/loans/${loanToDelete.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete loan');
      }
      toast({ title: "Loan Deleted", description: `Loan "${loanToDelete.loan_name}" has been deleted.` });
      fetchLoans();
    } catch (error) {
      toast({ title: "Deletion Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSaving(false);
      setLoanToDelete(null);
      setIsDeleteAlertOpen(false); // Close dialog after action
    }
  };

  const handleOpenAiAnalysisDialog = async (loan: Loan) => {
    setSelectedLoanForAnalysis(loan);
    setIsAiAnalysisLoading(true);
    setAiAnalysisResult(null);
    setAiAnalysisError(null);
    setIsAiAnalysisDialogOpen(true);

    try {
      const mockRecentSales = 50000; 
      const result = await getAiLoanAnalysis({ loan, recent_sales_revenue_last_30_days: mockRecentSales });
      
      if ('error' in result && typeof result.error === 'string') {
         let errorMessage = result.error;
         if (result.details) errorMessage += ` Details: ${result.details}`;
         if (result.hint) errorMessage += ` Hint: ${result.hint}`;
         throw new Error(errorMessage);
      }
      
      setAiAnalysisResult(result as LoanFinancialForecastingOutput);
    } catch (error) {
      const errorMessage = (error as Error).message || "Failed to get AI analysis.";
      setAiAnalysisError(errorMessage);
      toast({ title: "AI Analysis Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsAiAnalysisLoading(false);
    }
  };


  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader><CardTitle className="text-2xl flex items-center"><Landmark className="mr-3 h-6 w-6 text-primary"/>Manage Business Loans</CardTitle><CardDescription>Loading loan data...</CardDescription></CardHeader>
        <CardContent className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center"><Landmark className="mr-3 h-6 w-6 text-primary"/>Manage Business Loans</CardTitle>
            <CardDescription>Track, add, edit, or delete loan information.</CardDescription>
          </div>
          <Button onClick={handleAddNew}><PlusCircle className="mr-2 h-4 w-4"/> Add New Loan</Button>
        </CardHeader>
        <CardContent>
          {loans.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No loans found. Add a new loan to get started.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loan Name</TableHead>
                    <TableHead>Lender</TableHead>
                    <TableHead className="text-right">Principal (NPR)</TableHead>
                    <TableHead className="text-center">Rate (%)</TableHead>
                    <TableHead className="text-center">Term (M)</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loans.map(loan => (
                    <TableRow key={loan.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">{loan.loan_name}</TableCell>
                      <TableCell>{loan.lender_name}</TableCell>
                      <TableCell className="text-right">{Number(loan.principal_amount).toLocaleString()}</TableCell>
                      <TableCell className="text-center">{loan.interest_rate}%</TableCell>
                      <TableCell className="text-center">{loan.loan_term_months}</TableCell>
                      <TableCell>{format(parseISO(loan.start_date), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="text-center">
                        <Badge 
                            variant={loan.status === 'Paid Off' ? 'default' : loan.status === 'Active' ? 'outline' : 'secondary'}
                            className={loan.status === 'Paid Off' ? 'bg-green-500/20 text-green-700 border-green-500/30' : 
                                        loan.status === 'Active' ? 'border-primary text-primary' :
                                        loan.status === 'Defaulted' ? 'bg-destructive/20 text-destructive border-destructive/30' : ''}
                        >
                            {loan.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center space-x-1">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(loan)} className="h-8 px-2 text-xs"><Edit className="mr-1 h-3 w-3"/> Edit</Button>
                        <Button variant="outline" size="sm" onClick={() => handleOpenAiAnalysisDialog(loan)} className="h-8 px-2 text-xs"><Sparkles className="mr-1 h-3 w-3"/> AI Analysis</Button>
                        <Button variant="destructive" size="sm" onClick={() => { setLoanToDelete(loan); setIsDeleteAlertOpen(true); }} className="h-8 px-2 text-xs"><Trash2 className="mr-1 h-3 w-3"/>Del</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) form.reset(); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingLoan ? 'Edit Loan' : 'Add New Loan'}</DialogTitle>
            <DialogFormDescription>
              {editingLoan ? `Editing details for ${editingLoan.loan_name}.` : 'Fill in the details for the new loan.'}
            </DialogFormDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] p-1">
            <div className="p-5">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField control={form.control} name="loan_name" render={({ field }) => (
                    <FormItem><FormLabel>Loan Name*</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="lender_name" render={({ field }) => (
                    <FormItem><FormLabel>Lender Name*</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="principal_amount" render={({ field }) => (
                        <FormItem><FormLabel>Principal Amount (NPR)*</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="interest_rate" render={({ field }) => (
                        <FormItem><FormLabel>Annual Interest Rate (%)*</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="loan_term_months" render={({ field }) => (
                        <FormItem><FormLabel>Loan Term (Months)*</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="start_date" render={({ field }) => (
                        <FormItem><FormLabel>Start Date*</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                   <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Status*</FormLabel>
                        <select {...field} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                            {LOAN_STATUS_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                        </select>
                        <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem><FormLabel>Notes (Optional)</FormLabel><FormControl><Textarea {...field} rows={3} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <DialogFooter className="pt-4">
                    <Button type="button" variant="outline" onClick={() => {setIsFormOpen(false); form.reset();}}>Cancel</Button>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      {editingLoan ? 'Save Changes' : 'Create Loan'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={(open) => { if (!open) setLoanToDelete(null); setIsDeleteAlertOpen(open); }}>
        <AlertDialogDeleteContent>
          <AlertDialogDeleteHeader>
            <AlertDialogDeleteTitle>Are you sure you want to delete this loan?</AlertDialogDeleteTitle>
            <AlertDialogDeleteDescription>
              This action cannot be undone. This will permanently delete the loan: "{loanToDelete?.loan_name}".
            </AlertDialogDeleteDescription>
          </AlertDialogDeleteHeader>
          <AlertDialogDeleteFooter>
            <AlertDialogCancel onClick={() => { setLoanToDelete(null); setIsDeleteAlertOpen(false); }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isSaving} className="bg-destructive hover:bg-destructive/90">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogDeleteFooter>
        </AlertDialogDeleteContent>
      </AlertDialog>

      {/* AI Analysis Dialog */}
      <Dialog open={isAiAnalysisDialogOpen} onOpenChange={setIsAiAnalysisDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center"><Sparkles className="mr-2 h-5 w-5 text-primary"/>AI Financial Analysis: {selectedLoanForAnalysis?.loan_name}</DialogTitle>
            <DialogFormDescription>
              AI-powered insights and forecasts for this loan. This is advisory and not financial gospel.
            </DialogFormDescription>
          </DialogHeader>
          <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {isAiAnalysisLoading && (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
                <p className="text-muted-foreground">Generating AI analysis... This may take a moment.</p>
              </div>
            )}
            {aiAnalysisError && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertBoxTitle>Analysis Error</AlertBoxTitle>
                    <AlertDescription>{aiAnalysisError}</AlertDescription>
                </Alert>
            )}
            {aiAnalysisResult && !isAiAnalysisLoading && (
              <div className="space-y-4 text-sm">
                <Card className="bg-muted/30">
                  <CardHeader className="pb-2"><CardTitle className="text-md">Estimated Next Payment Date</CardTitle></CardHeader>
                  <CardContent><p className="font-semibold">{aiAnalysisResult.estimated_next_payment_date || 'N/A'}</p></CardContent>
                </Card>
                <Card className="bg-muted/30">
                  <CardHeader className="pb-2"><CardTitle className="text-md">Estimated Monthly Payment (NPR)</CardTitle></CardHeader>
                  <CardContent><p className="font-semibold">रू{aiAnalysisResult.estimated_monthly_payment_npr?.toLocaleString() || 'N/A'}</p></CardContent>
                </Card>
                 <Card className="bg-muted/30">
                  <CardHeader className="pb-2"><CardTitle className="text-md">Financial Outlook Summary</CardTitle></CardHeader>
                  <CardContent><p className="whitespace-pre-line">{aiAnalysisResult.financial_outlook_summary}</p></CardContent>
                </Card>
                {aiAnalysisResult.repayment_capacity_assessment && (
                    <Card className="bg-muted/30">
                        <CardHeader className="pb-2"><CardTitle className="text-md">Repayment Capacity Assessment</CardTitle></CardHeader>
                        <CardContent><p className="whitespace-pre-line">{aiAnalysisResult.repayment_capacity_assessment}</p></CardContent>
                    </Card>
                )}
                 <Card className="bg-muted/30">
                  <CardHeader className="pb-2"><CardTitle className="text-md">Potential Risks or Advice</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-1">
                      {aiAnalysisResult.potential_risks_or_advice.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAiAnalysisDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

