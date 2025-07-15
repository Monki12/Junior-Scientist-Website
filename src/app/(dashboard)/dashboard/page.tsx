
'use client';

import { useAuth } from '@/hooks/use-auth';
import { Loader2, Users, ShieldCheck, Trophy, Briefcase, ListChecks, Award, BarChart3, LineChart, Ticket, Compass, CheckCircle, Search, AlertCircle, Inbox, UserCheck as UserCheckIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useEffect, useState, useMemo } from 'react';
import type { SubEvent, UserProfileData, EventRegistration, Task, TaskPriority, Board, BoardMember } from '@/types';
import { collection, onSnapshot, query, orderBy, limit, where, getDocs, Timestamp, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { format, isPast } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { nanoid } from 'nanoid';

const OverallHeadDashboard = () => {
  const [stats, setStats] = useState({ events: 0, staff: 0, students: 0, avgParticipants: '0.0' });
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
        if (!initialLoads.staff) { initialLoads.staff = true; checkAllLoaded(); }
    }, error => console.error("Error fetching staff stats: ", error));

    const studentsQuery = query(collection(db, 'users'), where('role', '==', 'student'));
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
      
      <div className="grid gap-6">
        <Card>
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

  const assignedEventUids = useMemo(() => userProfile.assignedEventUids || [], [userProfile.assignedEventUids]);

  useEffect(() => {
    if (assignedEventUids.length === 0) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const unsubs: (() => void)[] = [];
    const initialLoads = { events: false, registrations: false, tasks: false };

    const checkAllLoaded = () => {
      if (Object.values(initialLoads).every(Boolean)) {
        setLoading(false);
      }
    };
    
    try {
      const eventsQuery = query(collection(db, 'subEvents'), where('__name__', 'in', assignedEventUids));
      unsubs.push(onSnapshot(eventsQuery, (snapshot) => {
          const eventsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubEvent));
          setManagedEvents(eventsList);
          setStats(prev => ({...prev, managedEvents: eventsList.length}));
          if (!initialLoads.events) { initialLoads.events = true; checkAllLoaded(); }
      }, error => { console.error("Error fetching rep events:", error); if (!initialLoads.events) { initialLoads.events = true; checkAllLoaded(); } }));

      const registrationsQuery = query(collection(db, 'event_registrations'), where('subEventId', 'in', assignedEventUids));
      unsubs.push(onSnapshot(registrationsQuery, (snapshot) => {
          setStats(prev => ({...prev, totalParticipants: snapshot.size}));
          if (!initialLoads.registrations) { initialLoads.registrations = true; checkAllLoaded(); }
      }, error => { console.error("Error fetching rep registrations:", error); if (!initialLoads.registrations) { initialLoads.registrations = true; checkAllLoaded(); }}));
      
      const tasksQuery = query(collection(db, 'tasks'), where('subEventId', 'in', assignedEventUids));
      unsubs.push(onSnapshot(tasksQuery, (snapshot) => {
          const tasksList = snapshot.docs.map(doc => doc.data() as Task);
          const completed = tasksList.filter(t => t.status === 'Completed').length;
          setStats(prev => ({...prev, tasksCompleted: completed, tasksTotal: tasksList.length}));
          if (!initialLoads.tasks) { initialLoads.tasks = true; checkAllLoaded(); }
      }, error => { console.error("Error fetching rep tasks:", error); if (!initialLoads.tasks) { initialLoads.tasks = true; checkAllLoaded(); }}));

    } catch (error) {
      console.error("Error setting up event rep listeners:", error);
      setLoading(false); // Catch synchronous errors during query creation
    }

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
                    <div className="text-center py-10 text-muted-foreground">
                        <Briefcase className="h-12 w-12 mx-auto mb-3 text-primary/30" />
                        <h3 className="text-lg font-semibold text-foreground mb-1">No Events Assigned</h3>
                        <p className="text-sm">Event details will appear here once you are assigned to an event by an admin.</p>
                    </div>
                )}
            </CardContent>
         </Card>
    </div>
  );
};


