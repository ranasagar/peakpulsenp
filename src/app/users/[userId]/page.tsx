
// /src/app/users/[userId]/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, User as UserIcon, ImagePlus, ArrowLeft } from 'lucide-react';
import MainLayout from '@/components/layout/main-layout';
import type { User as AuthUserType, UserPost } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { UserPostDetailModal } from '@/components/community/user-post-detail-modal';
import { useAuth } from '@/hooks/use-auth'; // To handle liking/bookmarking from this page

interface UserProfilePageProps {
  params: { userId: string };
}

export default function UserProfilePage({ params }: UserProfilePageProps) {
  const { userId } = params;
  const [profile, setProfile] = useState<AuthUserType | null>(null);
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const { user: loggedInUser, isAuthenticated, refreshUserProfile } = useAuth();
  const [selectedPostForModal, setSelectedPostForModal] = useState<UserPost | null>(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isLikingPostId, setIsLikingPostId] = useState<string | null>(null);
  const [isBookmarkingPostId, setIsBookmarkingPostId] = useState<string | null>(null);


  const fetchUserProfile = useCallback(async () => {
    if (!userId) {
      setError("User ID not provided.");
      setIsLoadingProfile(false);
      return;
    }
    setIsLoadingProfile(true);
    try {
      const response = await fetch(`/api/account/profile?uid=${userId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `User profile not found (ID: ${userId}). Status: ${response.status}`);
      }
      const data: AuthUserType = await response.json();
      setProfile(data);
    } catch (err) {
      setError((err as Error).message);
      toast({ title: "Error Loading Profile", description: (err as Error).message, variant: "destructive" });
    } finally {
      setIsLoadingProfile(false);
    }
  }, [userId, toast]);

  const fetchUserSubmittedPosts = useCallback(async () => {
    if (!userId) {
        setIsLoadingPosts(false);
        return;
    }
    setIsLoadingPosts(true);
    try {
      const response = await fetch(`/api/user-posts?userId=${userId}&status=approved`); // Assuming API supports filtering by user and status
      if (!response.ok) {
        throw new Error('Failed to fetch user posts');
      }
      const data: UserPost[] = await response.json();
      setUserPosts(data);
    } catch (err) {
      toast({ title: "Error Loading Posts", description: (err as Error).message, variant: "destructive" });
    } finally {
      setIsLoadingPosts(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    fetchUserProfile();
    fetchUserSubmittedPosts();
  }, [fetchUserProfile, fetchUserSubmittedPosts]);

  const handleCommunityPostClick = (post: UserPost) => {
    if (!isAuthenticated) {
      toast({
        title: "Login to Interact",
        description: "Please log in to view post details and interact.",
        action: <Button asChild variant="outline"><Link href={`/login?redirect=/users/${userId}`}>Login</Link></Button>
      });
      return;
    }
    setSelectedPostForModal(post);
    setIsPostModalOpen(true);
  };

  const handleLikeToggle = useCallback(async (postId: string) => {
    if (!isAuthenticated || !loggedInUser?.id) { return; }
    setIsLikingPostId(postId);
    const originalPosts = [...userPosts];
    const postIndex = userPosts.findIndex(p => p.id === postId);
    if (postIndex === -1) { setIsLikingPostId(null); return; }

    const postToUpdate = { ...userPosts[postIndex] };
    const alreadyLiked = postToUpdate.liked_by_user_ids?.includes(loggedInUser.id);
    const newLikedBy = alreadyLiked 
      ? postToUpdate.liked_by_user_ids?.filter(id => id !== loggedInUser.id) 
      : [...(postToUpdate.liked_by_user_ids || []), loggedInUser.id];
    postToUpdate.liked_by_user_ids = newLikedBy;
    postToUpdate.like_count = newLikedBy?.length || 0;
    
    setUserPosts(prev => prev.map(p => p.id === postId ? postToUpdate : p));
    if (selectedPostForModal?.id === postId) setSelectedPostForModal(postToUpdate);

    try {
      const response = await fetch(`/api/user-posts/${postId}/like`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: loggedInUser.id }),
      });
      if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || 'Failed to update like status.'); }
      const updatedPostFromServer: UserPost = await response.json();
      setUserPosts(prev => prev.map(p => p.id === postId ? updatedPostFromServer : p));
      if (selectedPostForModal?.id === postId) setSelectedPostForModal(updatedPostFromServer);
    } catch (errorCatch) {
      toast({ title: "Error", description: (errorCatch as Error).message, variant: "destructive" });
      setUserPosts(originalPosts); // Revert optimistic update
      if (selectedPostForModal?.id === postId) setSelectedPostForModal(originalPosts[postIndex]);
    } finally {
      setIsLikingPostId(null);
    }
  }, [isAuthenticated, loggedInUser, userPosts, selectedPostForModal, toast]);

  const handleBookmarkToggle = useCallback(async (postId: string) => {
    if (!isAuthenticated || !loggedInUser?.id) { return; }
    setIsBookmarkingPostId(postId);
    try {
      const response = await fetch(`/api/user-posts/${postId}/bookmark`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: loggedInUser.id }),
      });
      if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || 'Failed to update bookmark status.'); }
      await refreshUserProfile(); 
      toast({ title: "Bookmark status updated!" });
    } catch (errorCatch) {
      toast({ title: "Error", description: (errorCatch as Error).message, variant: "destructive" });
    } finally {
      setIsBookmarkingPostId(null);
    }
  }, [isAuthenticated, loggedInUser, toast, refreshUserProfile]);

  const handleCommentPosted = useCallback((postId: string, newComment: any) => { // Use any for temp flexibility
    setUserPosts(prevPosts => prevPosts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comment_count: (p.comment_count || 0) + 1,
          comments: p.comments ? [...p.comments, newComment] : [newComment]
        };
      }
      return p;
    }));
    if (selectedPostForModal?.id === postId) {
      setSelectedPostForModal(prev => prev ? ({
        ...prev,
        comment_count: (prev.comment_count || 0) + 1,
        comments: prev.comments ? [...prev.comments, newComment] : [newComment]
      }) : null);
    }
  }, [selectedPostForModal]);


  if (isLoadingProfile) {
    return (
      <MainLayout>
        <div className="container-wide section-padding flex justify-center items-center min-h-[70vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg text-muted-foreground">Loading Profile...</p>
        </div>
      </MainLayout>
    );
  }

  if (error || !profile) {
    return (
      <MainLayout>
        <div className="container-slim section-padding text-center">
          <UserIcon className="h-16 w-16 text-destructive mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-destructive mb-3">Profile Not Found</h1>
          <p className="text-muted-foreground mb-6">{error || "The requested user profile could not be loaded."}</p>
          <Button asChild variant="outline"><Link href="/community"><ArrowLeft className="mr-2 h-4 w-4" />Back to Community</Link></Button>
        </div>
      </MainLayout>
    );
  }

  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'Community', href: '/community' }, // Assuming a general community page exists or will exist
    { name: profile.name || 'User Profile' },
  ];

  return (
    <MainLayout>
      <div className="container-wide section-padding">
        <div className="mb-8">
          <Breadcrumbs items={breadcrumbs} />
        </div>

        <Card className="shadow-xl p-6 md:p-8 mb-12">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-primary p-1 shrink-0">
              <AvatarImage src={profile.avatarUrl || `https://placehold.co/150x150.png?text=${profile.name ? profile.name.charAt(0) : 'U'}`} alt={profile.name || 'User'} data-ai-hint="profile avatar"/>
              <AvatarFallback className="text-4xl">{profile.name ? profile.name.charAt(0).toUpperCase() : <UserIcon />}</AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left flex-grow">
              <h1 className="text-3xl font-bold text-foreground">{profile.name}</h1>
              {profile.bio && <p className="text-md text-muted-foreground mt-2 max-w-xl">{profile.bio}</p>}
              {/* Add more public profile info here if available, e.g., join date, website */}
            </div>
          </div>
        </Card>

        <h2 className="text-2xl font-semibold text-foreground mb-8">
          {profile.name}'s Shared Styles ({userPosts.length})
        </h2>
        {isLoadingPosts ? (
          <div className="flex justify-center py-10"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
        ) : userPosts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {userPosts.map(post => (
              <Card 
                key={post.id} 
                className="overflow-hidden rounded-xl shadow-lg group hover:shadow-2xl transition-shadow cursor-pointer"
                onClick={() => handleCommunityPostClick(post)}
              >
                <AspectRatio ratio={1/1} className="relative bg-muted">
                  <Image 
                    src={post.image_url} 
                    alt={post.caption || `Style post by ${post.user_name}`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    data-ai-hint="user fashion style"
                  />
                </AspectRatio>
                <CardContent className="p-3">
                  {post.caption && <p className="text-xs text-muted-foreground line-clamp-2 mb-1.5">{post.caption}</p>}
                  {/* Simplified actions for public view, actual interaction in modal */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><HeartIcon className="h-3.5 w-3.5"/>{post.like_count || 0}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <ImagePlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{profile.name} hasn't shared any styles yet.</p>
          </div>
        )}
      </div>
      {selectedPostForModal && (
        <UserPostDetailModal
          isOpen={isPostModalOpen}
          onOpenChange={setIsPostModalOpen}
          post={userPosts.find(p => p.id === selectedPostForModal.id) || selectedPostForModal} 
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
