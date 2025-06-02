
"use client";

import React from 'react';
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
import { Heart, MessageCircle, Send, Bookmark, Loader2, Tag } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
        <div className="grid grid-cols-1 md:grid-cols-2 h-full">
          {/* Image Section */}
          <div className="relative bg-black flex items-center justify-center md:max-h-[calc(90vh-4rem)]">
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
          <div className="flex flex-col h-full">
            <DialogHeader className="p-4 border-b flex-shrink-0">
              <div className="flex items-center space-x-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={post.user_avatar_url || undefined} alt={post.user_name} data-ai-hint="user avatar"/>
                  <AvatarFallback>{post.user_name ? post.user_name.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
                </Avatar>
                <div>
                  <DialogTitle className="text-sm font-semibold">{post.user_name}</DialogTitle>
                   <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </DialogHeader>

            <ScrollArea className="flex-grow p-4">
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

            <div className="p-4 border-t flex-shrink-0 space-y-3">
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
                {/* Placeholder icons */}
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
