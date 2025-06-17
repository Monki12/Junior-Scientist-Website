
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { subEventsData } from '@/data/subEvents';
import type { SubEvent } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Settings, ArrowLeft, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function ManageEventPage() {
  const router = useRouter();
  const params = useParams();
  const eventSlug = params.eventSlug as string;
  
  const { userProfile, loading: authLoading } = useAuth();
  const [event, setEvent] = useState<SubEvent | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);

  useEffect(() => {
    if (eventSlug) {
      const foundEvent = subEventsData.find(e => e.slug === eventSlug);
      if (foundEvent) {
        setEvent(foundEvent);
      } else {
        notFound(); // Or handle as "event not found"
      }
    }
    setLoadingEvent(false);
  }, [eventSlug]);

  useEffect(() => {
    if (!authLoading && userProfile) {
      const isOverallHeadOrAdmin = userProfile.role === 'overall_head' || userProfile.role === 'admin';
      const isEventManagerForThisEvent = userProfile.role === 'event_representative' && userProfile.assignedEventSlug === eventSlug;
      
      if (!isOverallHeadOrAdmin && !isEventManagerForThisEvent) {
        router.push('/dashboard'); // Redirect if not authorized
      }
    } else if (!authLoading && !userProfile) {
      router.push('/login?redirect=/organizer/events/manage');
    }
  }, [userProfile, authLoading, router, eventSlug]);

  if (authLoading || loadingEvent || !userProfile) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  const canManage = (userProfile.role === 'overall_head' || userProfile.role === 'admin') || 
                    (userProfile.role === 'event_representative' && userProfile.assignedEventSlug === eventSlug);

  if (!canManage) {
    // This state will likely be brief due to useEffect redirect, but good for graceful handling
    return (
      <div className="flex flex-col min-h-[calc(100vh-10rem)] items-center justify-center text-center p-4">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-4">
          You do not have the necessary permissions to manage this event. Redirecting...
        </p>
      </div>
    );
  }


  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)] animate-fade-in-up">
      <Card className="w-full max-w-xl text-center shadow-xl">
        <CardHeader>
          <Settings className="mx-auto h-16 w-16 text-primary mb-4" />
          <CardTitle className="text-3xl font-headline text-primary">Manage Event: {event ? event.title : 'Loading...'}</CardTitle>
          <CardDescription>
            This section is under construction. Soon, you will be able to modify event details, view participants, manage organizers for this event, and assign tasks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            Features will include event editing, participant lists, task assignment within the event team, and performance tracking.
          </p>
          <Button onClick={() => router.back()} variant="outline" className="mr-2">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Button>
          <Button asChild variant="secondary">
            <Link href="/dashboard">
             Go to Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
