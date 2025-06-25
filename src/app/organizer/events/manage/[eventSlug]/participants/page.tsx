
'use client';

import { useEffect, useState, useMemo, FormEvent } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import type { SubEvent, EventParticipant, CustomColumnDefinition, EventRegistration, UserProfileData } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
import { useToast } from '@/hooks/use-toast';
import { db, storage } from '@/lib/firebase'; // Import db and storage
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore'; // Firestore imports
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Storage imports

import { ArrowLeft, Loader2, Users, Search, ShieldAlert, Filter, PlusCircle, BarChart2, PieChart, Users2, Tag, XIcon, Check, X, HelpCircle, UploadCloud, UserCheck, Ban } from 'lucide-react';


interface DisplayParticipant extends UserProfileData { // Using UserProfileData as base for participant details
  registrationId: string;
  registrationStatus: EventRegistration['registrationStatus'];
  presentee: boolean;
  admitCardUrl?: string | null;
  registeredAt: string; // ISO string
  customRegistrationData?: EventRegistration['submittedDocuments']; // Example, can extend
}

interface ActiveDynamicFilter {
  id: string;
  columnId: string;
  columnName: string;
  value: string;
  isCustom: boolean;
}

export default function ManageParticipantsPage() {
  const router = useRouter();
  const params = useParams();
  const eventSlug = params.eventSlug as string;
  const { toast } = useToast();

  const { userProfile: organizerProfile, loading: authLoading } = useAuth();
  const [event, setEvent] = useState<SubEvent | null>(null);
  const [loadingEventData, setLoadingEventData] = useState(true);
  
  const [participants, setParticipants] = useState<DisplayParticipant[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [registrationStatusFilter, setRegistrationStatusFilter] = useState<EventRegistration['registrationStatus'] | 'all'>('all');

  const [customColumnDefinitions, setCustomColumnDefinitions] = useState<CustomColumnDefinition[]>([]);
  // Add column dialog, editing cell states, etc., can be added back if complex custom columns per registration are needed.
  // For now, focusing on core registration fields.

  const [isAdmitCardUploadOpen, setIsAdmitCardUploadOpen] = useState(false);
  const [selectedParticipantForAdmitCard, setSelectedParticipantForAdmitCard] = useState<DisplayParticipant | null>(null);
  const [admitCardFile, setAdmitCardFile] = useState<File | null>(null);
  const [isUploadingAdmitCard, setIsUploadingAdmitCard] = useState(false);


  useEffect(() => {
    if (eventSlug) {
      setLoadingEventData(true);
      const fetchEvent = async () => {
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
          console.error("Error fetching event data:", error);
          notFound();
        } finally {
          setLoadingEventData(false);
        }
      };
      fetchEvent();
    } else {
      setLoadingEventData(false);
      notFound();
    }
  }, [eventSlug]);

  useEffect(() => {
    if (!authLoading && organizerProfile) {
      const canManageThisEvent = 
        organizerProfile.role === 'overall_head' ||
        organizerProfile.role === 'admin' ||
        (organizerProfile.role === 'organizer' && event?.organizerUids?.includes(organizerProfile.uid)) ||
        (organizerProfile.role === 'event_representative' && organizerProfile.assignedEventSlug === eventSlug);
      
      if (event && !canManageThisEvent) {
        toast({ title: "Access Denied", description: "You are not authorized for this event's participant list.", variant: "destructive"});
        router.push('/dashboard'); 
      }
    } else if (!authLoading && !organizerProfile) {
      router.push(`/login?redirect=/organizer/events/manage/${eventSlug}/participants`);
    }
  }, [organizerProfile, authLoading, router, eventSlug, event, toast]);

  // Fetch participants for the current event
  useEffect(() => {
    if (event && organizerProfile) { // Ensure event and organizerProfile are loaded
      setLoadingParticipants(true);
      const fetchParticipants = async () => {
        try {
          const registrationsRef = collection(db, 'event_registrations');
          const q = query(registrationsRef, where('subEventId', '==', event.id));
          const querySnapshot = await getDocs(q);
          
          const fetchedParticipantsPromises = querySnapshot.docs.map(async (regDoc) => {
            const regData = regDoc.data() as EventRegistration;
            
            // Check if participantInfoSnapshot exists and use it
            if (regData.participantInfoSnapshot) {
              return {
                ...regData.participantInfoSnapshot, // Spread the snapshot
                uid: regData.userId, // Ensure UID is present
                registrationId: regDoc.id,
                registrationStatus: regData.registrationStatus,
                presentee: regData.presentee || false,
                admitCardUrl: regData.admitCardUrl,
                registeredAt: regData.registeredAt?.toDate ? regData.registeredAt.toDate().toISOString() : new Date().toISOString(),
                role: 'student' // Assume role from context
              } as DisplayParticipant;
            }

            // Fallback: Fetch user details if snapshot is missing
            const userDocRef = doc(db, 'users', regData.userId);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              const userData = userDocSnap.data() as UserProfileData;
              return {
                ...userData, // Spread user profile data
                registrationId: regDoc.id,
                registrationStatus: regData.registrationStatus,
                presentee: regData.presentee || false,
                admitCardUrl: regData.admitCardUrl,
                registeredAt: regData.registeredAt?.toDate ? regData.registeredAt.toDate().toISOString() : new Date().toISOString(),
              } as DisplayParticipant;
            }
            return null;
          });

          const fetchedParticipants = (await Promise.all(fetchedParticipantsPromises)).filter(p => p !== null) as DisplayParticipant[];
          setParticipants(fetchedParticipants);

        } catch (error) {
          console.error("Error fetching participants:", error);
          toast({ title: "Error", description: "Could not fetch participant data.", variant: "destructive" });
        } finally {
          setLoadingParticipants(false);
        }
      };
      fetchParticipants();
    }
  }, [event, organizerProfile, toast]);


  const uniqueSchoolNames = useMemo(() => {
    const schools = new Set(participants.map(p => p.schoolName).filter(Boolean) as string[]);
    return ['all', ...Array.from(schools)];
  }, [participants]);

  const registrationStatuses: Array<EventRegistration['registrationStatus'] | 'all'> = ['all', 'pending', 'approved', 'declined', 'cancelled'];

  const filteredParticipants = useMemo(() => {
    return participants.filter(participant => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = searchTermLower === '' ||
        (participant.fullName && participant.fullName.toLowerCase().includes(searchTermLower)) ||
        (participant.email && participant.email.toLowerCase().includes(searchTermLower)) ||
        (participant.schoolName && participant.schoolName.toLowerCase().includes(searchTermLower));
      
      const matchesSchool = schoolFilter === 'all' || participant.schoolName === schoolFilter;
      const matchesStatus = registrationStatusFilter === 'all' || participant.registrationStatus === registrationStatusFilter;
      
      return matchesSearch && matchesSchool && matchesStatus;
    });
  }, [participants, searchTerm, schoolFilter, registrationStatusFilter]);
  
  const schoolBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    filteredParticipants.forEach(p => {
      if (p.schoolName) {
        breakdown[p.schoolName] = (breakdown[p.schoolName] || 0) + 1;
      } else {
        breakdown['N/A'] = (breakdown['N/A'] || 0) + 1;
      }
    });
    return breakdown;
  }, [filteredParticipants]);

  const registrationStatusBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    filteredParticipants.forEach(p => {
      breakdown[p.registrationStatus] = (breakdown[p.registrationStatus] || 0) + 1;
    });
    return breakdown;
  }, [filteredParticipants]);


  const handleUpdateRegistrationField = async (registrationId: string, field: keyof EventRegistration, value: any) => {
    try {
      const regDocRef = doc(db, 'event_registrations', registrationId);
      await updateDoc(regDocRef, {
        [field]: value,
        lastUpdatedAt: serverTimestamp(),
      });
      setParticipants(prev => prev.map(p => p.registrationId === registrationId ? { ...p, [field]: value, updatedAt: new Date().toISOString() } as DisplayParticipant : p));
      toast({ title: "Success", description: `Participant ${field} updated.` });
    } catch (error: any) {
      console.error(`Error updating ${field}:`, error);
      toast({ title: "Update Failed", description: error.message || `Could not update ${field}.`, variant: "destructive" });
    }
  };

  const handleAdmitCardUpload = async () => {
    if (!admitCardFile || !selectedParticipantForAdmitCard || !event) {
      toast({ title: "Error", description: "File or participant/event data missing for admit card upload.", variant: "destructive"});
      return;
    }
    setIsUploadingAdmitCard(true);
    try {
      const storageRef = ref(storage, `admit_cards/${event.id}/${selectedParticipantForAdmitCard.uid}_${selectedParticipantForAdmitCard.registrationId}_admit_card.${admitCardFile.name.split('.').pop()}`);
      await uploadBytes(storageRef, admitCardFile);
      const downloadURL = await getDownloadURL(storageRef);

      await handleUpdateRegistrationField(selectedParticipantForAdmitCard.registrationId, 'admitCardUrl', downloadURL);
      
      toast({ title: "Admit Card Uploaded", description: `Admit card for ${selectedParticipantForAdmitCard.fullName} uploaded successfully.` });
      setIsAdmitCardUploadOpen(false);
      setAdmitCardFile(null);
      setSelectedParticipantForAdmitCard(null);
    } catch (error: any) {
      console.error("Error uploading admit card:", error);
      toast({ title: "Upload Failed", description: error.message || "Could not upload admit card.", variant: "destructive" });
    } finally {
      setIsUploadingAdmitCard(false);
    }
  };

  if (authLoading || loadingEventData || !organizerProfile || !event) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="max-w-full mx-auto py-8 px-4 animate-fade-in-up space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
           <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-2 sm:mb-0 self-start sm:self-center">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Event Dashboard
          </Button>
          <div className="mt-2 sm:mt-0">
            <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
                <Users className="h-8 w-8" /> Manage Participants: {event.title}
            </h1>
            <p className="text-muted-foreground">View, filter, and manage registered participants for this event.</p>
          </div>
        </div>
        <Button variant="default" className="bg-accent hover:bg-accent/90 text-accent-foreground" disabled>
          Export Data (CSV)
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BarChart2 className="h-6 w-6 text-primary" />Statistics Overview</CardTitle>
          <CardDescription>Quick insights into participant data for this event. Updates with filters.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-secondary/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1"><Users2 className="h-4 w-4"/>Total (Filtered)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{filteredParticipants.length}</p>
            </CardContent>
          </Card>
          <Card className="bg-secondary/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1"><PieChart className="h-4 w-4"/>By School</CardTitle>
            </CardHeader>
            <CardContent className="text-xs max-h-24 overflow-y-auto">
              {Object.entries(schoolBreakdown).map(([school, count]) => (
                <p key={school}>{school}: {count}</p>
              ))}
              {Object.keys(schoolBreakdown).length === 0 && <p className="text-muted-foreground">No school data.</p>}
            </CardContent>
          </Card>
          <Card className="bg-secondary/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1"><PieChart className="h-4 w-4"/>Reg. Status</CardTitle>
            </CardHeader>
            <CardContent className="text-xs max-h-24 overflow-y-auto">
               {Object.entries(registrationStatusBreakdown).map(([status, count]) => (
                <p key={status} className="capitalize">{status}: {count}</p>
              ))}
              {Object.keys(registrationStatusBreakdown).length === 0 && <p className="text-muted-foreground">No status data.</p>}
            </CardContent>
          </Card>
           <Card className="bg-secondary/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Presentees</CardTitle>
            </CardHeader>
            <CardContent>
               <p className="text-2xl font-bold text-green-600">{filteredParticipants.filter(p => p.presentee).length}</p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Participant Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
            <div className="relative">
                <Label htmlFor="search-participants">Search</Label>
                <Search className="absolute left-2.5 top-[calc(50%+0.3rem)] -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="search-participants" type="search" placeholder="Name, email, school..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9"/>
            </div>
            <div>
                <Label htmlFor="school-filter">School</Label>
                <Select value={schoolFilter} onValueChange={setSchoolFilter}>
                <SelectTrigger id="school-filter"><SelectValue placeholder="Filter by school" /></SelectTrigger>
                <SelectContent>{uniqueSchoolNames.map(school => (<SelectItem key={school} value={school}>{school === 'all' ? 'All Schools' : school}</SelectItem>))}</SelectContent>
                </Select>
            </div>
            <div>
                <Label htmlFor="reg-status-filter">Registration Status</Label>
                <Select value={registrationStatusFilter} onValueChange={(value: EventRegistration['registrationStatus'] | 'all') => setRegistrationStatusFilter(value)}>
                <SelectTrigger id="reg-status-filter"><SelectValue placeholder="Filter by status" /></SelectTrigger>
                <SelectContent>{registrationStatuses.map(status => (<SelectItem key={status} value={status} className="capitalize">{status === 'all' ? 'All Statuses' : status}</SelectItem>))}</SelectContent>
                </Select>
            </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Participant List ({filteredParticipants.length} found)</CardTitle>
          <CardDescription>Manage registrations for &quot;{event.title}&quot;. Total registered: {participants.length}.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingParticipants ? (
             <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading participants...</span></div>
          ) : filteredParticipants.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>School</TableHead>
                    <TableHead>Standard</TableHead>
                    <TableHead>Registered On</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Present</TableHead>
                    <TableHead className="text-center">Admit Card</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParticipants.map((p) => (
                      <TableRow key={p.registrationId}>
                        <TableCell className="font-medium">{p.fullName || p.displayName}</TableCell>
                        <TableCell>{p.email}</TableCell>
                        <TableCell>{p.schoolName || 'N/A'}</TableCell>
                        <TableCell>{p.standard ? `Grade ${p.standard}` : 'N/A'}</TableCell>
                        <TableCell>{new Date(p.registeredAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Select value={p.registrationStatus} onValueChange={(newStatus: EventRegistration['registrationStatus']) => handleUpdateRegistrationField(p.registrationId, 'registrationStatus', newStatus)}>
                            <SelectTrigger className="h-8 text-xs capitalize w-[100px]"><SelectValue /></SelectTrigger>
                            <SelectContent>{registrationStatuses.filter(s => s !== 'all').map(s => (<SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>))}</SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-center">
                           <Checkbox checked={p.presentee} onCheckedChange={(checked) => handleUpdateRegistrationField(p.registrationId, 'presentee', !!checked)} aria-label={`Mark ${p.fullName} as present`} />
                        </TableCell>
                        <TableCell className="text-center">
                          {p.admitCardUrl ? (
                            <Button variant="link" size="sm" asChild><a href={p.admitCardUrl} target="_blank" rel="noopener noreferrer">View</a></Button>
                          ) : (
                            <Button variant="outline" size="xs" onClick={() => { setSelectedParticipantForAdmitCard(p); setIsAdmitCardUploadOpen(true); }}>
                              <UploadCloud className="mr-1 h-3 w-3"/> Upload
                            </Button>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                            <Button variant="ghost" size="xs" onClick={() => alert(`More actions for ${p.fullName} coming soon (e.g., view full profile, manage team if applicable).`)}>Details</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <Filter className="h-12 w-12 mx-auto mb-3 text-primary/50" />
              <p>No participants match the current filters for this event.</p>
              { (searchTerm || schoolFilter !== 'all' || registrationStatusFilter !== 'all') &&
                <Button variant="link" onClick={() => { setSearchTerm(''); setSchoolFilter('all'); setRegistrationStatusFilter('all');}} className="mt-2">
                  Clear All Filters
                </Button>
              }
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={isAdmitCardUploadOpen} onOpenChange={setIsAdmitCardUploadOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Upload Admit Card for {selectedParticipantForAdmitCard?.fullName}</AlertDialogTitle>
                <AlertDialogDescription>
                    Select a PDF or image file for the admit card. This will be uploaded to secure storage.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
                <Label htmlFor="admitCardFile">Admit Card File</Label>
                <Input id="admitCardFile" type="file" accept="application/pdf,image/*" onChange={(e) => setAdmitCardFile(e.target.files?.[0] || null)} />
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => {setAdmitCardFile(null); setSelectedParticipantForAdmitCard(null);}}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleAdmitCardUpload} disabled={!admitCardFile || isUploadingAdmitCard}>
                    {isUploadingAdmitCard && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Upload & Save
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
