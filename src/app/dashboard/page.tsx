
'use client';

import { useEffect, useState, useMemo, useCallback, FormEvent } from 'react';
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
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, serverTimestamp, addDoc } from 'firebase/firestore';


import { format, isToday, isPast, isThisWeek, startOfDay, parseISO, isValid } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2, BarChartBig, Edit, Users, FileScan, Settings, BookUser, ListChecks, CalendarDays, UserCircle, Bell, GraduationCap, School, Download, Info, Briefcase, Newspaper, Award, Star, CheckCircle, ClipboardList, TrendingUp, Building, Activity, ShieldCheck, ExternalLink, Home, Search, CalendarCheck, Ticket, Users2, Phone, Mail, Milestone, MapPin, Clock, UsersRound, CheckSquare, BarChartHorizontalBig, Rss, AlertTriangle, Filter as FilterIcon, PlusCircle, GanttChartSquare, Rows, Tag, XIcon, Pencil, Trash2, CalendarRange, LayoutDashboard, CalendarIcon
} from 'lucide-react';


const defaultEventFormState: Omit<SubEvent, 'id' | 'slug' | 'mainImage'> & { mainImageSrc: string; mainImageAlt: string; mainImageAiHint: string; eventReps: string; organizers_str: string } = {
  title: '',
  superpowerCategory: 'The Thinker',
  shortDescription: '',
  detailedDescription: '',
  mainImageSrc: '',
  mainImageAlt: '',
  mainImageAiHint: '',
  registrationLink: '',
  deadline: undefined,
  eventDate: undefined,
  isTeamBased: false,
  minTeamMembers: 1,
  maxTeamMembers: 1,
  status: 'Planning',
  venue: '',
  eventReps: [],
  registeredParticipantCount: 0,
  organizers_str: '',
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
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [globalSchoolFilter, setGlobalSchoolFilter] = useState('all');
  const [globalPaymentStatusFilter, setGlobalPaymentStatusFilter] = useState('all'); // This will be mock for now
  const [globalEventFilter, setGlobalEventFilter] = useState('all');
  
  const [globalCustomColumnDefinitions, setGlobalCustomColumnDefinitions] = useState<CustomColumnDefinition[]>([]);
  const [isAddGlobalCustomColumnDialogOpen, setIsAddGlobalCustomColumnDialogOpen] = useState(false);
  const [newGlobalCustomColumnForm, setNewGlobalCustomColumnForm] = useState<{ name: string; dataType: CustomColumnDefinition['dataType']; options: string; defaultValue: string; description: string;}>({ name: '', dataType: 'text', options: '', defaultValue: '', description: '' });
  const [editingGlobalCustomCell, setEditingGlobalCustomCell] = useState<{ participantId: string; columnId: string } | null>(null);
  
  const [activeGlobalDynamicFilters, setActiveGlobalDynamicFilters] = useState<ActiveDynamicFilter[]>([]);
  const [isAddGlobalFilterPopoverOpen, setIsAddGlobalFilterPopoverOpen] = useState(false);
  const [newGlobalFilterColumn, setNewGlobalFilterColumn] = useState<{ id: string, name: string, isCustom: boolean } | null>(null);
  const [newGlobalFilterValue, setNewGlobalFilterValue] = useState('');

  const [allPlatformEvents, setAllPlatformEvents] = useState<SubEvent[]>([]); 
  const [eventSearchTerm, setEventSearchTerm] = useState('');
  const [eventStatusFilter, setEventStatusFilter] = useState<EventStatus | 'all'>('all');
  const [eventCategoryFilter, setEventCategoryFilter] = useState('all');
  
  const [activeEventDynamicFilters, setActiveEventDynamicFilters] = useState<ActiveDynamicFilter[]>([]);
  const [isAddEventFilterPopoverOpen, setIsAddEventFilterPopoverOpen] = useState(false);
  const [newEventFilterColumn, setNewEventFilterColumn] = useState<{ id: string, name: string, isCustom: boolean } | null>(null);
  const [newEventFilterValue, setNewEventFilterValue] = useState('');
  
  const [isEventFormDialogOpen, setIsEventFormDialogOpen] = useState(false);
  const [currentEventForm, setCurrentEventForm] = useState(defaultEventFormState);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const [isDeleteEventConfirmOpen, setIsDeleteEventConfirmOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<SubEvent | null>(null);

  // New state for custom columns for events
  const [eventCustomColumnDefinitions, setEventCustomColumnDefinitions] = useState<CustomColumnDefinition[]>([]);
  const [isAddEventCustomColumnDialogOpen, setIsAddEventCustomColumnDialogOpen] = useState(false);
  const [newEventCustomColumnForm, setNewEventCustomColumnForm] = useState<{ name: string; dataType: CustomColumnDefinition['dataType']; options: string; defaultValue: string; description: string;}>({ name: '', dataType: 'text', options: '', defaultValue: '', description: '' });
  const [editingEventCustomCell, setEditingEventCustomCell] = useState<{ eventId: string; columnId: string } | null>(null);



  useEffect(() => {
    if (!loading && !authUser) {
      router.push('/login?redirect=/dashboard');
    }
  }, [authUser, loading, router]);


  // Fetch all data needed for admin/overall head views
  useEffect(() => {
    if (userProfile && (userProfile.role === 'admin' || userProfile.role === 'overall_head')) {
      const fetchAdminData = async () => {
        // Fetch all events
        const eventsQuery = query(collection(db, 'subEvents'));
        const eventsSnapshot = await getDocs(eventsQuery);
        const eventsList = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubEvent));
        setAllPlatformEvents(eventsList);

        // Fetch all users
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
        if (userProfile.displayName) {
          const tasksQuery = query(collection(db, 'tasks'), where('assignedTo', 'array-contains', userProfile.displayName));
          const tasksSnapshot = await getDocs(tasksQuery);
          const tasksList = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
          setTasks(tasksList);
        } else {
          setTasks([]);
        }
      };
      fetchMyTasks();

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
      
      // Perform updates
      await updateDoc(teamRef, {
        memberUids: newMemberUids,
        teamSize: newMemberUids.length,
        updatedAt: serverTimestamp(),
      });

      await updateDoc(registrationRef, {
        registrationStatus: 'cancelled',
        lastUpdatedAt: serverTimestamp(),
      });

      toast({ title: "Success", description: "You have left the team. Your registration for this event is now cancelled." });

      // Refresh UI by removing the event from the local state
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

  const tasksDueToday = tasks.filter(task => task.dueDate && isValid(parseISO(task.dueDate)) && isToday(parseISO(task.dueDate)) && task.status !== 'Completed').length;
  const overdueTasks = tasks.filter(task => task.dueDate && isValid(parseISO(task.dueDate)) && isPast(parseISO(task.dueDate)) && !isToday(parseISO(task.dueDate)) && task.status !== 'Completed').length;
  const tasksThisWeek = tasks.filter(task => task.dueDate && isValid(parseISO(task.dueDate)) && isThisWeek(parseISO(task.dueDate), { weekStartsOn: 1 }) && task.status !== 'Completed').length;

  const allStudents = useMemo(() => allUsers.filter(u => u.role === 'student'), [allUsers]);

  const uniqueGlobalSchoolNames = useMemo(() => {
    const schools = new Set(allStudents.map(p => p.schoolName).filter(Boolean) as string[]);
    return ['all', ...Array.from(schools)];
  }, [allStudents]);

  const allEventTitles = useMemo(() => {
     return [{slug: 'all', title: 'All Events'}, ...allPlatformEvents.map(event => ({slug: event.slug, title: event.title}))];
  }, [allPlatformEvents]);


  const filteredGlobalParticipants = useMemo(() => {
    return allStudents; // Add filtering logic here later
  }, [allStudents]);

  
  const handleEventFormSubmit = async (e: FormEvent) => {
     e.preventDefault();
     if (!currentEventForm.title) {
        toast({ title: "Error", description: "Event Title is required.", variant: "destructive" });
        return;
     }

    const eventDataToSave: Omit<SubEvent, 'id'| 'slug'> = {
        title: currentEventForm.title,
        superpowerCategory: currentEventForm.superpowerCategory,
        shortDescription: currentEventForm.shortDescription,
        detailedDescription: currentEventForm.detailedDescription,
        mainImage: { 
            src: currentEventForm.mainImageSrc || 'https://placehold.co/600x400.png', 
            alt: currentEventForm.mainImageAlt || currentEventForm.title,
            dataAiHint: currentEventForm.mainImageAiHint || 'event placeholder'
        },
        registrationLink: currentEventForm.registrationLink,
        deadline: currentEventForm.deadline,
        eventDate: currentEventForm.eventDate,
        isTeamBased: currentEventForm.isTeamBased,
        minTeamMembers: Number(currentEventForm.minTeamMembers),
        maxTeamMembers: Number(currentEventForm.maxTeamMembers),
        status: currentEventForm.status,
        venue: currentEventForm.venue,
        eventReps: currentEventForm.eventReps.split(',').map(s => s.trim()).filter(Boolean),
        organizerUids: currentEventForm.organizers_str.split(',').map(s => s.trim()).filter(Boolean),
        registeredParticipantCount: currentEventForm.registeredParticipantCount || 0,
        customData: currentEventForm.customData || {},
    };
    
    const slug = eventDataToSave.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

    try {
      if (editingEventId) {
        const eventRef = doc(db, "subEvents", editingEventId);
        await updateDoc(eventRef, { ...eventDataToSave, slug });
        setAllPlatformEvents(prev => prev.map(event => event.id === editingEventId ? { ...event, ...eventDataToSave, slug, id: editingEventId } : event));
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
    } catch(error) {
       console.error("Error saving event:", error);
       toast({ title: "Error Saving Event", description: "An error occurred while saving the event.", variant: "destructive"});
    }
  };


  const openCreateEventDialog = () => {
    setEditingEventId(null);
    setCurrentEventForm(defaultEventFormState);
    setIsEventFormDialogOpen(true);
  };
  const openEditEventDialog = (event: SubEvent) => {
    setEditingEventId(event.id);
    setCurrentEventForm({
        ...defaultEventFormState,
        ...event,
        mainImageSrc: event.mainImage.src,
        mainImageAlt: event.mainImage.alt,
        mainImageAiHint: event.mainImage.dataAiHint,
        organizers_str: (event.organizerUids || []).join(', '),
        eventReps: (event.eventReps || []).join(', '),
    });
    setIsEventFormDialogOpen(true);
  };

  const confirmDeleteEvent = async () => {
    // This is a destructive action and should be handled with care
    // For now, we will just remove from local state.
    // In a real app, this would involve deleting from Firestore and handling cascading deletes.
    if (eventToDelete) {
      setAllPlatformEvents(prev => prev.filter(e => e.id !== eventToDelete.id));
      toast({ title: `Mock: Event "${eventToDelete.title}" deleted.`});
      setIsDeleteEventConfirmOpen(false);
      setEventToDelete(null);
    }
  };

  // ... other handler functions ...

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

  // Fallback for Organizer/Admin roles until specific dashboards are fleshed out
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

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Welcome, Organizer!</CardTitle>
            <CardDescription>This is your centralized dashboard. More role-specific features are coming soon.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Link href="/admin/users" className="p-4 bg-muted/50 rounded-lg hover:bg-muted text-center">
                <Users className="mx-auto h-8 w-8 text-primary mb-2" />
                <p className="font-semibold">Manage Users</p>
              </Link>
              <Link href="/organizer/event-tasks" className="p-4 bg-muted/50 rounded-lg hover:bg-muted text-center">
                <ListChecks className="mx-auto h-8 w-8 text-primary mb-2" />
                <p className="font-semibold">Manage Tasks</p>
              </Link>
              <Link href="/ocr-tool" className="p-4 bg-muted/50 rounded-lg hover:bg-muted text-center">
                <FileScan className="mx-auto h-8 w-8 text-primary mb-2" />
                <p className="font-semibold">OCR Tool</p>
              </Link>
               <Link href="/profile" className="p-4 bg-muted/50 rounded-lg hover:bg-muted text-center">
                <UserCircle className="mx-auto h-8 w-8 text-primary mb-2" />
                <p className="font-semibold">My Profile</p>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {(role === 'admin' || role === 'overall_head') && (
        <section id="manage-all-events">
          <Card className="shadow-md-soft rounded-xl">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <CardTitle className="flex items-center gap-2 text-2xl text-primary"><CalendarRange className="h-7 w-7"/>Manage All Platform Events</CardTitle>
                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={openCreateEventDialog}>
                    <PlusCircle className="mr-2 h-4 w-4"/> Add New Event
                </Button>
              </div>
              <CardDescription>Oversee, edit, or create new events on the platform. Showing {allPlatformEvents.length} events.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event Name</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Participants</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allPlatformEvents.map(event => (
                        <TableRow key={event.id}>
                          <TableCell className="font-medium">
                            <Link href={`/organizer/events/manage/${event.slug}`}>{event.title}</Link>
                          </TableCell>
                          <TableCell>{event.eventDate ? format(parseISO(event.eventDate), 'MMM dd, yyyy') : 'TBA'}</TableCell>
                          <TableCell>
                            <Badge variant={getEventStatusBadgeVariant(event.status)} className="capitalize">{event.status || 'N/A'}</Badge>
                          </TableCell>
                          <TableCell>{event.registeredParticipantCount || 0}</TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button variant="ghost" size="icon" className="hover:bg-muted/50 h-8 w-8" onClick={() => openEditEventDialog(event)}>
                              <Pencil className="h-4 w-4" /> <span className="sr-only">Edit Event</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Dialog for Create/Edit Event */}
        <Dialog open={isEventFormDialogOpen} onOpenChange={(isOpen) => {
            setIsEventFormDialogOpen(isOpen);
            if (!isOpen) {
                setEditingEventId(null);
                setCurrentEventForm(defaultEventFormState);
            }
        }}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{editingEventId ? `Edit Event` : "Create New Event"}</DialogTitle>
                    <DialogDescription>
                       Fill in the details for the event. Click save when you&apos;re done.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleEventFormSubmit} className="grid gap-4 py-4">
                    {/* Form fields as before... */}
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
                        <Label htmlFor="detailedDescription">Detailed Description</Label>
                        <Textarea id="detailedDescription" value={currentEventForm.detailedDescription} onChange={e => setCurrentEventForm(f => ({...f, detailedDescription: e.target.value}))} rows={5}/>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="eventDateForm">Event Date</Label>
                             <Popover>
                                <PopoverTrigger asChild>
                                <Button id="eventDateForm" variant="outline" className={`w-full justify-start text-left font-normal ${!currentEventForm.eventDate && "text-muted-foreground"}`}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {currentEventForm.eventDate && isValid(parseISO(currentEventForm.eventDate)) ? format(parseISO(currentEventForm.eventDate), "PPP") : <span>Pick a date</span>}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={currentEventForm.eventDate ? parseISO(currentEventForm.eventDate) : undefined} onSelect={date => setCurrentEventForm(f => ({...f, eventDate: date?.toISOString()}))} initialFocus />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div>
                            <Label htmlFor="eventDeadlineForm">Registration Deadline</Label>
                             <Popover>
                                <PopoverTrigger asChild>
                                <Button id="eventDeadlineForm" variant="outline" className={`w-full justify-start text-left font-normal ${!currentEventForm.deadline && "text-muted-foreground"}`}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {currentEventForm.deadline && isValid(parseISO(currentEventForm.deadline)) ? format(parseISO(currentEventForm.deadline), "PPP") : <span>Pick a date</span>}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={currentEventForm.deadline ? parseISO(currentEventForm.deadline) : undefined} onSelect={date => setCurrentEventForm(f => ({...f, deadline: date?.toISOString()}))} initialFocus />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="eventReps">Event Representative UIDs (comma-separated)</Label>
                        <Input id="eventReps" value={currentEventForm.eventReps} onChange={e => setCurrentEventForm(f => ({...f, eventReps: e.target.value}))} />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                        <Button type="submit">Save</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    </div>
  );
}

    