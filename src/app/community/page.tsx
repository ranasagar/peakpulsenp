
// /src/app/community/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Loader2, Users, ImagePlus, Heart as HeartIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/components/layout/main-layout';
import type { UserPost, PostComment, User as AuthUserType, BreadcrumbItem } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserPostDetailModal } from '@/components/community/user-post-detail-modal';
import { useAuth } from '@/hooks/use-auth';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';

// Metadata export removed as this is a client component

async function fetchApprovedUserPosts(): Promise<UserPost[]> {
  const response = await fetch('/api/user-posts?status=approved');
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Failed to fetch approved posts and parse error."}));
    throw new Error(errorData.message || `Failed to fetch approved posts: ${response.statusText}`);
  }
  return response.json();
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const { user: loggedInUser, isAuthenticated, refreshUserProfile } = useAuth();
  const [selectedPostForModal, setSelectedPostForModal] = useState<UserPost | null>(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isLikingPostId, setIsLikingPostId] = useState<string | null>(null);
  const [isBookmarkingPostId, setIsBookmarkingPostId] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedPosts = await fetchApprovedUserPosts();
      setPosts(fetchedPosts);
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      toast({
        title: "Error Loading Community Posts",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handlePostClick = (post: UserPost) => {
    if (!isAuthenticated) {
      toast({
        title: "Login to Interact",
        description: "Please log in to view post details and interact.",
        action: <Button asChild variant="outline"><Link href="/login?redirect=/community">Login</Link></Button>
      });
      return;
    }
    setSelectedPostForModal(post);
    setIsPostModalOpen(true);
  };

  const handleLikeToggle = useCallback(async (postId: string) => {
    if (!isAuthenticated || !loggedInUser?.id) { return; } 
    setIsLikingPostId(postId);
    const originalPosts = [...posts];
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) { setIsLikingPostId(null); return; }

    const postToUpdate = { ...posts[postIndex] };
    const alreadyLiked = postToUpdate.liked_by_user_ids?.includes(loggedInUser.id);
    const newLikedBy = alreadyLiked 
      ? postToUpdate.liked_by_user_ids?.filter(id => id !== loggedInUser.id) 
      : [...(postToUpdate.liked_by_user_ids || []), loggedInUser.id];
    postToUpdate.liked_by_user_ids = newLikedBy;
    postToUpdate.like_count = newLikedBy?.length || 0;
    
    setPosts(prev => prev.map(p => p.id === postId ? postToUpdate : p));
    if (selectedPostForModal?.id === postId) setSelectedPostForModal(postToUpdate);

    try {
      const response = await fetch(`/api/user-posts/${postId}/like`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: loggedInUser.id }),
      });
      if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || 'Failed to update like status.'); }
      const updatedPostFromServer: UserPost = await response.json();
      setPosts(prev => prev.map(p => p.id === postId ? updatedPostFromServer : p));
      if (selectedPostForModal?.id === postId) setSelectedPostForModal(updatedPostFromServer);
    } catch (errorCatch) {
      toast({ title: "Error", description: (errorCatch as Error).message, variant: "destructive" });
      setPosts(originalPosts);
      if (selectedPostForModal?.id === postId) setSelectedPostForModal(originalPosts[postIndex]);
    } finally {
      setIsLikingPostId(null);
    }
  }, [isAuthenticated, loggedInUser, posts, selectedPostForModal, toast]);

  const handleBookmarkToggle = useCallback(async (postId: string) => {
    if (!isAuthenticated || !loggedInUser?.id) { return; }
    setIsBookmarkingPostId(postId);
    try {
      const response = await fetch(`/api/user-posts/${postId}/bookmark`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: loggedInUser.id }),
      });
      if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || 'Failed to update bookmark.'); }
      await refreshUserProfile(); 
      toast({ title: "Bookmark status updated!" });
    } catch (errorCatch) {
      toast({ title: "Error", description: (errorCatch as Error).message, variant: "destructive" });
    } finally {
      setIsBookmarkingPostId(null);
    }
  }, [isAuthenticated, loggedInUser, toast, refreshUserProfile]);

  const handleCommentPosted = useCallback((postId: string, newComment: PostComment) => {
    setPosts(prevPosts => prevPosts.map(p => {
      if (p.id === postId) {
        return { ...p, comment_count: (p.comment_count || 0) + 1, comments: p.comments ? [...p.comments, newComment] : [newComment] };
      }
      return p;
    }));
    if (selectedPostForModal?.id === postId) {
      setSelectedPostForModal(prev => prev ? ({ ...prev, comment_count: (prev.comment_count || 0) + 1, comments: prev.comments ? [...prev.comments, newComment] : [newComment] }) : null);
    }
  }, [selectedPostForModal]);

  const breadcrumbs: BreadcrumbItem[] = [
    { name: 'Home', href: '/' },
    { name: 'Community' },
  ];

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container-wide section-padding flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg text-muted-foreground">Loading Community Posts...</p>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="container-wide section-padding text-center">
          <p className="text-destructive text-lg">Error: {error}</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container-wide section-padding">
        <div className="mb-8">
          <Breadcrumbs items={breadcrumbs} />
        </div>
        <div className="text-center mb-12 md:mb-16">
          <Users className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Peak Pulse Community
          </h1>
          <p className="text-lg text-muted-foreground mt-3 max-w-xl mx-auto">
            See how our community wears Peak Pulse. Get inspired and share your own style!
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link href="/community/create-post">
              <ImagePlus className="mr-2 h-5 w-5" /> Share Your Style
            </Link>
          </Button>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">No community posts yet. Be the first to share!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {posts.map((post) => {
                let userNameDisplay = post.user_name || 'Anonymous';
                const idSnippetPattern = /^[a-zA-Z0-9]{4}\.\.\.[a-zA-Z0-9]{4}$/;

                if (loggedInUser && post.user_id === loggedInUser.id && loggedInUser.name && loggedInUser.name.trim() !== '') {
                    if (!idSnippetPattern.test(loggedInUser.name)) { 
                         userNameDisplay = loggedInUser.name;
                    } else if (post.user_name && !idSnippetPattern.test(post.user_name)) {
                        userNameDisplay = post.user_name;
                    }
                }
                
                const userProfileLink = `/users/${post.user_id}`;

                const hasLiked = loggedInUser?.id && post.liked_by_user_ids?.includes(loggedInUser.id);

                return (
                  <Card 
                    key={post.id} 
                    className="overflow-hidden rounded-xl shadow-lg group hover:shadow-2xl transition-shadow cursor-pointer"
                    onClick={() => handlePostClick(post)}
                  >
                    <AspectRatio ratio={1/1} className="relative bg-muted">
                        <Image 
                            src={post.image_url} 
                            alt={post.caption || `Style post by ${userNameDisplay}`}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            data-ai-hint="user fashion style"
                        />
                    </AspectRatio>
                    <div className="p-3 bg-background/80 backdrop-blur-sm">
                        <div className="flex items-center space-x-2 mb-1.5">
                            <Avatar className="h-7 w-7 border-border">
                                <AvatarImage src={post.user_avatar_url || undefined} alt={userNameDisplay} data-ai-hint="user avatar small"/>
                                <AvatarFallback>{userNameDisplay ? userNameDisplay.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
                            </Avatar>
                            <Link href={userProfileLink} className="text-xs font-medium text-foreground hover:text-primary truncate" onClick={(e) => e.stopPropagation()}>
                                {userNameDisplay}
                            </Link>
                        </div>
                        {post.caption && <p className="text-xs text-muted-foreground line-clamp-2 mb-1.5">{post.caption}</p>}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <button
                                onClick={(e) => { e.stopPropagation(); handleLikeToggle(post.id); }}
                                disabled={isLikingPostId === post.id || !isAuthenticated}
                                className={cn(
                                    "flex items-center gap-1 hover:text-destructive p-1 -ml-1 rounded-md transition-colors",
                                    hasLiked ? "text-destructive" : "text-muted-foreground"
                                )}
                                aria-label={hasLiked ? "Unlike post" : "Like post"}
                            >
                                {isLikingPostId === post.id ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <HeartIcon className={cn("h-3.5 w-3.5", hasLiked && "fill-destructive")}/>}
                                <span>{post.like_count || 0}</span>
                            </button>
                            <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true, includeSeconds: false })}</span>
                        </div>
                    </div>
                  </Card>
                );
            })}
          </div>
        )}
      </div>

      {selectedPostForModal && (
        <UserPostDetailModal
          isOpen={isPostModalOpen}
          onOpenChange={setIsPostModalOpen}
          post={posts.find(p => p.id === selectedPostForModal.id) || selectedPostForModal} 
          currentUserId={loggedInUser?.id}
          currentUser={loggedInUser}
          onLikeToggle={handleLikeToggle}
          onBookmarkToggle={handleBookmarkToggle}
          onCommentPosted={handleCommentPosted}
          isLikingPostId={isLikingPostId}
          isBookmarkingPostId={isBookmarkingPostId}
        />
      )}
    </MainLayout>
  );
}

// Added for Next.js App Router to correctly handle dynamic params if any were used (not in this page specifically but good practice for child dynamic pages)
export const dynamic = 'force-dynamic'; 

    