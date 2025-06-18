'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { subEventsData } from '@/data/subEvents';
import type { SubEvent, EventStatus } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Loader2, Settings, ArrowLeft, ShieldAlert, Info, CalendarDays, MapPin, Users, ListChecks, Edit, LayoutDashboard } from 'lucide-react';

const getEventStatusBadgeVariant = (status: EventStatus | undefined): "default" | "secondary" | "outline" | "destructive" => {
    switch (status) {
        case 'Active': return 'default'; 
        case 'Planning': return 'secondary';
        case 'Completed': return 'outline'; 
        case 'Cancelled': return 'destructive';
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
  const [isEditSettingsDialogOpen, setIsEditSettingsDialogOpen] = useState(false);

  useEffect(() => {
    if (eventSlug) {
      const foundEvent = subEventsData.find(e => e.slug === eventSlug);
      if (foundEvent) {
        setEvent(foundEvent);
      } else {
        notFound();
      }
    }
    setLoadingEvent(false);
  }, [eventSlug]);

  useEffect(() => {
    if (!authLoading && userProfile && event) { // Check event also
      const isOverallHead = userProfile.role === 'overall_head';
      const isEventManagerForThisEvent = userProfile.role === 'event_representative' && userProfile.assignedEventSlug === eventSlug;
      
      if (!isOverallHead && !isEventManagerForThisEvent) {
        toast({ title: "Access Denied", description: "You are not authorized to manage this event.", variant: "destructive"});
        router.push('/dashboard'); 
      }
    } else if (!authLoading && !userProfile) {
      router.push(`/login?redirect=/organizer/events/manage/${eventSlug}`);
    }
  }, [userProfile, authLoading, router, eventSlug, event, toast]);

  // Mock task count for this event (can be refined later if tasks are loaded here)
  const mockPendingTasksCount = useAuth().userProfile?.tasks?.filter(task => task.eventSlug === eventSlug && task.status !== 'Completed').length || 5;


  if (authLoading || loadingEvent || !userProfile || !event) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  const canManageGlobally = userProfile.role === 'overall_head';


  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Event Header / Overview Section */}
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
                        <Button variant="outline" size="sm" onClick={() => setIsEditSettingsDialogOpen(true)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit Event Settings
                        </Button>
                    )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm mb-4">
                    <p className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-accent" /> Date: <span className="font-medium">{event.eventDate ? new Date(event.eventDate).toLocaleDateString() : 'TBA'}</span></p>
                    <p className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-accent" /> Venue: <span className="font-medium">{event.venue || 'TBD'}</span></p>
                    <p className="flex items-center gap-1.5"><Info className="h-4 w-4 text-accent" /> Status: <Badge variant={getEventStatusBadgeVariant(event.status)} className="ml-1 capitalize text-xs">{event.status || 'N/A'}</Badge></p>
                    <p className="flex items-center gap-1.5"><Users className="h-4 w-4 text-accent" /> Registered: <span className="font-medium">{event.registeredParticipantCount || 0}</span></p>
                    <p className="flex items-center gap-1.5"><ListChecks className="h-4 w-4 text-accent" /> Pending Tasks: <span className="font-medium">{mockPendingTasksCount}</span></p>
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

      {/* Tabs for Different Management Sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
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
              <p className="text-muted-foreground">Full participant management features for this event (including custom columns, stats, and filters) will be integrated here soon.</p>
              <p className="text-muted-foreground">For now, you can manage participants for this specific event on its dedicated page.</p>
              <Button asChild variant="secondary">
                <Link href={`/organizer/events/manage/${eventSlug}/participants`}>
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
               <p className="text-muted-foreground">Full task management features (including list view, timeline view, and creation/editing) for this event will be integrated here soon.</p>
               <p className="text-muted-foreground">Currently, you can manage tasks on the general tasks page. You might need to filter by this event.</p>
              <Button asChild variant="secondary">
                <Link href={`/organizer/event-tasks?event=${eventSlug}`}>
                  Go to Event Tasks Page (Filter Manually)
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

      {/* Event Details Dialog */}
      <AlertDialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{event.title} - Full Details</AlertDialogTitle>
            <AlertDialogDescription>
              Complete information about the event.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="prose prose-sm dark:prose-invert max-h-[60vh] overflow-y-auto py-4">
            <p>{event.detailedDescription}</p>
            {/* Add more details here if needed, e.g., rules, schedule */}
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIsDetailsDialogOpen(false)}>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Event Settings Dialog (OH Only) */}
      {canManageGlobally && (
        <AlertDialog open={isEditSettingsDialogOpen} onOpenChange={setIsEditSettingsDialogOpen}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Edit Event Settings: {event.title}</AlertDialogTitle>
                <AlertDialogDescription>
                Overall Heads can modify event details, assign/unassign Event Representatives and Organizers, and manage other core settings here. Full form coming soon.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4 text-center text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-3 text-primary/40" />
                <p>Detailed event editing form, user assignment (ERs, Organizers), and delete options will be available here for Overall Heads in a future update.</p>
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction disabled>Save Changes (Coming Soon)</AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}

    </div>
  );
}
