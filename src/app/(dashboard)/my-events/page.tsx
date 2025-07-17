
'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import type { SubEvent } from '@/types';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, where, getDocs, Query } from 'firebase/firestore';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, PlusCircle, Edit, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import CreateEventForm from '@/components/admin/CreateEventForm';

export default function MyEventsPage() {
  const { userProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<SubEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [isCreateEventDialogOpen, setIsCreateEventDialogOpen] = useState(false);

  const canCreateEvents = userProfile?.role === 'admin' || userProfile?.role === 'overall_head';

  const getEventsQuery = useCallback(() => {
    if (!userProfile) return null;

    let eventsQuery: Query;
    switch(userProfile.role) {
      case 'admin':
      case 'overall_head':
        eventsQuery = query(collection(db, 'subEvents'));
        break;
      case 'event_representative':
        if (!userProfile.assignedEventUids || userProfile.assignedEventUids.length === 0) return null;
        eventsQuery = query(collection(db, 'subEvents'), where('__name__', 'in', userProfile.assignedEventUids));
        break;
      case 'organizer':
         if (!userProfile.boardIds || userProfile.boardIds.length === 0) return null;
        // This is an indirect way. A better approach might be to store eventUids directly on the organizer.
        // For now, we assume if they are an organizer of a board, they are an organizer for that event.
        // This needs a more direct link in the data model for full accuracy.
        eventsQuery = query(collection(db, 'subEvents'), where('organizerUids', 'array-contains', userProfile.uid));
        break;
      default:
        return null;
    }
    return eventsQuery;
  }, [userProfile]);


  const fetchEvents = useCallback(async () => {
      const q = getEventsQuery();
      if (!q) {
          setEvents([]);
          setLoadingEvents(false);
          return;
      }
      try {
          const snapshot = await getDocs(q);
          const eventsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubEvent));
          setEvents(eventsList);
      } catch (error) {
          console.error("Error fetching events:", error);
          toast({ title: "Error", description: "Could not fetch your events.", variant: "destructive" });
      } finally {
        setLoadingEvents(false);
      }
  }, [getEventsQuery, toast]);


  useEffect(() => {
    if (authLoading) return;
    
    setLoadingEvents(true);
    fetchEvents(); // Initial fetch
    
    // Set up a listener on registrations to re-fetch events when they change
    const registrationsQuery = query(collection(db, 'event_registrations'));
    const unsubscribeRegistrations = onSnapshot(registrationsQuery, () => {
        // A registration has changed, re-fetch the events to get the latest counts.
        fetchEvents();
    }, (error) => {
        console.error("Error listening to registrations:", error);
    });

    return () => {
        unsubscribeRegistrations();
    };
  }, [userProfile, authLoading, fetchEvents]);


  if (authLoading || loadingEvents) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Event Management</CardTitle>
            <CardDescription>
              {canCreateEvents 
                ? "Create new events and manage all existing ones." 
                : "A list of events you are assigned to."}
            </CardDescription>
          </div>
          {canCreateEvents && (
             <Dialog open={isCreateEventDialogOpen} onOpenChange={setIsCreateEventDialogOpen}>
                <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" /> Create New Event
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Create New Sub-Event</DialogTitle>
                        <DialogDescription>
                            Fill in the initial details. More options will be available on the edit page after creation.
                        </DialogDescription>
                    </DialogHeader>
                    <CreateEventForm onSuccess={() => setIsCreateEventDialogOpen(false)} />
                </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-primary/30" />
                <h3 className="text-lg font-semibold text-foreground mb-1">No Events Found</h3>
                <p className="text-sm">You are not currently assigned to manage any events.</p>
                <p className="text-xs mt-1">Event details will appear here once assigned by an admin.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map(event => (
                <Card key={event.id}>
                  <div className="relative h-40 w-full">
                     <Image src={event.mainImage.src} alt={event.mainImage.alt} fill style={{objectFit: 'cover'}} className="rounded-t-lg" data-ai-hint={event.mainImage.dataAiHint} />
                  </div>
                  <CardHeader>
                    <CardTitle>{event.title}</CardTitle>
                    <CardDescription>{event.eventDate ? new Date(event.eventDate).toLocaleDateString() : 'Date TBD'}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge variant={event.status === 'Active' ? 'default' : 'secondary'}>{event.status || 'Planning'}</Badge>
                    <p className="text-sm text-muted-foreground mt-2">{event.registeredParticipantCount || 0} participants</p>
                  </CardContent>
                  <CardFooter>
                    <Button asChild className="w-full">
                      <Link href={`/events/manage/${event.slug}`}>
                        <Edit className="mr-2 h-4 w-4" /> Manage Event
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