const useOrganizerData = (userProfile: UserProfileData) => {
    const [data, setData] = useState<{ boards: Board[], tasks: Task[] }>({ boards: [], tasks: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userProfile?.uid) {
            setLoading(false);
            return;
        }

        setLoading(true);

        // This query fetches boards where the user is a member
        const boardsQuery = query(collection(db, 'boards'), where('memberUids', 'array-contains', userProfile.uid));
        
        const unsubBoards = onSnapshot(boardsQuery, (boardSnapshot) => {
            const userBoards = boardSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Board));
            setData(prev => ({ ...prev, boards: userBoards }));

            if (userBoards.length > 0) {
                const allBoardIds = userBoards.map(b => b.id);
                
                // This query fetches all tasks belonging to the boards the user is a member of.
                // It's needed for the "Team Workload" and "Unassigned Tasks" cards.
                if (allBoardIds.length > 0) {
                    const tasksQuery = query(collection(db, 'tasks'), where('boardId', 'in', allBoardIds));
                    const unsubTasks = onSnapshot(tasksQuery, (taskSnapshot) => {
                        const allTasks = taskSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
                        setData(prev => ({ ...prev, tasks: allTasks }));
                        setLoading(false); // Last listener to load
                    });
                    // This will be cleaned up by the outer listener's cleanup function
                    return () => unsubTasks();
                }

            } else {
                 setData(prev => ({...prev, tasks: []}));
                 setLoading(false);
            }
        }, error => {
            console.error("Error fetching boards:", error);
            setLoading(false);
        });

        // The cleanup function for the board listener.
        // It will also handle the cleanup of the nested task listener.
        return () => unsubBoards();
    }, [userProfile.uid]);

    return { ...data, loading };
};


