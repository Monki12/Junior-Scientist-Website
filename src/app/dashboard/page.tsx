
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { subEventsData } from '@/data/subEvents';
import type { UserRole, SubEvent, Task, RegisteredEventInfo, UserProfileData, EventParticipant } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from "@/components/ui/table";
import { format, isToday, isPast, isThisWeek, startOfDay, parseISO, isValid } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2, BarChartBig, Edit, Users, FileScan, Settings, BookUser, ListChecks, CalendarDays, UserCircle, Bell, GraduationCap, School, Download, Info, Briefcase, Newspaper, Award, Star, CheckCircle, ClipboardList, TrendingUp, Building, Activity, ShieldCheck, ExternalLink, Home, Search, CalendarCheck, Ticket, Users2, Phone, Mail, Milestone, MapPin, Clock, UsersRound, CheckSquare, BarChartHorizontalBig, Rss, AlertTriangle, Filter as FilterIcon
} from 'lucide-react';

interface RegisteredEventDisplay extends SubEvent {
  teamName?: string;
  teamMembers?: { id: string, name: string, role?: string }[];
  admitCardStatus?: 'published' | 'pending' | 'unavailable';
}


// Helper function to determine badge variant for task priority
const getPriorityBadgeVariant = (priority: Task['priority']): "destructive" | "secondary" | "outline" => {
  if (priority === 'High') return 'destructive';
  if (priority === 'Medium') return 'secondary';
  return 'outline';
};

