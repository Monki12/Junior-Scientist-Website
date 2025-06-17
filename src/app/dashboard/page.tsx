
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2, BarChartBig, Edit, Users, FileScan, Settings, BookUser, Trophy, ListChecks, CalendarDays, UserCircle, Bell } from 'lucide-react';
import type { UserRole } from '@/types';

// Placeholder stats - these could be dynamic based on role
const commonStats = [
  { title: 'Total Events', value: '12', icon: <BarChartBig className="h-6 w-6 text-primary" />, color: 'text-primary' },
];
const organizerStats = [
  ...commonStats,
  { title: 'Active Registrations', value: '345', icon: <Users className="h-6 w-6 text-green-500" />, color: 'text-green-500' },
  { title: 'Pending Tasks', value: '8', icon: <Edit className="h-6 w-6 text-yellow-500" />, color: 'text-yellow-500' },
];
const studentStats = [
  ...commonStats,
  { title: 'My Registered Events', value: '2', icon: <BookUser className="h-6 w-6 text-blue-500" />, color: 'text-blue-500' },
  { title: 'Achievements', value: '1', icon: <Trophy className="h-6 w-6 text-yellow-500" />, color: 'text-yellow-500' },
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
  let dashboardTitle = "User Dashboard";
  let welcomeMessage = `Welcome back, ${userProfile.displayName || authUser.email}! Role: ${role}`;
  let currentStats = commonStats;
  let quickActions = [];

  if (role === 'student' || role === 'test') {
    dashboardTitle = "Student Dashboard";
    currentStats = studentStats;
    quickActions = [
      { href: '/events', label: 'Explore Events', icon: CalendarDays },
      { href: '/profile', label: 'My Profile', icon: UserCircle },
      { href: '/notifications', label: 'My Notifications', icon: Bell },
    ];
  } else if (role === 'organizer' || role === 'overall_head' || role === 'admin' || role ==='event_representative') {
    dashboardTitle = "Organizer Dashboard";
    currentStats = organizerStats;
    quickActions = [
      { href: '/organizer/events/manage', label: 'Manage Events', icon: Edit }, // Placeholder for actual route
      { href: '/organizer/registrations', label: 'View Registrations', icon: Users }, // Placeholder
      { href: '/ocr-tool', label: 'Scan Forms (OCR)', icon: FileScan },
      { href: '/profile/settings', label: 'Account Settings', icon: Settings }, // Placeholder
    ];
     if (role === 'overall_head' || role === 'admin') {
        quickActions.push({ href: '/admin/tasks', label: 'Task Management', icon: ListChecks}); // Placeholder
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
              <li className="text-sm text-muted-foreground">You registered for 'Science Olympiad'.</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      {(role === 'organizer' || role === 'overall_head' || role === 'admin') && (
        <section>
          <Card className="shadow-lg">
              <CardHeader>
                  <CardTitle>Upcoming Events Overview (Organizer)</CardTitle>
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
       {role === 'student' && (
        <section>
          <Card className="shadow-lg">
              <CardHeader>
                  <CardTitle>My Upcoming Events (Student)</CardTitle>
                  <CardDescription>Events you're registered for.</CardDescription>
              </CardHeader>
              <CardContent>
                  <p className="text-muted-foreground">Your registered events will be listed here.</p>
                   <div className="mt-4 h-40 bg-muted rounded-md flex items-center justify-center">
                      <CalendarDays className="h-16 w-16 text-muted-foreground/50" />
                  </div>
              </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
