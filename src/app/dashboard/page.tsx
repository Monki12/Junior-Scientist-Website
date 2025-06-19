
'use client';

import { useEffect, useState, useMemo, useCallback, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { subEventsData } from '@/data/subEvents';
import type { UserRole, SubEvent, Task, UserProfileData, EventParticipant, CustomColumnDefinition, ActiveDynamicFilter, EventStatus, EventRegistration, EventTeam } from '@/types';
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
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';


import { format, isToday, isPast, isThisWeek, startOfDay, parseISO, isValid } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2, BarChartBig, Edit, Users, FileScan, Settings, BookUser, ListChecks, CalendarDays, UserCircle, Bell, GraduationCap, School, Download, Info, Briefcase, Newspaper, Award, Star, CheckCircle, ClipboardList, TrendingUp, Building, Activity, ShieldCheck, ExternalLink, Home, Search, CalendarCheck, Ticket, Users2, Phone, Mail, Milestone, MapPin, Clock, UsersRound, CheckSquare, BarChartHorizontalBig, Rss, AlertTriangle, Filter as FilterIcon, PlusCircle, GanttChartSquare, Rows, Tag, XIcon, Pencil, Trash2, CalendarRange, LayoutDashboard, CalendarIcon
} from 'lucide-react';

interface StudentRegisteredEventDisplay extends SubEvent {
  registrationId: string;
  teamName?: string;
  teamId?: string;
  teamMembers?: string[]; // Changed to string[] for UIDs
  teamMembersNames?: Record<string, string>; // For fetched names
  admitCardUrl?: string | null;
  registrationStatus?: EventRegistration['registrationStatus'];
}


