
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ShieldAlert, ArrowLeft, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import CreateOrganizerForm from '@/components/admin/CreateOrganizerForm';

export default function AdminUsersPage() {
  const router = useRouter();
  const { userProfile, loading } = useAuth();
  const [isCreateOrganizerDialogOpen, setIsCreateOrganizerDialogOpen] = useState(false);

  useEffect(() => {
    if (!loading && userProfile && (userProfile.role !== 'admin' && userProfile.role !== 'overall_head')) {
      router.push('/dashboard'); 
    }
  }, [userProfile, loading, router]);
  
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
    // You could add logic here to refresh a user list if one was displayed on this page
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)] animate-fade-in-up">
      <Card className="w-full max-w-2xl text-center shadow-xl">
        <CardHeader>
          <Users className="mx-auto h-16 w-16 text-primary mb-4" />
          <CardTitle className="text-3xl font-headline text-primary">User Management</CardTitle>
          <CardDescription>
            Create new organizational accounts (Organizers, Event Reps, Overall Heads) and manage user roles.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            Use the button below to create a new staff account. Full user editing and role management capabilities will be available in the main dashboard.
          </p>

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

          <p className="text-sm text-accent">
            Currently, organizational roles are based on pre-defined mock profiles for dashboard testing. This form creates real users in Firebase.
          </p>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
