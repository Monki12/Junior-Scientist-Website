
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import type { SubEvent } from '@/types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, ListFilter, Loader2, CalendarDays, Tag } from 'lucide-react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

function SubEventCard({ event }: { event: SubEvent }) {
  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full bg-card/80 backdrop-blur-sm border-border/50 hover:border-primary/50 rounded-xl">
      <Link href={`/events/${event.slug}`} className="block group">
        <div className="relative w-full h-56">
          <Image
            src={event.mainImage.src}
            alt={event.mainImage.alt}
            fill
            style={{ objectFit: 'cover' }}
            data-ai-hint={event.mainImage.dataAiHint}
            className="group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <CardHeader>
          <CardTitle className="text-2xl font-headline group-hover:text-primary transition-colors">{event.title}</CardTitle>
          <CardDescription className="line-clamp-3 text-muted-foreground">{event.shortDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground flex-grow">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" />
            <span>Category: {event.superpowerCategory}</span>
          </div>
          {event.deadline && (
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              <span>Deadline: {new Date(event.deadline).toLocaleDateString()}</span>
            </div>
          )}
        </CardContent>
      </Link>
      <CardFooter>
        <Button asChild className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
          <Link href={`/events/${event.slug}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

// This is the primary, public-facing page for the /events route.
export default function SubEventsListPage() {
  const [events, setEvents] = useState<SubEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const { userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // This logic handles redirecting staff members away from the public events page
    // to their own dedicated management page, resolving any routing conflicts.
    if (!authLoading && userProfile) {
      const isStaff = ['admin', 'overall_head', 'event_representative', 'organizer'].includes(userProfile.role);
      if (isStaff) {
        router.replace('/my-events');
        return; // Early return to prevent fetching public events for staff
      }
    }
  }, [userProfile, authLoading, router]);
  
  useEffect(() => {
    setLoading(true);
    const eventsQuery = query(collection(db, 'subEvents'));
    
    const unsubscribe = onSnapshot(eventsQuery, (snapshot) => {
      const eventsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubEvent));
      setEvents(eventsList);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching events in real-time: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredEvents = events
    .filter(event => 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.shortDescription.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(event => 
      categoryFilter === 'all' || (event.superpowerCategory && event.superpowerCategory === categoryFilter)
    );
  
  const uniqueCategories = ['all', ...new Set(events.map(event => event.superpowerCategory).filter(Boolean) as string[])];
  
  const isRedirecting = !authLoading && userProfile && ['admin', 'overall_head', 'event_representative', 'organizer'].includes(userProfile.role);
  if (authLoading || loading || isRedirecting) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 animate-fade-in-up">
      <header className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">Junior Scientist Sub-Events</h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Explore the exciting array of sub-events designed to challenge and inspire young scientists. Find your passion and register today!
        </p>
      </header>
      
      <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center p-4 rounded-lg bg-card border">
        <div className="relative w-full sm:flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            type="search"
            placeholder="Search sub-events..."
            className="pl-10 w-full bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative w-full sm:w-auto">
           <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[220px] bg-background">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              {uniqueCategories.map(category => (
                <SelectItem key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredEvents.map((event) => (
            <SubEventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-2xl font-semibold text-foreground mb-2">No Sub-Events Found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}
    </div>
  );
}