const OrganizerDashboard = ({ userProfile }: { userProfile: UserProfileData }) => {
    const { toast } = useToast();
    const { boards, tasks, loading } = useOrganizerData(userProfile);

    const { myTasks, myCompletedTasks, myTotalTasks, myCompletionPercentage, upcomingTasks } = useMemo(() => {
        const myTasks = tasks.filter(t => t.assignedToUserIds.includes(userProfile.uid));
        const myCompletedTasks = myTasks.filter(t => t.status === 'Completed').length;
        const myTotalTasks = myTasks.length;
        const myCompletionPercentage = myTotalTasks > 0 ? (myCompletedTasks / myTotalTasks) * 100 : 0;
        
        const priorityOrder: { [key in TaskPriority]: number } = { 'High': 1, 'Medium': 2, 'Low': 3 };
        const upcomingTasks = myTasks
          .filter(t => t.status !== 'Completed')
          .sort((a, b) => {
            const priorityA = priorityOrder[a.priority] || 4;
            const priorityB = priorityOrder[b.priority] || 4;
            if (priorityA !== priorityB) return priorityA - priorityB;
            
            const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
            const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
            return dateA - dateB;
          })
          .slice(0, 3);
        
        return { myTasks, myCompletedTasks, myTotalTasks, myCompletionPercentage, upcomingTasks };
    }, [tasks, userProfile.uid]);


    const handleCreateTask = async () => {
        if (boards.length === 0) {
            toast({ title: "No Boards", description: "You must be a member of a board to create a task.", variant: "destructive" });
            return;
        }
        // In a real app, this might open a modal to select a board first.
        // For now, we'll just link to the main tasks page.
        toast({ title: "Redirecting...", description: "Please create the new task on your desired board."});
        // Assuming router is available or navigate programmatically
    };

    if (loading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" /><span className="ml-4">Loading Your Dashboard...</span>
            </div>
        );
    }
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">Organizer Dashboard</h1>
      <div className="flex flex-col gap-6">
        
        <Card>
          <CardHeader>
            <CardTitle>Your Task Completion</CardTitle>
            <CardDescription>Your assigned tasks across all boards.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">{myCompletionPercentage.toFixed(0)}%</div>
            <Progress value={myCompletionPercentage} className="mt-2 h-2"/>
            <p className="text-sm text-muted-foreground mt-2">{myCompletedTasks} of {myTotalTasks} tasks completed.</p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full"><Link href="/my-tasks">View My Tasks</Link></Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Your Top 3 Urgent Tasks</CardTitle>
            <CardDescription>Highest priority tasks assigned to you.</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingTasks.length > 0 ? (
              <ul className="space-y-3">
                {upcomingTasks.map(task => (
                  <li key={task.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-semibold">{task.caption}</p>
                      <p className="text-sm text-muted-foreground">
                        Due: {task.dueDate ? format(new Date(task.dueDate), 'MMM dd') : 'No due date'}
                      </p>
                    </div>
                    <Badge variant={task.priority === 'High' ? 'destructive' : task.priority === 'Medium' ? 'secondary' : 'outline'}>{task.priority}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-3 text-green-500/50" />
                <h3 className="text-lg font-semibold text-foreground mb-1">You're all caught up! ✨</h3>
                <p className="text-sm">No pending tasks assigned to you.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

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
      const regs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventRegistration));
      
      if (regs.length === 0) {
        setRegistrations([]);
        setLoadingData(false);
        return;
      }
      
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
          setRegistrations(regs);
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
  
  if (loadingData) {
      return (
        <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <span className="ml-4">Loading Your Dashboard...</span>
        </div>
      )
  }
  
  const upcomingEvents = registrations.filter(reg => {
    if (!reg.eventDetails?.eventDate) return false;
    const eventDate = reg.eventDetails.eventDate instanceof Timestamp 
        ? reg.eventDetails.eventDate.toDate() 
        : new Date(reg.eventDetails.eventDate);
    return eventDate >= new Date();
  }).sort((a, b) => {
      const dateA = a.eventDetails?.eventDate ? (a.eventDetails.eventDate instanceof Timestamp ? a.eventDetails.eventDate.toMillis() : new Date(a.eventDetails.eventDate).getTime()) : 0;
      const dateB = b.eventDetails?.eventDate ? (b.eventDetails.eventDate instanceof Timestamp ? b.eventDetails.eventDate.toMillis() : new Date(b.eventDetails.eventDate).getTime()) : 0;
      return dateA - dateB;
  });

  if (registrations.length === 0) {
    return (
        <div className="text-center py-10">
            <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-2xl font-semibold mb-2">You haven't registered for any events yet!</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">Head over to the 'Explore Events' section to find exciting opportunities and challenges waiting for you.</p>
            <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link href="/events"><Search className="mr-2 h-4 w-4"/>Explore Events Now</Link>
            </Button>
        </div>
    )
  }

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
            <div className="text-2xl font-bold">{registrations.length}</div>
            <p className="text-xs text-muted-foreground">Events you are part of</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingEvents.length}</div>
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
          {upcomingEvents.length > 0 ? (
            <ul className="space-y-4">
              {upcomingEvents.slice(0, 5).map(reg => (
                <li key={reg.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <Link href={`/events/${reg.eventDetails?.slug || ''}`} className="font-semibold text-primary hover:underline">
                      {reg.eventDetails?.title || 'Event details loading...'}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {reg.eventDetails?.eventDate ? format(reg.eventDetails.eventDate instanceof Timestamp ? reg.eventDetails.eventDate.toDate() : new Date(reg.eventDetails.eventDate), "PPP") : 'Date TBD'}
                    </p>
                  </div>
                  <Badge variant={reg.registrationStatus === 'approved' ? 'default' : 'secondary'} className="capitalize">{reg.registrationStatus}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center text-muted-foreground py-4">
              <p>You have no upcoming events.</p>
              <p className="text-sm">Check "My Registrations" to see your past event history.</p>
              <Button asChild variant="link" className="mt-2"><Link href="/my-registrations">View All Registrations</Link></Button>
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
        return <OrganizerDashboard userProfile={userProfile} />;
      case 'student':
      default:
        return <StudentDashboard userProfile={userProfile} />;
    }
  };

  return <div className="h-full w-full">{renderDashboardByRole()}</div>;
}
