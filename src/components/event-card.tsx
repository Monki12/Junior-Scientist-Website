
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
    <Card className="overflow-hidden shadow-soft hover:shadow-md-soft transition-all duration-300 flex flex-col h-full bg-card border-border/30 hover:border-primary/50 rounded-xl group">
      <Link href={`/events/${event.slug}`} className="block h-full flex flex-col">
        <div className="relative w-full h-48 overflow-hidden">
          <Image
            src={event.mainImage?.src || "https://placehold.co/600x400.png"}
            alt={event.mainImage?.alt || event.title}
            fill
            style={{ objectFit: 'cover' }}
            data-ai-hint={event.mainImage?.dataAiHint || "event"}
            className="group-hover:scale-105 transition-transform duration-300"
          />
           <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10"></div>
        </div>
        <CardHeader>
          <CardTitle className="text-xl font-headline group-hover:text-primary transition-colors">{event.title}</CardTitle>
          <CardDescription className="line-clamp-2 text-muted-foreground">{event.shortDescription}</CardDescription>
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
          <Button asChild className="w-full">
            <span className="w-full">View Details</span>
          </Button>
        </CardFooter>
      </Link>
    </Card>
  );
}
