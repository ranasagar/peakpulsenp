
"use client";

import { useAuth } from '@/hooks/use-auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Edit3, KeyRound, CheckCircle, ShieldAlert, Loader2, ShoppingBag, Heart, MessageSquare, Image as ImageIconLucide } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState, useCallback } from 'react';
import type { User as AuthUserType, Order, Product, Review as ReviewType, UserPost } from '@/types';
import { ProductCard } from '@/components/product/product-card';
import Image from 'next/image'; // For order item images
import { Badge } from '@/components/ui/badge'; // For order status
import { RatingStars } from '@/components/ui/rating-stars'; // For review display

const profileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  avatarUrl: z.string().url({ message: "Invalid URL for avatar."}).optional().or(z.literal('')),
  bio: z.string().max(250, "Bio must be 250 characters or less.").optional().or(z.literal('')),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required." }),
  newPassword: z.string().min(6, { message: "New password must be at least 6 characters." }),
  confirmPassword: z.string().min(6, { message: "Confirm password must be at least 6 characters." }),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "New passwords don't match.",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { user: authUser, isLoading: authLoading, refreshUserProfile } = useAuth();
  const { toast } = useToast();
  const [isFetchingProfileDetails, setIsFetchingProfileDetails] = useState(true);
  const [profileData, setProfileData] = useState<AuthUserType | null>(null);
  
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  
  const [allProducts, setAllProducts] = useState<Product[]>([]); // For wishlist
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [isLoadingWishlistProducts, setIsLoadingWishlistProducts] = useState(false);

  const [userSubmittedPosts, setUserSubmittedPosts] = useState<UserPost[]>([]);
  const [isLoadingUserPosts, setIsLoadingUserPosts] = useState(false);
  const [userReviews, setUserReviews] = useState<ReviewType[]>([]);
  const [isLoadingUserReviews, setIsLoadingUserReviews] = useState(false);


  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '', email: '', avatarUrl: '', bio: '' },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const fetchFullProfileData = useCallback(async () => {
    if (authUser && authUser.id) {
      setIsFetchingProfileDetails(true);
      try {
        const response = await fetch(`/api/account/profile?uid=${authUser.id}`);
        if (response.ok) {
          const data: AuthUserType = await response.json();
          setProfileData(data);
          profileForm.reset({
            name: data.name || '',
            email: data.email || '',
            avatarUrl: data.avatarUrl || '',
            bio: data.bio || '',
          });
        } else {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.message || errorData.rawSupabaseError?.message || `Failed to fetch profile details: ${response.statusText}`;
          console.warn(`[ProfilePage] fetchFullProfileData: API call failed. UID: ${authUser?.id}. Error: ${errorMessage}`);
          toast({ title: "Profile Partially Loaded", description: "Could not fetch full profile details. Some information might be from cache or incomplete. Please ensure database schema is up to date if issues persist.", variant: "default", duration: 7000 });
          // Do not throw here; let the finally block handle fallback to authUser.
        }
      } catch (error) {
        console.error("[ProfilePage] Error in fetchFullProfileData's try-catch:", error);
        const desc = (error as Error).message || "An unknown error occurred while loading your detailed profile information.";
        toast({ title: "Error Loading Profile Details", description: desc, variant: "destructive" });
        // Fallback to authUser data will be handled in `finally` if `profileData` wasn't set.
      } finally {
        // Ensure profileData is set to authUser if it hasn't been successfully fetched
        // and authUser exists. This handles the case where the API failed but authUser is available.
        if (!profileData && authUser) { // Check if profileData was NOT set by a successful API call
            setProfileData(authUser); // Use the potentially less complete authUser from context
            profileForm.reset({
                name: authUser.name || '',
                email: authUser.email || '',
                avatarUrl: authUser.avatarUrl || '',
                bio: authUser.bio || '', // authUser.bio might be undefined, which is fine
            });
        }
        setIsFetchingProfileDetails(false);
      }
    } else if (!authLoading && !authUser) {
        // If authUser is null and not loading, there's no profile to fetch.
        // This case should ideally be handled by a redirect or a "please login" message
        // if the page is accessed directly without auth.
        console.warn("[ProfilePage] fetchFullProfileData: authUser is null and not loading. Cannot fetch profile.");
        setIsFetchingProfileDetails(false);
    }
  }, [authUser, authLoading, toast, profileForm, profileData]); // Added profileData to deps

  useEffect(() => {
    if (!authLoading) fetchFullProfileData();
  }, [authLoading, fetchFullProfileData]);

  const fetchOrdersForProfile = useCallback(async () => {
    if (authUser?.id) {
      setIsLoadingOrders(true);
      try {
        const res = await fetch(`/api/account/orders?userId=${authUser.id}`);
        if (!res.ok) throw new Error("Failed to fetch orders");
        const data: Order[] = await res.json();
        setUserOrders(data);
      } catch (err) {
        toast({ title: "Error", description: "Could not load your orders.", variant: "destructive" });
      } finally {
        setIsLoadingOrders(false);
      }
    }
  }, [authUser, toast]);

  const fetchAllProductsForWishlist = useCallback(async () => {
    if (authUser?.wishlist && authUser.wishlist.length > 0) {
      setIsLoadingWishlistProducts(true);
      try {
        const res = await fetch('/api/products');
        if(!res.ok) throw new Error("Failed to load all products for wishlist filtering.");
        const productsData: Product[] = await res.json();
        setAllProducts(productsData);
        const filtered = productsData.filter(p => authUser.wishlist!.includes(p.id));
        setWishlistItems(filtered);
      } catch (err) {
        toast({ title: "Error", description: "Could not load wishlist products.", variant: "destructive"});
      } finally {
        setIsLoadingWishlistProducts(false);
      }
    } else {
      setWishlistItems([]);
    }
  }, [authUser, toast]);

  const fetchUserSubmissions = useCallback(async () => {
      if (authUser?.id) {
          setIsLoadingUserPosts(true);
          setIsLoadingUserReviews(true);
          try {
              const [postsRes, reviewsRes] = await Promise.all([
                  fetch(`/api/user-posts?userId=${authUser.id}`),
                  fetch(`/api/reviews?userId=${authUser.id}`) 
              ]);
              if (postsRes.ok) {
                  const postsData: UserPost[] = await postsRes.json();
                  setUserSubmittedPosts(postsData.filter(p => p.status === 'approved')); // Show only approved posts
              } else {
                  toast({title: "Error", description: "Could not load your community posts.", variant: "destructive"});
              }
              if (reviewsRes.ok) {
                  const reviewsData: ReviewType[] = await reviewsRes.json();
                  setUserReviews(reviewsData.filter(r => r.status === 'approved')); // Show only approved reviews
              } else {
                   toast({title: "Error", description: "Could not load your reviews.", variant: "destructive"});
              }
          } catch (err) {
               toast({title: "Error", description: "Failed to load your submissions.", variant: "destructive"});
          } finally {
              setIsLoadingUserPosts(false);
              setIsLoadingUserReviews(false);
          }
      }
  }, [authUser, toast]);


  const onProfileSubmit = async (data: ProfileFormValues) => {
    if (!authUser || !authUser.id) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    try {
      const payload = {
        id: authUser.id,
        name: data.name,
        avatarUrl: data.avatarUrl || null,
        bio: data.bio || null,
        email: authUser.email, 
        roles: profileData?.roles || authUser.roles, 
        wishlist: profileData?.wishlist || authUser.wishlist, 
      };
      const response = await fetch('/api/account/profile', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update profile. Server returned non-JSON response.' }));
        throw new Error(errorData.message || errorData.rawSupabaseError?.message || 'Failed to update profile');
      }
      const updatedProfileResponse = await response.json();
      await refreshUserProfile(); 
      toast({ title: "Profile Updated", description: "Your information has been saved.", action: <CheckCircle className="text-green-500" /> });
      // The profileData state will be updated via refreshUserProfile and subsequent re-render of useAuth context,
      // which triggers fetchFullProfileData again.
      // Or, directly set it if API returns the full user object:
      if (updatedProfileResponse.user) {
        setProfileData(updatedProfileResponse.user);
        profileForm.reset(updatedProfileResponse.user);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({ title: "Update Failed", description: (error as Error).message, variant: "destructive" });
    }
  };

  const onPasswordSubmit = async (data: PasswordFormValues) => {
    toast({ title: "Password Change (Mock)", description: "Password change requires Firebase SDK direct integration.", variant: "default", action: <ShieldAlert className="text-yellow-500" /> });
    passwordForm.reset();
  };
  
  const currentDisplayUser = profileData || authUser;
  const ordersCount = userOrders.length;
  const wishlistCount = authUser?.wishlist?.length || 0;
  const submissionsCount = userSubmittedPosts.length + userReviews.length;


  if (authLoading || isFetchingProfileDetails) {
      return <div className="container-wide section-padding text-center flex items-center justify-center min-h-[50vh]"><Loader2 className="h-12 w-12 animate-spin text-primary" /> <span className="ml-4 text-lg">Loading profile...</span></div>
  }
  if (!currentDisplayUser) { 
      return <div className="container-wide section-padding text-center text-destructive">User profile could not be loaded. Please try logging in again or refresh the page.</div>
  }

  return (
    <div className="container-wide section-padding">
      <Card className="shadow-xl p-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
          <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-primary p-1 shrink-0">
            <AvatarImage src={profileForm.watch('avatarUrl') || currentDisplayUser?.avatarUrl || `https://placehold.co/150x150.png`} alt={currentDisplayUser?.name || 'User'} data-ai-hint="profile avatar user"/>
            <AvatarFallback className="text-4xl">{currentDisplayUser?.name ? currentDisplayUser.name.charAt(0).toUpperCase() : <User />}</AvatarFallback>
          </Avatar>
          <div className="text-center sm:text-left flex-grow">
            <h1 className="text-3xl font-bold text-foreground">{profileForm.watch('name') || currentDisplayUser?.name}</h1>
            <p className="text-sm text-muted-foreground mb-1">{profileForm.watch('email') || currentDisplayUser?.email}</p>
             <p className="text-xs text-accent mb-3 capitalize">Role: {currentDisplayUser?.roles?.join(', ') || 'Customer'}</p>
            <Textarea 
              readOnly 
              value={profileForm.watch('bio') || currentDisplayUser?.bio || "No bio yet. Add one in Edit Profile!"} 
              className="text-sm text-muted-foreground bg-transparent border-none p-0 min-h-[40px] resize-none focus-visible:ring-0 focus-visible:ring-offset-0 cursor-default"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => document.getElementById('edit-profile-trigger')?.click()} className="mt-4 sm:mt-0 shrink-0">
            <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center mb-10 border-t border-b py-4">
          <div><p className="text-xl font-semibold text-foreground">{ordersCount}</p><p className="text-xs text-muted-foreground">Orders</p></div>
          <div><p className="text-xl font-semibold text-foreground">{wishlistCount}</p><p className="text-xs text-muted-foreground">Wishlist</p></div>
          <div><p className="text-xl font-semibold text-foreground">{submissionsCount}</p><p className="text-xs text-muted-foreground">Submissions</p></div>
        </div>

        <Tabs defaultValue="submissions" 
              onValueChange={(value) => {
                if(value === 'orders' && userOrders.length === 0) fetchOrdersForProfile();
                if(value === 'wishlist' && wishlistItems.length === 0) fetchAllProductsForWishlist();
                if(value === 'submissions' && userSubmittedPosts.length === 0 && userReviews.length === 0) fetchUserSubmissions();
              }}>
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
            <TabsTrigger value="submissions">My Submissions</TabsTrigger>
            <TabsTrigger value="orders">My Orders</TabsTrigger>
            <TabsTrigger value="wishlist">My Wishlist</TabsTrigger>
            <TabsTrigger value="settings" id="edit-profile-trigger">Edit Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="submissions" className="space-y-8">
             <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center"><ImageIconLucide className="mr-2 h-5 w-5 text-primary"/>My Community Posts</h3>
              {isLoadingUserPosts ? <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary"/> : userSubmittedPosts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {userSubmittedPosts.map(post => (
                          <Card key={post.id} className="overflow-hidden">
                              <Image src={post.image_url} alt={post.caption || 'User post'} width={300} height={300} className="w-full h-48 object-cover" data-ai-hint="user fashion image"/>
                              <CardContent className="p-3">
                                  <p className="text-xs text-muted-foreground line-clamp-2">{post.caption || "No caption."}</p>
                                  <p className="text-xs text-primary mt-1">Status: {post.status}</p>
                              </CardContent>
                          </Card>
                      ))}
                  </div>
              ) : <p className="text-muted-foreground text-sm">You haven&apos;t submitted any community posts yet.</p>}

              <h3 className="text-xl font-semibold text-foreground mb-4 mt-8 flex items-center"><MessageSquare className="mr-2 h-5 w-5 text-primary"/>My Product Reviews</h3>
              {isLoadingUserReviews ? <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary"/> : userReviews.length > 0 ? (
                  <div className="space-y-4">
                      {userReviews.map(review => (
                          <Card key={review.id} className="p-3">
                              <div className="flex justify-between items-start">
                                  <p className="text-sm font-medium text-foreground">{review.product_name || review.product_id}</p>
                                  <RatingStars rating={review.rating} size={14}/>
                              </div>
                              {review.title && <p className="text-xs font-semibold mt-0.5">{review.title}</p>}
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-3">{review.comment}</p>
                              <p className="text-xs text-primary mt-1">Status: {review.status}</p>
                          </Card>
                      ))}
                  </div>
              ) : <p className="text-muted-foreground text-sm">You haven&apos;t submitted any reviews yet.</p>}
          </TabsContent>
          
          <TabsContent value="orders">
             {isLoadingOrders ? <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary"/> : userOrders.length > 0 ? (
                userOrders.map(order => (
                  <Card key={order.id} className="mb-4 p-4">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-medium">Order ID: <span className="text-primary">{order.id.substring(0,12)}...</span></p>
                        <Badge variant={order.status === 'Delivered' ? 'default' : 'outline'} className={order.status === 'Delivered' ? 'bg-green-100 text-green-700 border-green-300' : ''}>{order.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Date: {new Date(order.createdAt).toLocaleDateString()} | Total: रू{order.totalAmount.toLocaleString()}</p>
                  </Card>
                ))
              ) : <p className="text-center text-muted-foreground py-6">No orders found.</p>}
          </TabsContent>

          <TabsContent value="wishlist">
             {isLoadingWishlistProducts ? <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary"/> : wishlistItems.length > 0 ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {wishlistItems.map(item => <ProductCard key={item.id} product={item} />)}
                 </div>
              ) : <p className="text-center text-muted-foreground py-6">Your wishlist is empty.</p>}
          </TabsContent>

          <TabsContent value="settings">
            <Card className="shadow-none border-0 md:border md:shadow-sm">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center"><Edit3 className="mr-3 h-6 w-6 text-primary" />Personal Information</CardTitle>
                <CardDescription>Update your name, avatar, and bio.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                    <FormField control={profileForm.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Your full name" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={profileForm.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Email Address</FormLabel><FormControl><Input type="email" placeholder="your.email@example.com" {...field} value={field.value || ''} disabled /></FormControl><FormMessage /><p className="text-xs text-muted-foreground pt-1">Email cannot be changed here.</p></FormItem> )} />
                    <FormField control={profileForm.control} name="avatarUrl" render={({ field }) => ( <FormItem><FormLabel>Avatar URL</FormLabel><FormControl><Input placeholder="https://example.com/avatar.png" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={profileForm.control} name="bio" render={({ field }) => ( <FormItem><FormLabel>Bio</FormLabel><FormControl><Textarea placeholder="Tell us a bit about yourself..." {...field} value={field.value || ''} rows={3} /></FormControl><FormMessage /></FormItem> )} />
                    <Button type="submit" className="w-full sm:w-auto" disabled={profileForm.formState.isSubmitting}> {profileForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
            <Card className="mt-8 shadow-none border-0 md:border md:shadow-sm">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center"><KeyRound className="mr-3 h-6 w-6 text-primary" />Change Password</CardTitle>
                <CardDescription>Update your account password.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                    <FormField control={passwordForm.control} name="currentPassword" render={({ field }) => ( <FormItem><FormLabel>Current Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={passwordForm.control} name="newPassword" render={({ field }) => ( <FormItem><FormLabel>New Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={passwordForm.control} name="confirmPassword" render={({ field }) => ( <FormItem><FormLabel>Confirm New Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <Button type="submit" className="w-full sm:w-auto" disabled={passwordForm.formState.isSubmitting}> {passwordForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Update Password </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}

