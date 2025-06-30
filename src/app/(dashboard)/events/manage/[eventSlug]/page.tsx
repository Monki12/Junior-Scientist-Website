
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import type { SubEvent, EventStatus } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Loader2, Settings, ArrowLeft, ShieldAlert, Info, CalendarDays, MapPin, Users, ListChecks, Edit, LayoutDashboard, Users2 } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const getEventStatusBadgeVariant = (status: EventStatus | undefined): "default" | "secondary" | "outline" | "destructive" => {
    switch (status) {
        case 'Active': return 'default'; 
        case 'Planning': return 'secondary';
        case 'Completed': return 'outline'; 
        case 'Cancelled': case 'closed': return 'destructive';
        default: return 'outline';
    }
};

export default function ManageEventDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const eventSlug = params.eventSlug as string;
  const { toast } = useToast();
  
  const { userProfile, loading: authLoading } = useAuth();
  const [event, setEvent] = useState<SubEvent | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [activeTab, setActiveTab] = useState('participants');
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      if (eventSlug) {
        setLoadingEvent(true);
        const q = query(collection(db, 'subEvents'), where('slug', '==', eventSlug));
        try {
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const eventDoc = querySnapshot.docs[0];
            setEvent({ id: eventDoc.id, ...eventDoc.data() } as SubEvent);
          } else {
            notFound();
          }
        } catch (error) {
          console.error("Error fetching event:", error);
          notFound();
        } finally {
          setLoadingEvent(false);
        }
      }
    };
    fetchEvent();
  }, [eventSlug]);

  useEffect(() => {
    if (!authLoading && userProfile && event) { 
      const isOverallHead = userProfile.role === 'overall_head' || userProfile.role === 'admin';
      const isEventManagerForThisEvent = userProfile.role === 'event_representative' && (event.eventReps || []).includes(userProfile.uid);
      const isOrganizer = userProfile.role === 'organizer' && (event.organizerUids || []).includes(userProfile.uid);
      
      const canAccess = isOverallHead || isEventManagerForThisEvent || isOrganizer;
      
      if (!canAccess) {
        toast({ title: "Access Denied", description: "You are not authorized to manage this event.", variant: "destructive"});
        router.push('/dashboard'); 
      }
    } else if (!authLoading && !userProfile) {
      router.push(`/login?redirect=/events/manage/${eventSlug}`);
    }
  }, [userProfile, authLoading, router, eventSlug, event, toast]);

  if (authLoading || loadingEvent || !userProfile || !event) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  const canManageGlobally = userProfile.role === 'overall_head' || userProfile.role === 'admin';
  const mockPendingTasksCount = 0; // Placeholder until tasks are fully integrated here


  return (
    <div className="space-y-6 animate-fade-in-up">
      <Card className="shadow-lg overflow-hidden">
        <div className="md:flex">
            <div className="md:shrink-0 relative w-full md:w-72 h-48 md:h-auto">
                <Image 
                    src={event.mainImage.src} 
                    alt={event.mainImage.alt} 
                    fill
                    style={{objectFit: 'cover'}}
                    priority
                    data-ai-hint={event.mainImage.dataAiHint || 'event banner'}
                />
            </div>
            <div className="p-6 flex-grow">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                    <h1 className="text-3xl font-bold text-primary">Manage Event: {event.title}</h1>
                    {canManageGlobally && (
                        <Button variant="outline" size="sm" asChild>
                           <Link href={`/events/manage/${eventSlug}/edit`}>
                             <Edit className="mr-2 h-4 w-4" /> Edit Event Settings
                           </Link>
                        </Button>
                    )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm mb-4">
                    <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-accent" /> Date: <span className="font-medium">{event.eventDate ? new Date(event.eventDate).toLocaleDateString() : 'TBA'}</span></span>
                    <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-accent" /> Venue: <span className="font-medium">{event.venue || 'TBD'}</span></span>
                    <span className="flex items-center gap-1.5"><Info className="h-4 w-4 text-accent" /> Status: <Badge variant={getEventStatusBadgeVariant(event.status)} className="ml-1 capitalize text-xs">{event.status || 'N/A'}</Badge></span>
                    <span className="flex items-center gap-1.5"><Users2 className="h-4 w-4 text-accent" /> Registered: <span className="font-medium">{event.registeredParticipantCount || 0}</span></span>
                    <span className="flex items-center gap-1.5"><ListChecks className="h-4 w-4 text-accent" /> Pending Tasks: <span className="font-medium">{mockPendingTasksCount}</span></span>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                    <Button variant="default" size="sm" onClick={() => setIsDetailsDialogOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        <Info className="mr-1.5 h-4 w-4" /> View Full Details
                    </Button>
                     <Button variant="outline" size="sm" asChild>
                        <Link href="/dashboard"><LayoutDashboard className="mr-1.5 h-4 w-4"/>Go to Main Dashboard</Link>
                    </Button>
                </div>
            </div>
        </div>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 mb-4">
          <TabsTrigger value="participants">Participants</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="dday">D-Day Operations</TabsTrigger>
        </TabsList>

        <TabsContent value="participants">
          <Card>
            <CardHeader>
              <CardTitle>Manage Participants for {event.title}</CardTitle>
              <CardDescription>View, filter, and manage all participants registered for this event.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-muted-foreground">Participant management for this event will be fully integrated here. For now, you can manage participants on its dedicated page.</p>
              <Button asChild variant="secondary">
                <Link href={`/events/manage/${eventSlug}/participants`}>
                  Go to Event Participant Management
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Manage Tasks for {event.title}</CardTitle>
              <CardDescription>Assign, track, and manage all tasks related to the organization of this event.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
               <p className="text-muted-foreground">Task management (list & timeline) for this event will be fully integrated here. For now, you can use the general tasks page and filter by this event if needed.</p>
              <Button asChild variant="secondary">
                <Link href={`/tasks?event=${eventSlug}`}>
                  Go to Tasks Page (Filter by Event)
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dday">
          <Card>
            <CardHeader>
              <CardTitle>D-Day Operations for {event.title}</CardTitle>
              <CardDescription>Manage live event day activities: attendance, venue check-ins, level progression, and manual qualifications.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <Settings className="h-16 w-16 text-primary/30 mx-auto mb-4" />
              <p className="text-xl font-semibold">D-Day Features Coming Soon!</p>
              <p className="text-muted-foreground">This section will provide tools for managing the event on the day it happens, including real-time attendance, participant progression through different levels or venues, and manual overrides for qualifications.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{event.title} - Full Details</AlertDialogTitle>
            <AlertDialogDescription>
              Complete information about the event.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="prose prose-sm dark:prose-invert max-h-[60vh] overflow-y-auto py-4">
            <div dangerouslySetInnerHTML={{ __html: event.detailedDescription }} />
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIsDetailsDialogOpen(false)}>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
