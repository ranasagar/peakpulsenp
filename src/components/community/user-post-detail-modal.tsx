
"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Send, Bookmark, Loader2, Tag, X, Share2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { UserPost, PostComment, User } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface UserPostDetailModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  post: UserPost | null;
  currentUserId?: string | null;
  currentUser?: User | null; // Pass full current user for posting comments
  onLikeToggle: (postId: string) => Promise<void>;
  onBookmarkToggle: (postId: string) => Promise<void>;
  onCommentPosted: (postId: string, newComment: PostComment) => void; // Callback for optimistic UI update
  isLikingPostId: string | null;
  isBookmarkingPostId: string | null;
}

export function UserPostDetailModal({
  isOpen,
  onOpenChange,
  post,
  currentUserId,
  currentUser,
  onLikeToggle,
  onBookmarkToggle,
  onCommentPosted,
  isLikingPostId,
  isBookmarkingPostId,
}: UserPostDetailModalProps) {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchComments = async () => {
      if (isOpen && post?.id) {
        setIsLoadingComments(true);
        try {
          const response = await fetch(`/api/user-posts/${post.id}/comments`);
          if (response.ok) {
            const data: PostComment[] = await response.json();
            setComments(data);
          } else {
            toast({ title: "Error", description: "Could not load comments.", variant: "destructive" });
          }
        } catch (error) {
          toast({ title: "Error", description: "Failed to fetch comments.", variant: "destructive" });
        } finally {
          setIsLoadingComments(false);
        }
      }
    };
    fetchComments();
  }, [isOpen, post?.id, toast]);


  if (!post) return null;

  const hasLiked = currentUserId ? post.liked_by_user_ids?.includes(currentUserId) : false;
  const isLikingThisPost = isLikingPostId === post.id;

  const hasBookmarked = currentUser?.bookmarked_post_ids?.includes(post.id) || false;
  const isBookmarkingThisPost = isBookmarkingPostId === post.id;

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !currentUser?.id || !post.id) {
      toast({ title: "Cannot Post", description: "Comment cannot be empty or user not identified.", variant: "destructive" });
      return;
    }
    setIsSubmittingComment(true);
    try {
      const response = await fetch(`/api/user-posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, commentText: newCommentText }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to post comment.");
      }
      const newCommentData: PostComment = await response.json();
      
      // Optimistic update or re-fetch:
      // For simplicity, we'll use the callback to update the parent's state, which then updates this modal
      onCommentPosted(post.id, {
        ...newCommentData,
        user_name: currentUser.name || 'You', // Use current user's name for optimistic update
        user_avatar_url: currentUser.avatarUrl,
      });
      setComments(prev => [...prev, {
        ...newCommentData,
        user_name: currentUser.name || 'You', 
        user_avatar_url: currentUser.avatarUrl,
      }]);


      setNewCommentText('');
      toast({ title: "Comment Posted!" });
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/community/post/${post.id}`; // Placeholder
    const shareTitle = `Check out this style: ${post.user_name}'s look on Peak Pulse`;
    const shareText = post.caption || shareTitle;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        toast({ title: "Shared successfully!"});
      } catch (error) {
        console.error("Error sharing:", error);
        toast({ title: "Sharing failed", description: "Could not share at this moment.", variant:"destructive"});
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast({ title: "Link Copied!", description: "Post link copied to clipboard."});
      } catch (error) {
        toast({ title: "Copy Failed", description: "Could not copy link.", variant: "destructive"});
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl p-0 max-h-[90vh] flex flex-col overflow-hidden">
         <DialogClose asChild className="md:hidden absolute right-2 top-2 z-50">
            <Button variant="ghost" size="icon" className="rounded-full bg-black/30 hover:bg-black/50 text-white">
              <X className="h-5 w-5" />
            </Button>
          </DialogClose>

        <div className="grid grid-cols-1 md:grid-cols-2 h-full w-full">
          <div className="relative bg-black flex items-center justify-center h-[50vh] sm:h-[60vh] md:h-full w-full md:max-h-full">
            <Image
              src={post.image_url}
              alt={post.caption || `Post by ${post.user_name}`}
              width={800}
              height={1000}
              className="object-contain max-h-full w-auto"
              data-ai-hint="user generated fashion style"
            />
          </div>

          <div className="flex flex-col h-full w-full max-h-[calc(50vh-4rem)] sm:max-h-[calc(40vh-4rem)] md:max-h-full"> {/* Adjusted max-h for mobile */}
            <DialogHeader className="p-4 border-b flex-shrink-0">
              <div className="flex items-center space-x-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={post.user_avatar_url || undefined} alt={post.user_name || 'User'} data-ai-hint="user avatar"/>
                  <AvatarFallback>{post.user_name ? post.user_name.charAt(0).toUpperCase() : 'A'}</AvatarFallback>
                </Avatar>
                <div>
                  <Link href={`/users/${post.user_id}`} passHref>
                    <DialogTitle className="text-sm font-semibold hover:underline cursor-pointer">
                      {post.user_name || 'Anonymous'}
                    </DialogTitle>
                  </Link>
                   <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </DialogHeader>

            <ScrollArea className="flex-grow p-4">
              <div className="space-y-3 mb-4">
                {post.caption && (
                  <p className="text-sm text-foreground whitespace-pre-line">{post.caption}</p>
                )}
                {post.product_tags && post.product_tags.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs font-medium text-muted-foreground flex items-center mb-1">
                      <Tag className="h-3 w-3 mr-1.5"/>Featured Products:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {post.product_tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {/* Comments Section */}
              <h4 className="text-sm font-semibold mb-2 border-t pt-3">Comments ({isLoadingComments ? <Loader2 className="inline h-3 w-3 animate-spin" /> : comments.length})</h4>
              {isLoadingComments ? (
                <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : comments.length > 0 ? (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2"> {/* Added max-h and overflow for comments */}
                  {comments.map(comment => (
                    <div key={comment.id} className="flex items-start space-x-2.5 text-xs">
                      <Avatar className="h-7 w-7">
                         <AvatarImage src={comment.user_avatar_url || undefined} alt={comment.user_name || 'User'} data-ai-hint="user avatar small"/>
                         <AvatarFallback>{comment.user_name ? comment.user_name.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <Link href={`/users/${comment.user_id}`} className="font-semibold text-foreground hover:underline">
                          {comment.user_name || 'User'}
                        </Link>
                        <p className="text-muted-foreground whitespace-pre-line">{comment.comment_text}</p>
                        <p className="text-xs text-muted-foreground/70 mt-0.5">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-3">No comments yet. Be the first!</p>
              )}
            </ScrollArea>

            <div className="p-4 border-t flex-shrink-0 space-y-3 bg-card">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost" size="icon" onClick={() => onLikeToggle(post.id)}
                  disabled={isLikingThisPost || !currentUserId} aria-label={hasLiked ? 'Unlike' : 'Like'}
                  className={cn("hover:text-destructive", hasLiked ? "text-destructive" : "text-foreground/70")}
                >
                  {isLikingThisPost ? <Loader2 className="h-5 w-5 animate-spin" /> : <Heart className={cn("h-5 w-5", hasLiked && "fill-destructive")} />}
                </Button>
                <Button variant="ghost" size="icon" className="text-foreground/70 hover:text-primary" aria-label="Comment" onClick={() => document.getElementById(`comment-input-${post.id}`)?.focus()}>
                  <MessageCircle className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-foreground/70 hover:text-primary" aria-label="Share" onClick={handleShare}>
                  <Share2 className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="ml-auto text-foreground/70 hover:text-primary" aria-label="Bookmark" onClick={() => onBookmarkToggle(post.id)} disabled={isBookmarkingThisPost || !currentUserId}>
                  {isBookmarkingThisPost ? <Loader2 className="h-5 w-5 animate-spin" /> : <Bookmark className={cn("h-5 w-5", hasBookmarked && "fill-primary text-primary")} />}
                </Button>
              </div>
              <p className="text-sm font-semibold">
                {post.like_count ?? 0} like{post.like_count === 1 ? '' : 's'}
              </p>
               <form onSubmit={handleCommentSubmit} className="flex items-start space-x-2">
                {currentUser?.avatarUrl && (
                  <Avatar className="h-8 w-8 mt-0.5">
                    <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name || 'User'} />
                    <AvatarFallback>{currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
                  </Avatar>
                )}
                <Textarea
                  id={`comment-input-${post.id}`}
                  placeholder={currentUser ? `Add a comment as ${currentUser.name || 'yourself'}...` : "Login to comment..."}
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  rows={1}
                  className="flex-grow text-sm min-h-[2.5rem] resize-none"
                  disabled={!currentUser || isSubmittingComment}
                />
                <Button type="submit" size="sm" disabled={!currentUser || isSubmittingComment || !newCommentText.trim()}>
                  {isSubmittingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}



