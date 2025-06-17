
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Event as OldEventType } from '@/types'; // Renamed to avoid conflict if SubEvent uses 'Event'
import { CalendarDays, MapPin, Tag } from 'lucide-react';

interface EventCardProps {
  event: OldEventType; // This card might be for a different type of event now.
}

// This component might need to be adapted or replaced if the primary event listing
// is now for SubEvents. Keeping it for now if it's used elsewhere.
// For Junior Scientist sub-events, a new SubEventCard is created in events/page.tsx.

export default function EventCard({ event }: EventCardProps) {
  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full bg-card/80 backdrop-blur-sm">
      <Link href={`/events/${event.id}`} className="block group h-full flex flex-col">
        <div className="relative w-full h-48">
          <Image
            src={event.imageUrl || "https://placehold.co/600x400.png"}
            alt={event.title}
            layout="fill"
            objectFit="cover"
            data-ai-hint={event.dataAiHint || event.category || "event generic"}
            className="group-hover:scale-105 transition-transform"
          />
        </div>
        <CardHeader>
          <CardTitle className="text-xl font-headline group-hover:text-primary transition-colors">{event.title}</CardTitle>
          <CardDescription className="line-clamp-2">{event.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground flex-grow">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            <span>{new Date(event.date).toLocaleDateString()} {event.time ? `- ${event.time}` : ''}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span>{event.location}</span>
          </div>
          {event.category && (
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              <span>Category: {event.category}</span>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
            <span className="w-full">View Details</span>
          </Button>
        </CardFooter>
      </Link>
    </Card>
  );
}

