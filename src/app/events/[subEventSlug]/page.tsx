
'use client';

import { useEffect, useState } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { subEventsData } from '@/data/subEvents';
import type { SubEvent } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, CalendarDays, ExternalLink, Info, Image as ImageIcon, CheckCircle, Loader2, UserCheck, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

export default function SubEventDetailPage() {
  const params = useParams();
  const { subEventSlug } = params;
  const [event, setEvent] = useState<SubEvent | null>(null);
  const { authUser, userProfile, setUserProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [isRegistered, setIsRegistered] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [isTeamNameDialogOpen, setIsTeamNameDialogOpen] = useState(false);

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

  useEffect(() => {
    if (event && userProfile && (userProfile.role === 'student' || userProfile.role === 'test')) {
      setIsRegistered(userProfile.registeredEvents?.some(re => re.eventSlug === event.slug) || false);
    }
  }, [userProfile, event]);

  const openTeamNameDialog = () => {
    if (!userProfile || !event) return;
     if (userProfile.role !== 'student' && userProfile.role !== 'test') {
        toast({
            title: "Registration Failed",
            description: "Only students can register for events.",
            variant: "destructive",
        });
        return;
    }
    setIsTeamNameDialogOpen(true);
  };

  const handleActualRegister = async (currentTeamName?: string) => {
    if (!userProfile || !event || !setUserProfile) return;
    setIsRegistering(true);
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

    setUserProfile(prevProfile => {
      if (!prevProfile) return null;
      const newRegisteredEvent = { eventSlug: event.slug, teamName: currentTeamName || undefined };
      const updatedRegisteredEvents = [...(prevProfile.registeredEvents || []), newRegisteredEvent];
      // Ensure no duplicate event slugs, preferring the latest registration if somehow duplicated (though UI should prevent this)
      const uniqueRegisteredEvents = Array.from(new Map(updatedRegisteredEvents.map(item => [item.eventSlug, item])).values());
      return { ...prevProfile, registeredEvents: uniqueRegisteredEvents };
    });

    setIsRegistered(true);
    setIsRegistering(false);
    setIsTeamNameDialogOpen(false);
    setTeamName(''); 
    toast({
      title: "Registration Successful!",
      description: `You have successfully registered for ${event.title}${currentTeamName ? ` with team '${currentTeamName}'` : ''}.`,
    });
  };
  
  const handleRegistrationAttempt = () => {
    if (!event) return;
    if (event.isTeamEvent) {
      openTeamNameDialog();
    } else {
      handleActualRegister();
    }
  };


  if (authLoading || !event) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-10rem)] text-xl text-muted-foreground"><Loader2 className="h-8 w-8 animate-spin mr-2" />Loading event details...</div>;
  }

  const currentRegistrationDetails = userProfile?.registeredEvents?.find(re => re.eventSlug === event.slug);


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
          <div className="space-x-2">
            <Badge variant="secondary" className="text-md bg-primary/10 text-primary">{event.superpowerCategory}</Badge>
            {event.isTeamEvent && <Badge variant="outline" className="text-md bg-accent/10 text-accent border-accent"><Users className="mr-1 h-4 w-4"/>Team Event</Badge>}
          </div>
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

            {!authUser ? (
              <Button size="lg" asChild className="w-full md:w-auto bg-accent hover:bg-accent/90 text-accent-foreground text-lg py-3 px-6">
                <Link href={`/login?redirect=/events/${event.slug}`}>
                  Register Now / Login <ExternalLink className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            ) : (userProfile && (userProfile.role === 'student' || userProfile.role === 'test')) ? (
              isRegistered ? (
                <div className="text-center py-4">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="font-semibold text-foreground">You are already registered for this event.</p>
                  {currentRegistrationDetails?.teamName && (
                    <p className="text-sm text-muted-foreground">Team: {currentRegistrationDetails.teamName}</p>
                  )}
                  <Button variant="link" asChild className="mt-1 text-primary"><Link href="/dashboard">View in Dashboard</Link></Button>
                </div>
              ) : (
                <Button 
                  size="lg" 
                  onClick={handleRegistrationAttempt} 
                  disabled={isRegistering}
                  className="w-full md:w-auto bg-green-500 hover:bg-green-600 text-white text-lg py-3 px-6"
                >
                  {isRegistering ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UserCheck className="mr-2 h-5 w-5" />}
                  Confirm Registration &amp; Proceed to Mock Payment
                </Button>
              )
            ) : (
              <p className="text-muted-foreground text-center py-4">Only students can register for events. Organizers and other roles manage events through their dashboard.</p>
            )}
            
            <CardDescription className="text-sm text-muted-foreground pt-2">
              Register for: {event.title}. (Mock payment simulation after confirmation)
            </CardDescription>
          </CardContent>
        </Card>
      </article>

      {event?.isTeamEvent && (
        <AlertDialog open={isTeamNameDialogOpen} onOpenChange={setIsTeamNameDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Enter Team Name (Optional)</AlertDialogTitle>
              <AlertDialogDescription>
                You are registering for &quot;{event.title}&quot;. If you are part of a team, please enter your team name below. Otherwise, you can leave it blank.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Label htmlFor="teamNameInput" className="mb-2 block">Team Name</Label>
              <Input 
                id="teamNameInput"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="E.g., The Innovators" 
                disabled={isRegistering}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isRegistering}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleActualRegister(teamName)} disabled={isRegistering}>
                {isRegistering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Register
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

