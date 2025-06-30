
'use client';

import { useEffect, useState, useMemo, useCallback, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import type { UserRole, SubEvent, Task, UserProfileData, EventParticipant, CustomColumnDefinition, ActiveDynamicFilter, EventStatus, EventRegistration, EventTeam, StudentRegisteredEventDisplay } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Calendar } from '@/components/ui/calendar';
import { auth, db, storage } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, serverTimestamp, addDoc, deleteDoc, runTransaction, orderBy, limit } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import dynamic from 'next/dynamic';

import { format, isToday, isPast, isThisWeek, startOfDay, parseISO, isValid } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2, BarChartBig, Edit, Users, FileScan, Settings, BookUser, ListChecks, CalendarDays, UserCircle, Bell, GraduationCap, School, Download, Info, Briefcase, Newspaper, Award, Star, CheckCircle, ClipboardList, TrendingUp, Building, Activity, ShieldCheck, ExternalLink, Home, Search, CalendarCheck, Ticket, Users2, Phone, Mail, Milestone, MapPin, Clock, UsersRound, CheckSquare, BarChartHorizontalBig, Rss, AlertTriangle, Filter as FilterIcon, PlusCircle, GanttChartSquare, Rows, Tag, X as XIcon, Pencil, Trash2, CalendarRange, LayoutDashboard, CalendarIcon, UploadCloud, Image as ImageIcon, Trash, Trophy
} from 'lucide-react';


const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

const defaultEventFormState: Omit<SubEvent, 'id' | 'slug' | 'mainImage' | 'organizerUids' | 'eventReps'> & { mainImageSrc: string; mainImageAlt: string; mainImageAiHint: string; organizers_str: string; eventReps_str: string } = {
  title: '',
  superpowerCategory: 'The Thinker',
  shortDescription: '',
  detailedDescription: '',
  mainImageSrc: '',
  mainImageAlt: '',
  mainImageAiHint: '',
  registrationLink: '',
  deadline: null,
  eventDate: null,
  isTeamBased: false,
  minTeamMembers: 1,
  maxTeamMembers: 1,
  status: 'Planning',
  venue: '',
  eventReps_str: '',
  registeredParticipantCount: 0,
  organizers_str: '',
  galleryImages: [],
};


const getPriorityBadgeVariant = (priority: Task['priority']): "destructive" | "secondary" | "outline" => {
  if (priority === 'High') return 'destructive';
  if (priority === 'Medium') return 'secondary';
  return 'outline';
};

