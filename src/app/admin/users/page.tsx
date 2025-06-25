
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, ShieldAlert, ArrowLeft, PlusCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import CreateOrganizerForm from '@/components/admin/CreateOrganizerForm';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserProfileData } from '@/types';

export default function AdminUsersPage() {
  const router = useRouter();
  const { userProfile, loading } = useAuth();
  const [isCreateOrganizerDialogOpen, setIsCreateOrganizerDialogOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<UserProfileData[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  useEffect(() => {
    if (!loading && userProfile && (userProfile.role !== 'admin' && userProfile.role !== 'overall_head')) {
      router.push('/dashboard'); 
    }
  }, [userProfile, loading, router]);
  
  const fetchAllUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfileData));
      setAllUsers(usersList);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (userProfile && (userProfile.role === 'admin' || userProfile.role === 'overall_head')) {
      fetchAllUsers();
    }
  }, [userProfile]);

  if (loading || !userProfile) {
     return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Users className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (userProfile.role !== 'admin' && userProfile.role !== 'overall_head') {
    return (
      <div className="flex flex-col min-h-[calc(100vh-10rem)] items-center justify-center text-center p-4">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
        <p className="text-muted-foreground">You do not have permission to manage users.</p>
        <Button onClick={() => router.push('/dashboard')} className="mt-4">Go to Dashboard</Button>
      </div>
    );
  }

  const handleOrganizerCreationSuccess = () => {
    setIsCreateOrganizerDialogOpen(false);
    fetchAllUsers();
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-3xl font-headline text-primary flex items-center"><Users className="mr-3 h-8 w-8"/>User Management</CardTitle>
              <CardDescription>
                Create new organizational accounts and manage all platform users.
              </CardDescription>
            </div>
             <Dialog open={isCreateOrganizerDialogOpen} onOpenChange={setIsCreateOrganizerDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" /> Create Staff Account
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Staff Account</DialogTitle>
                  <DialogDescription>
                    Fill in the details to create a new account for an organizer, representative, or admin.
                  </DialogDescription>
                </DialogHeader>
                <CreateOrganizerForm
                  currentAdminRole={userProfile.role as 'admin' | 'overall_head'}
                  onSuccess={handleOrganizerCreationSuccess}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingUsers ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2">Loading users...</p>
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Identifier</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allUsers.map((user) => (
                    <TableRow key={user.uid}>
                      <TableCell className="font-medium">{user.fullName || user.displayName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell className="capitalize">{user.role?.replace('_', ' ')}</TableCell>
                      <TableCell>{user.role === 'student' ? `ID: ${user.shortId}` : `Roll: ${user.collegeRollNumber}`}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">Edit</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