const defaultEventFormState: Omit<SubEvent, 'id' | 'slug' | 'mainImage'> & { mainImageSrc: string; mainImageAlt: string; mainImageAiHint: string; event_representatives_str: string; organizers_str: string } = {
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
  organizerUids: [],
  registeredParticipantCount: 0,
  event_representatives_str: '',
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
  
  const [localUserProfileTasks, setLocalUserProfileTasks] = useState<Task[]>([]);
  const [studentRegisteredFullEvents, setStudentRegisteredFullEvents] = useState<StudentRegisteredEventDisplay[]>([]);
  const [loadingStudentEvents, setLoadingStudentEvents] = useState(false);


  const [globalParticipants, setGlobalParticipants] = useState<EventParticipant[]>([]);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [globalSchoolFilter, setGlobalSchoolFilter] = useState('all');
  const [globalPaymentStatusFilter, setGlobalPaymentStatusFilter] = useState('all');
  const [globalEventFilter, setGlobalEventFilter] = useState('all');
  
  const [globalCustomColumnDefinitions, setGlobalCustomColumnDefinitions] = useState<CustomColumnDefinition[]>([]);
  const [isAddGlobalCustomColumnDialogOpen, setIsAddGlobalCustomColumnDialogOpen] = useState(false);
  const [newGlobalCustomColumnForm, setNewGlobalCustomColumnForm] = useState<{ name: string; dataType: CustomColumnDefinition['dataType']; options: string; defaultValue: string; description: string;}>({ name: '', dataType: 'text', options: '', defaultValue: '', description: '' });
  const [editingGlobalCustomCell, setEditingGlobalCustomCell] = useState<{ participantId: string; columnId: string } | null>(null);
  
  const [activeGlobalDynamicFilters, setActiveGlobalDynamicFilters] = useState<ActiveDynamicFilter[]>([]);
  const [isAddGlobalFilterPopoverOpen, setIsAddGlobalFilterPopoverOpen] = useState(false);
  const [newGlobalFilterColumn, setNewGlobalFilterColumn] = useState<{ id: string, name: string, isCustom: boolean } | null>(null);
  const [newGlobalFilterValue, setNewGlobalFilterValue] = useState('');

  const [allPlatformEvents, setAllPlatformEvents] = useState<SubEvent[]>(subEventsData); 
  const [eventSearchTerm, setEventSearchTerm] = useState('');
  const [eventStatusFilter, setEventStatusFilter] = useState<EventStatus | 'all'>('all');
  
  const [isEventFormDialogOpen, setIsEventFormDialogOpen] = useState(false);
  const [currentEventForm, setCurrentEventForm] = useState(defaultEventFormState);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const [isDeleteEventConfirmOpen, setIsDeleteEventConfirmOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<SubEvent | null>(null);


  useEffect(() => {
    if (!loading && !authUser) {
      router.push('/login?redirect=/dashboard');
    }
    if (userProfile) {
      const personallyAssignedTasks = userProfile.tasks?.filter(task => 
        task.assignedTo?.includes(userProfile.displayName!) // Assuming displayName is a valid string for matching
      ) || [];
      setLocalUserProfileTasks(personallyAssignedTasks);

      if (userProfile.role === 'overall_head' && userProfile.allPlatformParticipants) {
        setGlobalParticipants(userProfile.allPlatformParticipants);
      }

      if ((userProfile.role === 'student' || userProfile.role === 'test') && authUser) {
        setLoadingStudentEvents(true);
        const fetchStudentRegistrations = async () => {
          try {
            const registrationsRef = collection(db, 'event_registrations');
            const q = query(registrationsRef, where('userId', '==', authUser.uid));
            const querySnapshot = await getDocs(q);
            
            const fetchedRegistrationsPromises = querySnapshot.docs.map(async (regDoc) => {
              const regData = regDoc.data() as EventRegistration;
              const eventDetail = subEventsData.find(event => event.id === regData.eventId);
              if (eventDetail) {
                let teamDetails: EventTeam | undefined;
                let teamMembersNames: Record<string, string> = {};

                if (regData.isTeamRegistration && regData.teamId) {
                   try {
                    const teamDocRef = doc(db, 'event_teams', regData.teamId);
                    const teamDocSnap = await getDoc(teamDocRef);
                    if(teamDocSnap.exists()){
                        teamDetails = teamDocSnap.data() as EventTeam;
                        // Fetch member names (can be slow, consider optimization for many members)
                        for (const memberUid of teamDetails.memberUids) {
                            const userDoc = await getDoc(doc(db, 'users', memberUid));
                            if (userDoc.exists()) {
                                teamMembersNames[memberUid] = (userDoc.data() as UserProfileData).fullName || memberUid;
                            } else {
                                teamMembersNames[memberUid] = memberUid; // Fallback to UID
                            }
                        }
                    }
                   } catch (teamError) {
                       console.error("Error fetching team details for student dashboard:", teamError);
                   }
                }
                return {
                  ...eventDetail,
                  registrationId: regDoc.id,
                  teamId: teamDetails?.id,
                  teamName: teamDetails?.teamName,
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
            console.error("Error fetching student registrations:", error);
            toast({ title: "Error", description: "Could not fetch your registered events.", variant: "destructive" });
          } finally {
            setLoadingStudentEvents(false);
          }
        };
        fetchStudentRegistrations();
      }
    } else {
      setLocalUserProfileTasks([]); 
      setGlobalParticipants([]);
      setStudentRegisteredFullEvents([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser, userProfile, loading, router]); // toast was removed as it's stable


  const handleTaskCompletionToggle = (taskId: string) => {
    if (!setUserProfile || !userProfile) return;

    const updatedTasksForContext = (userProfile.tasks || []).map(task =>
      task.id === taskId
        ? { ...task, status: task.status === 'Completed' ? 'In Progress' : 'Completed' as Task['status'], updatedAt: new Date().toISOString() }
        : task
    );
    
    setUserProfile(prevProfile => {
      if (!prevProfile) return null;
      return { ...prevProfile, tasks: updatedTasksForContext };
    });
  };

  const myTasks = localUserProfileTasks; 

  const today = startOfDay(new Date());
  const tasksDueToday = myTasks.filter(task => task.dueDate && isValid(parseISO(task.dueDate)) && isToday(parseISO(task.dueDate)) && task.status !== 'Completed').length;
  const overdueTasks = myTasks.filter(task => task.dueDate && isValid(parseISO(task.dueDate)) && isPast(parseISO(task.dueDate)) && !isToday(parseISO(task.dueDate)) && task.status !== 'Completed').length;
  const tasksThisWeek = myTasks.filter(task => task.dueDate && isValid(parseISO(task.dueDate)) && isThisWeek(parseISO(task.dueDate), { weekStartsOn: 1 }) && task.status !== 'Completed').length;


  const uniqueGlobalSchoolNames = useMemo(() => {
    const schools = new Set(globalParticipants.map(p => p.schoolName).filter(Boolean) as string[]);
    return ['all', ...Array.from(schools)];
  }, [globalParticipants]);

  const globalPaymentStatuses: Array<EventParticipant['paymentStatus'] | 'all'> = ['all', 'paid', 'pending', 'waived', 'failed'];
  
  const allEventSlugsAndTitles = useMemo(() => {
     return [{slug: 'all', title: 'All Events'}, ...subEventsData.map(event => ({slug: event.slug, title: event.title}))];
  }, []);


  const availableGlobalParticipantFilterColumns = useMemo(() => {
    const standardCols = [
      { id: 'name', name: 'Name', isCustom: false },
      { id: 'email', name: 'Email', isCustom: false },
      { id: 'contactNumber', name: 'Contact Number', isCustom: false },
      { id: 'schoolName', name: 'School Name', isCustom: false },
      { id: 'paymentStatus', name: 'Payment Status', isCustom: false },
      { id: 'registeredEventSlugs', name: 'Events Registered In', isCustom: false},
    ];
    const customCols = globalCustomColumnDefinitions.map(col => ({ id: col.id, name: col.name, isCustom: true }));
    return [...standardCols, ...customCols];
  }, [globalCustomColumnDefinitions]);

  const filteredGlobalParticipants = useMemo(() => {
    return globalParticipants.filter(participant => {
      const searchTermLower = globalSearchTerm.toLowerCase();
      const matchesSearch = searchTermLower === '' ||
        participant.name.toLowerCase().includes(searchTermLower) ||
        participant.email.toLowerCase().includes(searchTermLower) ||
        (participant.schoolName && participant.schoolName.toLowerCase().includes(searchTermLower)) ||
        (participant.contactNumber && participant.contactNumber.toLowerCase().includes(searchTermLower));
      
      const matchesSchool = globalSchoolFilter === 'all' || participant.schoolName === globalSchoolFilter;
      const matchesPaymentStatus = globalPaymentStatusFilter === 'all' || participant.paymentStatus === globalPaymentStatusFilter;
      const matchesEvent = globalEventFilter === 'all' || (participant.registeredEventSlugs && participant.registeredEventSlugs.includes(globalEventFilter));

      let matchesDynamic = true;
      if (activeGlobalDynamicFilters.length > 0) {
        matchesDynamic = activeGlobalDynamicFilters.every(filter => {
          let participantValue: any;
          if (filter.isCustom) {
            participantValue = participant.customData?.[filter.columnId];
          } else {
            participantValue = (participant as any)[filter.columnId];
          }

          if (participantValue === undefined || participantValue === null) {
            if (typeof participantValue === 'boolean' && filter.value.toLowerCase() === 'false') return true; 
            return false;
          }
          
          const valueStr = String(participantValue).toLowerCase();
          const filterValueStr = filter.value.toLowerCase();

          if (filter.columnId === 'registeredEventSlugs' && Array.isArray(participantValue)) {
             return participantValue.some(slug => {
                const eventTitle = subEventsData.find(e => e.slug === slug)?.title.toLowerCase() || slug.toLowerCase();
                return eventTitle.includes(filterValueStr);
             });
          }
          if (typeof participantValue === 'boolean') {
             return filterValueStr === valueStr;
          }
          return valueStr.includes(filterValueStr);
        });
      }

      return matchesSearch && matchesSchool && matchesPaymentStatus && matchesEvent && matchesDynamic;
    });
  }, [globalParticipants, globalSearchTerm, globalSchoolFilter, globalPaymentStatusFilter, globalEventFilter, activeGlobalDynamicFilters]);

  const handleAddGlobalDynamicFilter = () => {
    if (newGlobalFilterColumn && newGlobalFilterValue.trim() !== '') {
      const newFilter: ActiveDynamicFilter = {
        id: Date.now().toString(),
        columnId: newGlobalFilterColumn.id,
        columnName: newGlobalFilterColumn.name,
        value: newGlobalFilterValue,
        isCustom: newGlobalFilterColumn.isCustom,
      };
      setActiveGlobalDynamicFilters(prev => [...prev, newFilter]);
      setNewGlobalFilterColumn(null);
      setNewGlobalFilterValue('');
      setIsAddGlobalFilterPopoverOpen(false);
    } else {
      toast({ title: "Incomplete Filter", description: "Please select a column and enter a value.", variant: "destructive"});
    }
  };

  const removeGlobalDynamicFilter = (filterId: string) => {
    setActiveGlobalDynamicFilters(prev => prev.filter(f => f.id !== filterId));
  };
  
  const getInitialValueForDataType = (dataType: CustomColumnDefinition['dataType']) => {
    switch (dataType) {
      case 'checkbox': return false;
      case 'number': return 0;
      default: return '';
    }
  };

  const handleAddGlobalCustomColumnSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newGlobalCustomColumnForm.name || !newGlobalCustomColumnForm.dataType) {
      toast({ title: "Error", description: "Column Name and Data Type are required.", variant: "destructive" });
      return;
    }
    const newColumnId = `global_custom_${Date.now()}_${newGlobalCustomColumnForm.name.toLowerCase().replace(/\s+/g, '_')}`;
    const newDefinition: CustomColumnDefinition = {
      id: newColumnId,
      name: newGlobalCustomColumnForm.name,
      dataType: newGlobalCustomColumnForm.dataType,
      options: newGlobalCustomColumnForm.dataType === 'dropdown' ? newGlobalCustomColumnForm.options.split(',').map(opt => opt.trim()).filter(Boolean) : undefined,
      defaultValue: newGlobalCustomColumnForm.defaultValue || getInitialValueForDataType(newGlobalCustomColumnForm.dataType),
      description: newGlobalCustomColumnForm.description,
    };
    setGlobalCustomColumnDefinitions(prev => [...prev, newDefinition]);

     if (setUserProfile && userProfile) {
        setUserProfile(prevProfile => {
            if (!prevProfile || !prevProfile.allPlatformParticipants) return prevProfile;
            const updatedParticipants = prevProfile.allPlatformParticipants.map(p => ({
                ...p,
                customData: {
                    ...(p.customData || {}),
                    [newColumnId]: newDefinition.defaultValue
                }
            }));
            return { ...prevProfile, allPlatformParticipants: updatedParticipants };
        });
    }

    setNewGlobalCustomColumnForm({ name: '', dataType: 'text', options: '', defaultValue: '', description: ''});
    setIsAddGlobalCustomColumnDialogOpen(false);
    toast({ title: "Success", description: `Global custom column "${newDefinition.name}" added.` });
  };

  const handleGlobalCustomDataChange = (participantId: string, columnId: string, value: any) => {
     if (setUserProfile && userProfile) {
        setUserProfile(prevProfile => {
            if (!prevProfile || !prevProfile.allPlatformParticipants) return prevProfile;
            const updatedParticipants = prevProfile.allPlatformParticipants.map(p =>
                p.id === participantId
                ? { ...p, customData: { ...(p.customData || {}), [columnId]: value } }
                : p
            );
            return { ...prevProfile, allPlatformParticipants: updatedParticipants };
        });
    }
  };

  const renderGlobalParticipantCustomCell = (participant: EventParticipant, column: CustomColumnDefinition) => {
    const value = participant.customData?.[column.id] ?? column.defaultValue ?? getInitialValueForDataType(column.dataType);
    const isEditing = editingGlobalCustomCell?.participantId === participant.id && editingGlobalCustomCell?.columnId === column.id;

    if (isEditing) {
       switch (column.dataType) {
        case 'text':
          return <Input type="text" value={String(value)} onChange={(e) => handleGlobalCustomDataChange(participant.id, column.id, e.target.value)} onBlur={() => setEditingGlobalCustomCell(null)} autoFocus className="h-8 text-xs"/>;
        case 'number':
          return <Input type="number" value={Number(value)} onChange={(e) => handleGlobalCustomDataChange(participant.id, column.id, parseFloat(e.target.value) || 0)} onBlur={() => setEditingGlobalCustomCell(null)} autoFocus className="h-8 text-xs"/>;
        case 'date':
          return <Input type="date" value={value && isValid(parseISO(String(value))) ? format(parseISO(String(value)), 'yyyy-MM-dd') : ''} onChange={(e) => handleGlobalCustomDataChange(participant.id, column.id, e.target.value)} onBlur={() => setEditingGlobalCustomCell(null)} autoFocus className="h-8 text-xs"/>;
        case 'checkbox':
           return <Checkbox checked={!!value} onCheckedChange={(checked) => {handleGlobalCustomDataChange(participant.id, column.id, !!checked); setEditingGlobalCustomCell(null);}} />;
        case 'dropdown':
          return (
            <Select value={String(value)} onValueChange={(val) => { handleGlobalCustomDataChange(participant.id, column.id, val); setEditingGlobalCustomCell(null); }} >
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                {column.options?.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
              </SelectContent>
            </Select>
          );
        default:
          return String(value);
      }
    }

    switch (column.dataType) {
        case 'checkbox':
            return <Checkbox checked={!!value} onCheckedChange={(checked) => handleGlobalCustomDataChange(participant.id, column.id, !!checked)} aria-label={`Toggle ${column.name} for ${participant.name}`}/>;
        case 'date':
            return <span onClick={() => setEditingGlobalCustomCell({ participantId: participant.id, columnId: column.id })} className="cursor-pointer hover:bg-muted/50 p-1 rounded min-h-[2rem] block">{value && isValid(parseISO(String(value))) ? format(parseISO(String(value)), 'MMM dd, yyyy') : 'N/A'}</span>;
        default:
            return <span onClick={() => column.dataType !== 'checkbox' && setEditingGlobalCustomCell({ participantId: participant.id, columnId: column.id })} className="cursor-pointer hover:bg-muted/50 p-1 rounded min-h-[2rem] block">{String(value)}</span>;
    }
  };

  const filteredEventsForOverallHead = useMemo(() => {
    return allPlatformEvents.filter(event => {
      const searchTermLower = eventSearchTerm.toLowerCase();
      const matchesSearch = searchTermLower === '' ||
        event.title.toLowerCase().includes(searchTermLower) ||
        (event.venue && event.venue.toLowerCase().includes(searchTermLower));
      const matchesStatus = eventStatusFilter === 'all' || event.status === eventStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [allPlatformEvents, eventSearchTerm, eventStatusFilter]);
  
  const superpowerCategories = ['The Thinker', 'The Brainiac', 'The Strategist', 'The Innovator'];


  const handleEventFormChange = (field: keyof typeof defaultEventFormState, value: any) => {
    setCurrentEventForm(prev => ({ ...prev, [field]: value }));
  };
  
  const handleEventFormDateChange = (field: 'eventDate' | 'deadline', date: Date | undefined) => {
    setCurrentEventForm(prev => ({ ...prev, [field]: date ? date.toISOString() : undefined }));
  };


  const handleEventFormSubmit = (e: FormEvent) => {
     e.preventDefault();
     if (!currentEventForm.title) {
        toast({ title: "Error", description: "Event Title is required.", variant: "destructive" });
        return;
     }

    const eventDataToSave: Omit<SubEvent, 'id' | 'slug'> = {
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
        minTeamMembers: currentEventForm.minTeamMembers,
        maxTeamMembers: currentEventForm.maxTeamMembers,
        status: currentEventForm.status,
        venue: currentEventForm.venue,
        organizerUids: currentEventForm.organizers_str.split(',').map(s => s.trim()).filter(Boolean),
        registeredParticipantCount: currentEventForm.registeredParticipantCount || 0,
    };

    if (editingEventId) {
        const updatedEvent = { 
            ...allPlatformEvents.find(e => e.id === editingEventId)!,
            ...eventDataToSave,
            slug: eventDataToSave.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''), 
        };
        setAllPlatformEvents(prev => prev.map(event => event.id === editingEventId ? updatedEvent : event));
        toast({ title: "Event Updated", description: `Event "${eventDataToSave.title}" has been updated.`});
    } else {
        const newEvent: SubEvent = {
            id: `event-${Date.now()}`,
            slug: eventDataToSave.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
            ...eventDataToSave,
        };
        setAllPlatformEvents(prev => [newEvent, ...prev]);
        toast({ title: "Event Created", description: `Event "${newEvent.title}" has been added.`});
    }
    setIsEventFormDialogOpen(false);
    setEditingEventId(null);
    setCurrentEventForm(defaultEventFormState);
  };


  const openCreateEventDialog = () => {
    setEditingEventId(null);
    setCurrentEventForm(defaultEventFormState);
    setIsEventFormDialogOpen(true);
  };
  const openEditEventDialog = (event: SubEvent) => {
    setEditingEventId(event.id);
    setCurrentEventForm({
        title: event.title,
        superpowerCategory: event.superpowerCategory,
        shortDescription: event.shortDescription,
        detailedDescription: event.detailedDescription,
        mainImageSrc: event.mainImage.src,
        mainImageAlt: event.mainImage.alt,
        mainImageAiHint: event.mainImage.dataAiHint,
        registrationLink: event.registrationLink,
        deadline: event.deadline,
        eventDate: event.eventDate,
        isTeamBased: event.isTeamBased || false,
        minTeamMembers: event.minTeamMembers || 1,
        maxTeamMembers: event.maxTeamMembers || 1,
        status: event.status || 'Planning',
        venue: event.venue || '',
        organizers_str: (event.organizerUids || []).join(', '),
        event_representatives_str: '', // This might be part of organizerUids with specific role
        registeredParticipantCount: event.registeredParticipantCount || 0,
    });
    setIsEventFormDialogOpen(true);
  };
  const openDeleteEventDialog = (event: SubEvent) => {
    setEventToDelete(event);
    setIsDeleteEventConfirmOpen(true);
  };
  const confirmDeleteEvent = () => {
    if (eventToDelete) {
      setAllPlatformEvents(prev => prev.filter(e => e.id !== eventToDelete.id));
      toast({ title: `Mock: Event "${eventToDelete.title}" deleted.`});
      setIsDeleteEventConfirmOpen(false);
      setEventToDelete(null);
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
  if (role === 'student' || (role === 'test' && !userProfile.tasks?.length && !userProfile.assignedEventSlugs?.length && !userProfile.allPlatformParticipants?.length)) { 
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
              <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5"><ShieldCheck className="h-4 w-4"/>UID: {userProfile.uid}</p>
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
          {loadingStudentEvents ? (
            <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary"/> <span className="ml-2">Loading your events...</span></div>
          ) : studentRegisteredFullEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {studentRegisteredFullEvents.map(event => (
                <Card key={event.registrationId} className="overflow-hidden shadow-soft hover:shadow-md-soft transition-shadow rounded-xl flex flex-col">
                  <Link href={`/events/${event.slug}`} className="block group flex flex-col flex-grow">
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
                      {event.isTeamBased && event.teamName && (
                        <div className="mt-2">
                          <p className="text-xs text-accent font-semibold flex items-center gap-1"><Users className="h-4 w-4"/>Team: {event.teamName}</p>
                          {event.teamMembersNames && Object.keys(event.teamMembersNames).length > 0 && (
                            <div className="text-xs text-muted-foreground mt-1">
                                Members: {Object.values(event.teamMembersNames).join(', ') || 'No members listed'}
                            </div>
                          )}
                           <Button variant="link" size="sm" className="text-xs h-auto p-0 mt-1 text-destructive/80 hover:text-destructive" onClick={(e) => {e.preventDefault(); alert("Leave Team functionality coming soon!")}}>Leave Team</Button>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter>
                       <Button variant="outline" size="sm" className="w-full rounded-md">View Details</Button>
                    </CardFooter>
                   </Link>
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
           {loadingStudentEvents ? (
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
      </div>
    );
  }

  // Overall Head Dashboard
  if (role === 'overall_head') {
    const activeGlobalStaticFiltersForDisplay = [
        globalSearchTerm && { label: 'Search', value: globalSearchTerm },
        globalSchoolFilter !== 'all' && { label: 'School', value: globalSchoolFilter },
        globalPaymentStatusFilter !== 'all' && { label: 'Payment', value: globalPaymentStatusFilter },
        globalEventFilter !== 'all' && { label: 'Event', value: subEventsData.find(e => e.slug === globalEventFilter)?.title || globalEventFilter },
    ].filter(Boolean);

    const allActiveGlobalFiltersForDisplay = [
        ...activeGlobalStaticFiltersForDisplay.map(f => ({ ...f!, isDynamic: false, id: f!.label.toLowerCase()})),
        ...activeGlobalDynamicFilters.map(df => ({ label: df.columnName, value: df.value, id: df.id, isDynamic: true }))
    ];
    
    const allActiveEventFiltersForDisplay = [
        eventSearchTerm && { label: 'Search', value: eventSearchTerm },
        eventStatusFilter !== 'all' && { label: 'Status', value: eventStatusFilter },
    ].filter(Boolean);


    return (
      <div className="space-y-8 animate-fade-in-up">
        <header className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div className="flex items-center gap-4">
             <Avatar className="h-20 w-20 border-2 border-primary">
              <AvatarImage src={userProfile.photoURL || undefined} alt={userProfile.displayName || 'User'} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">{(userProfile.displayName || userProfile.email || 'U')[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-primary">{userProfile.displayName || "Overall Head Dashboard"}</h1>
              <p className="text-muted-foreground mt-1">{userProfile.email}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                  <span className="flex items-center gap-1"><ShieldCheck className="h-4 w-4" /> Role: <span className="font-medium text-foreground capitalize">{userProfile.role.replace('_', ' ')}</span></span>
                  {userProfile.department && <span className="flex items-center gap-1"><Building className="h-4 w-4" /> {userProfile.department}</span>}
              </div>
            </div>
          </div>
           <Button className="bg-accent hover:bg-accent/90 text-accent-foreground mt-4 md:mt-0 rounded-lg shadow-soft" onClick={openCreateEventDialog}>
              <PlusCircle className="mr-2 h-4 w-4"/> Create New Event
           </Button>
        </header>

        {myTasks.length > 0 && (
        <section id="my-tasks-overall-head">
          <Card className="shadow-md-soft rounded-xl">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                    <CardTitle className="flex items-center gap-2 text-xl text-primary"><ClipboardList className="h-6 w-6"/>My Tasks</CardTitle>
                    <CardDescription>Overview of tasks assigned to you globally.</CardDescription>
                </div>
                <Button asChild variant="outline" size="sm">
                    <Link href="/organizer/event-tasks">View All My Tasks</Link>
                </Button>
              </div>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm border-t pt-3">
                <span>Due Today: <Badge variant={tasksDueToday > 0 ? "default" : "outline"} className={`${tasksDueToday > 0 ? 'bg-blue-500/10 text-blue-700 border-blue-500/30' : 'text-muted-foreground'}` }>{tasksDueToday}</Badge></span>
                <span>Overdue: <Badge variant={overdueTasks > 0 ? "destructive" : "outline"} className={overdueTasks > 0 ? "" : "text-muted-foreground"}>{overdueTasks}</Badge></span>
                <span>This Week: <Badge variant={tasksThisWeek > 0 ? "secondary" : "outline"} className={`${tasksThisWeek > 0 ? 'bg-purple-500/10 text-purple-700 border-purple-500/30': 'text-muted-foreground'}`}>{tasksThisWeek}</Badge></span>
              </div>
            </CardHeader>
            <CardContent>
              {myTasks.length > 0 ? (
                 <div className="overflow-x-auto rounded-md border">
                    <Table>
                        <TableHeader>
                        <TableRow className="bg-muted/20 hover:bg-muted/30">
                            <TableHead className="w-[50px]"></TableHead>
                            <TableHead>Task</TableHead>
                            <TableHead className="w-[100px]">Event</TableHead>
                            <TableHead className="w-[100px]">Due</TableHead>
                            <TableHead className="w-[100px]">Priority</TableHead>
                            <TableHead className="w-[120px]">Status</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {myTasks.slice(0, 7).map((task) => (
                            <TableRow key={task.id} className={`hover:bg-muted/50 transition-colors duration-150 ${task.status === 'Completed' ? 'opacity-60' : ''}`}>
                            <TableCell>
                                <Checkbox
                                checked={task.status === 'Completed'}
                                onCheckedChange={() => handleTaskCompletionToggle(task.id)}
                                aria-label={`Mark task ${task.title} as ${task.status === 'Completed' ? 'incomplete' : 'complete'}`}
                                />
                            </TableCell>
                            <TableCell className="font-medium max-w-[200px] sm:max-w-xs md:max-w-sm truncate">
                                <Link href="/organizer/event-tasks" title={task.title} className="hover:underline">{task.title}</Link>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                                <Badge variant="outline" className="text-xs">{task.eventSlug ? subEventsData.find(e => e.slug === task.eventSlug)?.title || task.eventSlug : 'General'}</Badge>
                            </TableCell>
                            <TableCell className={`text-xs ${task.dueDate && isValid(parseISO(task.dueDate)) && isPast(startOfDay(parseISO(task.dueDate))) && task.status !== 'Completed' ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                                {task.dueDate && isValid(parseISO(task.dueDate)) ? format(parseISO(task.dueDate), 'MMM dd') : 'N/A'}
                            </TableCell>
                            <TableCell>
                                <Badge variant={getPriorityBadgeVariant(task.priority)} className="capitalize text-xs py-0.5 px-1.5">{task.priority}</Badge>
                            </TableCell>
                            <TableCell>
                                <Badge variant={getStatusBadgeVariant(task.status).variant} className={`capitalize text-xs py-0.5 px-1.5 ${getStatusBadgeVariant(task.status).colorClass}`}>{task.status.replace('-', ' ')}</Badge>
                            </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                 </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <CheckSquare className="h-10 w-10 mx-auto mb-2 text-green-500" />
                  <p>Great job! You have no tasks assigned.</p>
                  <p className="text-xs">Check back later or view all event tasks.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
        )}
        
        <Separator />

         {/* Manage All Platform Events Section */}
        <section id="manage-all-events">
          <Card className="shadow-md-soft rounded-xl">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <CardTitle className="flex items-center gap-2 text-2xl text-primary"><CalendarRange className="h-7 w-7"/>Manage All Platform Events</CardTitle>
                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={openCreateEventDialog}>
                    <PlusCircle className="mr-2 h-4 w-4"/> Add New Event
                </Button>
              </div>
              <CardDescription>Oversee, edit, or create new events on the platform. Showing {filteredEventsForOverallHead.length} of {allPlatformEvents.length} events.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div className="relative">
                  <Label htmlFor="event-search">Search Events</Label>
                  <Search className="absolute left-2.5 top-[calc(50%+0.3rem)] -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="event-search" placeholder="Name, venue..." value={eventSearchTerm} onChange={e => setEventSearchTerm(e.target.value)} className="pl-9" />
                </div>
                <div>
                  <Label htmlFor="event-status-filter">Event Status</Label>
                  <Select value={eventStatusFilter} onValueChange={(value: EventStatus | 'all') => setEventStatusFilter(value)}>
                    <SelectTrigger id="event-status-filter"><SelectValue placeholder="Filter by status..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="Planning">Planning</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="open">Open (for Reg)</SelectItem>
                      <SelectItem value="closed">Closed (for Reg)</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" disabled className="text-muted-foreground">Date Range Filter (Soon)</Button>
                <Button variant="outline" disabled className="text-muted-foreground">Dynamic Event Filter (Soon)</Button>
              </div>

              {allActiveEventFiltersForDisplay.length > 0 && (
                 <div className="text-xs text-muted-foreground mt-2 mb-2">
                     <span className="font-medium">Active Event Filters:</span>
                     {allActiveEventFiltersForDisplay.map((filter) => (
                         <Badge key={filter!.label} variant="secondary" className="ml-1 text-xs py-0.5 px-1.5 rounded">
                         {filter!.label}: &quot;{filter!.value}&quot;
                         </Badge>
                     ))}
                 </div>
              )}

              {filteredEventsForOverallHead.length > 0 ? (
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event Name</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Venue</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Participants</TableHead>
                        <TableHead>ERs</TableHead>
                        <TableHead>Organizers</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEventsForOverallHead.map(event => (
                        <TableRow key={event.id}>
                          <TableCell className="font-medium hover:underline">
                            <Link href={`/organizer/events/manage/${event.slug}`}>{event.title}</Link>
                          </TableCell>
                          <TableCell>{event.eventDate ? format(parseISO(event.eventDate), 'MMM dd, yyyy') : 'TBA'}</TableCell>
                          <TableCell>{event.venue || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant={getEventStatusBadgeVariant(event.status)} className="capitalize">{event.status || 'N/A'}</Badge>
                          </TableCell>
                          <TableCell>{event.registeredParticipantCount || 0}</TableCell>
                          <TableCell className="text-xs max-w-[150px] truncate">
                            {(event.organizerUids?.includes('mock-representative-uid') ? 'Test Event Rep Bob' : '') || <span className="text-muted-foreground italic">None</span>}
                          </TableCell>
                           <TableCell className="text-xs max-w-[150px] truncate">
                             {event.organizerUids && event.organizerUids.length > 0 ? event.organizerUids.map(uid => mockUserProfiles[userProfile?.role as UserRole || 'student']?.displayName || uid).join(', ') : <span className="text-muted-foreground italic">None</span>}
                           </TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button variant="ghost" size="icon" className="hover:bg-muted/50 h-8 w-8" onClick={() => openEditEventDialog(event)}>
                              <Pencil className="h-4 w-4" /> <span className="sr-only">Edit Event</span>
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 h-8 w-8" onClick={() => openDeleteEventDialog(event)}>
                              <Trash2 className="h-4 w-4" /> <span className="sr-only">Delete Event</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <CalendarDays className="h-12 w-12 mx-auto mb-3 text-primary/30" />
                  <p>No events match the current filters.</p>
                   { (eventSearchTerm || eventStatusFilter !== 'all') &&
                    <Button variant="link" onClick={() => { setEventSearchTerm(''); setEventStatusFilter('all');}} className="mt-2">
                    Clear Event Filters
                    </Button>
                }
                </div>
              )}
            </CardContent>
          </Card>
        </section>
        
        <Separator />

        {/* Global Participant Management Section */}
        <section id="global-participants">
            <Card className="shadow-md-soft rounded-xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl text-primary"><Users2 className="h-7 w-7"/>All Platform Participants</CardTitle>
                    <CardDescription>View and manage participants across all events. Found: {filteredGlobalParticipants.length} of {globalParticipants.length}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-end">
                        <div className="relative">
                             <Label htmlFor="global-search-participants">Search</Label>
                            <Search className="absolute left-2.5 top-[calc(50%+0.3rem)] -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="global-search-participants" placeholder="Name, email, school..." value={globalSearchTerm} onChange={e => setGlobalSearchTerm(e.target.value)} className="pl-9" />
                        </div>
                        <div>
                            <Label htmlFor="global-school-filter">School</Label>
                            <Select value={globalSchoolFilter} onValueChange={setGlobalSchoolFilter}>
                                <SelectTrigger id="global-school-filter"><SelectValue placeholder="Filter by school..." /></SelectTrigger>
                                <SelectContent>
                                    {uniqueGlobalSchoolNames.map(school => <SelectItem key={school} value={school}>{school === 'all' ? 'All Schools' : school}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="global-payment-filter">Payment Status</Label>
                            <Select value={globalPaymentStatusFilter} onValueChange={setGlobalPaymentStatusFilter}>
                                <SelectTrigger id="global-payment-filter"><SelectValue placeholder="Filter by payment status..." /></SelectTrigger>
                                <SelectContent>
                                    {globalPaymentStatuses.map(status => <SelectItem key={status} value={status}>{status === 'all' ? 'All Statuses' : status.charAt(0).toUpperCase() + status.slice(1)}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="global-event-filter">Event</Label>
                            <Select value={globalEventFilter} onValueChange={setGlobalEventFilter}>
                                <SelectTrigger id="global-event-filter"><SelectValue placeholder="Filter by event..." /></SelectTrigger>
                                <SelectContent>
                                    {allEventSlugsAndTitles.map(eventItem => <SelectItem key={eventItem.slug} value={eventItem.slug}>{eventItem.title}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <Popover open={isAddGlobalFilterPopoverOpen} onOpenChange={setIsAddGlobalFilterPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full hover:bg-accent/10">
                                    <Tag className="mr-2 h-4 w-4" /> Add Dynamic Filter
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <h4 className="font-medium leading-none">Add Dynamic Filter</h4>
                                        <p className="text-sm text-muted-foreground">Select column & value.</p>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="global-filter-column">Column</Label>
                                        <Select
                                            value={newGlobalFilterColumn?.id}
                                            onValueChange={(value) => {
                                                const selected = availableGlobalParticipantFilterColumns.find(col => col.id === value);
                                                if (selected) setNewGlobalFilterColumn(selected);
                                            }}
                                        >
                                            <SelectTrigger id="global-filter-column" className="h-8">
                                            <SelectValue placeholder="Select column" />
                                            </SelectTrigger>
                                            <SelectContent>
                                            {availableGlobalParticipantFilterColumns.map(col => (
                                                <SelectItem key={col.id} value={col.id}>{col.name}</SelectItem>
                                            ))}
                                            </SelectContent>
                                        </Select>
                                        <Label htmlFor="global-filter-value">Value</Label>
                                        <Input
                                            id="global-filter-value"
                                            value={newGlobalFilterValue}
                                            onChange={(e) => setNewGlobalFilterValue(e.target.value)}
                                            className="h-8"
                                            placeholder="Enter value"
                                        />
                                    </div>
                                    <Button onClick={handleAddGlobalDynamicFilter}>Apply Filter</Button>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {allActiveGlobalFiltersForDisplay.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-2 mb-2">
                            <span className="font-medium">Active Global Participant Filters:</span>
                            {allActiveGlobalFiltersForDisplay.map((filter: any) => (
                                <Badge key={filter.id || filter.label} variant="secondary" className="ml-1 flex items-center gap-1 pr-1 text-xs py-0.5 px-1.5 rounded hover:bg-muted/80">
                                {filter.label}: &quot;{filter.value}&quot;
                                {filter.isDynamic && (
                                    <button onClick={() => removeGlobalDynamicFilter(filter.id)} className="ml-1 rounded-full hover:bg-destructive/20 hover:text-destructive p-0.5">
                                        <XIcon className="h-2.5 w-2.5" />
                                        <span className="sr-only">Remove filter</span>
                                    </button>
                                )}
                                </Badge>
                            ))}
                        </div>
                    )}

                    <Card className="bg-muted/30">
                        <CardContent className="py-4 text-center text-muted-foreground">
                            <BarChartBig className="h-10 w-10 mx-auto mb-2 text-primary/30"/>
                            Global Participant Statistics (Total Filtered: {filteredGlobalParticipants.length}) - Charts coming soon.
                        </CardContent>
                    </Card>

                    {filteredGlobalParticipants.length > 0 ? (
                        <div className="overflow-x-auto rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>School</TableHead>
                                        <TableHead>Payment</TableHead>
                                        <TableHead>Events Registered In</TableHead>
                                        {globalCustomColumnDefinitions.map(col => (
                                            <TableHead key={col.id}>{col.name}</TableHead>
                                        ))}
                                        <TableHead className="text-right">
                                            <AlertDialog open={isAddGlobalCustomColumnDialogOpen} onOpenChange={setIsAddGlobalCustomColumnDialogOpen}>
                                                <AlertDialogTrigger asChild>
                                                <Button variant="outline" size="sm" className="border-dashed hover:border-primary hover:text-primary h-8">
                                                    <PlusCircle className="mr-2 h-4 w-4" /> Add Column
                                                </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                <form onSubmit={handleAddGlobalCustomColumnSubmit}>
                                                    <AlertDialogHeader>
                                                    <AlertDialogTitle>Add New Global Custom Column</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Define a new column for all platform participants.
                                                    </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <div className="space-y-4 py-4">
                                                    <div>
                                                        <Label htmlFor="newGlobalCustomColName">Column Name</Label>
                                                        <Input id="newGlobalCustomColName" value={newGlobalCustomColumnForm.name} onChange={e => setNewGlobalCustomColumnForm({...newGlobalCustomColumnForm, name: e.target.value})} placeholder="E.g., T-Shirt Size" required />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="newGlobalCustomColDataType">Data Type</Label>
                                                        <Select value={newGlobalCustomColumnForm.dataType} onValueChange={val => setNewGlobalCustomColumnForm({...newGlobalCustomColumnForm, dataType: val as CustomColumnDefinition['dataType']})}>
                                                        <SelectTrigger id="newGlobalCustomColDataType"><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="text">Text</SelectItem>
                                                            <SelectItem value="number">Number</SelectItem>
                                                            <SelectItem value="checkbox">Checkbox</SelectItem>
                                                            <SelectItem value="dropdown">Dropdown</SelectItem>
                                                            <SelectItem value="date">Date</SelectItem>
                                                        </SelectContent>
                                                        </Select>
                                                    </div>
                                                    {newGlobalCustomColumnForm.dataType === 'dropdown' && (
                                                        <div>
                                                        <Label htmlFor="newGlobalCustomColOptions">Options (comma-separated)</Label>
                                                        <Input id="newGlobalCustomColOptions" value={newGlobalCustomColumnForm.options} onChange={e => setNewGlobalCustomColumnForm({...newGlobalCustomColumnForm, options: e.target.value})} placeholder="E.g., S, M, L, XL" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <Label htmlFor="newGlobalCustomColDefaultValue">Default Value (optional)</Label>
                                                        <Input id="newGlobalCustomColDefaultValue" value={newGlobalCustomColumnForm.defaultValue} onChange={e => setNewGlobalCustomColumnForm({...newGlobalCustomColumnForm, defaultValue: e.target.value})} />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="newGlobalCustomColDesc">Description (optional)</Label>
                                                        <Textarea id="newGlobalCustomColDesc" value={newGlobalCustomColumnForm.description} onChange={e => setNewGlobalCustomColumnForm({...newGlobalCustomColumnForm, description: e.target.value})} placeholder="Purpose of this column..." />
                                                    </div>
                                                    </div>
                                                    <AlertDialogFooter>
                                                    <AlertDialogCancel asChild><Button variant="outline" type="button">Cancel</Button></AlertDialogCancel>
                                                    <Button type="submit">Save Column</Button>
                                                    </AlertDialogFooter>
                                                </form>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredGlobalParticipants.map(p => (
                                        <TableRow key={p.id}>
                                            <TableCell className="font-medium">{p.name}</TableCell>
                                            <TableCell>{p.email}</TableCell>
                                            <TableCell>{p.schoolName || 'N/A'}</TableCell>
                                            <TableCell><Badge variant={p.paymentStatus === 'paid' ? 'default' : p.paymentStatus === 'pending' ? 'secondary' : 'outline'} className="capitalize">{p.paymentStatus}</Badge></TableCell>
                                            <TableCell>
                                                {p.registeredEventSlugs && p.registeredEventSlugs.length > 0 ? p.registeredEventSlugs.map(slug => {
                                                    const eventTitle = subEventsData.find(e => e.slug === slug)?.title || slug;
                                                    return (
                                                        <Badge 
                                                            key={slug} 
                                                            variant="secondary" 
                                                            className="mr-1 mb-1 cursor-pointer hover:bg-primary/20 text-xs"
                                                            onClick={() => toast({ title: `Drill-down to ${eventTitle}`, description: "Functionality coming soon!"})}
                                                        >
                                                            {eventTitle}
                                                        </Badge>
                                                    );
                                                }) : <span className="text-xs text-muted-foreground">None</span>}
                                            </TableCell>
                                            {globalCustomColumnDefinitions.map(colDef => <TableCell key={colDef.id}>{renderGlobalParticipantCustomCell(p, colDef)}</TableCell>)}
                                            <TableCell>{/* Empty cell for alignment with "Add Column" header */}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-10 text-muted-foreground">
                            <Users className="h-12 w-12 mx-auto mb-3 text-primary/30" />
                            <p>No participants match the current filters.</p>
                             { (globalSearchTerm || globalSchoolFilter !== 'all' || globalPaymentStatusFilter !== 'all' || globalEventFilter !== 'all' || activeGlobalDynamicFilters.length > 0) &&
                                <Button variant="link" onClick={() => { setGlobalSearchTerm(''); setGlobalSchoolFilter('all'); setGlobalPaymentStatusFilter('all'); setGlobalEventFilter('all'); setActiveGlobalDynamicFilters([]);}} className="mt-2">
                                Clear All Global Participant Filters
                                </Button>
                            }
                        </div>
                    )}
                </CardContent>
            </Card>
        </section>

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
                    <DialogTitle>{editingEventId ? `Edit Event: ${allPlatformEvents.find(e=>e.id === editingEventId)?.title}` : "Create New Event"}</DialogTitle>
                    <DialogDescription>
                       Fill in the details for the event. Click save when you&apos;re done.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleEventFormSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="eventTitle">Event Title</Label>
                            <Input id="eventTitle" value={currentEventForm.title} onChange={e => handleEventFormChange('title', e.target.value)} placeholder="E.g., Tech Conference 2024" required />
                        </div>
                        <div>
                            <Label htmlFor="eventSuperpowerCategory">Superpower Category</Label>
                            <Select value={currentEventForm.superpowerCategory} onValueChange={val => handleEventFormChange('superpowerCategory', val)}>
                                <SelectTrigger id="eventSuperpowerCategory"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {superpowerCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="eventShortDescription">Short Description</Label>
                        <Textarea id="eventShortDescription" value={currentEventForm.shortDescription} onChange={e => handleEventFormChange('shortDescription', e.target.value)} placeholder="A brief overview of the event (1-2 sentences)." />
                    </div>
                    <div>
                        <Label htmlFor="eventDetailedDescription">Detailed Description</Label>
                        <Textarea id="eventDetailedDescription" value={currentEventForm.detailedDescription} onChange={e => handleEventFormChange('detailedDescription', e.target.value)} placeholder="Full details about the event, rules, schedule, etc." rows={5}/>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label htmlFor="eventMainImageSrc">Main Image URL</Label>
                            <Input id="eventMainImageSrc" value={currentEventForm.mainImageSrc} onChange={e => handleEventFormChange('mainImageSrc', e.target.value)} placeholder="https://placehold.co/600x400.png" />
                        </div>
                        <div>
                            <Label htmlFor="eventMainImageAlt">Image Alt Text</Label>
                            <Input id="eventMainImageAlt" value={currentEventForm.mainImageAlt} onChange={e => handleEventFormChange('mainImageAlt', e.target.value)} placeholder="Description of image" />
                        </div>
                        <div>
                            <Label htmlFor="eventMainImageAiHint">Image AI Hint</Label>
                            <Input id="eventMainImageAiHint" value={currentEventForm.mainImageAiHint} onChange={e => handleEventFormChange('mainImageAiHint', e.target.value)} placeholder="Keywords for AI (e.g., debate conference)" />
                        </div>
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
                                <Calendar mode="single" selected={currentEventForm.eventDate ? parseISO(currentEventForm.eventDate) : undefined} onSelect={date => handleEventFormDateChange('eventDate', date)} initialFocus />
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
                                <Calendar mode="single" selected={currentEventForm.deadline ? parseISO(currentEventForm.deadline) : undefined} onSelect={date => handleEventFormDateChange('deadline', date)} initialFocus />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="eventVenue">Venue</Label>
                            <Input id="eventVenue" value={currentEventForm.venue} onChange={e => handleEventFormChange('venue', e.target.value)} placeholder="E.g., Main Auditorium" />
                        </div>
                        <div>
                            <Label htmlFor="eventStatusForm">Status</Label>
                            <Select value={currentEventForm.status} onValueChange={val => handleEventFormChange('status', val as EventStatus)}>
                                <SelectTrigger id="eventStatusForm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Planning">Planning</SelectItem>
                                    <SelectItem value="Active">Active</SelectItem>
                                    <SelectItem value="open">Open (for Reg)</SelectItem>
                                    <SelectItem value="closed">Closed (for Reg)</SelectItem>
                                    <SelectItem value="Completed">Completed</SelectItem>
                                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="eventIsTeamBased" checked={currentEventForm.isTeamBased} onCheckedChange={checked => handleEventFormChange('isTeamBased', !!checked)} />
                        <Label htmlFor="eventIsTeamBased" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Is this a Team Event?
                        </Label>
                    </div>
                    {currentEventForm.isTeamBased && (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="minTeamMembers">Min Team Members</Label>
                                <Input id="minTeamMembers" type="number" value={currentEventForm.minTeamMembers || 1} onChange={e => handleEventFormChange('minTeamMembers', parseInt(e.target.value) || 1)} />
                            </div>
                            <div>
                                <Label htmlFor="maxTeamMembers">Max Team Members</Label>
                                <Input id="maxTeamMembers" type="number" value={currentEventForm.maxTeamMembers || 1} onChange={e => handleEventFormChange('maxTeamMembers', parseInt(e.target.value) || 1)} />
                            </div>
                        </div>
                    )}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="eventOrganizers">Organizer UIDs (comma-separated)</Label>
                            <Input id="eventOrganizers" value={currentEventForm.organizers_str} onChange={e => handleEventFormChange('organizers_str', e.target.value)} placeholder="uid1, uid2, uid3" />
                        </div>
                        <div>
                            <Label htmlFor="eventRepresentatives">Event Representative UIDs (comma-separated)</Label>
                            <Input id="eventRepresentatives" value={currentEventForm.event_representatives_str} onChange={e => handleEventFormChange('event_representatives_str', e.target.value)} placeholder="uid_rep1, uid_rep2" />
                        </div>
                    </div>
                     <div>
                        <Label htmlFor="eventRegLink">Registration Link (optional external)</Label>
                        <Input id="eventRegLink" value={currentEventForm.registrationLink} onChange={e => handleEventFormChange('registrationLink', e.target.value)} placeholder="/signup?event=your-event-slug" />
                    </div>

                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                        <Button type="submit">{editingEventId ? "Save Changes" : "Create Event"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>

        {/* AlertDialog for Delete Event Confirmation */}
        <AlertDialog open={isDeleteEventConfirmOpen} onOpenChange={setIsDeleteEventConfirmOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Delete Event</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete the event &quot;{eventToDelete?.title}&quot;? This action cannot be undone. (Mock for now)
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDeleteEvent} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }
  
  // Event Representative Dashboard
  if (role === 'event_representative') {
    const assignedEvent = userProfile.assignedEventSlug ? subEventsData.find(e => e.slug === userProfile.assignedEventSlug) : null;

    return (
      <div className="space-y-8 animate-fade-in-up">
        <header className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-2 border-primary">
              <AvatarImage src={userProfile.photoURL || undefined} alt={userProfile.displayName || 'User'} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">{(userProfile.displayName || userProfile.email || 'U')[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-primary">{userProfile.displayName || "Event Representative Dashboard"}</h1>
              <p className="text-muted-foreground mt-1">{userProfile.email}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                  <span className="flex items-center gap-1"><ShieldCheck className="h-4 w-4" /> Role: <Badge variant="secondary" className="capitalize text-xs">{userProfile.role.replace('_', ' ')}</Badge></span>
                  {userProfile.department && <span className="flex items-center gap-1"><Building className="h-4 w-4" /> {userProfile.department}</span>}
              </div>
            </div>
          </div>
        </header>
        
        <Separator />

        <section id="event-summary-cards">
            <h2 className="text-2xl font-semibold text-primary mb-4">My Assigned Event Overview</h2>
            {assignedEvent ? (
                <Card className="shadow-md-soft rounded-xl overflow-hidden">
                    <div className="md:flex">
                        <div className="md:shrink-0">
                             <Image 
                                src={assignedEvent.mainImage.src} 
                                alt={assignedEvent.mainImage.alt} 
                                width={300} 
                                height={200} 
                                style={{objectFit: 'cover'}} 
                                className="h-48 w-full md:h-full md:w-64"
                                data-ai-hint={assignedEvent.mainImage.dataAiHint}
                            />
                        </div>
                        <div className="p-6 flex-grow">
                            <CardTitle className="text-2xl font-bold text-primary mb-1">{assignedEvent.title}</CardTitle>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mb-3">
                                {assignedEvent.eventDate && <span className="flex items-center"><CalendarDays className="mr-1.5 h-4 w-4" /> Date: {new Date(assignedEvent.eventDate).toLocaleDateString()}</span>}
                                <span className="flex items-center"><Clock className="mr-1.5 h-4 w-4" /> Time: (Mock) 10:00 AM</span>
                                <span className="flex items-center"><MapPin className="mr-1.5 h-4 w-4" /> Venue: {assignedEvent.venue || '(Mock) Main Auditorium'}</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-4">
                                <span className="flex items-center"><UsersRound className="mr-1.5 h-4 w-4 text-accent" /> Registered: <span className="font-semibold ml-1">{assignedEvent.registeredParticipantCount || 0}</span></span>
                                <span className="flex items-center"><ListChecks className="mr-1.5 h-4 w-4 text-accent" /> Pending Tasks: <span className="font-semibold ml-1">{myTasks.filter(t => t.status !== 'Completed').length}</span></span>
                                <div className="flex items-center col-span-full text-sm"><Info className="mr-1.5 h-4 w-4 text-accent" /> Status: <Badge variant={getEventStatusBadgeVariant(assignedEvent.status)} className="ml-1 capitalize">{assignedEvent.status || 'Planning'}</Badge></div>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-4">
                                <Button asChild variant="outline" size="sm">
                                    <Link href={`/events/${assignedEvent.slug}`}><Info className="mr-1.5 h-4 w-4" /> View Details</Link>
                                </Button>
                                <Button asChild variant="outline" size="sm">
                                    <Link href={`/organizer/events/manage/${assignedEvent.slug}/participants`}><Users className="mr-1.5 h-4 w-4" /> Manage Participants</Link>
                                </Button>
                                <Button asChild variant="default" size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                                    <Link href={`/organizer/event-tasks`}><CheckSquare className="mr-1.5 h-4 w-4" /> Manage Tasks</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>
            ) : (
                <Card className="shadow-soft rounded-xl">
                    <CardContent className="text-center py-10 text-muted-foreground">
                        <Briefcase className="h-12 w-12 mx-auto mb-3 text-primary/50" />
                        <p>No event assigned to you currently.</p>
                    </CardContent>
                </Card>
            )}
        </section>

        <Separator />
        
        {myTasks.length > 0 && (
             <section id="my-tasks">
              <Card className="shadow-md-soft rounded-xl">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-xl text-primary"><ClipboardList className="h-6 w-6"/>My Tasks</CardTitle>
                      <CardDescription>Tasks assigned to you for your event.</CardDescription>
                    </div>
                     <Button asChild variant="outline" size="sm">
                        <Link href="/organizer/event-tasks">View All My Tasks</Link>
                    </Button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm border-t pt-3">
                    <span>Due Today: <Badge variant={tasksDueToday > 0 ? "default" : "outline"} className={`${tasksDueToday > 0 ? 'bg-blue-500/10 text-blue-700 border-blue-500/30' : 'text-muted-foreground'}`}>{tasksDueToday}</Badge></span>
                    <span>Overdue: <Badge variant={overdueTasks > 0 ? "destructive" : "outline"} className={overdueTasks > 0 ? "" : "text-muted-foreground"}>{overdueTasks}</Badge></span>
                    <span>This Week: <Badge variant={tasksThisWeek > 0 ? "secondary" : "outline"} className={`${tasksThisWeek > 0 ? 'bg-purple-500/10 text-purple-700 border-purple-500/30': 'text-muted-foreground'}`}>{tasksThisWeek}</Badge></span>
                  </div>
                </CardHeader>
                <CardContent>
                  {myTasks.length > 0 ? (
                    <div className="overflow-x-auto rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/20 hover:bg-muted/30">
                            <TableHead className="w-[50px]"></TableHead>
                            <TableHead>Task</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {myTasks.slice(0, 5).map((task) => ( 
                            <TableRow key={task.id} className={`hover:bg-muted/50 transition-colors duration-150 ${task.status === 'Completed' ? 'opacity-60' : ''}`}>
                              <TableCell>
                                <Checkbox
                                  checked={task.status === 'Completed'}
                                  onCheckedChange={() => handleTaskCompletionToggle(task.id)}
                                  aria-label={`Mark task ${task.title} as ${task.status === 'Completed' ? 'incomplete' : 'complete'}`}
                                />
                              </TableCell>
                              <TableCell className="font-medium max-w-xs truncate hover:underline">
                                <Link href="/organizer/event-tasks" title={task.title}>{task.title}</Link>
                              </TableCell>
                              <TableCell className={`text-xs ${task.dueDate && isValid(parseISO(task.dueDate)) && isPast(startOfDay(parseISO(task.dueDate))) && task.status !== 'Completed' ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                                {task.dueDate && isValid(parseISO(task.dueDate)) ? format(parseISO(task.dueDate), 'MMM dd') : 'N/A'}
                              </TableCell>
                              <TableCell>
                                <Badge variant={getPriorityBadgeVariant(task.priority)} className="capitalize text-xs py-0.5 px-1.5">{task.priority}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={getStatusBadgeVariant(task.status).variant} className={`capitalize text-xs py-0.5 px-1.5 ${getStatusBadgeVariant(task.status).colorClass}`}>{task.status.replace('-', ' ')}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                     <div className="text-center py-6 text-muted-foreground">
                        <CheckSquare className="h-10 w-10 mx-auto mb-2 text-green-500" />
                        <p>Great job! You have no tasks due.</p>
                        <p className="text-xs">Check back later or view all event tasks.</p>
                      </div>
                  )}
                </CardContent>
              </Card>
            </section>
        )}

        <Separator />

        <section id="key-metrics">
            <h2 className="text-2xl font-semibold text-primary mb-4">Key Metrics at a Glance</h2>
             <Card className="shadow-soft rounded-xl">
                <CardContent className="py-6 text-muted-foreground">
                    <BarChartHorizontalBig className="h-10 w-10 mx-auto mb-3 text-primary/30" />
                    <p className="text-center">Key metrics and statistics (e.g., total registrations, task completion rate, upcoming critical deadlines) related to your assigned event will be displayed here soon.</p>
                </CardContent>
            </Card>
        </section>
        
        <Separator />

        <section id="recent-activity">
            <h2 className="text-2xl font-semibold text-primary mb-4">Recent Activity Feed</h2>
             <Card className="shadow-soft rounded-xl">
                <CardContent className="py-6 text-muted-foreground">
                    <Rss className="h-10 w-10 mx-auto mb-3 text-primary/30" />
                    <p className="text-center">A feed of recent activities (new registrations, task updates, comments) related to your event(s) will appear here.</p>
                </CardContent>
            </Card>
        </section>
      </div>
    );
  }
  
  // Default/Organizer/Admin/Test Dashboard
  let dashboardTitle = "User Dashboard";
  let quickActions: Array<{ href: string; label: string; icon: React.ElementType; disabled?: boolean;}> = [];
  
  const assignedOrganizerEvents = role === 'organizer' && userProfile.assignedEventSlugs
    ? userProfile.assignedEventSlugs.map(slug => subEventsData.find(e => e.slug === slug)?.title).filter(Boolean)
    : [];

  switch(role) {
    case 'organizer':
      dashboardTitle = "Organizer Dashboard";
      quickActions = [
        { href: '/profile', label: 'My Profile', icon: UserCircle },
        { href: '/notifications', label: 'Notifications', icon: Bell },
        { href: '/ocr-tool', label: 'Scan Forms (OCR)', icon: FileScan },
        { href: '/organizer/event-tasks', label: 'All Event Tasks', icon: ListChecks },
      ];
      break;
    case 'admin':
      dashboardTitle = "Admin Dashboard";
       quickActions = [
        { href: '/admin/tasks', label: 'Global Task Mgmt', icon: Settings},
        { href: '/organizer/events/manage', label: 'Manage All Events', icon: Briefcase }, // This link might need updating if direct event management is centralized
        { href: '/admin/users', label: 'Manage Users', icon: Users}, 
        { href: '/ocr-tool', label: 'Scan Forms (OCR)', icon: FileScan },
        { href: '/organizer/event-tasks', label: 'All Event Tasks', icon: ListChecks },
        { href: '/profile', label: 'My Profile', icon: UserCircle }, 
        { href: '/notifications', label: 'Notifications', icon: Bell },
      ];
      break;
    case 'test': 
        dashboardTitle = "Test User Dashboard";
        quickActions = [
            { href: '/profile', label: 'My Profile', icon: UserCircle },
            { href: '/notifications', label: 'Notifications', icon: Bell },
            { href: '/events', label: 'Browse Events', icon: Search },
            { href: '/ocr-tool', label: 'OCR Tool (Test)', icon: FileScan },
            { href: '/organizer/event-tasks', label: 'All Event Tasks', icon: ListChecks },
        ];
        break;
    default:
      dashboardTitle = "User Dashboard";
  }


  return ( 
    <div className="space-y-8 animate-fade-in-up">
      <header className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div className="flex items-center gap-4">
           <Avatar className="h-20 w-20 border-2 border-primary">
            <AvatarImage src={userProfile.photoURL || undefined} alt={userProfile.displayName || 'User'} />
            <AvatarFallback className="text-2xl bg-primary/10 text-primary">{(userProfile.displayName || userProfile.email || 'U')[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary">{userProfile.displayName || dashboardTitle}</h1>
            <p className="text-muted-foreground mt-1">{userProfile.email}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1"><ShieldCheck className="h-4 w-4" /> Role: <Badge variant="secondary" className="capitalize text-xs">{userProfile.role.replace('_', ' ')}</Badge></span>
                {userProfile.department && <span className="flex items-center gap-1"><Building className="h-4 w-4" /> {userProfile.department}</span>}
            </div>
          </div>
        </div>
        {(role === 'organizer' || role === 'overall_head' || role === 'admin') && userProfile.role !== 'overall_head' && ( // OH has its own Create Event Button
          <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground mt-4 md:mt-0 rounded-lg shadow-soft">
            <Link href="/organizer/events/create">Create New Event (Legacy)</Link>
          </Button>
        )}
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {userProfile.points !== undefined && (
            <Card className="shadow-soft rounded-xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">My Points</CardTitle>
                    <Award className="h-5 w-5 text-yellow-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">{userProfile.points}</div>
                </CardContent>
            </Card>
        )}
        {userProfile.credibilityScore !== undefined && (
            <Card className="shadow-soft rounded-xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Credibility Score</CardTitle>
                    <Activity className="h-5 w-5 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">{userProfile.credibilityScore}%</div>
                </CardContent>
            </Card>
        )}
         {(myTasks.length > 0 || role === 'event_representative') && ( 
            <Card className="shadow-soft rounded-xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Pending Tasks</CardTitle>
                    <ClipboardList className="h-5 w-5 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{myTasks.filter(t => t.status === 'Pending Review' || t.status === 'In Progress' || t.status === 'Not Started').length}</div>
                </CardContent>
            </Card>
        )}
      </section>
      
      {role === 'organizer' && assignedOrganizerEvents.length > 0 && (
        <Card className="shadow-md-soft rounded-xl">
            <CardHeader>
                <CardTitle className="text-xl text-primary">My Assigned Events</CardTitle>
                <CardDescription>Events you are contributing to.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                {assignedOrganizerEvents.map(title => (
                    <Badge key={title} variant="secondary" className="mr-2 mb-1 px-3 py-1 rounded-md">{title}</Badge>
                ))}
                <Button asChild variant="link" className="text-xs p-0 h-auto mt-2"><Link href="/organizer/events/manage">Manage My Events</Link></Button>
            </CardContent>
        </Card>
      )}


      {myTasks.length > 0 && (
        <section id="my-tasks">
          <Card className="shadow-md-soft rounded-xl">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                    <CardTitle className="flex items-center gap-2 text-xl text-primary"><ClipboardList className="h-6 w-6"/>My Tasks</CardTitle>
                    <CardDescription>Overview of tasks assigned to you.</CardDescription>
                </div>
                <Button asChild variant="outline" size="sm">
                    <Link href="/organizer/event-tasks">View All My Tasks</Link>
                </Button>
              </div>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm border-t pt-3">
                <span>Due Today: <Badge variant={tasksDueToday > 0 ? "default" : "outline"} className={`${tasksDueToday > 0 ? 'bg-blue-500/10 text-blue-700 border-blue-500/30' : 'text-muted-foreground'}` }>{tasksDueToday}</Badge></span>
                <span>Overdue: <Badge variant={overdueTasks > 0 ? "destructive" : "outline"} className={overdueTasks > 0 ? "" : "text-muted-foreground"}>{overdueTasks}</Badge></span>
                <span>This Week: <Badge variant={tasksThisWeek > 0 ? "secondary" : "outline"} className={`${tasksThisWeek > 0 ? 'bg-purple-500/10 text-purple-700 border-purple-500/30': 'text-muted-foreground'}`}>{tasksThisWeek}</Badge></span>
              </div>
            </CardHeader>
            <CardContent>
              {myTasks.length > 0 ? (
                 <div className="overflow-x-auto rounded-md border">
                    <Table>
                        <TableHeader>
                        <TableRow className="bg-muted/20 hover:bg-muted/30">
                            <TableHead className="w-[50px]"></TableHead>
                            <TableHead>Task</TableHead>
                            <TableHead className="w-[100px]">Event</TableHead>
                            <TableHead className="w-[100px]">Due</TableHead>
                            <TableHead className="w-[100px]">Priority</TableHead>
                            <TableHead className="w-[120px]">Status</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {myTasks.slice(0, 7).map((task) => ( 
                            <TableRow 
                                key={task.id} 
                                className={`hover:bg-muted/50 transition-colors duration-150 ${task.status === 'Completed' ? 'opacity-60' : ''}`}
                            >
                            <TableCell>
                                <Checkbox
                                checked={task.status === 'Completed'}
                                onCheckedChange={() => handleTaskCompletionToggle(task.id)}
                                aria-label={`Mark task ${task.title} as ${task.status === 'Completed' ? 'incomplete' : 'complete'}`}
                                />
                            </TableCell>
                            <TableCell className="font-medium max-w-[200px] sm:max-w-xs md:max-w-sm truncate">
                                <Link href="/organizer/event-tasks" title={task.title} className="hover:underline">{task.title}</Link>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                                <Badge variant="outline" className="text-xs">{task.eventSlug ? subEventsData.find(e => e.slug === task.eventSlug)?.title || task.eventSlug : 'General'}</Badge>
                            </TableCell>
                            <TableCell 
                                className={`text-xs ${task.dueDate && isValid(parseISO(task.dueDate)) && isPast(startOfDay(parseISO(task.dueDate))) && task.status !== 'Completed' ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}
                            >
                                {task.dueDate && isValid(parseISO(task.dueDate)) ? format(parseISO(task.dueDate), 'MMM dd') : 'N/A'}
                            </TableCell>
                            <TableCell>
                                <Badge variant={getPriorityBadgeVariant(task.priority)} className="capitalize text-xs py-0.5 px-1.5">{task.priority}</Badge>
                            </TableCell>
                            <TableCell>
                                <Badge variant={getStatusBadgeVariant(task.status).variant} className={`capitalize text-xs py-0.5 px-1.5 ${getStatusBadgeVariant(task.status).colorClass}`}>{task.status.replace('-', ' ')}</Badge>
                            </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                 </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <CheckSquare className="h-10 w-10 mx-auto mb-2 text-green-500" />
                  <p>Great job! You have no tasks assigned.</p>
                  <p className="text-xs">Check back later or view all event tasks.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      <section>
        <Card className="shadow-md-soft rounded-xl">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Access common tasks quickly.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {quickActions.map(action => (
              <Button variant="outline" asChild key={action.href} disabled={action.disabled} className="rounded-md">
                <Link href={action.href} className="flex items-center justify-center gap-2 text-sm">
                  <action.icon className="h-4 w-4" /> {action.label}
                </Link>
              </Button>
            ))}
             {(role === 'admin' || role === 'overall_head') && (
              <Button variant="outline" asChild className="rounded-md">
                <Link href="/admin/users" className="flex items-center justify-center gap-2 text-sm">
                  <Users className="h-4 w-4" /> Manage Users
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </section>
      
      {(role === 'organizer' || role === 'overall_head' || role === 'admin') && (
         <section>
          <Card className="shadow-md-soft rounded-xl">
              <CardHeader>
                  <CardTitle>Upcoming Events Overview (Mock)</CardTitle>
                  <CardDescription>A quick look at events you are managing.</CardDescription>
              </CardHeader>
              <CardContent>
                  <p className="text-muted-foreground">Chart or list of upcoming events will be displayed here.</p>
                  <div className="mt-4 h-64 bg-muted/50 rounded-lg flex items-center justify-center">
                      <BarChartBig className="h-16 w-16 text-muted-foreground/50" />
                  </div>
              </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}

    