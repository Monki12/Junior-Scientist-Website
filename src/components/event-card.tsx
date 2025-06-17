import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Event } from '@/types';
import { CalendarDays, MapPin, Users } from 'lucide-react';

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
      <div className="relative w-full h-48">
        <Image
          src={event.imageUrl || "https://placehold.co/400x200.png"}
          alt={event.title}
          layout="fill"
          objectFit="cover"
          data-ai-hint={event.category || "event generic"}
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
            <Users className="h-4 w-4 text-primary" />
            <span>Category: {event.category}</span>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
          <Link href={`/events/${event.id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
