
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import type { SubEvent } from '@/types';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { EditEventForm } from '@/components/admin/EditEventForm';
import { useToast } from '@/hooks/use-toast';

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const eventSlug = params.eventSlug as string;
  const { toast } = useToast();
  
  const { userProfile, loading: authLoading } = useAuth();
  const [event, setEvent] = useState<SubEvent | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);

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
    if (!authLoading && userProfile) {
      const canManageGlobally = userProfile.role === 'overall_head' || userProfile.role === 'admin';
      if (!canManageGlobally) {
        toast({ title: "Access Denied", description: "You are not authorized to edit this event.", variant: "destructive" });
        router.push(`/events/manage/${eventSlug}`);
      }
    } else if (!authLoading && !userProfile) {
      router.push(`/login?redirect=/events/manage/${eventSlug}/edit`);
    }
  }, [userProfile, authLoading, router, eventSlug, toast]);

  if (authLoading || loadingEvent || !userProfile) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-primary">Edit Event Settings</h1>
            <p className="text-muted-foreground">Editing details for: {event?.title || "..."}</p>
        </div>
        <Button variant="outline" asChild>
            <Link href={`/events/manage/${eventSlug}`}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Event Dashboard
            </Link>
        </Button>
      </div>

      {event ? (
        <EditEventForm event={event} />
      ) : (
        <p>Event not found or finished loading.</p>
      )}
    </div>
  );
}
