
'use client';

import { useAuth } from '@/hooks/use-auth';
import { Loader2, Users, ShieldCheck, Trophy, Briefcase, ListChecks, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useEffect, useState }from 'react';
import type { SubEvent, Task, UserProfileData } from '@/types';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Mock data for charts
const registrationData = [
  { name: 'Jan', students: 400 },
  { name: 'Feb', students: 300 },
  { name: 'Mar', students: 500 },
  { name: 'Apr', students: 780 },
  { name: 'May', students: 600 },
];

const taskData = [
  { name: 'Event A', completed: 40, pending: 24 },
  { name: 'Event B', completed: 30, pending: 13 },
  { name: 'Event C', completed: 50, pending: 8 },
];

const OverallHeadDashboard = () => {
  const [stats, setStats] = useState({ events: 0, staff: 0, students: 0 });
  const [topStaff, setTopStaff] = useState<UserProfileData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
        try {
            const eventsSnapshot = await getDocs(collection(db, 'subEvents'));
            const staffQuery = query(collection(db, 'users'), where('role', 'in', ['admin', 'overall_head', 'event_representative', 'organizer']));
            const staffSnapshot = await getDocs(staffQuery);
            const studentsQuery = query(collection(db, 'users'), where('role', '==', 'student'));
            const studentsSnapshot = await getDocs(studentsQuery);

            const leaderboardQuery = query(staffQuery, orderBy('credibilityScore', 'desc'), limit(3));
            const leaderboardSnapshot = await getDocs(leaderboardQuery);
            
            setStats({
                events: eventsSnapshot.size,
                staff: staffSnapshot.size,
                students: studentsSnapshot.size,
            });

            setTopStaff(leaderboardSnapshot.docs.map(doc => doc.data() as UserProfileData));

        } catch (error) {
            console.error("Error fetching dashboard stats: ", error);
        }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.events}</div>
            <p className="text-xs text-muted-foreground">Managed across the platform</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.staff}</div>
            <p className="text-xs text-muted-foreground">Organizers, Reps, and Admins</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.students}</div>
            <p className="text-xs text-muted-foreground">Registered participants</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
            <CardHeader>
                <CardTitle>Student Registration Trends</CardTitle>
                <CardDescription>Mock data showing monthly registrations.</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={registrationData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="students" fill="hsl(var(--primary))" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
         <Card className="lg:col-span-3">
            <CardHeader>
                <CardTitle className="flex items-center"><Trophy className="h-5 w-5 mr-2 text-yellow-500"/>Credibility Leaders</CardTitle>
                <CardDescription>Top performing staff members.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {topStaff.map((staff, index) => (
                    <div key={staff.uid} className="flex items-center">
                        <div className="text-xl font-bold mr-4">#{index + 1}</div>
                        <div>
                            <p className="font-semibold">{staff.fullName}</p>
                            <p className="text-sm text-muted-foreground">{staff.role?.replace(/_/g, ' ')}</p>
                        </div>
                        <div className="ml-auto text-lg font-bold text-accent">{staff.credibilityScore}</div>
                    </div>
                ))}
                <Button asChild variant="outline" className="w-full">
                    <Link href="/leaderboard">View Full Leaderboard</Link>
                </Button>
            </CardContent>
        </Card>
      </div>
    </div>
  )
};

const EventRepDashboard = () => (
    <Card>
        <CardHeader>
            <CardTitle>Event Representative Dashboard</CardTitle>
            <CardDescription>This is your dashboard. An overview of your assigned events, tasks, and staff will be shown here.</CardDescription>
        </CardHeader>
        <CardContent>
             <p>Content for Event Representative coming soon!</p>
        </CardContent>
    </Card>
);

const OrganizerDashboard = () => (
    <Card>
        <CardHeader>
            <CardTitle>Organizer Dashboard</CardTitle>
            <CardDescription>This is your dashboard. An overview of your assigned tasks and credibility score will be shown here.</CardDescription>
        </CardHeader>
        <CardContent>
             <p>Content for Organizer coming soon!</p>
        </CardContent>
    </Card>
);

const StudentDashboard = () => (
    <Card>
        <CardHeader>
            <CardTitle>Student Dashboard</CardTitle>
            <CardDescription>Welcome! Your registered events and teams will be displayed here.</CardDescription>
        </CardHeader>
        <CardContent>
             <Button asChild><Link href="/events">Explore Events</Link></Button>
        </CardContent>
    </Card>
);


export default function DashboardPage() {
  const { userProfile, loading } = useAuth();
  
  if (loading || !userProfile) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  const renderDashboardByRole = () => {
    switch (userProfile.role) {
      case 'admin':
      case 'overall_head':
        return <OverallHeadDashboard />;
      case 'event_representative':
        return <EventRepDashboard />;
      case 'organizer':
        return <OrganizerDashboard />;
      case 'student':
      case 'test':
      default:
        return <StudentDashboard />;
    }
  };

  return <div className="h-full w-full">{renderDashboardByRole()}</div>;
}
