'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2, BarChartBig, Edit, Users, FileScan, Settings } from 'lucide-react';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/dashboard');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Placeholder stats
  const stats = [
    { title: 'Total Events', value: '12', icon: <BarChartBig className="h-6 w-6 text-primary" />, color: 'text-primary' },
    { title: 'Active Registrations', value: '345', icon: <Users className="h-6 w-6 text-green-500" />, color: 'text-green-500' },
    { title: 'Pending Tasks', value: '8', icon: <Edit className="h-6 w-6 text-yellow-500" />, color: 'text-yellow-500' },
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">
      <header className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-primary">Organizer Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back, {user.displayName || user.email}!</p>
        </div>
        <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <Link href="/organizer/events/create">Create New Event</Link>
        </Button>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">+20.1% from last month (mock)</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Access common organizer tasks quickly.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Button variant="outline" asChild>
              <Link href="/organizer/events" className="flex items-center gap-2">
                <Edit className="h-4 w-4" /> Manage Events
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/organizer/registrations" className="flex items-center gap-2">
                <Users className="h-4 w-4" /> View Registrations
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/ocr-tool" className="flex items-center gap-2">
                <FileScan className="h-4 w-4" /> Scan Forms (OCR)
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/profile/settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" /> Account Settings
              </Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Overview of recent event activities (placeholder).</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="text-sm text-muted-foreground">New registration for 'Tech Conference 2024'.</li>
              <li className="text-sm text-muted-foreground">'Art Workshop' event updated.</li>
              <li className="text-sm text-muted-foreground">5 new tasks assigned.</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      <section>
        {/* Placeholder for charts or more detailed event list */}
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Upcoming Events Overview</CardTitle>
                <CardDescription>A quick look at your upcoming events.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Chart or list of upcoming events will be displayed here.</p>
                <div className="mt-4 h-64 bg-muted rounded-md flex items-center justify-center">
                    <BarChartBig className="h-16 w-16 text-muted-foreground/50" />
                </div>
            </CardContent>
        </Card>
      </section>

    </div>
  );
}
