
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { subEventsData } from '@/data/subEvents';
import type { UserRole, SubEvent } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Loader2,
  BarChartBig,
  Edit,
  Users,
  FileScan,
  Settings,
  BookUser,
  Trophy,
  ListChecks,
  CalendarDays,
  UserCircle,
  Bell,
  GraduationCap,
  School,
  Download,
  Info,
  Briefcase,
  Newspaper
} from 'lucide-react';

// Placeholder stats for organizers
const organizerStats = [
  { title: 'Total Events', value: '12', icon: <BarChartBig className="h-6 w-6 text-primary" />, color: 'text-primary' },
  { title: 'Active Registrations', value: '345', icon: <Users className="h-6 w-6 text-green-500" />, color: 'text-green-500' },
  { title: 'Pending Tasks', value: '8', icon: <Edit className="h-6 w-6 text-yellow-500" />, color: 'text-yellow-500' },
];

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
    const studentRegisteredEvents: SubEvent[] = userProfile.registeredEventSlugs
      ?.map(slug => subEventsData.find(event => event.slug === slug))
      .filter(event => event !== undefined) as SubEvent[] || [];

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
              {userProfile.school && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <School className="h-4 w-4" /> {userProfile.school}
                </p>
              )}
              {userProfile.grade && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <GraduationCap className="h-4 w-4" /> {userProfile.grade}
                </p>
              )}
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
              {studentRegisteredEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {studentRegisteredEvents.map(event => (
                    <Card key={event.id} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                       <Link href={`/events/${event.slug}`} className="block group">
                        <div className="relative w-full h-40">
                          <Image
                            src={event.mainImage.src}
                            alt={event.mainImage.alt}
                            layout="fill"
                            objectFit="cover"
                            data-ai-hint={event.mainImage.dataAiHint}
                            className="group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg group-hover:text-primary">{event.title}</CardTitle>
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
                  <p>You haven't registered for any events yet.</p>
                  <Button variant="link" asChild className="mt-2 text-primary"><Link href="/events">Explore Events</Link></Button>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

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

  // Organizer/Admin Dashboard (existing logic)
  let dashboardTitle = "User Dashboard";
  let welcomeMessage = `Welcome back, ${userProfile.displayName || authUser.email}! Role: ${role}`;
  let currentStats = organizerStats; // Default to organizer stats
  let quickActions = [];

  if (role === 'organizer' || role === 'overall_head' || role === 'admin' || role === 'event_representative') {
    dashboardTitle = "Organizer Dashboard";
    quickActions = [
      { href: '/organizer/events/manage', label: 'Manage Events', icon: Briefcase }, 
      { href: '/organizer/registrations', label: 'View Registrations', icon: Users }, 
      { href: '/ocr-tool', label: 'Scan Forms (OCR)', icon: FileScan },
      { href: '/profile', label: 'My Profile', icon: UserCircle }, 
    ];
     if (role === 'overall_head' || role === 'admin') {
        quickActions.push({ href: '/admin/tasks', label: 'Task Management', icon: ListChecks}); 
     }
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      <header className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-primary">{dashboardTitle}</h1>
          <p className="text-muted-foreground mt-1">{welcomeMessage}</p>
        </div>
        {(role === 'organizer' || role === 'overall_head' || role === 'admin') && (
          <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Link href="/organizer/events/create">Create New Event</Link>
          </Button>
        )}
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentStats.map((stat) => (
          <Card key={stat.title} className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">+X% from last month (mock)</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Access common tasks quickly.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            {quickActions.map(action => (
              <Button variant="outline" asChild key={action.href}>
                <Link href={action.href} className="flex items-center gap-2">
                  <action.icon className="h-4 w-4" /> {action.label}
                </Link>
              </Button>
            ))}
             <Button variant="outline" asChild>
                <Link href="/notifications" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" /> Notifications
                </Link>
              </Button>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Overview of recent activities (placeholder).</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="text-sm text-muted-foreground">New registration for 'Tech Conference 2024'.</li>
              <li className="text-sm text-muted-foreground">'Art Workshop' event updated.</li>
              <li className="text-sm text-muted-foreground">5 new tasks assigned for organizers.</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      {(role === 'organizer' || role === 'overall_head' || role === 'admin' || role === 'event_representative') && (
        <section>
          <Card className="shadow-lg">
              <CardHeader>
                  <CardTitle>Upcoming Events Overview</CardTitle>
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
