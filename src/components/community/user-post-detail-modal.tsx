
"use client";

import React from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose, // Keep this for the X button
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Send, Bookmark, Loader2, Tag, X } from 'lucide-react'; // Added X
import { ScrollArea } from '@/components/ui/scroll-area';
import type { UserPost } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface UserPostDetailModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  post: UserPost | null;
  currentUserId?: string | null;
  onLikeToggle: (postId: string) => Promise<void>;
  isLikingPostId: string | null;
}

export function UserPostDetailModal({
  isOpen,
  onOpenChange,
  post,
  currentUserId,
  onLikeToggle,
  isLikingPostId,
}: UserPostDetailModalProps) {
  if (!post) return null;

  const hasLiked = currentUserId ? post.liked_by_user_ids?.includes(currentUserId) : false;
  const isLikingThisPost = isLikingPostId === post.id;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl p-0 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Explicit Close button for mobile, DialogClose handles the X icon internally in shadcn */}
         <DialogClose asChild className="md:hidden absolute right-2 top-2 z-50">
            <Button variant="ghost" size="icon" className="rounded-full bg-black/30 hover:bg-black/50 text-white">
              <X className="h-5 w-5" />
            </Button>
          </DialogClose>

        <div className="grid grid-cols-1 md:grid-cols-2 h-full w-full">
          {/* Image Section */}
          <div className="relative bg-black flex items-center justify-center h-[60vh] md:h-full w-full md:max-h-[calc(90vh-0rem)]"> {/* Removed md:max-h calc */}
            <Image
              src={post.image_url}
              alt={post.caption || `Post by ${post.user_name}`}
              width={800}
              height={1000}
              className="object-contain max-h-full w-auto"
              data-ai-hint="user generated fashion style"
            />
          </div>

          {/* Details Section */}
          <div className="flex flex-col h-full w-full"> {/* Ensure details section can scroll if content overflows */}
            <DialogHeader className="p-4 border-b flex-shrink-0">
              <div className="flex items-center space-x-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={post.user_avatar_url || undefined} alt={post.user_name || 'User'} data-ai-hint="user avatar"/>
                  <AvatarFallback>{post.user_name ? post.user_name.charAt(0).toUpperCase() : 'A'}</AvatarFallback>
                </Avatar>
                <div>
                  <DialogTitle className="text-sm font-semibold">{post.user_name || 'Anonymous'}</DialogTitle>
                   <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </DialogHeader>

            <ScrollArea className="flex-grow p-4"> {/* ScrollArea for caption and tags */}
              <div className="space-y-3">
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
            </ScrollArea>

            <div className="p-4 border-t flex-shrink-0 space-y-3 bg-card"> {/* Ensure background for action bar */}
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onLikeToggle(post.id)}
                  disabled={isLikingThisPost || !currentUserId}
                  aria-label={hasLiked ? 'Unlike' : 'Like'}
                  className={cn("hover:text-destructive", hasLiked ? "text-destructive" : "text-foreground/70")}
                >
                  {isLikingThisPost ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Heart className={cn("h-5 w-5", hasLiked && "fill-destructive")} />
                  )}
                </Button>
                <Button variant="ghost" size="icon" className="text-foreground/70 hover:text-primary" aria-label="Comment (UI only)">
                  <MessageCircle className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-foreground/70 hover:text-primary" aria-label="Share (UI only)">
                  <Send className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="ml-auto text-foreground/70 hover:text-primary" aria-label="Save (UI only)">
                  <Bookmark className="h-5 w-5" />
                </Button>
              </div>
              <p className="text-sm font-semibold">
                {post.like_count ?? 0} like{post.like_count === 1 ? '' : 's'}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
