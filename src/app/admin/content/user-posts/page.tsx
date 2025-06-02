
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { Loader2, ImagePlay, CheckCircle, XCircle, Trash2, RefreshCw, User as UserIcon } from 'lucide-react';
import type { UserPost } from '@/types';
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

const POST_STATUSES: UserPost['status'][] = ['pending', 'approved', 'rejected'];

export default function AdminUserPostsPage() {
  const { toast } = useToast();
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null); // postId of updating post
  const [postToDelete, setPostToDelete] = useState<UserPost | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  const fetchUserPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/user-posts');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to fetch user posts" }));
        throw new Error(errorData.message || errorData.rawSupabaseError?.message || "Failed to fetch user posts");
      }
      const data: UserPost[] = await response.json();
      setUserPosts(data);
    } catch (error) {
      toast({ title: "Error Fetching Posts", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUserPosts();
  }, [fetchUserPosts]);

  const handleStatusChange = async (postId: string, newStatus: UserPost['status']) => {
    setIsUpdating(postId);
    try {
      const response = await fetch(`/api/admin/user-posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to update status" }));
        throw new Error(errorData.message || errorData.rawSupabaseError?.message || "Failed to update status");
      }
      toast({ title: "Status Updated", description: `Post status changed to ${newStatus}.` });
      fetchUserPosts(); // Refresh list
    } catch (error) {
      toast({ title: "Update Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsUpdating(null);
    }
  };

  const handleDeletePost = async () => {
    if (!postToDelete) return;
    setIsUpdating(postToDelete.id); 
    try {
      const response = await fetch(`/api/admin/user-posts/${postToDelete.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to delete post" }));
        throw new Error(errorData.message || errorData.rawSupabaseError?.message || "Failed to delete post");
      }
      toast({ title: "Post Deleted", description: "The post has been successfully deleted." });
      fetchUserPosts(); // Refresh list
    } catch (error) {
      toast({ title: "Deletion Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsUpdating(null);
      setIsDeleteAlertOpen(false);
      setPostToDelete(null);
    }
  };

  const getStatusBadgeVariant = (status: UserPost['status']): "default" | "secondary" | "destructive" | "outline" => {
    if (status === 'approved') return 'default'; 
    if (status === 'rejected') return 'destructive';
    return 'outline'; // Pending
  };


  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader><CardTitle className="text-2xl flex items-center"><ImagePlay className="mr-3 h-6 w-6 text-primary"/>Manage User Submitted Posts</CardTitle></CardHeader>
        <CardContent className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center"><ImagePlay className="mr-3 h-6 w-6 text-primary"/>Manage User Submitted Posts</CardTitle>
            <CardDescription>Approve, reject, or delete user-submitted style posts for the community spotlight.</CardDescription>
          </div>
           <Button onClick={fetchUserPosts} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading || !!isUpdating ? 'animate-spin' : ''}`}/> Refresh Posts
          </Button>
        </CardHeader>
        <CardContent>
          {userPosts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No user posts found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Image</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Caption</TableHead>
                    <TableHead>Product Tags</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userPosts.map(post => (
                    <TableRow key={post.id} className="hover:bg-muted/30">
                      <TableCell>
                        <Image 
                            src={post.image_url} 
                            alt={post.caption || `User post by ${post.user_name}`} 
                            width={60} 
                            height={60} 
                            className="rounded-md object-cover aspect-square bg-muted"
                            data-ai-hint="user generated fashion"
                        />
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center">
                          {post.user_avatar_url && <Image src={post.user_avatar_url} alt={post.user_name || 'User'} width={24} height={24} className="rounded-full mr-2" data-ai-hint="user avatar small"/>}
                          {post.user_name || post.user_id.substring(0,8)+'...' }
                        </div>
                        <div className="text-xs text-muted-foreground">{post.user_id.substring(0,12)}...</div>
                      </TableCell>
                      <TableCell className="text-xs max-w-xs truncate" title={post.caption}>{post.caption || '-'}</TableCell>
                      <TableCell className="text-xs">
                        {post.product_tags && post.product_tags.length > 0 
                          ? post.product_tags.map(tag => <Badge key={tag} variant="secondary" className="mr-1 mb-1">{tag}</Badge>)
                          : '-'}
                      </TableCell>
                      <TableCell className="text-xs">{format(new Date(post.created_at), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="text-center">
                        <Select
                          value={post.status}
                          onValueChange={(newStatus) => handleStatusChange(post.id, newStatus as UserPost['status'])}
                          disabled={isUpdating === post.id}
                        >
                          <SelectTrigger className="h-8 w-[110px] text-xs">
                            <SelectValue placeholder="Set status" />
                          </SelectTrigger>
                          <SelectContent>
                            {POST_STATUSES.map(s => (
                              <SelectItem key={s} value={s} className="text-xs">
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                         {isUpdating === post.id && <Loader2 className="inline-block ml-2 h-4 w-4 animate-spin" />}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive/80 h-8 w-8"
                          onClick={() => { setPostToDelete(post); setIsDeleteAlertOpen(true); }}
                          disabled={isUpdating === post.id}
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

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={(open) => { if(!open) setPostToDelete(null); setIsDeleteAlertOpen(open);}}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the post by {postToDelete?.user_name || 'this user'}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPostToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePost}
              disabled={!!isUpdating && isUpdating === postToDelete?.id}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isUpdating === postToDelete?.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete Post
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

    