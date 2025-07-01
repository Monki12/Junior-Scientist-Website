
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { SubEvent } from '@/types';
import { CalendarDays, MapPin, Tag } from 'lucide-react';

interface EventCardProps {
  event: SubEvent;
}

export default function EventCard({ event }: EventCardProps) {
  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full bg-card/80 backdrop-blur-sm">
      <Link href={`/events/${event.slug}`} className="block group h-full flex flex-col">
        <div className="relative w-full h-48">
          <Image
            src={event.mainImage?.src || "https://placehold.co/600x400.png"}
            alt={event.mainImage?.alt || event.title}
            fill
            style={{ objectFit: 'cover' }}
            data-ai-hint={event.mainImage?.dataAiHint || "event"}
            className="group-hover:scale-105 transition-transform"
          />
        </div>
        <CardHeader>
          <CardTitle className="text-xl font-headline group-hover:text-primary transition-colors">{event.title}</CardTitle>
          <CardDescription className="line-clamp-2">{event.shortDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground flex-grow">
          {event.eventDate && (
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              <span>{new Date(event.eventDate).toLocaleDateString()}</span>
            </div>
          )}
          {event.venue && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span>{event.venue}</span>
            </div>
          )}
          {event.superpowerCategory && (
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              <span>Category: {event.superpowerCategory}</span>
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