const getStatusBadgeVariant = (status: Task['status']): { variant: "default" | "secondary" | "outline" | "destructive", colorClass: string } => {
  switch (status) {
    case 'Completed': return { variant: 'default', colorClass: 'bg-green-500/10 border-green-500/30 text-green-700 dark:bg-green-700/20 dark:text-green-300' };
    case 'In Progress': return { variant: 'secondary', colorClass: 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:bg-blue-700/20 dark:text-blue-300' };
    case 'Pending Review': return { variant: 'outline', colorClass: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:bg-yellow-700/20 dark:text-yellow-300' };
    case 'Not Started': return { variant: 'outline', colorClass: 'bg-slate-500/10 border-slate-500/30 text-slate-700 dark:bg-slate-700/20 dark:text-slate-300' };
    default: return { variant: 'outline', colorClass: 'bg-muted text-muted-foreground border-border' };
  }
};

const getEventStatusBadgeVariant = (status: EventStatus | undefined): "default" | "secondary" | "outline" | "destructive" => {
    switch (status) {
        case 'Active': case 'open': return 'default'; 
        case 'Planning': return 'secondary';
        case 'Completed': return 'outline'; 
        case 'Cancelled': case 'closed': return 'destructive';
        default: return 'outline';
    }
};

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<UserProfileData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('role', 'in', ['organizer', 'event_representative', 'overall_head', 'admin']), orderBy('credibilityScore', 'desc'), limit(10));
        const querySnapshot = await getDocs(q);
        const leaders = querySnapshot.docs.map(doc => doc.data() as UserProfileData);
        setLeaderboard(leaders);
      } catch (error) {
        console.error("Error fetching leaderboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle>Leaderboard</CardTitle></CardHeader>
        <CardContent className="flex justify-center items-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md-soft rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl text-primary"><Trophy className="h-7 w-7"/>Credibility Leaderboard</CardTitle>
        <CardDescription>Top performing staff members based on task completions and responsibilities.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaderboard.map((user, index) => (
              <TableRow key={user.uid}>
                <TableCell className="font-bold">#{index + 1}</TableCell>
                <TableCell>{user.fullName || user.displayName}</TableCell>
                <TableCell className="capitalize">{user.role?.replace('_', ' ')}</TableCell>
                <TableCell className="text-right font-semibold text-accent">{user.credibilityScore}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};


export default function DashboardPage() {
  const { authUser, userProfile, setUserProfile, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [studentRegisteredFullEvents, setStudentRegisteredFullEvents] = useState<StudentRegisteredEventDisplay[]>([]);
  const [loadingStudentData, setLoadingStudentData] = useState(true);

  // State for "Leave Team" functionality
  const [isConfirmLeaveTeamOpen, setIsConfirmLeaveTeamOpen] = useState(false);
  const [isLeavingTeam, setIsLeavingTeam] = useState(false);
  const [selectedEventForLeave, setSelectedEventForLeave] = useState<StudentRegisteredEventDisplay | null>(null);

  const [allUsers, setAllUsers] = useState<UserProfileData[]>([]);
  const [allPlatformEvents, setAllPlatformEvents] = useState<SubEvent[]>([]); 
  
  const [isEventFormDialogOpen, setIsEventFormDialogOpen] = useState(false);
  const [currentEventForm, setCurrentEventForm] = useState(defaultEventFormState);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [galleryImageFiles, setGalleryImageFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);


  const [isDeleteEventConfirmOpen, setIsDeleteEventConfirmOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<SubEvent | null>(null);

  useEffect(() => {
    if (!loading && !authUser) {
      router.push('/login?redirect=/dashboard');
    }
  }, [authUser, loading, router]);


  // Fetch data needed for admin/overall head/rep views
  useEffect(() => {
    if (userProfile && (userProfile.role !== 'student')) {
      const fetchAdminData = async () => {
        // Fetch all events
        const eventsQuery = query(collection(db, 'subEvents'));
        const eventsSnapshot = await getDocs(eventsQuery);
        const eventsList = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubEvent));
        setAllPlatformEvents(eventsList);

        // Fetch all users (for assignment dropdowns etc)
        const usersQuery = query(collection(db, 'users'));
        const usersSnapshot = await getDocs(usersQuery);
        const usersList = usersSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfileData));
        setAllUsers(usersList);
      };
      fetchAdminData();
    }
  }, [userProfile]);

  // Fetch data specific to the logged-in user
  useEffect(() => {
    if (authUser && userProfile) {
      // Fetch tasks assigned to the current user
      const fetchMyTasks = async () => {
        if (userProfile.uid) {
          const tasksQuery = query(collection(db, 'tasks'), where('assignedToUserIds', 'array-contains', userProfile.uid));
          const tasksSnapshot = await getDocs(tasksQuery);
          const tasksList = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
          setTasks(tasksList);
        } else {
          setTasks([]);
        }
      };
      
      if(userProfile.role !== 'student') fetchMyTasks();

      // Fetch student-specific registration data
      if (userProfile.role === 'student' || userProfile.role === 'test') {
        setLoadingStudentData(true);
        const fetchStudentRegistrations = async () => {
          try {
            const registrationsRef = collection(db, 'event_registrations');
            const q = query(registrationsRef, where('userId', '==', authUser.uid), where('registrationStatus', '!=', 'cancelled'));
            const querySnapshot = await getDocs(q);
            
            const eventDetailsCache = new Map<string, SubEvent>();

            const fetchedRegistrationsPromises = querySnapshot.docs.map(async (regDoc) => {
              const regData = regDoc.data() as EventRegistration;

              let eventDetail = eventDetailsCache.get(regData.subEventId);
              if (!eventDetail) {
                const eventDoc = await getDoc(doc(db, 'subEvents', regData.subEventId));
                if (eventDoc.exists()) {
                  eventDetail = { id: eventDoc.id, ...eventDoc.data() } as SubEvent;
                  eventDetailsCache.set(regData.subEventId, eventDetail);
                }
              }

              if (eventDetail) {
                let teamDetails: EventTeam | undefined;
                let teamMembersNames: Record<string, string> = {};

                if (regData.isTeamRegistration && regData.teamId) {
                   try {
                    const teamDocRef = doc(db, 'event_teams', regData.teamId);
                    const teamDocSnap = await getDoc(teamDocRef);
                    if(teamDocSnap.exists()){
                        teamDetails = { id: teamDocSnap.id, ...teamDocSnap.data() } as EventTeam;
                        if (teamDetails.memberUids) {
                          for (const memberUid of teamDetails.memberUids) {
                              try {
                                  const userDoc = await getDoc(doc(db, 'users', memberUid));
                                  if (userDoc.exists()) {
                                      const userData = userDoc.data() as UserProfileData;
                                      teamMembersNames[memberUid] = userData.fullName || userData.displayName || 'Unknown Member';
                                  } else {
                                      teamMembersNames[memberUid] = 'Unknown Member';
                                  }
                              } catch (userFetchError) {
                                  console.warn(`Could not fetch profile for user ${memberUid}.`, userFetchError);
                                  teamMembersNames[memberUid] = 'Unknown Member';
                              }
                          }
                        }
                    }
                   } catch (teamError) {
                       console.error("Error fetching team details:", teamError);
                   }
                }
                return {
                  ...eventDetail,
                  registrationId: regDoc.id,
                  teamId: teamDetails?.id,
                  teamName: teamDetails?.teamName,
                  teamLeaderId: teamDetails?.teamLeaderId,
                  teamMembers: teamDetails?.memberUids,
                  teamMembersNames: teamMembersNames,
                  admitCardUrl: regData.admitCardUrl,
                  registrationStatus: regData.registrationStatus,
                } as StudentRegisteredEventDisplay;
              }
              return null;
            });
            const resolvedRegistrations = (await Promise.all(fetchedRegistrationsPromises)).filter(Boolean) as StudentRegisteredEventDisplay[];
            setStudentRegisteredFullEvents(resolvedRegistrations);
          } catch (error) {
            if (auth.currentUser) {
              console.error("Error fetching student registrations:", error);
              toast({ title: "Could not fetch events", description: "There was an issue loading your registered events.", variant: "destructive" });
            }
          } finally {
            setLoadingStudentData(false);
          }
        };
        fetchStudentRegistrations();
      }
    }
  }, [authUser, userProfile, toast]);


  const handleLeaveTeam = async () => {
    if (!selectedEventForLeave || !authUser) {
      toast({ title: "Error", description: "No event selected or user not authenticated.", variant: "destructive"});
      return;
    }
    
    setIsLeavingTeam(true);
    const { teamId, registrationId } = selectedEventForLeave;

    if (!teamId || !registrationId) {
      toast({ title: "Error", description: "Missing team or registration ID.", variant: "destructive" });
      setIsLeavingTeam(false);
      return;
    }

    const teamRef = doc(db, 'event_teams', teamId);
    const registrationRef = doc(db, 'event_registrations', registrationId);

    try {
      const teamDoc = await getDoc(teamRef);
      if (!teamDoc.exists()) {
        throw new Error("Team not found. It may have been disbanded.");
      }

      const currentTeamData = teamDoc.data() as EventTeam;
      const newMemberUids = currentTeamData.memberUids.filter(uid => uid !== authUser.uid);

      if (newMemberUids.length === currentTeamData.memberUids.length) {
         throw new Error("You are not a member of this team.");
      }
      
      await runTransaction(db, async (transaction) => {
        transaction.update(teamRef, {
            memberUids: newMemberUids,
            teamSize: newMemberUids.length,
            updatedAt: serverTimestamp(),
        });
        transaction.update(registrationRef, {
            registrationStatus: 'cancelled',
            lastUpdatedAt: serverTimestamp(),
        });
      });

      toast({ title: "Success", description: "You have left the team. Your registration for this event is now cancelled." });

      setStudentRegisteredFullEvents(prev => prev.filter(event => event.registrationId !== registrationId));
      
    } catch (error: any) {
      console.error("Error leaving team:", error);
      toast({ title: "Failed to leave team", description: error.message || "An unknown error occurred.", variant: "destructive" });
    } finally {
      setIsLeavingTeam(false);
      setIsConfirmLeaveTeamOpen(false);
      setSelectedEventForLeave(null);
    }
  };
  
  const handleImageFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast({ title: "File Too Large", description: "Image must be smaller than 5MB.", variant: "destructive"});
            return;
        }
        setMainImageFile(file);
        const previewUrl = URL.createObjectURL(file);
        setCurrentEventForm(f => ({ ...f, mainImageSrc: previewUrl }));
    }
  };

  const handleGalleryFilesChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
     if (files.length > 0) {
        setGalleryImageFiles(prev => [...prev, ...files]);
        const newPreviews = files.map(file => URL.createObjectURL(file));
        setGalleryPreviews(prev => [...prev, ...newPreviews]);
     }
  };
  
  const removeGalleryPreview = (index: number) => {
    setGalleryImageFiles(files => files.filter((_, i) => i !== index));
    setGalleryPreviews(previews => previews.filter((_, i) => i !== index));
  };


  const handleEventFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    if (!currentEventForm.title) {
        toast({ title: "Error", description: "Event Title is required.", variant: "destructive" });
        setIsUploading(false);
        return;
    }

    let imageUrl = currentEventForm.mainImageSrc || 'https://placehold.co/600x400.png';
    const slug = currentEventForm.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

    try {
        if (mainImageFile) {
            const imageRef = ref(storage, `event_images/${slug}/${mainImageFile.name}`);
            await uploadBytes(imageRef, mainImageFile);
            imageUrl = await getDownloadURL(imageRef);
        }

        const galleryImageUrls: SubEvent['galleryImages'] = editingEventId 
          ? allPlatformEvents.find(e => e.id === editingEventId)?.galleryImages || [] 
          : [];

        for (const file of galleryImageFiles) {
            const galleryImageRef = ref(storage, `event_images/${slug}/gallery/${file.name}_${Date.now()}`);
            await uploadBytes(galleryImageRef, file);
            const url = await getDownloadURL(galleryImageRef);
            galleryImageUrls.push({ src: url, alt: file.name, dataAiHint: 'event gallery' });
        }

        const eventDataToSave: Omit<SubEvent, 'id'| 'slug'> = {
            title: currentEventForm.title,
            superpowerCategory: currentEventForm.superpowerCategory,
            shortDescription: currentEventForm.shortDescription,
            detailedDescription: currentEventForm.detailedDescription,
            mainImage: { 
                src: imageUrl, 
                alt: currentEventForm.mainImageAlt || currentEventForm.title,
                dataAiHint: currentEventForm.mainImageAiHint || 'event placeholder'
            },
            galleryImages: galleryImageUrls,
            registrationLink: currentEventForm.registrationLink,
            deadline: currentEventForm.deadline || null,
            eventDate: currentEventForm.eventDate || null,
            isTeamBased: currentEventForm.isTeamBased,
            minTeamMembers: Number(currentEventForm.minTeamMembers),
            maxTeamMembers: Number(currentEventForm.maxTeamMembers),
            status: currentEventForm.status,
            venue: currentEventForm.venue,
            eventReps: currentEventForm.eventReps_str.split(',').map(s => s.trim()).filter(Boolean),
            organizerUids: currentEventForm.organizers_str.split(',').map(s => s.trim()).filter(Boolean),
            registeredParticipantCount: currentEventForm.registeredParticipantCount || 0,
            customData: currentEventForm.customData || {},
        };
      
        if (editingEventId) {
          const eventRef = doc(db, "subEvents", editingEventId);
          await updateDoc(eventRef, { ...eventDataToSave, slug });
          setAllPlatformEvents(prev => prev.map(event => event.id === editingEventId ? { ...event, ...eventDataToSave, slug, id: editingEventId } as SubEvent : event));
          toast({ title: "Event Updated", description: `Event "${eventDataToSave.title}" has been updated.`});
        } else {
          const docRef = await addDoc(collection(db, "subEvents"), { ...eventDataToSave, slug });
          const newEvent: SubEvent = { id: docRef.id, slug, ...eventDataToSave };
          setAllPlatformEvents(prev => [newEvent, ...prev]);
          toast({ title: "Event Created", description: `Event "${newEvent.title}" has been added.`});
        }
        setIsEventFormDialogOpen(false);
        setEditingEventId(null);
        setCurrentEventForm(defaultEventFormState);
        setMainImageFile(null);
        setGalleryImageFiles([]);
        setGalleryPreviews([]);
    } catch(error) {
       console.error("Error saving event:", error);
       toast({ title: "Error Saving Event", description: (error as Error).message || "An unexpected error occurred.", variant: "destructive"});
    } finally {
      setIsUploading(false);
    }
  };


  const openCreateEventDialog = () => {
    setEditingEventId(null);
    setCurrentEventForm(defaultEventFormState);
    setMainImageFile(null);
    setGalleryImageFiles([]);
    setGalleryPreviews([]);
    setIsEventFormDialogOpen(true);
  };
  const openEditEventDialog = (event: SubEvent) => {
    setEditingEventId(event.id);
    setMainImageFile(null);
    setGalleryImageFiles([]);
    setGalleryPreviews([]);
    setCurrentEventForm({
        ...defaultEventFormState,
        ...event,
        deadline: event.deadline ? parseISO(event.deadline) : null,
        eventDate: event.eventDate ? parseISO(event.eventDate) : null,
        mainImageSrc: event.mainImage.src,
        mainImageAlt: event.mainImage.alt,
        mainImageAiHint: event.mainImage.dataAiHint,
        organizers_str: (event.organizerUids || []).join(', '),
        eventReps_str: (event.eventReps || []).join(', '),
    });
    setIsEventFormDialogOpen(true);
  };

  const confirmDeleteEvent = async () => {
    if (eventToDelete) {
       try {
        await deleteDoc(doc(db, "subEvents", eventToDelete.id));
        setAllPlatformEvents(prev => prev.filter(e => e.id !== eventToDelete.id));
        toast({ title: `Event "${eventToDelete.title}" deleted.`});
      } catch (error) {
        console.error("Error deleting event:", error);
        toast({ title: "Error", description: "Could not delete the event.", variant: "destructive" });
      } finally {
        setIsDeleteEventConfirmOpen(false);
        setEventToDelete(null);
      }
    }
  };

  if (loading || !authUser || !userProfile) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const role: UserRole = userProfile.role;

  // Student Dashboard
  if (role === 'student' || (role === 'test' && !tasks?.length)) { 
    return (
      <div className="space-y-10 animate-fade-in-up">
        <Card className="shadow-md-soft rounded-xl overflow-hidden">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6 bg-gradient-to-br from-primary/5 via-background to-background">
            <Avatar className="h-24 w-24 text-3xl border-2 border-primary shadow-md shrink-0">
              <AvatarImage src={userProfile.photoURL || undefined} alt={userProfile.fullName || userProfile.displayName || 'Student'} />
              <AvatarFallback className="bg-primary/10 text-primary">{(userProfile.fullName || userProfile.displayName || userProfile.email || 'S')[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="space-y-1 text-center sm:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-primary">{userProfile.fullName || userProfile.displayName || 'Student Dashboard'}</h1>
              <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5"><Mail className="h-4 w-4"/>{userProfile.email}</p>
              <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5"><ShieldCheck className="h-4 w-4"/>ID: {userProfile.shortId || 'N/A'}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1 justify-center sm:justify-start">
                {userProfile.schoolName && ( <span className="flex items-center gap-1.5"><School className="h-4 w-4" /> {userProfile.schoolName} {userProfile.schoolVerifiedByOrganizer === false && <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-400">Pending Review</Badge>} </span>)}
                {userProfile.standard && ( <span className="flex items-center gap-1.5"><GraduationCap className="h-4 w-4" /> Grade {userProfile.standard} {userProfile.division && `(${userProfile.division})`}</span>)}
              </div>
              {userProfile.phoneNumbers && userProfile.phoneNumbers.length > 0 && (
                 <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1 justify-center sm:justify-start">
                    {userProfile.phoneNumbers.map(num => (
                         <span key={num} className="flex items-center gap-1.5"><Phone className="h-4 w-4" /> {num}</span>
                    ))}
                 </div>
              )}
            </div>
            <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground sm:ml-auto mt-4 sm:mt-0 px-6 py-2 rounded-lg shadow-soft">
                <Link href="/events">Explore More Events</Link>
            </Button>
          </CardContent>
        </Card>
        
        <Separator />

        <section id="my-events">
          <h2 className="text-2xl font-semibold text-primary mb-1">My Registered Events</h2>
          <p className="text-muted-foreground mb-6">Events you are currently participating in.</p>
          {loadingStudentData ? (
            <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary"/> <span className="ml-2">Loading your events...</span></div>
          ) : studentRegisteredFullEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {studentRegisteredFullEvents.map(event => (
                <Card key={event.registrationId} className="overflow-hidden shadow-soft hover:shadow-md-soft transition-shadow rounded-xl flex flex-col">
                  <div className="flex flex-col flex-grow">
                    <Link href={`/events/${event.slug}`} className="block group">
                      <div className="relative w-full h-40">
                        <Image
                          src={event.mainImage.src}
                          alt={event.mainImage.alt}
                          fill
                          style={{ objectFit: 'cover' }}
                          data-ai-hint={event.mainImage.dataAiHint}
                          className="group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg group-hover:text-primary">{event.title}</CardTitle>
                        {event.eventDate && <CardDescription className="text-xs flex items-center gap-1"><CalendarDays className="h-3 w-3"/> {new Date(event.eventDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</CardDescription>}
                        <Badge variant={event.registrationStatus === 'approved' ? 'default' : 'secondary'} className="mt-1 text-xs capitalize self-start">
                          Status: {event.registrationStatus || 'N/A'}
                        </Badge>
                      </CardHeader>
                      <CardContent className="pt-0 flex-grow">
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{event.shortDescription}</p>
                      </CardContent>
                    </Link>
                    <CardContent className="pt-0">
                      {event.isTeamBased && (
                        <div className="mt-2">
                          <p className="text-xs text-accent font-semibold flex items-center gap-1"><Users className="h-4 w-4"/>Team: {event.teamName || 'Your Team'}</p>
                          {event.teamMembersNames && Object.keys(event.teamMembersNames).length > 0 ? (
                            <div className="text-xs text-muted-foreground mt-1">
                                Members: {Object.values(event.teamMembersNames).join(', ')}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground mt-1">Loading team members...</p>
                          )}
                           {authUser?.uid !== event.teamLeaderId && event.teamId && (
                                <Button
                                    variant="link"
                                    size="sm"
                                    className="text-xs h-auto p-0 mt-1 text-destructive/80 hover:text-destructive"
                                    onClick={(e) => {
                                    e.preventDefault();
                                    setSelectedEventForLeave(event);
                                    setIsConfirmLeaveTeamOpen(true);
                                    }}
                                    disabled={isLeavingTeam && selectedEventForLeave?.teamId === event.teamId}
                                >
                                    {isLeavingTeam && selectedEventForLeave?.teamId === event.teamId ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                                    Leave Team
                                </Button>
                            )}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="mt-auto">
                       <Button variant="outline" size="sm" asChild className="w-full rounded-md">
                         <Link href={`/events/${event.slug}`}>View Details</Link>
                       </Button>
                    </CardFooter>
                   </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="shadow-soft rounded-xl">
              <CardContent className="text-center py-10 text-muted-foreground">
                <Milestone className="h-12 w-12 mx-auto mb-3 text-primary/50" />
                <p className="mb-1 text-lg">No Events Registered Yet</p>
                <p className="text-sm mb-3">Start your journey by exploring available events.</p>
                <Button variant="link" asChild className="text-primary"><Link href="/events">Explore Events</Link></Button>
              </CardContent>
            </Card>
          )}
        </section>

        <Separator />
        
        <section id="admit-cards">
          <h2 className="text-2xl font-semibold text-primary mb-1">Admit Cards</h2>
          <p className="text-muted-foreground mb-6">Download your admit cards for upcoming events.</p>
           {loadingStudentData ? (
             <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>
           ) : studentRegisteredFullEvents.length > 0 ? (
             <div className="space-y-4">
                {studentRegisteredFullEvents.filter(e => e.registrationStatus === 'approved').map(event => (
                    <Card key={`admit-${event.id}`} className="shadow-soft rounded-xl">
                        <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-center gap-3">
                            <div>
                                <h3 className="font-semibold text-foreground">{event.title}</h3>
                                <p className="text-sm text-muted-foreground">Event Date: {event.eventDate ? new Date(event.eventDate).toLocaleDateString() : 'TBA'}</p>
                            </div>
                            {event.admitCardUrl ? (
                                <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-md shadow-sm">
                                    <a href={event.admitCardUrl} target="_blank" rel="noopener noreferrer">
                                      <Download className="mr-2 h-4 w-4" /> Download Admit Card
                                    </a>
                                </Button>
                            ) : (
                                <Badge variant={'outline'} className="text-xs py-1 px-2">
                                    Admit Card Not Yet Available
                                </Badge>
                            )}
                        </CardContent>
                    </Card>
                ))}
                {studentRegisteredFullEvents.filter(e => e.registrationStatus === 'approved').length === 0 && (
                     <Card className="shadow-soft rounded-xl">
                        <CardContent className="text-center py-10 text-muted-foreground">
                            <Newspaper className="h-12 w-12 mx-auto mb-3 text-primary/50" />
                            <p>No admit cards available for your approved registrations yet.</p>
                        </CardContent>
                    </Card>
                )}
             </div>
          ) : (
             <Card className="shadow-soft rounded-xl">
              <CardContent className="text-center py-10 text-muted-foreground">
                <Newspaper className="h-12 w-12 mx-auto mb-3 text-primary/50" />
                <p>No registered events to show admit card status for.</p>
              </CardContent>
            </Card>
          )}
        </section>

        <Separator />

        <section id="teams">
             <h2 className="text-2xl font-semibold text-primary mb-1">My Teams</h2>
            <p className="text-muted-foreground mb-6">Manage your teams for group events.</p>
            <Card className="shadow-soft rounded-xl">
                <CardContent className="text-center py-10 text-muted-foreground">
                    <Users2 className="h-12 w-12 mx-auto mb-3 text-primary/50" />
                    <p>Team management features (inviting members, viewing full team details) are coming soon!</p>
                    <p className="text-sm">You can currently create a team or join one when registering for a team event.</p>
                </CardContent>
            </Card>
        </section>
        
        <AlertDialog open={isConfirmLeaveTeamOpen} onOpenChange={setIsConfirmLeaveTeamOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to leave this team?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. You will no longer be part of this team, and your event registration will be cancelled.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel disabled={isLeavingTeam}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleLeaveTeam} disabled={isLeavingTeam} className="bg-destructive hover:bg-destructive/90">
                    {isLeavingTeam ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isLeavingTeam ? "Leaving..." : "Leave Team"}
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

      </div>
    );
  }

  const assignedEvents = allPlatformEvents.filter(event => 
    userProfile.role === 'admin' ||
    userProfile.role === 'overall_head' ||
    (userProfile.role === 'event_representative' && userProfile.assignedEventUids?.includes(event.id)) ||
    (userProfile.role === 'organizer' && event.organizerUids?.includes(userProfile.uid))
  );

  // Staff Dashboards (Organizer, Rep, Overall Head, Admin)
  return (
    <div className="space-y-8 animate-fade-in-up">
      <header className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div className="flex items-center gap-4">
           <Avatar className="h-20 w-20 border-2 border-primary">
            <AvatarImage src={userProfile.photoURL || undefined} alt={userProfile.displayName || 'User'} />
            <AvatarFallback className="text-2xl bg-primary/10 text-primary">{(userProfile.displayName || userProfile.email || 'U')[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary">{userProfile.displayName || "Organizer Dashboard"}</h1>
            <p className="text-muted-foreground mt-1">{userProfile.email}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1"><ShieldCheck className="h-4 w-4" /> Role: <Badge variant="secondary" className="capitalize text-xs">{userProfile.role.replace('_', ' ')}</Badge></span>
                {userProfile.department && <span className="flex items-center gap-1"><Building className="h-4 w-4" /> {userProfile.department}</span>}
            </div>
          </div>
        </div>
        {(role === 'admin' || role === 'overall_head') && (
           <Button className="bg-accent hover:bg-accent/90 text-accent-foreground mt-4 md:mt-0 rounded-lg shadow-soft" onClick={openCreateEventDialog}>
              <PlusCircle className="mr-2 h-4 w-4"/> Create New Event
           </Button>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>My Tasks</CardTitle>
                    <CardDescription>Tasks assigned to you across all events.</CardDescription>
                </CardHeader>
                <CardContent>
                   {tasks.length > 0 ? (
                        <div className="space-y-2">
                            {tasks.slice(0, 5).map(task => (
                                <div key={task.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                                    <div>
                                        <p className="font-medium">{task.title}</p>
                                        <p className="text-xs text-muted-foreground">Due: {task.dueDate ? format(parseISO(task.dueDate), 'MMM dd, yyyy') : 'N/A'}</p>
                                    </div>
                                    <Badge variant={getPriorityBadgeVariant(task.priority)}>{task.priority}</Badge>
                                </div>
                            ))}
                        </div>
                   ) : <p className="text-muted-foreground text-sm">No tasks assigned to you yet.</p>}
                </CardContent>
                <CardFooter>
                    <Button variant="outline" asChild><Link href="/organizer/event-tasks">View All Tasks</Link></Button>
                </CardFooter>
            </Card>

            {(role === 'admin' || role === 'overall_head') && (
              <Leaderboard />
            )}

            <Card>
              <CardHeader>
                <CardTitle>My Assigned Events</CardTitle>
              </CardHeader>
              <CardContent>
                {assignedEvents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {assignedEvents.map(event => (
                        <Link href={`/organizer/events/manage/${event.slug}`} key={event.id}>
                          <Card className="hover:border-primary transition-colors">
                              <CardHeader>
                                <CardTitle className="text-lg">{event.title}</CardTitle>
                                <CardDescription className="capitalize">{event.status}</CardDescription>
                              </CardHeader>
                          </Card>
                        </Link>
                      ))}
                    </div>
                ) : <p className="text-muted-foreground text-sm">You are not assigned to any events.</p>}
              </CardContent>
            </Card>
        </div>
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Award className="h-6 w-6 text-primary"/>My Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label>Credibility Score</Label>
                        <p className="text-3xl font-bold text-accent">{userProfile.credibilityScore || 0}</p>
                    </div>
                     <div>
                        <Label>Tasks Completed</Label>
                        <p className="text-xl font-bold">{tasks.filter(t => t.status === 'Completed').length}</p>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
                <CardContent className="flex flex-col gap-2">
                     <Button variant="outline" asChild><Link href="/organizer/event-tasks"><ListChecks className="mr-2"/>Manage Tasks</Link></Button>
                     {(role === 'admin' || role === 'overall_head') && <Button variant="outline" asChild><Link href="/admin/users"><Users className="mr-2"/>Manage Users</Link></Button>}
                     <Button variant="outline" asChild><Link href="/ocr-tool"><FileScan className="mr-2"/>OCR Tool</Link></Button>
                     <Button variant="outline" asChild><Link href="/profile"><UserCircle className="mr-2"/>My Profile</Link></Button>
                </CardContent>
            </Card>
            {(role !== 'admin' && role !== 'overall_head') && (
              <Leaderboard />
            )}
        </div>
      </div>
      
      {/* Dialog for Create/Edit Event */}
      <Dialog open={isEventFormDialogOpen} onOpenChange={(isOpen) => {
            if (isUploading) return;
            setIsEventFormDialogOpen(isOpen);
            if (!isOpen) {
                setEditingEventId(null);
                setCurrentEventForm(defaultEventFormState);
                setMainImageFile(null);
                setGalleryImageFiles([]);
                setGalleryPreviews([]);
            }
        }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>{editingEventId ? `Edit Event: ${currentEventForm.title}` : "Create New Event"}</DialogTitle>
                <DialogDescription>
                    Fill in the details for the event. Click save when you&apos;re done.
                </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEventFormSubmit} className="grid gap-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="eventTitle">Event Title</Label>
                        <Input id="eventTitle" value={currentEventForm.title} onChange={e => setCurrentEventForm(f => ({...f, title: e.target.value}))} required />
                    </div>
                    <div>
                        <Label htmlFor="eventSuperpowerCategory">Superpower Category</Label>
                        <Select value={currentEventForm.superpowerCategory} onValueChange={val => setCurrentEventForm(f => ({...f, superpowerCategory: val as any}))}>
                            <SelectTrigger id="eventSuperpowerCategory"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="The Thinker">The Thinker</SelectItem>
                                <SelectItem value="The Brainiac">The Brainiac</SelectItem>
                                <SelectItem value="The Strategist">The Strategist</SelectItem>
                                <SelectItem value="The Innovator">The Innovator</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div>
                    <Label htmlFor="shortDescription">Short Description (for cards)</Label>
                    <Textarea id="shortDescription" value={currentEventForm.shortDescription} onChange={e => setCurrentEventForm(f => ({...f, shortDescription: e.target.value}))} rows={2}/>
                </div>
                <div>
                    <Label htmlFor="detailedDescription">Detailed Description (for event page)</Label>
                    <ReactQuill theme="snow" value={currentEventForm.detailedDescription} onChange={value => setCurrentEventForm(f => ({ ...f, detailedDescription: value }))} />
                </div>
                <div>
                    <Label htmlFor="mainImageFile">Main Event Image</Label>
                    <Input id="mainImageFile" type="file" accept="image/*" onChange={handleImageFileChange} />
                        {currentEventForm.mainImageSrc && (
                        <div className="mt-2 relative w-full h-40 rounded-md overflow-hidden border">
                            <Image src={currentEventForm.mainImageSrc} alt="Event image preview" fill style={{ objectFit: 'cover' }} />
                        </div>
                    )}
                </div>

                <div>
                    <Label htmlFor="galleryImageFiles">Gallery Images (optional)</Label>
                    <Input id="galleryImageFiles" type="file" accept="image/*" multiple onChange={handleGalleryFilesChange} />
                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {galleryPreviews.map((src, index) => (
                            <div key={index} className="relative group">
                                <Image src={src} alt={`Gallery preview ${index + 1}`} width={100} height={100} className="w-full h-24 object-cover rounded-md" />
                                <Button type="button" size="icon" variant="destructive" className="absolute top-1 right-1 h-6 w-6 opacity-70 group-hover:opacity-100" onClick={() => removeGalleryPreview(index)}>
                                    <Trash className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="eventDateForm">Event Date</Label>
                            <Popover>
                            <PopoverTrigger asChild>
                            <Button id="eventDateForm" variant="outline" className={`w-full justify-start text-left font-normal ${!currentEventForm.eventDate && "text-muted-foreground"}`}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {currentEventForm.eventDate && isValid(currentEventForm.eventDate) ? format(currentEventForm.eventDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={currentEventForm.eventDate ?? undefined} onSelect={date => setCurrentEventForm(f => ({...f, eventDate: date ?? null}))} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div>
                        <Label htmlFor="eventDeadlineForm">Registration Deadline</Label>
                            <Popover>
                            <PopoverTrigger asChild>
                            <Button id="eventDeadlineForm" variant="outline" className={`w-full justify-start text-left font-normal ${!currentEventForm.deadline && "text-muted-foreground"}`}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {currentEventForm.deadline && isValid(currentEventForm.deadline) ? format(currentEventForm.deadline, "PPP") : <span>Pick a date</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={currentEventForm.deadline ?? undefined} onSelect={date => setCurrentEventForm(f => ({...f, deadline: date ?? null}))} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Team Settings</Label>
                    <div className='flex items-center space-x-2'>
                        <Checkbox id="isTeamBased" checked={currentEventForm.isTeamBased} onCheckedChange={checked => setCurrentEventForm(f => ({...f, isTeamBased: !!checked}))} />
                        <Label htmlFor='isTeamBased'>This is a team-based event</Label>
                    </div>
                    {currentEventForm.isTeamBased && (
                        <div className='grid grid-cols-2 gap-4 pl-6'>
                            <div>
                                <Label htmlFor="minTeamMembers">Min Team Size</Label>
                                <Input id="minTeamMembers" type="number" value={currentEventForm.minTeamMembers} onChange={e => setCurrentEventForm(f => ({...f, minTeamMembers: Number(e.target.value)}))} />
                            </div>
                            <div>
                                <Label htmlFor="maxTeamMembers">Max Team Size</Label>
                                <Input id="maxTeamMembers" type="number" value={currentEventForm.maxTeamMembers} onChange={e => setCurrentEventForm(f => ({...f, maxTeamMembers: Number(e.target.value)}))} />
                            </div>
                        </div>
                    )}
                </div>
                <div>
                    <Label htmlFor="eventReps">Event Representative UIDs (comma-separated)</Label>
                    <Input id="eventReps" value={currentEventForm.eventReps_str} onChange={e => setCurrentEventForm(f => ({...f, eventReps_str: e.target.value}))} />
                </div>
                <div>
                    <Label htmlFor="organizers_str">Organizer UIDs (comma-separated)</Label>
                    <Input id="organizers_str" value={currentEventForm.organizers_str} onChange={e => setCurrentEventForm(f => ({...f, organizers_str: e.target.value}))} />
                </div>
                <div>
                    <Label htmlFor="venue">Venue</Label>
                    <Input id="venue" value={currentEventForm.venue} onChange={e => setCurrentEventForm(f => ({...f, venue: e.target.value}))} />
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="outline" disabled={isUploading}>Cancel</Button></DialogClose>
                    <Button type="submit" disabled={isUploading}>
                        {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {isUploading ? "Saving..." : "Save Event"}
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteEventConfirmOpen} onOpenChange={setIsDeleteEventConfirmOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the event
                    &quot;{eventToDelete?.title}&quot; and all associated registrations.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteEventConfirmOpen(false)}>Cancel</Button>
              <Button onClick={confirmDeleteEvent} className="bg-destructive hover:bg-destructive/90">
                  Yes, delete event
              </Button>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
