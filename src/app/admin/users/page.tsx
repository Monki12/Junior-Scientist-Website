
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useEffect } from 'react';

export default function AdminUsersPage() {
  const router = useRouter();
  const { userProfile, loading } = useAuth();

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

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)] animate-fade-in-up">
      <Card className="w-full max-w-2xl text-center shadow-xl">
        <CardHeader>
          <Users className="mx-auto h-16 w-16 text-primary mb-4" />
          <CardTitle className="text-3xl font-headline text-primary">User Management</CardTitle>
          <CardDescription>
            This section is for creating new organizational accounts (Organizers, Event Reps, Overall Heads) and managing user roles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            Full user management capabilities, including role assignment and account creation by Admins/Overall Heads, are under development and would typically involve secure backend functions.
          </p>
          <p className="text-sm text-accent mb-4">
            Currently, organizational roles are based on pre-defined mock profiles in the application.
          </p>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
