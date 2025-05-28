
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { Loader2, MessageSquare, CheckCircle, XCircle, Trash2, RefreshCw } from 'lucide-react';
import type { Review } from '@/types';
import { format } from 'date-fns';
import Image from 'next/image';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RatingStars } from '@/components/ui/rating-stars';


const REVIEW_STATUSES: Review['status'][] = ['pending', 'approved', 'rejected'];

export default function AdminReviewsPage() {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null); // reviewId of updating review
  const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/reviews');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to fetch reviews" }));
        throw new Error(errorData.message || errorData.rawSupabaseError?.message || "Failed to fetch reviews");
      }
      const data: Review[] = await response.json();
      setReviews(data);
    } catch (error) {
      toast({ title: "Error Fetching Reviews", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleStatusChange = async (reviewId: string, newStatus: Review['status']) => {
    setIsUpdating(reviewId);
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to update status" }));
        throw new Error(errorData.message || errorData.rawSupabaseError?.message || "Failed to update status");
      }
      toast({ title: "Status Updated", description: `Review status changed to ${newStatus}.` });
      fetchReviews(); // Refresh list
    } catch (error) {
      toast({ title: "Update Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsUpdating(null);
    }
  };

  const handleDeleteReview = async () => {
    if (!reviewToDelete) return;
    setIsUpdating(reviewToDelete.id); 
    try {
      const response = await fetch(`/api/admin/reviews/${reviewToDelete.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to delete review" }));
        throw new Error(errorData.message || errorData.rawSupabaseError?.message || "Failed to delete review");
      }
      toast({ title: "Review Deleted", description: "The review has been successfully deleted." });
      fetchReviews(); // Refresh list
    } catch (error) {
      toast({ title: "Deletion Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsUpdating(null);
      setIsDeleteAlertOpen(false);
      setReviewToDelete(null);
    }
  };

  const getStatusBadgeVariant = (status: Review['status']): "default" | "secondary" | "destructive" | "outline" => {
    if (status === 'approved') return 'default'; 
    if (status === 'rejected') return 'destructive';
    return 'outline'; // Pending
  };


  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader><CardTitle className="text-2xl flex items-center"><MessageSquare className="mr-3 h-6 w-6 text-primary"/>Manage Product Reviews</CardTitle></CardHeader>
        <CardContent className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center"><MessageSquare className="mr-3 h-6 w-6 text-primary"/>Manage Product Reviews</CardTitle>
            <CardDescription>Approve, reject, or delete customer-submitted product reviews.</CardDescription>
          </div>
           <Button onClick={fetchReviews} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading || !!isUpdating ? 'animate-spin' : ''}`}/> Refresh Reviews
          </Button>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No reviews found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead className="text-center">Rating</TableHead>
                    <TableHead>Comment</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews.map(review => (
                    <TableRow key={review.id} className="hover:bg-muted/30">
                      <TableCell className="text-xs">{format(new Date(review.createdAt), 'MMM d, yyyy HH:mm')}</TableCell>
                      <TableCell className="text-sm font-medium">{review.product_name || review.product_id.substring(0,8)+'...'}</TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center">
                          {review.user_avatar_url && <Image src={review.user_avatar_url} alt={review.user_name || 'User'} width={24} height={24} className="rounded-full mr-2" data-ai-hint="user avatar"/>}
                          {review.user_name || review.user_id.substring(0,8)+'...' }
                        </div>
                      </TableCell>
                      <TableCell className="text-center"><RatingStars rating={review.rating} size={16} /></TableCell>
                      <TableCell className="text-xs max-w-xs truncate" title={review.comment}>{review.comment}</TableCell>
                      <TableCell className="text-center">
                        <Select
                          value={review.status}
                          onValueChange={(newStatus) => handleStatusChange(review.id, newStatus as Review['status'])}
                          disabled={isUpdating === review.id}
                        >
                          <SelectTrigger className="h-8 w-[110px] text-xs">
                            <SelectValue placeholder="Set status" />
                          </SelectTrigger>
                          <SelectContent>
                            {REVIEW_STATUSES.map(s => (
                              <SelectItem key={s} value={s} className="text-xs">
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                         {isUpdating === review.id && <Loader2 className="inline-block ml-2 h-4 w-4 animate-spin" />}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive/80 h-8 w-8"
                          onClick={() => { setReviewToDelete(review); setIsDeleteAlertOpen(true); }}
                          disabled={isUpdating === review.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={(open) => { if(!open) setReviewToDelete(null); setIsDeleteAlertOpen(open);}}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the review by {reviewToDelete?.user_name || 'this user'}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setReviewToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteReview}
              disabled={!!isUpdating && isUpdating === reviewToDelete?.id}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isUpdating === reviewToDelete?.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete Review
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

    