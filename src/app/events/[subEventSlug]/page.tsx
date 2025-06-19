
'use client';

import { useEffect, useState } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { subEventsData } from '@/data/subEvents';
import type { SubEvent, EventRegistration, EventTeam, UserProfileData } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, CalendarDays, ExternalLink, Info, Image as ImageIcon, CheckCircle, Loader2, UserCheck, Users, UserPlus, PlusCircle, AlertTriangle, Ticket } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, serverTimestamp, doc, setDoc, getDoc } from 'firebase/firestore';

export default function SubEventDetailPage() {
  const params = useParams();
  const { subEventSlug } = params;
  const [event, setEvent] = useState<SubEvent | null>(null);
  const { authUser, userProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationDetails, setRegistrationDetails] = useState<EventRegistration | null>(null);
  const [teamDetails, setTeamDetails] = useState<EventTeam | null>(null); // State for team details
  const [loadingTeamDetails, setLoadingTeamDetails] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  
  const [isTeamFormOpen, setIsTeamFormOpen] = useState(false);
  const [teamName, setTeamName] = useState('');

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
    const checkRegistration = async () => {
      if (event && authUser) {
        try {
          const registrationsRef = collection(db, 'event_registrations');
          const q = query(registrationsRef, where('userId', '==', authUser.uid), where('eventId', '==', event.id));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            setIsRegistered(true);
            const regData = querySnapshot.docs[0].data() as EventRegistration;
            regData.id = querySnapshot.docs[0].id;
            setRegistrationDetails(regData);
          } else {
            setIsRegistered(false);
            setRegistrationDetails(null);
            setTeamDetails(null); // Clear team details if not registered
          }
        } catch (error) {
          console.error("Error checking registration status:", error);
          toast({ title: "Error", description: "Could not check registration status.", variant: "destructive" });
        }
      } else {
        setIsRegistered(false);
        setRegistrationDetails(null);
        setTeamDetails(null);
      }
    };
    checkRegistration();
  }, [authUser, event, toast]);

  useEffect(() => {
    const fetchTeamDetails = async () => {
      if (registrationDetails?.isTeamRegistration && registrationDetails.teamId) {
        setLoadingTeamDetails(true);
        try {
          const teamDocRef = doc(db, 'event_teams', registrationDetails.teamId);
          const teamDocSnap = await getDoc(teamDocRef);
          if (teamDocSnap.exists()) {
            setTeamDetails(teamDocSnap.data() as EventTeam);
          } else {
            console.warn(`Team document with ID ${registrationDetails.teamId} not found.`);
            setTeamDetails(null);
          }
        } catch (error) {
          console.error("Error fetching team details:", error);
          toast({ title: "Error", description: "Could not fetch team details.", variant: "destructive" });
          setTeamDetails(null);
        } finally {
          setLoadingTeamDetails(false);
        }
      } else {
        setTeamDetails(null); // Clear team details if not a team registration or no teamId
      }
    };

    if (isRegistered) {
        fetchTeamDetails();
    }
  }, [registrationDetails, isRegistered, toast]);


  const handleIndividualRegistration = async () => {
    if (!authUser || !event || !userProfile) {
      toast({ title: "Error", description: "User or event data missing.", variant: "destructive"});
      return;
    }
    setIsRegistering(true);
    try {
      const newRegistration: EventRegistration = {
        userId: authUser.uid,
        eventId: event.id,
        registeredAt: serverTimestamp(),
        registrationStatus: 'pending',
        isTeamRegistration: false,
        teamId: null,
        admitCardUrl: null,
        presentee: false,
        submittedDocuments: null,
        lastUpdatedAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, 'event_registrations'), newRegistration);
      setIsRegistered(true);
      setRegistrationDetails({ ...newRegistration, id: docRef.id, registeredAt: new Date().toISOString(), lastUpdatedAt: new Date().toISOString() }); // Simulate timestamp
      toast({ title: "Registration Submitted!", description: `You've successfully submitted your registration for ${event.title}.` });
    } catch (error: any) {
      console.error("Error during individual registration:", error);
      toast({ title: "Registration Failed", description: error.message || "Could not submit registration.", variant: "destructive" });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleCreateTeamAndRegister = async () => {
    if (!authUser || !event || !teamName.trim() || !userProfile) {
      toast({ title: "Error", description: "Team name is required and user/event data must be present.", variant: "destructive"});
      return;
    }
    if (!event.isTeamBased) {
      toast({title: "Error", description: "This is not a team-based event.", variant: "destructive"});
      return;
    }

    setIsRegistering(true);
    let teamDocId = '';

    try {
      const newTeam: EventTeam = {
        eventId: event.id,
        teamName: teamName.trim(),
        teamLeaderId: authUser.uid,
        memberUids: [authUser.uid], 
        teamSize: 1, 
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      const teamDocRef = await addDoc(collection(db, 'event_teams'), newTeam);
      teamDocId = teamDocRef.id;
      console.log("Team created with ID:", teamDocId);

      const newRegistration: EventRegistration = {
        userId: authUser.uid,
        eventId: event.id,
        registeredAt: serverTimestamp(),
        registrationStatus: 'pending',
        isTeamRegistration: true,
        teamId: teamDocId,
        admitCardUrl: null,
        presentee: false,
        submittedDocuments: null,
        lastUpdatedAt: serverTimestamp(),
      };
      const regDocRef = await addDoc(collection(db, 'event_registrations'), newRegistration);
      
      setIsRegistered(true);
      setRegistrationDetails({ ...newRegistration, id: regDocRef.id, registeredAt: new Date().toISOString(), lastUpdatedAt: new Date().toISOString() });
      // Team details will be fetched by the useEffect hook
      toast({ title: "Team Created & Registered!", description: `Team "${teamName}" created and you're registered for ${event.title}.` });
      setIsTeamFormOpen(false);
      setTeamName('');

    } catch (error: any) {
      console.error("Error during team registration:", error);
      toast({ title: "Team Registration Failed", description: error.message || "Could not create team or register.", variant: "destructive" });
    } finally {
      setIsRegistering(false);
    }
  };
  
  const handleRegistrationAttempt = () => {
    if (!authUser) {
      router.push(`/login?redirect=/events/${event?.slug}`);
      return;
    }
    if (!userProfile || (userProfile.role !== 'student' && userProfile.role !== 'test')) {
      toast({ title: "Registration Denied", description: "Only students can register for events.", variant: "destructive" });
      return;
    }
    if (event?.isTeamBased) {
      setIsTeamFormOpen(true);
    } else {
      handleIndividualRegistration();
    }
  };


  if (authLoading || !event) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-10rem)] text-xl text-muted-foreground"><Loader2 className="h-8 w-8 animate-spin mr-2" />Loading event details...</div>;
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
          <div className="space-x-2">
            <Badge variant="secondary" className="text-md bg-primary/10 text-primary">{event.superpowerCategory}</Badge>
            {event.isTeamBased && <Badge variant="outline" className="text-md bg-accent/10 text-accent border-accent"><Users className="mr-1 h-4 w-4"/>Team Event</Badge>}
          </div>
        </header>

        <Card className="shadow-xl overflow-hidden bg-card/80 backdrop-blur-sm">
          <div className="relative w-full h-64 md:h-96">
            <Image 
              src={event.mainImage.src} 
              alt={event.mainImage.alt} 
              fill
              style={{ objectFit: 'cover' }} 
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
            {event.isTeamBased && (
              <p className="mt-2 text-sm text-accent">
                This is a team event. Min members: {event.minTeamMembers || 'N/A'}, Max members: {event.maxTeamMembers || 'N/A'}.
              </p>
            )}
          </CardContent>
        </Card>

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
                  Login to Register <ExternalLink className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            ) : (userProfile && (userProfile.role === 'student' || userProfile.role === 'test')) ? (
              isRegistered ? (
                <div className="text-center py-4">
                  <Ticket className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="font-semibold text-foreground">You are registered for this event!</p>
                  {registrationDetails?.isTeamRegistration && (
                    loadingTeamDetails ? (
                      <p className="text-sm text-muted-foreground flex items-center justify-center gap-1"><Loader2 className="h-4 w-4 animate-spin"/>Loading team details...</p>
                    ) : teamDetails ? (
                      <>
                        <p className="text-sm text-muted-foreground">Team: <strong>{teamDetails.teamName}</strong></p>
                        <p className="text-xs text-muted-foreground">
                          Members: {teamDetails.memberUids.length > 0 ? `(${teamDetails.memberUids.length}) UIDs: ${teamDetails.memberUids.join(', ')}` : 'No members listed yet.'}
                        </p>
                        <p className="text-xs text-muted-foreground">(Further team details in dashboard)</p>
                      </>
                    ) : registrationDetails.teamId ? (
                      <p className="text-sm text-muted-foreground">Team ID: {registrationDetails.teamId} (Could not load team name)</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Team registration, but no team details found.</p>
                    )
                  )}
                   <Badge variant={registrationDetails?.registrationStatus === 'approved' ? 'default' : 'secondary'} className="mt-1 capitalize">
                    Status: {registrationDetails?.registrationStatus || 'N/A'}
                  </Badge>
                  <br/>
                  <Button variant="link" asChild className="mt-2 text-primary"><Link href="/dashboard">View in Dashboard</Link></Button>
                </div>
              ) : (
                <Button 
                  size="lg" 
                  onClick={handleRegistrationAttempt} 
                  disabled={isRegistering}
                  className="w-full md:w-auto bg-green-500 hover:bg-green-600 text-white text-lg py-3 px-6"
                >
                  {isRegistering ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UserCheck className="mr-2 h-5 w-5" />}
                  Register for Event
                </Button>
              )
            ) : (
              <p className="text-muted-foreground text-center py-4">Only students can register for events. Organizers and other roles manage events through their dashboard.</p>
            )}
            
            <CardDescription className="text-sm text-muted-foreground pt-2">
              Register for: {event.title}. Your registration status will be updated by organizers.
            </CardDescription>
          </CardContent>
        </Card>
      </article>

      <AlertDialog open={isTeamFormOpen} onOpenChange={setIsTeamFormOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Register Team for &quot;{event.title}&quot;</AlertDialogTitle>
            <AlertDialogDescription>
              Enter your team name. You will be the team leader. You can invite other members later from your dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-3">
            <div>
              <Label htmlFor="teamNameInput" className="mb-2 block">Team Name <span className="text-destructive">*</span></Label>
              <Input 
                id="teamNameInput"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="E.g., The Innovators" 
                disabled={isRegistering}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRegistering}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCreateTeamAndRegister} disabled={isRegistering || !teamName.trim()}>
              {isRegistering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create Team & Register
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

    
