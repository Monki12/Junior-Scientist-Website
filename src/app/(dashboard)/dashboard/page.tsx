
'use client';

import { useAuth } from '@/hooks/use-auth';
import { Loader2, Users, ShieldCheck, Trophy, Briefcase, ListChecks, Award, BarChart3, LineChart, Ticket, Compass, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useEffect, useState }from 'react';
import type { SubEvent, UserProfileData, EventRegistration, Task } from '@/types';
import { collection, onSnapshot, query, orderBy, limit, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const OverallHeadDashboard = () => {
  const [stats, setStats] = useState({ events: 0, staff: 0, students: 0, avgParticipants: '0.0' });
  const [topStaff, setTopStaff] = useState<UserProfileData[]>([]);
  const [eventParticipantData, setEventParticipantData] = useState<{name: string, participants: number}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    let eventsCache: SubEvent[] = [];
    let initialLoads = { events: false, registrations: false, staff: false, students: false };

    const checkAllLoaded = () => {
      if (Object.values(initialLoads).every(Boolean)) {
        setLoading(false);
      }
    };

    const eventsQuery = query(collection(db, 'subEvents'));
    const unsubEvents = onSnapshot(eventsQuery, (snapshot) => {
      eventsCache = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as SubEvent);
      if (!initialLoads.events) { initialLoads.events = true; checkAllLoaded(); }
    }, error => console.error("Error fetching events: ", error));

    const registrationsQuery = query(collection(db, 'event_registrations'));
    const unsubRegistrations = onSnapshot(registrationsQuery, (regSnapshot) => {
      const totalParticipants = regSnapshot.size;
      const avgParticipants = eventsCache.length > 0 ? (totalParticipants / eventsCache.length).toFixed(1) : '0.0';
      setStats(prev => ({...prev, events: eventsCache.length, avgParticipants}));

      const participantCountsByEvent: { [key: string]: number } = {};
      regSnapshot.forEach(doc => {
          const reg = doc.data() as EventRegistration;
          participantCountsByEvent[reg.subEventId] = (participantCountsByEvent[reg.subEventId] || 0) + 1;
      });

      const topEvents = eventsCache
          .map(event => ({
              name: event.title,
              participants: participantCountsByEvent[event.id] || 0,
          }))
          .sort((a, b) => b.participants - a.participants)
          .slice(0, 10)
          .map(event => ({
              ...event,
              name: event.name.length > 15 ? event.name.substring(0, 15) + '...' : event.name,
          }));
      setEventParticipantData(topEvents);

      if (!initialLoads.registrations) { initialLoads.registrations = true; checkAllLoaded(); }
    }, error => console.error("Error fetching registrations for stats: ", error));

    const staffQuery = query(collection(db, 'users'), where('role', 'in', ['admin', 'overall_head', 'event_representative', 'organizer']));
    const unsubStaff = onSnapshot(staffQuery, (snapshot) => {
        setStats(prev => ({...prev, staff: snapshot.size}));
        const staffList = snapshot.docs.map(doc => doc.data() as UserProfileData);
        const leaderboard = staffList.sort((a, b) => (b.credibilityScore || 0) - (a.credibilityScore || 0)).slice(0, 3);
        setTopStaff(leaderboard);
        if (!initialLoads.staff) { initialLoads.staff = true; checkAllLoaded(); }
    }, error => console.error("Error fetching staff stats: ", error));

    const studentsQuery = query(collection(db, 'users'), where('role', 'in', ['student', 'test']));
    const unsubStudents = onSnapshot(studentsQuery, (snapshot) => {
        setStats(prev => ({...prev, students: snapshot.size}));
        if (!initialLoads.students) { initialLoads.students = true; checkAllLoaded(); }
    }, error => console.error("Error fetching students stats: ", error));

    return () => {
        unsubEvents();
        unsubRegistrations();
        unsubStaff();
        unsubStudents();
    };
  }, []);
  
  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <span className="ml-4">Loading Dashboard Data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Active Events</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.events}</div>
            <p className="text-xs text-muted-foreground">Managed across the platform</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{stats.staff}</div>
            <p className="text-xs text-muted-foreground">Organizers, Reps, and Admins</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students Registered</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.students}</div>
            <p className="text-xs text-muted-foreground">Across all events</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Participants / Event</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{stats.avgParticipants}</div>
            <p className="text-xs text-muted-foreground">Average engagement per event</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
            <CardHeader>
                <CardTitle>Top Events by Participant Count</CardTitle>
                <CardDescription>A look at the most popular events based on registrations.</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={eventParticipantData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" angle={-10} textAnchor="end" height={50} interval={0} />
                        <YAxis allowDecimals={false} />
                        <Tooltip cursor={{fill: 'hsla(var(--primary), 0.1)'}} />
                        <Legend />
                        <Bar dataKey="participants" name="Participants" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
         <Card className="lg:col-span-3">
            <CardHeader>
                <CardTitle className="flex items-center"><Trophy className="h-5 w-5 mr-2 text-yellow-500"/>Credibility Leaders</CardTitle>
                <CardDescription>Top performing staff members based on credibility score.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {topStaff.length > 0 ? topStaff.map((staff, index) => (
                    <div key={staff.uid} className="flex items-center">
                        <div className="text-xl font-bold mr-4">#{index + 1}</div>
                        <div>
                            <p className="font-semibold">{staff.fullName}</p>
                            <p className="text-sm text-muted-foreground capitalize">{staff.role?.replace(/_/g, ' ')}</p>
                        </div>
                        <div className="ml-auto text-lg font-bold text-accent">{staff.credibilityScore}</div>
                    </div>
                )) : <p className="text-sm text-muted-foreground">No staff data available.</p>}
                <Button asChild variant="outline" className="w-full mt-2">
                    <Link href="/leaderboard">View Full Leaderboard</Link>
                </Button>
            </CardContent>
        </Card>
      </div>
    </div>
  )
};

