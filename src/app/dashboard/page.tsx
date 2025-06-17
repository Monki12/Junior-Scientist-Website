
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { subEventsData } from '@/data/subEvents';
import type { UserRole, SubEvent, Task } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  BarChartBig,
  Edit,
  Users,
  FileScan,
  Settings,
  BookUser,
  ListChecks,
  CalendarDays,
  UserCircle,
  Bell,
  GraduationCap,
  School,
  Download,
  Info,
  Briefcase,
  Newspaper,
  Award,
  Star,
  CheckCircle,
  ClipboardList,
  TrendingUp,
  Building, // Department Icon
  Activity, // Credibility Score Icon
  ShieldCheck // Points Icon
} from 'lucide-react';

interface RegisteredEventDisplay extends SubEvent {
  teamName?: string;
}

function TaskCard({ task }: { task: Task }) {
  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30';
      case 'in-progress': return 'bg-blue-500/10 text-blue-600 border-blue-500/30';
      case 'completed': return 'bg-green-500/10 text-green-600 border-green-500/30';
      case 'overdue': return 'bg-red-500/10 text-red-600 border-red-500/30';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };
  return (
    <Card className={`shadow-md hover:shadow-lg transition-shadow ${getStatusColor(task.status)}`}>
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex justify-between items-start">
          <CardTitle className="text-md line-clamp-1">{task.title}</CardTitle>
          <Badge variant="outline" className={`text-xs ${getStatusColor(task.status)} border-current`}>{task.status}</Badge>
        </div>
        {task.eventSlug && (
          <CardDescription className="text-xs">Event: {subEventsData.find(e => e.slug === task.eventSlug)?.title || task.eventSlug}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="px-4 pb-3 pt-1">
        <p className="text-xs text-muted-foreground line-clamp-2 mb-1">{task.description}</p>
        {task.deadline && <p className="text-xs">Deadline: {new Date(task.deadline).toLocaleDateString()}</p>}
        {task.points && <p className="text-xs">Points: {task.points}</p>}
         {task.assignedByName && <p className="text-xs mt-1">Assigned by: {task.assignedByName}</p>}
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
          return { ...eventDetail, teamName: registeredInfo.teamName };
        }
        return null; 
      })
      .filter(event => event !== null) as RegisteredEventDisplay[] || [];

    return (
      <div className="space-y-8 animate-fade-in-up">
        <header className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-2 border-primary">
              <AvatarImage src={userProfile.photoURL || undefined} alt={userProfile.displayName || 'Student'} />
              <AvatarFallback className="text-2xl">{(userProfile.displayName || userProfile.email || 'S')[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-primary">{userProfile.displayName || 'Student Dashboard'}</h1>
              <p className="text-muted-foreground mt-1">{userProfile.email}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                {userProfile.school && ( <p className="flex items-center gap-1"><School className="h-4 w-4" /> {userProfile.school}</p>)}
                {userProfile.grade && ( <p className="flex items-center gap-1"><GraduationCap className="h-4 w-4" /> {userProfile.grade}</p>)}
              </div>
            </div>
          </div>
          <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground mt-4 md:mt-0">
            <Link href="/events">Explore More Events</Link>
          </Button>
        </header>

        <section>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl"><BookUser className="h-5 w-5 text-primary"/>My Registered Events</CardTitle>
              <CardDescription>Events you are currently registered for.</CardDescription>
            </CardHeader>
            <CardContent>
              {studentRegisteredFullEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {studentRegisteredFullEvents.map(event => (
                    <Card key={event.id} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                       <Link href={`/events/${event.slug}`} className="block group">
                        <div className="relative w-full h-40">
                          <Image
                            src={event.mainImage.src}
                            alt={event.mainImage.alt}
                            fill
                            style={{ objectFit: 'cover' }}
                            data-ai-hint={event.mainImage.dataAiHint}
                            className="group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg group-hover:text-primary">{event.title}</CardTitle>
                           {event.teamName && (
                            <p className="text-xs text-accent font-medium flex items-center">
                              <Users className="mr-1 h-3 w-3"/> Team: {event.teamName}
                            </p>
                          )}
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-sm text-muted-foreground line-clamp-2">{event.shortDescription}</p>
                        </CardContent>
                        <CardFooter>
                           <Button variant="outline" size="sm" className="w-full">View Details</Button>
                        </CardFooter>
                       </Link>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Info className="h-10 w-10 mx-auto mb-2" />
                  <p>You haven&apos;t registered for any events yet.</p>
                  <Button variant="link" asChild className="mt-2 text-primary"><Link href="/events">Explore Events</Link></Button>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
        
        { (userProfile.role === 'test' && userProfile.tasks && userProfile.tasks.length > 0) && (
            <section>
            <Card className="shadow-lg">
                <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl"><ClipboardList className="h-5 w-5 text-primary"/>My Tasks</CardTitle>
                <CardDescription>Tasks assigned to you.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                {userProfile.tasks.map(task => <TaskCard key={task.id} task={task} />)}
                </CardContent>
            </Card>
            </section>
        )}

        <section>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl"><Newspaper className="h-5 w-5 text-primary"/>My Admit Card</CardTitle>
              <CardDescription>Your admit card will be available here once finalized by the organizers.</CardDescription>
            </CardHeader>
            <CardContent className="text-center py-8">
              <Download className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">Admit card not yet available.</p>
              <Button disabled variant="secondary">
                <Download className="mr-2 h-4 w-4" /> Download Admit Card (Unavailable)
              </Button>
            </CardContent>
          </Card>
        </section>
        
        <section>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { href: '/events', label: 'Explore Events', icon: CalendarDays },
                { href: '/profile', label: 'My Profile', icon: UserCircle },
                { href: '/notifications', label: 'Notifications', icon: Bell },
              ].map(action => (
                <Button variant="outline" asChild key={action.href}>
                  <Link href={action.href} className="flex items-center gap-2">
                    <action.icon className="h-4 w-4" /> {action.label}
                  </Link>
                </Button>
              ))}
            </CardContent>
          </Card>
        </section>

      </div>
    );
  }

  // Organizer/Admin/Representative Dashboard
  let dashboardTitle = "User Dashboard";
  let quickActions = [];
  
  const assignedEvent = role === 'event_representative' && userProfile.assignedEventSlug 
    ? subEventsData.find(e => e.slug === userProfile.assignedEventSlug) 
    : null;

  const assignedOrganizerEvents = role === 'organizer' && userProfile.assignedEventSlugs
    ? userProfile.assignedEventSlugs.map(slug => subEventsData.find(e => e.slug === slug)?.title).filter(Boolean)
    : [];

  switch(role) {
    case 'event_representative':
      dashboardTitle = "Event Representative Dashboard";
      quickActions = [
        { href: '/profile', label: 'My Profile', icon: UserCircle },
        { href: '/notifications', label: 'Notifications', icon: Bell },
      ];
      if (assignedEvent) {
        quickActions.unshift({ href: `/organizer/events/manage/${assignedEvent.slug}`, label: 'Manage My Event', icon: Briefcase});
        quickActions.splice(1,0, { href: `/organizer/event-tasks`, label: 'Event Tasks', icon: ListChecks});
      } else {
         quickActions.unshift({ href: '#', label: 'No Event Assigned', icon: Briefcase, disabled: true });
      }
      break;
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
        { href: '/admin/users', label: 'Manage Users', icon: Users}, // Placeholder link
        { href: '/ocr-tool', label: 'Scan Forms (OCR)', icon: FileScan },
        { href: '/profile', label: 'My Profile', icon: UserCircle }, 
        { href: '/notifications', label: 'Notifications', icon: Bell },
      ];
      break;
    default:
      dashboardTitle = "User Dashboard"; // Should not happen if role is defined
  }


  return (
    <div className="space-y-8 animate-fade-in-up">
      <header className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div className="flex items-center gap-4">
           <Avatar className="h-20 w-20 border-2 border-primary">
            <AvatarImage src={userProfile.photoURL || undefined} alt={userProfile.displayName || 'User'} />
            <AvatarFallback className="text-2xl">{(userProfile.displayName || userProfile.email || 'U')[0].toUpperCase()}</AvatarFallback>
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
          <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground mt-4 md:mt-0">
            <Link href="/organizer/events/create">Create New Event</Link>
          </Button>
        )}
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {userProfile.points !== undefined && (
            <Card className="shadow-md">
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
            <Card className="shadow-md">
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
            <Card className="shadow-md">
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
      
      {role === 'event_representative' && assignedEvent && (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl text-primary">Managing: {assignedEvent.title}</CardTitle>
                <CardDescription>{assignedEvent.shortDescription}</CardDescription>
            </CardHeader>
            <CardContent>
                <Link href={`/events/${assignedEvent.slug}`} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline">View Event Page <ExternalLink className="ml-2 h-4 w-4" /></Button>
                </Link>
            </CardContent>
        </Card>
      )}

      {role === 'organizer' && assignedOrganizerEvents.length > 0 && (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl text-primary">My Assigned Events</CardTitle>
                <CardDescription>Events you are contributing to.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                {assignedOrganizerEvents.map(title => (
                    <Badge key={title} variant="secondary" className="mr-2">{title}</Badge>
                ))}
            </CardContent>
        </Card>
      )}


      {userProfile.tasks && userProfile.tasks.length > 0 && (
        <section>
          <Card className="shadow-lg">
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
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Access common tasks quickly.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {quickActions.map(action => (
              <Button variant="outline" asChild key={action.href} disabled={(action as any).disabled}>
                <Link href={action.href} className="flex items-center gap-2">
                  <action.icon className="h-4 w-4" /> {action.label}
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>
      </section>
      
      {(role === 'organizer' || role === 'overall_head' || role === 'admin') && (
         <section>
          <Card className="shadow-lg">
              <CardHeader>
                  <CardTitle>Upcoming Events Overview (Mock)</CardTitle>
                  <CardDescription>A quick look at events you are managing.</CardDescription>
              </CardHeader>
              <CardContent>
                  <p className="text-muted-foreground">Chart or list of upcoming events will be displayed here.</p>
                  <div className="mt-4 h-64 bg-muted rounded-md flex items-center justify-center">
                      <BarChartBig className="h-16 w-16 text-muted-foreground/50" />
                  </div>
              </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
