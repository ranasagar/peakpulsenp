
"use client";

import { useAuth } from '@/hooks/use-auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Edit3, KeyRound, CheckCircle, ShieldAlert, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import type { User as AuthUserType } from '@/types';

const profileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  avatarUrl: z.string().url({ message: "Invalid URL for avatar."}).optional().or(z.literal('')),
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
  const [isFetchingProfile, setIsFetchingProfile] = useState(true);
  const [profileData, setProfileData] = useState<AuthUserType | null>(null);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
      avatarUrl: '',
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (authUser && authUser.id && !authLoading) { // Ensure authUser and not authLoading
      setIsFetchingProfile(true);
      fetch(`/api/account/profile?uid=${authUser.id}`)
        .then(res => {
          if (res.ok) return res.json();
          if (res.status === 404) return null; 
          return res.json().then(errData => { throw new Error(errData.message || 'Failed to fetch profile'); });
        })
        .then(data => {
          if (data) {
            setProfileData(data);
            profileForm.reset({
              name: data.name || authUser.name || '',
              email: data.email || authUser.email || '', // Email should likely come from authUser always
              avatarUrl: data.avatarUrl || authUser.avatarUrl || '',
            });
          } else {
            // Profile not in Firestore, use authUser details as fallback for form
            setProfileData(authUser); // Set profileData to authUser if nothing from DB
            profileForm.reset({
              name: authUser.name || '',
              email: authUser.email || '',
              avatarUrl: authUser.avatarUrl || '',
            });
          }
        })
        .catch(error => {
          console.error("Error fetching profile:", error);
          toast({ title: "Error", description: "Could not load profile data. Using basic info.", variant: "default" });
           setProfileData(authUser); // Fallback to authUser data
           profileForm.reset({ 
              name: authUser.name || '',
              email: authUser.email || '',
              avatarUrl: authUser.avatarUrl || '',
            });
        })
        .finally(() => setIsFetchingProfile(false));
    } else if (!authLoading && !authUser) {
        setIsFetchingProfile(false); 
    } else if (authUser && authLoading) { // Still loading auth info, wait
        setIsFetchingProfile(true);
    }
  }, [authUser, authLoading, toast, profileForm]);


  const onProfileSubmit = async (data: ProfileFormValues) => {
    if (!authUser || !authUser.id) {
      toast({ title: "Error", description: "You must be logged in to update your profile.", variant: "destructive" });
      return;
    }

    // profileForm.formState.isSubmitting is handled by react-hook-form
    try {
      const payload = { 
        uid: authUser.id, 
        name: data.name, 
        avatarUrl: data.avatarUrl || null, // Send null if empty to potentially clear it
        email: authUser.email, // Email is not directly editable here
        roles: authUser.roles, // Preserve existing roles
        wishlist: authUser.wishlist, // Preserve existing wishlist
      };

      const response = await fetch('/api/account/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update profile' }));
        throw new Error(errorData.message || 'Failed to update profile');
      }
      
      const updatedProfileData = await response.json();
      await refreshUserProfile(); // This will refetch from Supabase and update authContext

      toast({
        title: "Profile Updated",
        description: "Your personal information has been successfully updated.",
        action: <CheckCircle className="text-green-500" />,
      });
      setProfileData(updatedProfileData.user); // Update local state as well

    } catch (error) {
      console.error("Error updating profile:", error);
      toast({ title: "Update Failed", description: (error as Error).message, variant: "destructive" });
    }
  };

  const onPasswordSubmit = async (data: PasswordFormValues) => {
    console.log("Password change data (client-side mock):", data);
    toast({
      title: "Password Change (Mock)",
      description: "Password change functionality needs direct Firebase SDK integration for security.",
      variant: "default",
      action: <ShieldAlert className="text-yellow-500" />,
    });
    passwordForm.reset();
  };
  
  const currentDisplayUser = profileData || authUser; // Use profileData if available, fallback to authUser

  if (authLoading || isFetchingProfile) {
      return <div className="container-wide section-padding text-center flex items-center justify-center min-h-[50vh]"><Loader2 className="h-12 w-12 animate-spin text-primary" /> <span className="ml-4 text-lg">Loading profile...</span></div>
  }
  if (!authUser) { 
      return <div className="container-wide section-padding text-center text-destructive">User not found or not logged in. Please try logging in again.</div>
  }

  return (
    <div className="container-wide section-padding">
      <div className="flex items-center mb-10">
        <User className="h-10 w-10 mr-4 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Your Profile</h1>
          <p className="text-muted-foreground">Manage your personal information and account settings.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        <div className="md:col-span-1">
          <Card className="shadow-lg p-6 text-center sticky top-24">
             <Avatar className="h-28 w-28 mx-auto mb-4 border-4 border-primary p-1">
                <AvatarImage src={profileForm.watch('avatarUrl') || currentDisplayUser?.avatarUrl || `https://placehold.co/150x150.png`} alt={currentDisplayUser?.name || 'User'} data-ai-hint="profile avatar user"/>
                <AvatarFallback className="text-4xl">{currentDisplayUser?.name ? currentDisplayUser.name.charAt(0).toUpperCase() : <User />}</AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-semibold text-foreground">{profileForm.watch('name') || currentDisplayUser?.name}</h2>
            <p className="text-sm text-muted-foreground">{profileForm.watch('email') || currentDisplayUser?.email}</p>
             <p className="text-xs text-accent mt-1 capitalize">Role: {currentDisplayUser?.roles?.join(', ') || 'Customer'}</p>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-8">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center"><Edit3 className="mr-3 h-6 w-6 text-primary" />Personal Information</CardTitle>
              <CardDescription>Update your name, email address, and avatar.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                  <FormField
                    control={profileForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="your.email@example.com" {...field} disabled />
                        </FormControl>
                        <FormMessage />
                         <p className="text-xs text-muted-foreground pt-1">Email address cannot be changed here. This requires a separate secure process.</p>
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={profileForm.control}
                    name="avatarUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Avatar URL (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/avatar.png" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full sm:w-auto" disabled={profileForm.formState.isSubmitting}>
                    {profileForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center"><KeyRound className="mr-3 h-6 w-6 text-primary" />Change Password</CardTitle>
              <CardDescription>Update your account password. Choose a strong, unique password.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full sm:w-auto" disabled={passwordForm.formState.isSubmitting}>
                     {passwordForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Password
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