const EventRepDashboard = ({ userProfile }: { userProfile: UserProfileData }) => {
  const [stats, setStats] = useState({
    managedEvents: 0,
    totalParticipants: 0,
    tasksCompleted: 0,
    tasksTotal: 0,
  });
  const [loading, setLoading] = useState(true);
  const [managedEvents, setManagedEvents] = useState<SubEvent[]>([]);

  const assignedEventUids = userProfile.assignedEventUids || [];

  useEffect(() => {
    if (assignedEventUids.length === 0) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const unsubs: (() => void)[] = [];

    const eventsQuery = query(collection(db, 'subEvents'), where('__name__', 'in', assignedEventUids));
    unsubs.push(onSnapshot(eventsQuery, (snapshot) => {
        const eventsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubEvent));
        setManagedEvents(eventsList);
        setStats(prev => ({...prev, managedEvents: eventsList.length}));
    }));

    const registrationsQuery = query(collection(db, 'event_registrations'), where('subEventId', 'in', assignedEventUids));
    unsubs.push(onSnapshot(registrationsQuery, (snapshot) => {
        setStats(prev => ({...prev, totalParticipants: snapshot.size}));
    }));
    
    const tasksQuery = query(collection(db, 'tasks'), where('subEventId', 'in', assignedEventUids));
    unsubs.push(onSnapshot(tasksQuery, (snapshot) => {
        const tasksList = snapshot.docs.map(doc => doc.data() as Task);
        const completed = tasksList.filter(t => t.status === 'Completed').length;
        setStats(prev => ({...prev, tasksCompleted: completed, tasksTotal: tasksList.length}));
        setLoading(false); // Assume this is the last query to finish
    }));

    return () => unsubs.forEach(unsub => unsub());

  }, [assignedEventUids]);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <span className="ml-4">Loading Your Dashboard...</span>
      </div>
    );
  }
  
  const taskCompletionPercentage = stats.tasksTotal > 0 ? (stats.tasksCompleted / stats.tasksTotal) * 100 : 0;
  
  return (
    <div className="space-y-6">
        <h1 className="text-2xl font-bold text-primary">Event Representative Dashboard</h1>
         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Managed Events</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-primary">{stats.managedEvents}</div>
                <p className="text-xs text-muted-foreground">Events under your supervision</p>
            </CardContent>
            </Card>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-accent">{stats.totalParticipants}</div>
                <p className="text-xs text-muted-foreground">Across your managed events</p>
            </CardContent>
            </Card>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-primary">{stats.tasksCompleted} / {stats.tasksTotal}</div>
                <p className="text-xs text-muted-foreground">Completion for your events</p>
                <Progress value={taskCompletionPercentage} className="mt-2 h-2"/>
            </CardContent>
            </Card>
         </div>
         <Card>
            <CardHeader>
                <CardTitle>Your Events Overview</CardTitle>
                <CardDescription>Quick links to manage your assigned events.</CardDescription>
            </CardHeader>
            <CardContent>
                {managedEvents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {managedEvents.map(event => (
                            <div key={event.id} className="p-3 border rounded-lg flex justify-between items-center bg-muted/50">
                                <div>
                                    <p className="font-semibold">{event.title}</p>
                                    <Badge variant={event.status === 'Active' ? 'default' : 'secondary'} className="mt-1">{event.status}</Badge>
                                </div>
                                <Button asChild size="sm">
                                    <Link href={`/events/manage/${event.slug}`}>Manage</Link>
                                </Button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground text-center">You are not assigned to any events.</p>
                )}
            </CardContent>
         </Card>
    </div>
  );
};


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

const StudentDashboard = ({ userProfile }: { userProfile: UserProfileData }) => {
  const [registrations, setRegistrations] = useState<(EventRegistration & { eventDetails?: SubEvent })[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!userProfile?.uid) {
        setLoadingData(false);
        return;
    }

    setLoadingData(true);
    const q = query(collection(db, 'event_registrations'), where('userId', '==', userProfile.uid));

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      if (querySnapshot.empty) {
        setRegistrations([]);
        setLoadingData(false);
        return;
      }
      
      const regs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventRegistration));
      const eventIds = [...new Set(regs.map(r => r.subEventId))];

      if (eventIds.length > 0) {
        try {
          const eventsQuery = query(collection(db, 'subEvents'), where('__name__', 'in', eventIds));
          const eventsSnapshot = await getDocs(eventsQuery);
          const eventsMap = new Map(eventsSnapshot.docs.map(doc => [doc.id, {id: doc.id, ...doc.data()} as SubEvent]));
          
          const registrationsWithDetails = regs.map(reg => ({
            ...reg,
            eventDetails: eventsMap.get(reg.subEventId)
          }));
          
          setRegistrations(registrationsWithDetails);
        } catch (error) {
          console.error("Error fetching event details for dashboard: ", error);
          setRegistrations(regs); // Set registrations without details on error
        }
      } else {
         setRegistrations([]);
      }
      setLoadingData(false);
    }, (error) => {
      console.error("Error fetching registrations for dashboard: ", error);
      setLoadingData(false);
    });

    return () => unsubscribe();
  }, [userProfile?.uid]);
  
  const registeredEventsCount = registrations.length;
  
  const upcomingEvents = registrations.filter(reg => {
    if (!reg.eventDetails?.eventDate) return false;
    const eventDate = new Date(reg.eventDetails.eventDate);
    return eventDate >= new Date(); // Today or in the future
  }).sort((a, b) => { // Sort upcoming events by soonest first
      const dateA = a.eventDetails?.eventDate ? new Date(a.eventDetails.eventDate) : new Date(0);
      const dateB = b.eventDetails?.eventDate ? new Date(b.eventDetails.eventDate) : new Date(0);
      return dateA.getTime() - dateB.getTime();
  });
  
  const upcomingEventsCount = upcomingEvents.length;

  return (
    <div className="space-y-8 animate-fade-in-up">
      <h1 className="text-3xl font-bold text-primary">Welcome, {userProfile.fullName || userProfile.displayName}!</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registered Events</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingData ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{registeredEventsCount}</div>}
            <p className="text-xs text-muted-foreground">Events you are part of</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingData ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{upcomingEventsCount}</div>}
            <p className="text-xs text-muted-foreground">Events on the horizon</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Upcoming Events</CardTitle>
          <CardDescription>A list of your registered events that are coming up soon.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingData ? (
            <div className="flex justify-center items-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : upcomingEvents.length > 0 ? (
            <ul className="space-y-4">
              {upcomingEvents.slice(0, 5).map(reg => ( // Show max 5 upcoming
                <li key={reg.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <Link href={`/events/${reg.eventDetails?.slug || ''}`} className="font-semibold text-primary hover:underline">
                      {reg.eventDetails?.title || 'Event details loading...'}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {reg.eventDetails?.eventDate ? new Date(reg.eventDetails.eventDate).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'long', day: 'numeric'
                      }) : 'Date TBD'}
                    </p>
                  </div>
                  <Badge variant={reg.registrationStatus === 'approved' ? 'default' : 'secondary'} className="capitalize">{reg.registrationStatus}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center text-muted-foreground py-4">
              <p>You have no upcoming events registered.</p>
              <p className="text-sm">Why not explore some new ones?</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="bg-accent/10">
        <CardHeader>
          <CardTitle className="text-accent flex items-center gap-2"><Compass /> Explore More Events</CardTitle>
          <CardDescription>Discover new challenges and opportunities waiting for you.</CardDescription>
        </CardHeader>
        <CardContent>
           <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
             <Link href="/events">Explore All Events</Link>
           </Button>
        </CardContent>
      </Card>

    </div>
  );
};


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
        return <EventRepDashboard userProfile={userProfile} />;
      case 'organizer':
        return <OrganizerDashboard />;
      case 'student':
      case 'test':
      default:
        return <StudentDashboard userProfile={userProfile} />;
    }
  };

  return <div className="h-full w-full">{renderDashboardByRole()}</div>;
}