// Helper function to determine badge variant for task status
const getStatusBadgeVariant = (status: Task['status']): { variant: "default" | "secondary" | "outline" | "destructive", colorClass: string } => {
  switch (status) {
    case 'Completed': return { variant: 'default', colorClass: 'bg-green-500/10 border-green-500/30 text-green-700 dark:bg-green-700/20 dark:text-green-300' };
    case 'In Progress': return { variant: 'secondary', colorClass: 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:bg-blue-700/20 dark:text-blue-300' };
    case 'Pending Review': return { variant: 'outline', colorClass: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:bg-yellow-700/20 dark:text-yellow-300' };
    case 'Not Started': return { variant: 'outline', colorClass: 'bg-slate-500/10 border-slate-500/30 text-slate-700 dark:bg-slate-700/20 dark:text-slate-300' };
    default: return { variant: 'outline', colorClass: 'bg-muted text-muted-foreground border-border' };
  }
};


export default function DashboardPage() {
  const { authUser, userProfile, setUserProfile, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [localUserProfileTasks, setLocalUserProfileTasks] = useState<Task[]>([]);

  // State for Overall Head's Global Participant View
  const [globalParticipants, setGlobalParticipants] = useState<EventParticipant[]>([]);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [globalSchoolFilter, setGlobalSchoolFilter] = useState('all');
  const [globalPaymentStatusFilter, setGlobalPaymentStatusFilter] = useState('all');
  const [globalEventFilter, setGlobalEventFilter] = useState('all');


  useEffect(() => {
    if (!loading && !authUser) {
      router.push('/login?redirect=/dashboard');
    }
    if (userProfile) {
      setLocalUserProfileTasks(userProfile.tasks || []);
      if (userProfile.role === 'overall_head' && userProfile.allPlatformParticipants) {
        setGlobalParticipants(userProfile.allPlatformParticipants);
      }
    } else {
      setLocalUserProfileTasks([]); 
      setGlobalParticipants([]);
    }
  }, [authUser, userProfile, loading, router]);


  const handleTaskCompletionToggle = (taskId: string) => {
    if (!setUserProfile || !userProfile) return;

    const updatedTasks = localUserProfileTasks.map(task =>
      task.id === taskId
        ? { ...task, status: task.status === 'Completed' ? 'In Progress' : 'Completed' as Task['status'], updatedAt: new Date().toISOString() }
        : task
    );
    setLocalUserProfileTasks(updatedTasks);

    setUserProfile(prevProfile => {
      if (!prevProfile) return null;
      return { ...prevProfile, tasks: updatedTasks };
    });
  };

  // Filter tasks assigned to the current user for the "My Tasks" section
  const myTasks = useMemo(() => {
    if (userProfile?.displayName) {
      return localUserProfileTasks.filter(task => task.assignedTo?.includes(userProfile.displayName!));
    }
    return [];
  }, [localUserProfileTasks, userProfile?.displayName]);

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

      return matchesSearch && matchesSchool && matchesPaymentStatus && matchesEvent;
    });
  }, [globalParticipants, globalSearchTerm, globalSchoolFilter, globalPaymentStatusFilter, globalEventFilter]);


  if (loading || !authUser || !userProfile) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const role: UserRole = userProfile.role;

  // Student Dashboard
  if (role === 'student' || (role === 'test' && myTasks.length === 0)) {
    const studentRegisteredFullEvents: RegisteredEventDisplay[] = userProfile.registeredEvents
      ?.map(registeredInfo => {
        const eventDetail = subEventsData.find(event => event.slug === registeredInfo.eventSlug);
        if (eventDetail) {
          return { 
            ...eventDetail, 
            teamName: registeredInfo.teamName, 
            teamMembers: registeredInfo.teamMembers,
            admitCardStatus: registeredInfo.admitCardStatus,
          };
        }
        return null; 
      })
      .filter(event => event !== null) as RegisteredEventDisplay[] || [];

    return (
      <div className="space-y-10 animate-fade-in-up">
        <Card className="shadow-md-soft rounded-xl overflow-hidden">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6 bg-gradient-to-br from-primary/5 via-background to-background">
            <Avatar className="h-24 w-24 text-3xl border-2 border-primary shadow-md shrink-0">
              <AvatarImage src={userProfile.photoURL || undefined} alt={userProfile.displayName || 'Student'} />
              <AvatarFallback className="bg-primary/10 text-primary">{(userProfile.displayName || userProfile.email || 'S')[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="space-y-1 text-center sm:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-primary">{userProfile.displayName || 'Student Dashboard'}</h1>
              <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5"><Mail className="h-4 w-4"/>{userProfile.email}</p>
              <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5"><ShieldCheck className="h-4 w-4"/>UID: {userProfile.uid}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1 justify-center sm:justify-start">
                {userProfile.school && ( <p className="flex items-center gap-1.5"><School className="h-4 w-4" /> {userProfile.school}</p>)}
                {userProfile.grade && ( <p className="flex items-center gap-1.5"><GraduationCap className="h-4 w-4" /> {userProfile.grade}</p>)}
              </div>
              {userProfile.phoneNumbers && userProfile.phoneNumbers.length > 0 && (
                 <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1 justify-center sm:justify-start">
                    {userProfile.phoneNumbers.map(num => (
                         <p key={num} className="flex items-center gap-1.5"><Phone className="h-4 w-4" /> {num}</p>
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
          {studentRegisteredFullEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {studentRegisteredFullEvents.map(event => (
                <Card key={event.id} className="overflow-hidden shadow-soft hover:shadow-md-soft transition-shadow rounded-xl flex flex-col">
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
                    </CardHeader>
                    <CardContent className="pt-0 flex-grow">
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{event.shortDescription}</p>
                      {event.isTeamEvent && event.teamName && (
                        <div className="mt-2">
                          <p className="text-xs text-accent font-semibold flex items-center gap-1"><Users className="h-4 w-4"/>Team: {event.teamName}</p>
                          {event.teamMembers && event.teamMembers.length > 0 && (
                            <ul className="text-xs text-muted-foreground list-disc list-inside pl-1">
                              {event.teamMembers.map(member => <li key={member.id || member.name}>{member.name}</li>)}
                            </ul>
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
          {studentRegisteredFullEvents.length > 0 ? (
             <div className="space-y-4">
                {studentRegisteredFullEvents.map(event => (
                    <Card key={`admit-${event.id}`} className="shadow-soft rounded-xl">
                        <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-center gap-3">
                            <div>
                                <h3 className="font-semibold text-foreground">{event.title}</h3>
                                <p className="text-sm text-muted-foreground">Event Date: {event.eventDate ? new Date(event.eventDate).toLocaleDateString() : 'TBA'}</p>
                            </div>
                            {event.admitCardStatus === 'published' ? (
                                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-md shadow-sm">
                                    <Download className="mr-2 h-4 w-4" /> Download Admit Card
                                </Button>
                            ) : (
                                <Badge variant={event.admitCardStatus === 'pending' ? 'secondary': 'outline'} className="text-xs py-1 px-2">
                                    {event.admitCardStatus === 'pending' ? 'Admit Card Generation Pending' : 'Admit Card Not Available Yet'}
                                </Badge>
                            )}
                        </CardContent>
                    </Card>
                ))}
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
                    <p>Team management features are coming soon!</p>
                    <p className="text-sm">You'll be able to view team details, invite members, and more.</p>
                </CardContent>
            </Card>
        </section>
      </div>
    );
  }

  if (role === 'overall_head') {
    // Overall Head Dashboard
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
                  <p className="flex items-center gap-1"><ShieldCheck className="h-4 w-4" /> Role: <span className="font-medium text-foreground capitalize">{userProfile.role.replace('_', ' ')}</span></p>
                  {userProfile.department && <p className="flex items-center gap-1"><Building className="h-4 w-4" /> {userProfile.department}</p>}
              </div>
            </div>
          </div>
          <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground mt-4 md:mt-0 rounded-lg shadow-soft">
              <Link href="/organizer/events/create">Create New Event</Link>
          </Button>
        </header>

        {/* My Tasks Section for Overall Head */}
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
                <span>Due Today: <Badge variant={tasksDueToday > 0 ? "default" : "outline"} className={`${tasksDueToday > 0 ? 'bg-blue-500/10 text-blue-700 border-blue-500/30' : ''}` }>{tasksDueToday}</Badge></span>
                <span>Overdue: <Badge variant={overdueTasks > 0 ? "destructive" : "outline"} className={overdueTasks > 0 ? "" : "text-muted-foreground"}>{overdueTasks}</Badge></span>
                <span>This Week: <Badge variant={tasksThisWeek > 0 ? "secondary" : "outline"} className={`${tasksThisWeek > 0 ? 'bg-purple-500/10 text-purple-700 border-purple-500/30': ''}`}>{tasksThisWeek}</Badge></span>
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
        
        <Separator />

        {/* Global Participant Management Section */}
        <section id="global-participants">
            <Card className="shadow-md-soft rounded-xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl text-primary"><Users2 className="h-7 w-7"/>All Platform Participants</CardTitle>
                    <CardDescription>View and manage participants across all events.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search name, email, school..." value={globalSearchTerm} onChange={e => setGlobalSearchTerm(e.target.value)} className="pl-9" />
                        </div>
                        <Select value={globalSchoolFilter} onValueChange={setGlobalSchoolFilter}>
                            <SelectTrigger><SelectValue placeholder="Filter by school..." /></SelectTrigger>
                            <SelectContent>
                                {uniqueGlobalSchoolNames.map(school => <SelectItem key={school} value={school}>{school === 'all' ? 'All Schools' : school}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={globalPaymentStatusFilter} onValueChange={setGlobalPaymentStatusFilter}>
                            <SelectTrigger><SelectValue placeholder="Filter by payment status..." /></SelectTrigger>
                            <SelectContent>
                                {globalPaymentStatuses.map(status => <SelectItem key={status} value={status}>{status === 'all' ? 'All Statuses' : status.charAt(0).toUpperCase() + status.slice(1)}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={globalEventFilter} onValueChange={setGlobalEventFilter}>
                            <SelectTrigger><SelectValue placeholder="Filter by event..." /></SelectTrigger>
                            <SelectContent>
                                {allEventSlugsAndTitles.map(event => <SelectItem key={event.slug} value={event.slug}>{event.title}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        {/* Placeholder for Add Dynamic Filter */}
                        <Button variant="outline" disabled><FilterIcon className="mr-2 h-4 w-4"/>Add Dynamic Filter (Soon)</Button>
                    </div>

                    {/* Active Filters Display (basic) */}
                    {(globalSearchTerm || globalSchoolFilter !== 'all' || globalPaymentStatusFilter !== 'all' || globalEventFilter !== 'all') && (
                        <div className="text-xs text-muted-foreground">
                            Active Filters: 
                            {globalSearchTerm && <span className="ml-1">Search: "{globalSearchTerm}"</span>}
                            {globalSchoolFilter !== 'all' && <span className="ml-1">School: {globalSchoolFilter}</span>}
                            {globalPaymentStatusFilter !== 'all' && <span className="ml-1">Payment: {globalPaymentStatusFilter}</span>}
                            {globalEventFilter !== 'all' && <span className="ml-1">Event: {subEventsData.find(e => e.slug === globalEventFilter)?.title || globalEventFilter}</span>}
                        </div>
                    )}

                    {/* Placeholder for Global Stats */}
                    <Card className="bg-muted/30">
                        <CardContent className="py-4 text-center text-muted-foreground">
                            <BarChartBig className="h-10 w-10 mx-auto mb-2 text-primary/30"/>
                            Global Participant Statistics (Total: {filteredGlobalParticipants.length}) - Charts coming soon.
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
                                                {p.registeredEventSlugs && p.registeredEventSlugs.map(slug => {
                                                    const eventTitle = subEventsData.find(e => e.slug === slug)?.title || slug;
                                                    return (
                                                        <Badge 
                                                            key={slug} 
                                                            variant="secondary" 
                                                            className="mr-1 mb-1 cursor-pointer hover:bg-primary/20"
                                                            onClick={() => toast({ title: `Drill-down to ${eventTitle}`, description: "Functionality coming soon!"})}
                                                        >
                                                            {eventTitle}
                                                        </Badge>
                                                    );
                                                })}
                                                {(!p.registeredEventSlugs || p.registeredEventSlugs.length === 0) && <span className="text-xs text-muted-foreground">None</span>}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-10 text-muted-foreground">
                            <Users className="h-12 w-12 mx-auto mb-3 text-primary/30" />
                            <p>No participants match the current filters.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </section>

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
                                {assignedEvent.eventDate && <p className="flex items-center"><CalendarDays className="mr-1.5 h-4 w-4" /> Date: {new Date(assignedEvent.eventDate).toLocaleDateString()}</p>}
                                <p className="flex items-center"><Clock className="mr-1.5 h-4 w-4" /> Time: (Mock) 10:00 AM</p>
                                <p className="flex items-center"><MapPin className="mr-1.5 h-4 w-4" /> Venue: (Mock) Main Auditorium</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-4">
                                <p className="flex items-center"><UsersRound className="mr-1.5 h-4 w-4 text-accent" /> Registered: <span className="font-semibold ml-1">57</span></p>
                                <p className="flex items-center"><ListChecks className="mr-1.5 h-4 w-4 text-accent" /> Pending Tasks: <span className="font-semibold ml-1">{myTasks.filter(t => t.status !== 'Completed').length}</span></p>
                                <div className="flex items-center col-span-full text-sm"><Info className="mr-1.5 h-4 w-4 text-accent" /> Status: <Badge variant="secondary" className="ml-1">Planning</Badge></div>
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
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
                    <span>Due Today: <Badge variant={tasksDueToday > 0 ? "default" : "outline"} className={`${tasksDueToday > 0 ? 'bg-blue-500/10 text-blue-700 border-blue-500/30' : ''}`}>{tasksDueToday}</Badge></span>
                    <span>Overdue: <Badge variant={overdueTasks > 0 ? "destructive" : "outline"} className={overdueTasks > 0 ? "" : "text-muted-foreground"}>{overdueTasks}</Badge></span>
                    <span>This Week: <Badge variant={tasksThisWeek > 0 ? "secondary" : "outline"} className={`${tasksThisWeek > 0 ? 'bg-purple-500/10 text-purple-700 border-purple-500/30' : ''}`}>{tasksThisWeek}</Badge></span>
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
  let quickActions = [];
  
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
    // case 'overall_head': -- Handled above
    //   dashboardTitle = "Overall Head Dashboard";
    //    quickActions = [ /* ... */ ];
    //   break;
    case 'admin':
      dashboardTitle = "Admin Dashboard";
       quickActions = [
        { href: '/admin/tasks', label: 'Global Task Mgmt', icon: Settings},
        { href: '/organizer/events/manage', label: 'Manage All Events', icon: Briefcase }, 
        { href: '/organizer/registrations', label: 'View Registrations', icon: Users }, 
        { href: '/admin/users', label: 'Manage Users', icon: Users}, 
        { href: '/ocr-tool', label: 'Scan Forms (OCR)', icon: FileScan },
        { href: '/organizer/event-tasks', label: 'All Event Tasks', icon: ListChecks },
        { href: '/profile', label: 'My Profile', icon: UserCircle }, 
        { href: '/notifications', label: 'Notifications', icon: Bell },
      ];
      break;
    case 'test': // Test user with tasks sees this dashboard
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
        {(role === 'organizer' || role === 'overall_head' || role === 'admin') && (
          <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground mt-4 md:mt-0 rounded-lg shadow-soft">
            <Link href="/organizer/events/create">Create New Event</Link>
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
                <span>Due Today: <Badge variant={tasksDueToday > 0 ? "default" : "outline"} className={`${tasksDueToday > 0 ? 'bg-blue-500/10 text-blue-700 border-blue-500/30' : ''}` }>{tasksDueToday}</Badge></span>
                <span>Overdue: <Badge variant={overdueTasks > 0 ? "destructive" : "outline"} className={overdueTasks > 0 ? "" : "text-muted-foreground"}>{overdueTasks}</Badge></span>
                <span>This Week: <Badge variant={tasksThisWeek > 0 ? "secondary" : "outline"} className={`${tasksThisWeek > 0 ? 'bg-purple-500/10 text-purple-700 border-purple-500/30': ''}`}>{tasksThisWeek}</Badge></span>
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
              <Button variant="outline" asChild key={action.href} disabled={(action as any).disabled} className="rounded-md">
                <Link href={action.href} className="flex items-center justify-center gap-2 text-sm">
                  <action.icon className="h-4 w-4" /> {action.label}
                </Link>
              </Button>
            ))}
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

    

