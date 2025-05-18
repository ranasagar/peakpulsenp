
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
import { User, Edit3, KeyRound, CheckCircle, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

const profileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  // Add other fields like phone, etc. if needed
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required." }), // Typically min 6-8
  newPassword: z.string().min(6, { message: "New password must be at least 6 characters." }),
  confirmPassword: z.string().min(6, { message: "Confirm password must be at least 6 characters." }),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "New passwords don't match.",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
    values: { // Keep form in sync if user object changes
        name: user?.name || '',
        email: user?.email || '',
    }
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onProfileSubmit = async (data: ProfileFormValues) => {
    // Mock API call
    console.log("Profile update data:", data);
    toast({
      title: "Profile Updated",
      description: "Your personal information has been successfully updated.",
      action: <CheckCircle className="text-green-500" />,
    });
  };

  const onPasswordSubmit = async (data: PasswordFormValues) => {
    // Mock API call
    console.log("Password change data:", data);
    toast({
      title: "Password Changed",
      description: "Your password has been successfully updated.",
      variant: "default",
      action: <CheckCircle className="text-green-500" />,
    });
    passwordForm.reset();
  };
  
  if (authLoading) {
      return <div className="container-wide section-padding text-center">Loading profile...</div>
  }
  if (!user) {
      return <div className="container-wide section-padding text-center text-destructive">User not found or not logged in.</div>
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
                <AvatarImage src={user.avatarUrl || `https://placehold.co/150x150.png?text=${user.name ? user.name.charAt(0) : 'P'}`} alt={user.name || 'User'} data-ai-hint="profile avatar"/>
                <AvatarFallback className="text-4xl">{user.name ? user.name.charAt(0).toUpperCase() : <User />}</AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm" className="mb-4">
                <Edit3 className="mr-2 h-3 w-3" /> Change Avatar (UI only)
            </Button>
            <h2 className="text-xl font-semibold text-foreground">{user.name}</h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
             <p className="text-xs text-accent mt-1 capitalize">Role: {user.roles?.join(', ') || 'Customer'}</p>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-8">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center"><Edit3 className="mr-3 h-6 w-6 text-primary" />Personal Information</CardTitle>
              <CardDescription>Update your name and email address.</CardDescription>
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
                          <Input type="email" placeholder="your.email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full sm:w-auto">
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
                  <Button type="submit" className="w-full sm:w-auto">
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
