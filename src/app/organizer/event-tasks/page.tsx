
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ListChecks, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useEffect } from 'react';

export default function EventTasksPage() {
  const router = useRouter();
  const { userProfile, loading } = useAuth();

  useEffect(() => {
    if (!loading && userProfile && userProfile.role !== 'event_representative' && userProfile.role !== 'overall_head' && userProfile.role !== 'admin') {
      // Redirect if not an authorized role
      router.push('/dashboard'); 
    }
  }, [userProfile, loading, router]);

  if (loading || !userProfile) {
     return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <ListChecks className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Further check to prevent rendering if role is not permitted
  if (userProfile.role !== 'event_representative' && userProfile.role !== 'overall_head' && userProfile.role !== 'admin') {
    return <p>Access Denied. Redirecting...</p>;
  }
  
  const eventTitle = userProfile.role === 'event_representative' && userProfile.assignedEventSlug 
    ? `for "${userProfile.assignedEventSlug}"` // Ideally, fetch event title here
    : "";


  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)] animate-fade-in-up">
      <Card className="w-full max-w-lg text-center shadow-xl">
        <CardHeader>
          <ListChecks className="mx-auto h-16 w-16 text-primary mb-4" />
          <CardTitle className="text-3xl font-headline text-primary">Event-Specific Task Management {eventTitle}</CardTitle>
          <CardDescription>
            This section is under construction. Event representatives will soon be able to manage tasks for their assigned event here, including assignment to organizers and progress tracking.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            You'll be able to create tasks, set deadlines, assign points, and monitor completion for your event team.
          </p>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
