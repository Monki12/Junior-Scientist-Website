
'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import type { SubEvent, EventRegistration, EventTeam, UserProfileData, CreateTeamFormData, JoinTeamFormData } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
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
import { ArrowLeft, CalendarDays, ExternalLink, Info, Users, CheckCircle, Loader2, UserCheck, UserPlus, PlusCircle, AlertTriangle, Ticket, Search as SearchIcon, ImageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, serverTimestamp, doc, setDoc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';

export default function SubEventDetailPage() {
  const params = useParams();
  const { subEventSlug } = params;
  const [event, setEvent] = useState<SubEvent | null>(null);
  const { authUser: user, userProfile, loading: authLoading } = useAuth(); // Renamed authUser to user for brevity
  const currentUserId = user?.uid;
  const { toast } = useToast();
  const router = useRouter();

  const [loadingEvent, setLoadingEvent] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<'not_registered' | 'registered_individual' | 'registered_team_leader' | 'registered_team_member' | 'loading'>('loading');
  const [userTeam, setUserTeam] = useState<EventTeam | null>(null);
  const [userRegistration, setUserRegistration] = useState<EventRegistration | null>(null);

  const [isCreateTeamDialogOpen, setIsCreateTeamDialogOpen] = useState(false);
  const [createTeamFormData, setCreateTeamFormData] = useState<CreateTeamFormData>({ teamName: '' });

  const [isJoinTeamDialogOpen, setIsJoinTeamDialogOpen] = useState(false);
  const [joinTeamFormData, setJoinTeamFormData] = useState<JoinTeamFormData>({ teamCodeOrName: '' });
  const [foundTeams, setFoundTeams] = useState<EventTeam[]>([]);
  const [searchingTeams, setSearchingTeams] = useState(false);
  
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  useEffect(() => {
    if (subEventSlug) {
      const fetchEvent = async () => {
        setLoadingEvent(true);
        const q = query(collection(db, 'subEvents'), where('slug', '==', subEventSlug));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const eventDoc = querySnapshot.docs[0];
          setEvent({ id: eventDoc.id, ...eventDoc.data() } as SubEvent);
        } else {
          notFound();
        }
        setLoadingEvent(false);
      };
      fetchEvent();
    }
  }, [subEventSlug]);

  useEffect(() => {
    if (!event || !currentUserId || authLoading) {
      if (!authLoading && !currentUserId && event) { // Event loaded, no user logged in
        setRegistrationStatus('not_registered');
        setLoadingEvent(false); // Ensure loadingEvent is false if only auth is pending
      }
      return;
    }
    
    const fetchRegistration = async () => {
      setRegistrationStatus('loading');
      try {
        const q = query(
          collection(db, 'event_registrations'),
          where('userId', '==', currentUserId),
          where('subEventId', '==', event.id)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const registration = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as EventRegistration;
          setUserRegistration(registration);
          if (registration.isTeamRegistration && registration.teamId) {
            setRegistrationStatus('registered_team_member'); 
            const teamDocRef = doc(db, 'event_teams', registration.teamId);
            const teamDocSnap = await getDoc(teamDocRef);
            if (teamDocSnap.exists()) {
              const teamData = { id: teamDocSnap.id, ...teamDocSnap.data() } as EventTeam;
              setUserTeam(teamData);
              if (teamData.teamLeaderId === currentUserId) {
                setRegistrationStatus('registered_team_leader');
              }
            } else {
               console.warn(`Team ${registration.teamId} not found for registration ${registration.id}`);
               setUserTeam(null); // Explicitly set to null if team doc not found
            }
          } else {
            setRegistrationStatus('registered_individual');
            setUserTeam(null);
          }
        } else {
          setRegistrationStatus('not_registered');
          setUserRegistration(null);
          setUserTeam(null);
        }
      } catch (error) {
        console.error("Error fetching registration:", error);
        toast({ title: 'Error loading registration status', variant: 'destructive' });
        setRegistrationStatus('not_registered');
      }
    };

    fetchRegistration();
  }, [event, currentUserId, authLoading, toast]);


  const handleIndividualRegistration = async () => {
    if (!currentUserId || !event || loadingAction || !userProfile) {
      toast({ title: "Error", description: "User, event data missing, or action in progress.", variant: "destructive"});
      return;
    }
    if (userProfile.role !== 'student') {
      toast({ title: "Registration Denied", description: "Only students can register for events.", variant: "destructive" });
      return;
    }

    setLoadingAction(true);
    setIsPaymentDialogOpen(false); // Close payment dialog

    try {
      const registrationData: Omit<EventRegistration, 'id'> = {
        userId: currentUserId,
        subEventId: event.id,
        registeredAt: serverTimestamp(),
        registrationStatus: 'pending',
        isTeamRegistration: false,
        teamId: null,
        admitCardUrl: null,
        presentee: false,
        submittedDocuments: null,
        lastUpdatedAt: serverTimestamp(),
        participantInfoSnapshot: {
          fullName: userProfile.fullName || userProfile.displayName || 'N/A',
          email: userProfile.email!,
          schoolName: userProfile.schoolName || 'N/A',
        }
      };
      const docRef = await addDoc(collection(db, 'event_registrations'), registrationData);
      setUserRegistration({ ...registrationData, id: docRef.id, registeredAt: new Date().toISOString(), lastUpdatedAt: new Date().toISOString() }); // Simulate timestamp

      toast({ title: 'Registration Submitted!', description: 'Your registration is pending payment verification.' });
      setRegistrationStatus('registered_individual');
    } catch (error: any) {
      console.error("Error registering individually:", error);
      toast({ title: 'Registration failed', description: error.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCreateTeamSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUserId || !event || loadingAction || !userProfile) {
      toast({ title: "Error", description: "User, event data missing, or action in progress.", variant: "destructive"});
      return;
    }
    if (userProfile.role !== 'student') {
      toast({ title: "Action Denied", description: "Only students can create teams.", variant: "destructive" });
      return;
    }
    if (!createTeamFormData.teamName.trim()) {
      toast({ title: 'Team name is required', variant: 'destructive' });
      return;
    }
    if (!event.isTeamBased) {
      toast({ title: 'Event is not team-based.', variant: 'destructive' });
      return;
    }

    setLoadingAction(true);
    setIsCreateTeamDialogOpen(false);
    setIsPaymentDialogOpen(false);
    try {
      const teamRef = doc(collection(db, 'event_teams'));
      const teamData: Omit<EventTeam, 'id'> = {
        eventId: event.id,
        teamName: createTeamFormData.teamName.trim(),
        teamLeaderId: currentUserId,
        memberUids: [currentUserId],
        teamSize: 1,
        status: 'pending' as const,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(teamRef, teamData);

      const registrationData: Omit<EventRegistration, 'id'> = {
        userId: currentUserId,
        subEventId: event.id,
        registeredAt: serverTimestamp(),
        registrationStatus: 'pending' as const,
        isTeamRegistration: true,
        teamId: teamRef.id,
        admitCardUrl: null,
        presentee: false,
        submittedDocuments: null,
        lastUpdatedAt: serverTimestamp(),
        participantInfoSnapshot: {
          fullName: userProfile.fullName || userProfile.displayName || 'N/A',
          email: userProfile.email!,
          schoolName: userProfile.schoolName || 'N/A',
        }
      };
      const regDocRef = await addDoc(collection(db, 'event_registrations'), registrationData);
      setUserRegistration({ ...registrationData, id: regDocRef.id, registeredAt: new Date().toISOString(), lastUpdatedAt: new Date().toISOString() });
      
      toast({ title: 'Team created & registered!', description: 'Your registration is pending payment verification. Share your team name!' });
      
      setRegistrationStatus('registered_team_leader');
      setUserTeam({ id: teamRef.id, ...teamData, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    } catch (error: any) {
      console.error("Error creating team:", error);
      toast({ title: 'Team creation failed', description: error.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setLoadingAction(false);
    }
  };
  
  const handleSearchTeams = async (e: FormEvent) => {
    e.preventDefault();
    if (!joinTeamFormData.teamCodeOrName.trim() || !event) return;

    setSearchingTeams(true);
    setFoundTeams([]);
    try {
      const q = query(
        collection(db, 'event_teams'),
        where('eventId', '==', event.id),
        where('teamName', '>=', joinTeamFormData.teamCodeOrName.trim()), // Basic prefix search
        where('teamName', '<=', joinTeamFormData.teamCodeOrName.trim() + '\uf8ff')
      );
      const querySnapshot = await getDocs(q);
      const teams: EventTeam[] = [];
      querySnapshot.forEach(docSnap => {
        const team = { id: docSnap.id, ...docSnap.data() } as EventTeam;
        if (event && team.memberUids.length < (event.maxTeamMembers || Infinity) && !team.memberUids.includes(currentUserId!)) {
          teams.push(team);
        }
      });
      setFoundTeams(teams);
      if (teams.length === 0) {
        toast({ title: 'No matching available teams found.', variant: 'default' });
      }
    } catch (error) {
      console.error("Error searching teams:", error);
      toast({ title: 'Error searching teams', variant: 'destructive' });
    } finally {
      setSearchingTeams(false);
    }
  };

  const handleJoinSpecificTeam = async (teamToJoin: EventTeam) => {
    if (!currentUserId || !event || loadingAction || !userProfile) return;
     if (userProfile.role !== 'student') {
      toast({ title: "Action Denied", description: "Only students can join teams.", variant: "destructive" });
      return;
    }
    if (teamToJoin.memberUids.length >= (event.maxTeamMembers || Infinity)) {
      toast({ title: 'Team is full', variant: 'destructive' }); return;
    }
    if (teamToJoin.memberUids.includes(currentUserId)) {
      toast({ title: 'You are already in this team!', variant: 'default' }); return;
    }

    setLoadingAction(true);
    setIsJoinTeamDialogOpen(false);
    setIsPaymentDialogOpen(false);
    try {
      const teamDocRef = doc(db, 'event_teams', teamToJoin.id);
      await updateDoc(teamDocRef, {
        memberUids: arrayUnion(currentUserId),
        teamSize: teamToJoin.memberUids.length + 1,
        updatedAt: serverTimestamp(),
      });

      const registrationData: Omit<EventRegistration, 'id'> = {
        userId: currentUserId,
        subEventId: event.id,
        registeredAt: serverTimestamp(),
        registrationStatus: 'pending' as const,
        isTeamRegistration: true,
        teamId: teamToJoin.id,
        admitCardUrl: null,
        presentee: false,
        submittedDocuments: null,
        lastUpdatedAt: serverTimestamp(),
        participantInfoSnapshot: {
          fullName: userProfile.fullName || userProfile.displayName || 'N/A',
          email: userProfile.email!,
          schoolName: userProfile.schoolName || 'N/A',
        }
      };
      const regDocRef = await addDoc(collection(db, 'event_registrations'), registrationData);
      setUserRegistration({ ...registrationData, id: regDocRef.id, registeredAt: new Date().toISOString(), lastUpdatedAt: new Date().toISOString() });

      toast({ title: `Successfully joined ${teamToJoin.teamName}!`, description: 'Your registration is pending payment verification.' });
      
      setRegistrationStatus('registered_team_member');
      setUserTeam({ ...teamToJoin, memberUids: [...teamToJoin.memberUids, currentUserId], teamSize: teamToJoin.memberUids.length + 1, updatedAt: new Date().toISOString() });
    } catch (error: any) {
      console.error("Error joining team:", error);
      toast({ title: 'Failed to join team', description: error.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setLoadingAction(false);
    }
  };

  const openPaymentDialog = () => {
    setIsPaymentDialogOpen(true);
  }

  const registrationAction = () => {
    if ((event.registrationFee || 0) > 0) {
      openPaymentDialog();
    } else {
      handleIndividualRegistration();
    }
  }
  
  const teamRegistrationAction = (action: 'create' | 'join') => {
    if ((event.registrationFee || 0) > 0) {
      openPaymentDialog();
      // We will proceed to the specific action from the payment dialog
    } else {
      if(action === 'create') setIsCreateTeamDialogOpen(true)
      if(action === 'join') setIsJoinTeamDialogOpen(true)
    }
  }


  if (authLoading || loadingEvent || !event) {
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
              data-ai-hint={event.mainImage.dataAiHint || 'event banner'}
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
            <div dangerouslySetInnerHTML={{ __html: event.detailedDescription }} />
            {event.isTeamBased && (
              <p className="mt-2 text-sm text-accent">
                Team size: {event.minTeamMembers || 1} - {event.maxTeamMembers || 'N/A'} members.
              </p>
            )}
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
            <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {event.galleryImages.map((image, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden shadow-md">
                        <Image src={image.src} alt={image.alt} fill style={{ objectFit: 'cover' }} data-ai-hint={image.dataAiHint || 'event gallery'} />
                    </div>
                ))}
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
             {(event.registrationFee || 0) > 0 && (
              <p className="flex items-center text-md text-foreground">
                <Ticket className="mr-2 h-5 w-5 text-accent" />
                Registration Fee: <strong>₹{event.registrationFee}</strong> {event.isTeamBased ? ' per team' : ' per person'}
              </p>
            )}

            {!currentUserId ? (
              <Button size="lg" asChild className="w-full md:w-auto bg-accent hover:bg-accent/90 text-accent-foreground text-lg py-3 px-6">
                <Link href={`/login?redirect=/events/${event.slug}`}>
                  Login to Register <ExternalLink className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            ) : registrationStatus === 'loading' ? (
                <div className="flex items-center text-muted-foreground justify-center py-4"> <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Checking registration status...</div>
            ) : registrationStatus === 'not_registered' ? (
                <>
                  {event.isTeamBased ? (
                    <div className="space-y-4 md:space-y-0 md:flex md:gap-3">
                      <Button onClick={() => teamRegistrationAction('create')} disabled={loadingAction} className="w-full md:w-auto bg-primary hover:bg-primary/90">
                        {loadingAction ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4"/>} Create New Team
                      </Button>
                      <Button onClick={() => teamRegistrationAction('join')} disabled={loadingAction} variant="outline" className="w-full md:w-auto">
                        {loadingAction ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4"/>} Join Existing Team
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      size="lg" 
                      onClick={registrationAction} 
                      disabled={loadingAction}
                      className="w-full md:w-auto bg-green-500 hover:bg-green-600 text-white text-lg py-3 px-6"
                    >
                      {loadingAction ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UserCheck className="mr-2 h-5 w-5" />}
                      Register for Event
                    </Button>
                  )}
                </>
            ) : (
              <div className="text-center py-4">
                <Ticket className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="font-semibold text-foreground">You are registered for this event!</p>
                {userRegistration?.registrationStatus && <Badge variant={userRegistration.registrationStatus === 'approved' ? 'default' : 'secondary'} className="mt-1 capitalize">Status: {userRegistration.registrationStatus}</Badge>}
                {userTeam && (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground">Team: <strong>{userTeam.teamName}</strong> ({registrationStatus === 'registered_team_leader' ? 'Leader' : 'Member'})</p>
                    <p className="text-xs text-muted-foreground">Members ({userTeam.memberUids.length}): (Full member names are shown on your dashboard)</p>
                  </div>
                )}
                 <Button variant="link" asChild className="mt-2 text-primary"><Link href="/dashboard">View in Dashboard</Link></Button>
              </div>
            )}
             {(!userProfile || (userProfile && userProfile.role !== 'student')) && currentUserId && (
                <p className="text-muted-foreground text-center py-4 text-sm">Only students can register. Your current role: {userProfile?.role || 'Unknown'}.</p>
            )}
            <CardDescription className="text-sm text-muted-foreground pt-2">
              Register for: {event.title}. Your registration status will be updated by organizers.
            </CardDescription>
          </CardContent>
        </Card>
      </article>

       <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Payment for &quot;{event.title}&quot;</DialogTitle>
              <DialogDescription>
                Please complete the payment of ₹{event.registrationFee} using the QR code below. After payment, click &quot;Done&quot; to submit your registration.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 text-center">
              <Image src="/images/qr.png" alt="Payment QR Code" width={250} height={250} className="mx-auto border-4 border-primary rounded-lg" data-ai-hint="payment qr" />
              <p className="mt-4 text-muted-foreground text-sm">Scan the QR code with your payment app.</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsPaymentDialogOpen(false)} disabled={loadingAction}>Cancel</Button>
              <Button type="button" onClick={event.isTeamBased ? () => { setIsCreateTeamDialogOpen(true); setIsPaymentDialogOpen(false)} : handleIndividualRegistration} disabled={loadingAction}>
                {loadingAction ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                Done, Proceed to Register
              </Button>
            </DialogFooter>
          </DialogContent>
       </Dialog>

      <Dialog open={isCreateTeamDialogOpen} onOpenChange={setIsCreateTeamDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Team for &quot;{event.title}&quot;</DialogTitle>
            <DialogDescription>
              Enter your team name. You will be the team leader. Other members can join using this team name.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTeamSubmit}>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="teamNameDialog">Team Name</Label>
                <Input 
                  id="teamNameDialog"
                  value={createTeamFormData.teamName}
                  onChange={(e) => setCreateTeamFormData({ ...createTeamFormData, teamName: e.target.value })}
                  placeholder="E.g., The Innovators" 
                  required
                  disabled={loadingAction}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline" disabled={loadingAction}>Cancel</Button></DialogClose>
              <Button type="submit" disabled={loadingAction || !createTeamFormData.teamName.trim()}>
                {loadingAction ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Create Team & Register
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

       <Dialog open={isJoinTeamDialogOpen} onOpenChange={setIsJoinTeamDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Join Existing Team for &quot;{event.title}&quot;</DialogTitle>
            <DialogDescription>Search for a team by its name to join.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSearchTeams} className="space-y-4 py-4">
            <div className="flex items-end gap-2">
              <div className="flex-grow">
                <Label htmlFor="teamCodeOrName">Team Name</Label>
                <Input
                  id="teamCodeOrName"
                  value={joinTeamFormData.teamCodeOrName}
                  onChange={(e) => setJoinTeamFormData({ ...joinTeamFormData, teamCodeOrName: e.target.value })}
                  placeholder="Enter exact team name"
                  required
                  disabled={loadingAction || searchingTeams}
                />
              </div>
              <Button type="submit" disabled={loadingAction || searchingTeams || !joinTeamFormData.teamCodeOrName.trim()}>
                {searchingTeams ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SearchIcon className="mr-2 h-4 w-4" />} Search
              </Button>
            </div>
          </form>

          {foundTeams.length > 0 && (
            <div className="mt-4 border-t pt-4 max-h-60 overflow-y-auto space-y-2">
              <h3 className="text-md font-semibold mb-2">Available Teams:</h3>
              {foundTeams.map(team => (
                <Card key={team.id} className="p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{team.teamName}</p>
                      <p className="text-xs text-muted-foreground">{team.memberUids.length} / {event?.maxTeamMembers} members</p>
                    </div>
                    <Button size="sm" onClick={() => handleJoinSpecificTeam(team)} disabled={loadingAction}>
                      {loadingAction ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Join Team
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
          {!searchingTeams && joinTeamFormData.teamCodeOrName && foundTeams.length === 0 && (
              <p className="text-center text-sm text-muted-foreground pt-2">No available teams found matching "{joinTeamFormData.teamCodeOrName}". Ensure the name is exact or the team isn't full.</p>
          )}
          <DialogFooter className="mt-4">
            <DialogClose asChild><Button type="button" variant="outline">Close</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
