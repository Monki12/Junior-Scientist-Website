
'use client';

import { useEffect, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { subEventsData } from '@/data/subEvents';
import type { SubEvent } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CalendarDays, ExternalLink, Info, Image as ImageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function SubEventDetailPage() {
  const params = useParams();
  const { subEventSlug } = params;
  const [event, setEvent] = useState<SubEvent | null>(null);

  useEffect(() => {
    if (subEventSlug) {
      const foundEvent = subEventsData.find(e => e.slug === subEventSlug);
      if (foundEvent) {
        setEvent(foundEvent);
      } else {
        notFound();
      }
    }
  }, [subEventSlug]);

  if (!event) {
    // This will typically be handled by notFound() redirecting, 
    // but as a fallback or during initial load:
    return <div className="flex justify-center items-center min-h-[calc(100vh-10rem)] text-xl text-muted-foreground">Loading event details...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 animate-fade-in-up">
      <Button variant="outline" asChild className="mb-8">
        <Link href="/events">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Sub-Events
        </Link>
      </Button>

      <article className="space-y-10">
        <header className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-3">{event.title}</h1>
          <Badge variant="secondary" className="text-md bg-primary/10 text-primary">{event.superpowerCategory}</Badge>
        </header>

        <Card className="shadow-xl overflow-hidden bg-card/80 backdrop-blur-sm">
          <div className="relative w-full h-64 md:h-96">
            <Image 
              src={event.mainImage.src} 
              alt={event.mainImage.alt} 
              layout="fill" 
              objectFit="cover" 
              priority
              data-ai-hint={event.mainImage.dataAiHint}
            />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-2xl text-accent">
              <Info className="mr-2 h-6 w-6" />
              About this Event
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert dark:prose-invert max-w-none text-foreground/90 text-lg leading-relaxed">
            <p>{event.detailedDescription}</p>
          </CardContent>
        </Card>

        {event.galleryImages && event.galleryImages.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-2xl text-accent">
                <ImageIcon className="mr-2 h-6 w-6" />
                Gallery
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {event.galleryImages.map((img, index) => (
                  <div key={index} className="relative aspect-video rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow">
                    <Image 
                      src={img.src} 
                      alt={img.alt} 
                      layout="fill" 
                      objectFit="cover"
                      data-ai-hint={img.dataAiHint} 
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-accent/10 border-accent">
          <CardHeader>
            <CardTitle className="text-xl text-accent">Registration Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {event.deadline && (
              <p className="flex items-center text-md text-foreground">
                <CalendarDays className="mr-2 h-5 w-5 text-accent" />
                Registration Deadline: <strong>{new Date(event.deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
              </p>
            )}
            <Button size="lg" asChild className="w-full md:w-auto bg-accent hover:bg-accent/90 text-accent-foreground text-lg py-3 px-6">
              <Link href={event.registrationLink}>
                Register Now <ExternalLink className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <CardDescription className="text-sm text-muted-foreground pt-2">
              Don't miss out! Secure your spot for {event.title}.
            </CardDescription>
          </CardContent>
        </Card>
      </article>
    </div>
  );
}
