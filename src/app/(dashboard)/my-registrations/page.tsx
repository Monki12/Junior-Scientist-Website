
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import type { SubEvent, EventRegistration } from '@/types';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Ticket, FileDown, Users, Calendar, AlertCircle } from 'lucide-react';

// Combined type for easy rendering
interface RegistrationDetails extends EventRegistration {
  eventDetails?: SubEvent;
}

const getStatusBadgeVariant = (status?: EventRegistration['registrationStatus']): "default" | "secondary" | "outline" | "destructive" => {
  switch (status) {
    case 'approved': return 'default';
    case 'pending': return 'secondary';
    case 'declined':
    case 'cancelled':
      return 'destructive';
    default: return 'outline';
  }
};


export default function MyRegistrationsPage() {
  const { userProfile, loading: authLoading } = useAuth();
  const [registrations, setRegistrations] = useState<RegistrationDetails[]>([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(true);

  useEffect(() => {
    if (!userProfile?.uid) {
      if (!authLoading) setLoadingRegistrations(false);
      return;
    }

    const q = query(collection(db, 'event_registrations'), where('userId', '==', userProfile.uid));

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      if (querySnapshot.empty) {
        setRegistrations([]);
        setLoadingRegistrations(false);
        return;
      }
      
      const regs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventRegistration));
      
      // Fetch details for all unique event IDs
      const eventIds = [...new Set(regs.map(r => r.subEventId))];
      if (eventIds.length > 0) {
        const eventsQuery = query(collection(db, 'subEvents'), where('__name__', 'in', eventIds));
        const eventsSnapshot = await getDocs(eventsQuery);
        const eventsMap = new Map(eventsSnapshot.docs.map(doc => [doc.id, {id: doc.id, ...doc.data()} as SubEvent]));
        
        const registrationsWithDetails = regs.map(reg => ({
          ...reg,
          eventDetails: eventsMap.get(reg.subEventId)
        })).sort((a, b) => {
            // Sort by event date, most recent first
            const dateA = a.eventDetails?.eventDate ? new Date(a.eventDetails.eventDate) : 0;
            const dateB = b.eventDetails?.eventDate ? new Date(b.eventDetails.eventDate) : 0;
            if (!dateA || !dateB) return 0;
            return dateB.getTime() - dateA.getTime();
        });
        
        setRegistrations(registrationsWithDetails);
      } else {
         setRegistrations([]);
      }

      setLoadingRegistrations(false);

    }, (error) => {
      console.error("Error fetching registrations: ", error);
      setLoadingRegistrations(false);
    });

    return () => unsubscribe();
  }, [userProfile, authLoading]);

  if (authLoading || loadingRegistrations) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Ticket className="h-7 w-7 text-primary"/>My Registered Events
          </CardTitle>
          <CardDescription>
            Manage your event registrations, check statuses, and access event materials.
          </CardDescription>
        </CardHeader>
      </Card>
      
      {registrations.length === 0 ? (
        <Card className="text-center py-12">
           <CardContent>
            <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold">No Registrations Found</h3>
            <p className="text-muted-foreground mt-2">You have not registered for any events yet. Time to explore!</p>
            <Button asChild variant="default" className="mt-4 bg-accent text-accent-foreground hover:bg-accent/90">
              <Link href="/events">Explore Events Now</Link>
            </Button>
           </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {registrations.map(reg => (
            <Card key={reg.id} className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>{reg.eventDetails?.title || 'Event Loading...'}</CardTitle>
                  <Badge variant={getStatusBadgeVariant(reg.registrationStatus)} className="capitalize">{reg.registrationStatus}</Badge>
                </div>
                <CardDescription>
                  Registered on: {reg.registeredAt?.toDate ? reg.registeredAt.toDate().toLocaleDateString() : 'N/A'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Event Date: {reg.eventDetails?.eventDate ? new Date(reg.eventDetails.eventDate).toLocaleDateString() : 'TBD'}</span>
                </div>
                {reg.isTeamRegistration && reg.teamId && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>Team Registration (Details on event page)</span>
                  </div>
                )}
                
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                {reg.admitCardUrl ? (
                  <Button asChild variant="outline">
                    <a href={reg.admitCardUrl} target="_blank" rel="noopener noreferrer">
                      <FileDown className="mr-2 h-4 w-4"/>Download Admit Card
                    </a>
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground">Admit card not yet available</p>
                )}
                 <Button asChild>
                  <Link href={`/events/${reg.eventDetails?.slug || ''}`}>View Event Page</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
