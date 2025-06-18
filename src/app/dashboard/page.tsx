
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { subEventsData } from '@/data/subEvents';
import type { UserRole, SubEvent, Task, RegisteredEventInfo } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Loader2, BarChartBig, Edit, Users, FileScan, Settings, BookUser, ListChecks, CalendarDays, UserCircle, Bell, GraduationCap, School, Download, Info, Briefcase, Newspaper, Award, Star, CheckCircle, ClipboardList, TrendingUp, Building, Activity, ShieldCheck, ExternalLink, Home, Search, CalendarCheck, Ticket, Users2, Phone, Mail, Milestone, MapPin, Clock, UsersRound, CheckSquare, BarChartHorizontalBig, Rss
} from 'lucide-react';

interface RegisteredEventDisplay extends SubEvent {
  teamName?: string;
  teamMembers?: { id: string, name: string, role?: string }[];
  admitCardStatus?: 'published' | 'pending' | 'unavailable';
}

function TaskCard({ task }: { task: Task }) {
  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/30';
      case 'in-progress': return 'bg-blue-500/10 text-blue-700 border-blue-500/30';
      case 'completed': return 'bg-green-500/10 text-green-700 border-green-500/30';
      case 'overdue': return 'bg-red-500/10 text-red-700 border-red-500/30';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };
  return (
    <Card className={`shadow-soft hover:shadow-md-soft transition-shadow rounded-lg ${getStatusColor(task.status)}`}>
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex justify-between items-start">
          <CardTitle className="text-md font-semibold line-clamp-1">{task.title}</CardTitle>
          <Badge variant="outline" className={`text-xs ${getStatusColor(task.status)} border-current capitalize`}>{task.status.replace('-', ' ')}</Badge>
        </div>
        {task.eventSlug && (
          <CardDescription className="text-xs">Event: {subEventsData.find(e => e.slug === task.eventSlug)?.title || task.eventSlug}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="px-4 pb-3 pt-1">
        <p className="text-xs text-muted-foreground line-clamp-2 mb-1">{task.description}</p>
        {task.deadline && <p className="text-xs">Deadline: {new Date(task.deadline).toLocaleDateString()}</p>}
        {task.points && <p className="text-xs">Points: {task.points}</p>}
         {task.assignedByName && <p className="text-xs mt-1 text-muted-foreground/80">Assigned by: {task.assignedByName}</p>}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { authUser, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !authUser) {
      router.push('/login?redirect=/dashboard');
    }
  }, [authUser, loading, router]);

  if (loading || !authUser || !userProfile) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const role: UserRole = userProfile.role;

  // Student Dashboard
  if (role === 'student' || role === 'test') {
    const studentRegisteredFullEvents: RegisteredEventDisplay[] = userProfile.registeredEvents
      ?.map(registeredInfo => {
        const eventDetail = subEventsData.find(event => event.slug === registeredInfo.eventSlug);
        if (eventDetail) {
          return { 
            ...eventDetail, 
            teamName: registeredInfo.teamName, 
            teamMembers: registeredInfo.teamMembers,
            admitCardStatus: registeredInfo.admitCardStatus,
            // eventDate is already on subEventData, but if we need to override from registration:
            // eventDate: registeredInfo.eventDate || eventDetail.eventDate 
          };
        }
        return null; 
      })
      .filter(event => event !== null) as RegisteredEventDisplay[] || [];

    return (
      <div className="space-y-10 animate-fade-in-up">
        {/* Student Identity Section */}
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

        {/* My Registered Events Section */}
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
        
        {/* Admit Card Section */}
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

        {/* Teams Section Placeholder */}
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

         <Separator />

        { (userProfile.role === 'test' && userProfile.tasks && userProfile.tasks.length > 0) && (
            <section>
            <Card className="shadow-lg rounded-xl">
                <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl"><ClipboardList className="h-5 w-5 text-primary"/>My Tasks (Test User)</CardTitle>
                <CardDescription>Tasks assigned to you for testing purposes.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                {userProfile.tasks.map(task => <TaskCard key={task.id} task={task} />)}
                </CardContent>
            </Card>
            </section>
        )}
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
                  <p className="flex items-center gap-1"><ShieldCheck className="h-4 w-4" /> Role: <span className="font-medium text-foreground capitalize">Event Representative</span></p>
                  {userProfile.department && <p className="flex items-center gap-1"><Building className="h-4 w-4" /> {userProfile.department}</p>}
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
                                <p className="flex items-center"><ListChecks className="mr-1.5 h-4 w-4 text-accent" /> Pending Tasks: <span className="font-semibold ml-1">3</span></p>
                                <p className="flex items-center col-span-full"><Info className="mr-1.5 h-4 w-4 text-accent" /> Status: <Badge variant="secondary" className="ml-1">Planning</Badge></p>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-4">
                                <Button asChild variant="outline" size="sm">
                                    <Link href={`/events/${assignedEvent.slug}`}><Info className="mr-1.5 h-4 w-4" /> View Details</Link>
                                </Button>
                                <Button variant="outline" size="sm" disabled> {/* Placeholder until page is built */}
                                    <Users className="mr-1.5 h-4 w-4" /> Manage Participants
                                </Button>
                                <Button asChild variant="outline" size="sm">
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

        <section id="key-metrics">
            <h2 className="text-2xl font-semibold text-primary mb-4">Key Metrics at a Glance</h2>
             <Card className="shadow-soft rounded-xl">
                <CardContent className="py-6 text-muted-foreground">
                    <BarChartHorizontalBig className="h-10 w-10 mx-auto mb-3 text-primary/30" />
                    <p className="text-center">Key metrics and statistics (e.g., total registrations, task completion rate, upcoming critical deadlines) will be displayed here soon.</p>
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
        
        {userProfile.tasks && userProfile.tasks.length > 0 && (
          <section>
            <Card className="shadow-md-soft rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl"><ClipboardList className="h-5 w-5 text-primary"/>My Tasks</CardTitle>
                <CardDescription>Tasks assigned to you. Click to see details (feature coming soon).</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userProfile.tasks.map(task => <TaskCard key={task.id} task={task} />)}
              </CardContent>
            </Card>
          </section>
        )}

      </div>
    );
  }
  
  // Organizer, Overall Head, Admin Dashboards
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
      ];
      break;
    case 'overall_head':
      dashboardTitle = "Overall Head Dashboard";
       quickActions = [
        { href: '/admin/tasks', label: 'Global Task Mgmt', icon: Settings},
        { href: '/organizer/events/manage', label: 'Manage All Events', icon: Briefcase }, 
        { href: '/organizer/registrations', label: 'View Registrations', icon: Users }, 
        { href: '/ocr-tool', label: 'Scan Forms (OCR)', icon: FileScan },
        { href: '/profile', label: 'My Profile', icon: UserCircle }, 
        { href: '/notifications', label: 'Notifications', icon: Bell },
      ];
      break;
    case 'admin':
      dashboardTitle = "Admin Dashboard";
       quickActions = [
        { href: '/admin/tasks', label: 'Global Task Mgmt', icon: Settings},
        { href: '/organizer/events/manage', label: 'Manage All Events', icon: Briefcase }, 
        { href: '/organizer/registrations', label: 'View Registrations', icon: Users }, 
        { href: '/admin/users', label: 'Manage Users', icon: Users}, // Corrected icon to Users
        { href: '/ocr-tool', label: 'Scan Forms (OCR)', icon: FileScan },
        { href: '/profile', label: 'My Profile', icon: UserCircle }, 
        { href: '/notifications', label: 'Notifications', icon: Bell },
      ];
      break;
    default:
      // Should not reach here for ER, but good fallback
      dashboardTitle = "User Dashboard";
  }


  return ( // Fallback for Organizer, Overall Head, Admin
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
                <p className="flex items-center gap-1"><ShieldCheck className="h-4 w-4" /> Role: <span className="font-medium text-foreground capitalize">{userProfile.role.replace('_', ' ')}</span></p>
                {userProfile.department && <p className="flex items-center gap-1"><Building className="h-4 w-4" /> {userProfile.department}</p>}
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
         {(userProfile.tasks && userProfile.tasks.length > 0) && (
            <Card className="shadow-soft rounded-xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Pending Tasks</CardTitle>
                    <ClipboardList className="h-5 w-5 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{userProfile.tasks.filter(t => t.status === 'pending' || t.status === 'in-progress').length}</div>
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


      {userProfile.tasks && userProfile.tasks.length > 0 && (
        <section>
          <Card className="shadow-md-soft rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl"><ClipboardList className="h-5 w-5 text-primary"/>My Tasks</CardTitle>
              <CardDescription>Tasks assigned to you. Click to see details (feature coming soon).</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userProfile.tasks.map(task => <TaskCard key={task.id} task={task} />)}
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

