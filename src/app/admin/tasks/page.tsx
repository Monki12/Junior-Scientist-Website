
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // For back button functionality if needed
import { useAuth } from '@/hooks/use-auth'; // To protect the route
import { useEffect } from 'react';

export default function AdminTasksPage() {
  const router = useRouter();
  const { userProfile, loading } = useAuth();

  useEffect(() => {
    if (!loading && userProfile && (userProfile.role !== 'admin' && userProfile.role !== 'overall_head')) {
      // Redirect if not an admin or overall_head
      router.push('/dashboard'); 
    }
  }, [userProfile, loading, router]);
  
  if (loading || !userProfile) {
     return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Settings className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (userProfile.role !== 'admin' && userProfile.role !== 'overall_head') {
    // This state will likely be brief due to useEffect redirect, but good for graceful handling
    return <p>Access Denied. Redirecting...</p>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)] animate-fade-in-up">
      <Card className="w-full max-w-lg text-center shadow-xl">
        <CardHeader>
          <Settings className="mx-auto h-16 w-16 text-primary mb-4" />
          <CardTitle className="text-3xl font-headline text-primary">Global Task Management</CardTitle>
          <CardDescription>
            This section is under construction. Soon, overall heads and admins will be able to create, assign, and track tasks for various roles and events from here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            Features will include task assignment, deadline setting, point allocation, and progress monitoring.
          </p>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
