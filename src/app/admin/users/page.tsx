// /src/app/admin/users/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Edit, Trash2, Users, UserCog } from 'lucide-react';
import type { User as AuthUserType } from '@/types';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent as AlertDialogDeleteContent,
  AlertDialogDescription as AlertDialogDeleteDescription,
  AlertDialogFooter as AlertDialogDeleteFooter,
  AlertDialogHeader as AlertDialogDeleteHeader,
  AlertDialogTitle as AlertDialogDeleteTitle,
} from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from '@/components/ui/form';

// Define available roles
const ALL_ROLES = ['admin', 'customer', 'vip', 'affiliate'] as const;
type UserRole = typeof ALL_ROLES[number];

const userRolesSchema = z.object({
  roles: z.array(z.string()).min(1, "User must have at least one role (e.g., 'customer')."),
});
type UserRoleFormValues = z.infer<typeof userRolesSchema>;

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<AuthUserType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingUser, setEditingUser] = useState<AuthUserType | null>(null);
  const [isRolesFormOpen, setIsRolesFormOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AuthUserType | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  const rolesForm = useForm<UserRoleFormValues>({
    resolver: zodResolver(userRolesSchema),
    defaultValues: { roles: [] },
  });

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.rawSupabaseError?.message || 'Failed to fetch users');
      }
      const data: AuthUserType[] = await response.json();
      setUsers(data);
    } catch (error) {
      toast({ title: "Error Fetching Users", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleEditRoles = (user: AuthUserType) => {
    setEditingUser(user);
    rolesForm.reset({ roles: user.roles || ['customer'] }); // Default to customer if no roles
    setIsRolesFormOpen(true);
  };

  const onRolesSubmit = async (data: UserRoleFormValues) => {
    if (!editingUser) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roles: data.roles }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.rawSupabaseError?.message || 'Failed to update user roles');
      }
      toast({ title: "Roles Updated!", description: `Roles for ${editingUser.name || editingUser.email} updated.` });
      fetchUsers();
      setIsRolesFormOpen(false);
    } catch (error) {
      toast({ title: "Update Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${userToDelete.id}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.rawSupabaseError?.message || 'Failed to delete user profile from DB');
      }
      toast({ title: "User Profile Deleted", description: `Profile for ${userToDelete.name || userToDelete.email} deleted from database.` });
      fetchUsers();
    } catch (error) {
      toast({ title: "Deletion Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSaving(false);
      setIsDeleteAlertOpen(false);
    }
  };
  
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'vip': return 'default'; // Primary color
      case 'affiliate': return 'secondary';
      default: return 'outline'; // customer
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader><CardTitle className="text-2xl flex items-center"><Users className="mr-3 h-6 w-6 text-primary"/>Manage Users</CardTitle><CardDescription>Loading user data...</CardDescription></CardHeader>
        <CardContent className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center"><Users className="mr-3 h-6 w-6 text-primary"/>Manage Users</CardTitle>
            <CardDescription>View user profiles and manage their roles. Deleting a user here only removes their profile data from this app's database, not their Firebase Auth account.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No users found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(user => (
                    <TableRow key={user.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">{user.name || 'N/A'}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(user.roles || []).map(role => (
                            <Badge key={role} variant={getRoleBadgeVariant(role)} className="text-xs">
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{user.createdAt ? format(new Date(user.createdAt), 'MMM d, yyyy') : 'N/A'}</TableCell>
                      <TableCell className="text-center space-x-1">
                        <Button variant="outline" size="sm" onClick={() => handleEditRoles(user)} className="h-8 px-2 text-xs"><UserCog className="mr-1 h-3 w-3"/> Edit Roles</Button>
                        <Button variant="destructive" size="sm" onClick={() => { setUserToDelete(user); setIsDeleteAlertOpen(true); }} className="h-8 px-2 text-xs"><Trash2 className="mr-1 h-3 w-3"/>Del Profile</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isRolesFormOpen} onOpenChange={setIsRolesFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Roles for {editingUser?.name || editingUser?.email}</DialogTitle>
            <DialogDescription>Select the roles for this user.</DialogDescription>
          </DialogHeader>
          <Form {...rolesForm}>
            <form onSubmit={rolesForm.handleSubmit(onRolesSubmit)} className="space-y-6 py-4">
              <FormField
                control={rolesForm.control}
                name="roles"
                render={() => (
                  <FormItem>
                    {ALL_ROLES.map((role) => (
                      <FormField
                        key={role}
                        control={rolesForm.control}
                        name="roles"
                        render={({ field }) => {
                          return (
                            <FormItem key={role} className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(role)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), role])
                                      : field.onChange(
                                          (field.value || []).filter(
                                            (value) => value !== role
                                          )
                                        )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer capitalize">{role}</FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Save Roles
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogDeleteContent>
          <AlertDialogDeleteHeader>
            <AlertDialogDeleteTitle>Are you sure?</AlertDialogDeleteTitle>
            <AlertDialogDeleteDescription>
              This action will delete the user profile "{userToDelete?.name || userToDelete?.email}" from the database. It will NOT delete their Firebase Authentication account. This cannot be undone.
            </AlertDialogDeleteDescription>
          </AlertDialogDeleteHeader>
          <AlertDialogDeleteFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} disabled={isSaving} className="bg-destructive hover:bg-destructive/90">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Delete Profile
            </AlertDialogAction>
          </AlertDialogDeleteFooter>
        </AlertDialogDeleteContent>
      </AlertDialog>
    </>
  );
}
