
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import type { Task, TaskPriority, TaskStatus, UserProfileData, SubEvent } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, isValid } from 'date-fns';
import {
  ListChecks, Loader2, PlusCircle, Edit2, Trash2, CalendarIcon, ChevronDown
} from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Unsubscribe, runTransaction, serverTimestamp, increment, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const defaultTaskFormState: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'assignedToUserIds'> & { assignedToUserIds: string[] } = {
  title: '',
  description: '',
  assignedToUserIds: [],
  dueDate: undefined,
  priority: 'Medium',
  status: 'Not Started',
  pointsOnCompletion: 10,
  subEventId: 'general',
};

const getPriorityBadgeVariant = (priority: TaskPriority) => {
  if (priority === 'High') return 'destructive';
  if (priority === 'Medium') return 'secondary';
  return 'outline';
};

const getStatusBadgeVariant = (status: TaskStatus): { variant: "default" | "secondary" | "outline" | "destructive", colorClass: string } => {
  switch (status) {
    case 'Completed': return { variant: 'default', colorClass: 'bg-green-500/10 border-green-500/30 text-green-700 dark:bg-green-700/20 dark:text-green-300' };
    case 'In Progress': return { variant: 'secondary', colorClass: 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:bg-blue-700/20 dark:text-blue-300' };
    case 'Pending Review': return { variant: 'outline', colorClass: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:bg-yellow-700/20 dark:text-yellow-300' };
    case 'Not Started': return { variant: 'outline', colorClass: 'bg-slate-500/10 border-slate-500/30 text-slate-700 dark:bg-slate-700/20 dark:text-slate-300' };
    default: return { variant: 'outline', colorClass: 'bg-muted text-muted-foreground border-border' };
  }
};

async function checkAndSendRankNotification(assigneeId: string, oldScore: number, newScore: number) {
    try {
        const staffQuery = query(collection(db, 'users'), where('role', 'in', ['organizer', 'event_representative', 'overall_head', 'admin']));
        const staffSnapshot = await getDocs(staffQuery);
        const staffList = staffSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfileData));

        const getRank = (score: number, list: UserProfileData[]) => {
            const sortedList = [...list].map(user => user.uid === assigneeId ? { ...user, credibilityScore: score } : user)
                                       .sort((a, b) => (b.credibilityScore || 0) - (a.credibilityScore || 0));
            return sortedList.findIndex(u => u.uid === assigneeId) + 1;
        };

        const oldRank = getRank(oldScore, staffList);
        const newRank = getRank(newScore, staffList);

        let notificationTitle: string | null = null;
        if (newRank > 0 && newRank <= 3 && (oldRank === 0 || oldRank > 3)) {
            notificationTitle = `You're in the Top 3!`;
        } else if (newRank > 0 && newRank <= 10 && (oldRank === 0 || oldRank > 10)) {
            notificationTitle = `You've reached the Top 10!`;
        }

        if (notificationTitle) {
            const notificationData = {
                userId: assigneeId,
                type: 'achievement',
                title: notificationTitle,
                message: `Congratulations! You've reached rank #${newRank} on the leaderboard. Keep up the great work!`,
                link: '/leaderboard',
                createdAt: serverTimestamp(),
                read: false,
            };
            await addDoc(collection(db, 'notifications'), notificationData);
        }
    } catch (error) {
        console.error("Error checking or sending rank notification:", error);
    }
}


export default function GlobalTasksPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { userProfile, loading: authLoading } = useAuth();

  const [managedTasks, setManagedTasks] = useState<Task[]>([]);
  const [personalTasks, setPersonalTasks] = useState<Task[]>([]);
  
  const [allEvents, setAllEvents] = useState<SubEvent[]>([]);
  const [allStaff, setAllStaff] = useState<UserProfileData[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [isTaskFormDialogOpen, setIsTaskFormDialogOpen] = useState(false);
  const [currentTaskForm, setCurrentTaskForm] = useState<any>(defaultTaskFormState);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const [isDeleteConfirmDialogOpen, setIsDeleteConfirmDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  
  const tasks = useMemo(() => {
    const allTasks = new Map<string, Task>();
    managedTasks.forEach(task => allTasks.set(task.id, task));
    personalTasks.forEach(task => allTasks.set(task.id, task));
    return Array.from(allTasks.values()).sort((a, b) => {
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        return dateA - dateB;
    });
  }, [managedTasks, personalTasks]);


  useEffect(() => {
    if (!userProfile) return;

    const unsubs: Unsubscribe[] = [];
    
    const setupListeners = async () => {
        setLoadingData(true);
        try {
          const eventsQuery = query(collection(db, 'subEvents'));
          unsubs.push(onSnapshot(eventsQuery, (snapshot) => {
            const eventsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubEvent));
            setAllEvents(eventsList);
          }));
          
          const staffRoles = ['organizer', 'event_representative', 'overall_head', 'admin'];
          const staffQuery = query(collection(db, 'users'), where('role', 'in', staffRoles));
          unsubs.push(onSnapshot(staffQuery, (snapshot) => {
            const staffList = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfileData));
            setAllStaff(staffList);
          }));

          let tasksQuery;
          if (userProfile.role === 'admin' || userProfile.role === 'overall_head') {
              tasksQuery = query(collection(db, 'tasks'));
              unsubs.push(onSnapshot(tasksQuery, (snapshot) => {
                const tasksList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
                setManagedTasks(tasksList);
                setPersonalTasks([]);
                setLoadingData(false);
              }));
          } else if (userProfile.role === 'event_representative') {
              const managedEventsIds = userProfile.assignedEventUids || ['__none__'];
              const managedTasksQuery = query(collection(db, 'tasks'), where('subEventId', 'in', managedEventsIds));
              unsubs.push(onSnapshot(managedTasksQuery, (snapshot) => {
                const tasksList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
                setManagedTasks(tasksList);
              }));
              
              const personalTasksQuery = query(collection(db, 'tasks'), where('assignedToUserIds', 'array-contains', userProfile.uid));
              unsubs.push(onSnapshot(personalTasksQuery, (snapshot) => {
                const tasksList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
                setPersonalTasks(tasksList);
                setLoadingData(false);
              }));
          } else { // Organizer
              tasksQuery = query(collection(db, 'tasks'), where('assignedToUserIds', 'array-contains', userProfile.uid));
              unsubs.push(onSnapshot(tasksQuery, (snapshot) => {
                const tasksList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
                setPersonalTasks(tasksList);
                setManagedTasks([]);
                setLoadingData(false);
              }));
          }
        } catch (error) {
          console.error("Error setting up listeners:", error);
          toast({ title: "Error", description: "Could not initialize page data.", variant: "destructive" });
          setLoadingData(false);
        }
    }

    setupListeners();

    return () => unsubs.forEach(unsub => unsub());
  }, [userProfile, toast]);

  const handleTaskFormSubmit = async () => {
    if (!currentTaskForm.title || !currentTaskForm.dueDate || currentTaskForm.assignedToUserIds.length === 0) {
      toast({ title: "Missing Information", description: "Title, Due Date, and at least one Assignee are required.", variant: "destructive" });
      return;
    }
  
    const taskDataToSave: Partial<Task> = {
      ...currentTaskForm,
      assignedByUserId: userProfile?.uid,
      dueDate: currentTaskForm.dueDate.toISOString(),
      updatedAt: serverTimestamp() as any,
    };
  
    try {
      if (editingTaskId) {
        const taskRef = doc(db, 'tasks', editingTaskId);
        await updateDoc(taskRef, taskDataToSave);
        toast({ title: "Task Updated", description: `Task "${currentTaskForm.title}" has been updated.` });
      } else {
        await addDoc(collection(db, 'tasks'), {
          ...taskDataToSave,
          createdAt: serverTimestamp(),
          status: 'Not Started',
        });
        toast({ title: "Task Created", description: `Task "${currentTaskForm.title}" has been added.` });
      }
      setIsTaskFormDialogOpen(false);
    } catch (error) {
      console.error("Error saving task:", error);
      toast({ title: "Save Failed", description: "Could not save the task.", variant: "destructive" });
    }
  };

  const handleStatusChange = async (task: Task, newStatus: TaskStatus) => {
      if (!userProfile) return;

      const taskRef = doc(db, "tasks", task.id);
      
      const originalTasks = JSON.parse(JSON.stringify(tasks));
      const updatedTasks = tasks.map(t => t.id === task.id ? {...t, status: newStatus} : t);
      setManagedTasks(updatedTasks.filter(t => managedTasks.some(mt => mt.id === t.id)));
      setPersonalTasks(updatedTasks.filter(t => personalTasks.some(pt => pt.id === t.id)));
      
      if (newStatus === 'Completed' && task.status !== 'Completed') {
          const assigneeOldScores = new Map<string, number>();
          try {
            await runTransaction(db, async (transaction) => {
              const assigneeRefs = task.assignedToUserIds.map(id => doc(db, "users", id));
              const assigneeDocs = await Promise.all(assigneeRefs.map(ref => transaction.get(ref)));
              
              let assignerRef = null;
              if (task.assignedByUserId) {
                assignerRef = doc(db, "users", task.assignedByUserId);
              }
              const [taskDoc, assignerDoc] = await Promise.all([
                  transaction.get(taskRef),
                  assignerRef ? transaction.get(assignerRef) : Promise.resolve(null)
              ]);

              if (!taskDoc.exists() || taskDoc.data().status === 'Completed') {
                  throw new Error("Task is already completed or does not exist.");
              }
              
              const pointsToAdd = task.pointsOnCompletion || 10;
              transaction.update(taskRef, {
                  status: 'Completed',
                  completedByUserId: userProfile.uid,
                  completedAt: serverTimestamp()
              });
              
              assigneeDocs.forEach((doc, index) => {
                if (doc.exists()) {
                  const oldScore = doc.data().credibilityScore || 0;
                  assigneeOldScores.set(doc.id, oldScore);
                  transaction.update(assigneeRefs[index], { credibilityScore: increment(pointsToAdd) });
                }
              });

              if (assignerDoc && assignerRef && assignerDoc.exists()) {
                  transaction.update(assignerRef, { credibilityScore: increment(2) });
              }
            });
            
            toast({ title: "Task Completed!", description: `Credibility scores have been updated.` });

            for (const [assigneeId, oldScore] of assigneeOldScores.entries()) {
                const newScore = oldScore + (task.pointsOnCompletion || 10);
                await checkAndSendRankNotification(assigneeId, oldScore, newScore);
            }
          } catch(e: any) {
             console.error("Transaction failed: ", e);
             toast({ title: "Error", description: e.message || "Failed to update task and scores.", variant: "destructive" });
             setManagedTasks(originalTasks.filter((t: Task) => managedTasks.some(mt => mt.id === t.id)));
             setPersonalTasks(originalTasks.filter((t: Task) => personalTasks.some(pt => pt.id === t.id)));
          }
      } else {
          try {
              await updateDoc(taskRef, { status: newStatus, updatedAt: serverTimestamp() });
          } catch (e: any) {
              console.error("Status update failed: ", e);
              toast({ title: "Error", description: "Could not update task status.", variant: "destructive" });
              setManagedTasks(originalTasks.filter((t: Task) => managedTasks.some(mt => mt.id === t.id)));
              setPersonalTasks(originalTasks.filter((t: Task) => personalTasks.some(pt => pt.id === t.id)));
          }
      }
  };

  const openEditTaskDialog = (task: Task) => {
    setEditingTaskId(task.id);
    setCurrentTaskForm({
      ...task,
      dueDate: task.dueDate && isValid(parseISO(task.dueDate)) ? parseISO(task.dueDate) : undefined,
    });
    setIsTaskFormDialogOpen(true);
  };
  
  const handleDeleteTask = async () => {
    if (taskToDelete) {
      try {
        await deleteDoc(doc(db, 'tasks', taskToDelete.id));
        toast({ title: "Task Deleted", description: `Task "${taskToDelete.title}" has been deleted.` });
      } catch (error) {
        console.error("Error deleting task:", error);
        toast({ title: "Delete Failed", variant: "destructive" });
      } finally {
        setIsDeleteConfirmDialogOpen(false);
        setTaskToDelete(null);
      }
    }
  };

  const openCreateTaskDialog = () => {
    setEditingTaskId(null);
    const defaults = { ...defaultTaskFormState };
    if (userProfile?.role === 'organizer') {
      defaults.assignedToUserIds = [userProfile.uid];
    }
    setCurrentTaskForm(defaults);
    setIsTaskFormDialogOpen(true);
  };

  const getEventTitleById = (id?: string) => {
    if (!id || id === 'general') return 'General';
    return allEvents.find(e => e.id === id)?.title || id;
  };
  
  const canSelfAssignOnly = userProfile?.role === 'organizer';
  const canCreateTasks = userProfile && ['admin', 'overall_head', 'event_representative'].includes(userProfile.role);

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold text-primary flex items-center">
              <ListChecks className="mr-3 h-7 w-7" /> Task Management
            </CardTitle>
            <CardDescription>Manage, assign, and track tasks for all events.</CardDescription>
          </div>
           {canCreateTasks && (
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-soft" onClick={openCreateTaskDialog}>
              <PlusCircle className="mr-2 h-5 w-5" /> Add New Task
            </Button>
           )}
        </CardHeader>
        <CardContent>
          {loadingData ? (
             <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                <ListChecks className="h-12 w-12 mx-auto mb-3 text-primary/30" />
                <h3 className="text-lg font-semibold text-foreground mb-1">No Tasks Found</h3>
                <p className="text-sm">It looks like there are no tasks here!</p>
                {canCreateTasks && (
                    <Button onClick={openCreateTaskDialog} className="mt-4">
                        <PlusCircle className="mr-2 h-4 w-4" /> Create a Task
                    </Button>
                )}
                {!canCreateTasks && <p className="text-xs mt-1">If you believe there should be tasks here, please contact your event manager.</p>}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => {
                    const isManager = userProfile?.role === 'admin' || userProfile?.role === 'overall_head' || (userProfile?.role === 'event_representative' && userProfile.assignedEventUids?.includes(task.subEventId || ''));
                    const isAssigner = userProfile?.uid === task.assignedByUserId;
                    const canEditFully = isManager || isAssigner;
                    const isAssignee = task.assignedToUserIds.includes(userProfile?.uid || '');
                    const canChangeStatus = canEditFully || isAssignee;

                    return (
                        <TableRow key={task.id}>
                        <TableCell className="font-medium">{task.title}</TableCell>
                        <TableCell>{task.assignedToUserIds?.map(uid => allStaff.find(s => s.uid === uid)?.fullName || 'N/A').join(', ')}</TableCell>
                        <TableCell>{getEventTitleById(task.subEventId)}</TableCell>
                        <TableCell>{task.dueDate && isValid(parseISO(task.dueDate)) ? format(parseISO(task.dueDate), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                        <TableCell><Badge variant={getPriorityBadgeVariant(task.priority)}>{task.priority}</Badge></TableCell>
                        <TableCell>
                             <Select value={task.status} onValueChange={(newStatus: TaskStatus) => handleStatusChange(task, newStatus)} disabled={!canChangeStatus}>
                                <SelectTrigger className={`h-8 text-xs capitalize w-[130px] ${getStatusBadgeVariant(task.status).colorClass}`}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Not Started">Not Started</SelectItem>
                                    <SelectItem value="In Progress">In Progress</SelectItem>
                                    <SelectItem value="Pending Review">Pending Review</SelectItem>
                                    <SelectItem value="Completed">Completed</SelectItem>
                                </SelectContent>
                            </Select>
                        </TableCell>
                        <TableCell className="space-x-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditTaskDialog(task)} disabled={!canEditFully}><Edit2 className="h-4 w-4" /></Button>
                            {canEditFully && 
                                <Button variant="ghost" size="icon" onClick={() => {setTaskToDelete(task); setIsDeleteConfirmDialogOpen(true);}}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            }
                        </TableCell>
                        </TableRow>
                    );
                })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={isTaskFormDialogOpen} onOpenChange={(isOpen) => {
            if (!isOpen) { setEditingTaskId(null); }
            setIsTaskFormDialogOpen(isOpen);
        }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editingTaskId ? 'Edit Task' : 'Create New Task'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
              <Input placeholder="Title" value={currentTaskForm.title} onChange={e => setCurrentTaskForm({ ...currentTaskForm, title: e.target.value })} />
              <Textarea placeholder="Description" value={currentTaskForm.description} onChange={e => setCurrentTaskForm({ ...currentTaskForm, description: e.target.value })} />
              <Popover>
                  <PopoverTrigger asChild>
                  <Button variant="outline" className={`justify-start text-left font-normal ${!currentTaskForm.dueDate && "text-muted-foreground"}`}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {currentTaskForm.dueDate ? format(currentTaskForm.dueDate, "PPP") : <span>Pick a due date</span>}
                  </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={currentTaskForm.dueDate} onSelect={date => setCurrentTaskForm({ ...currentTaskForm, dueDate: date })} initialFocus />
                  </PopoverContent>
              </Popover>
              <Select value={currentTaskForm.priority} onValueChange={v => setCurrentTaskForm({...currentTaskForm, priority: v})}>
                  <SelectTrigger><SelectValue placeholder="Priority"/></SelectTrigger>
                  <SelectContent>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
              </Select>
              <Select value={currentTaskForm.subEventId} onValueChange={v => setCurrentTaskForm({...currentTaskForm, subEventId: v})}>
                  <SelectTrigger><SelectValue placeholder="Assign to Event"/></SelectTrigger>
                  <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      {allEvents.map(e => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}
                  </SelectContent>
              </Select>
              <div>
                <Label>Assign To</Label>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between" disabled={canSelfAssignOnly}>
                            {currentTaskForm.assignedToUserIds.length > 0 ? `${currentTaskForm.assignedToUserIds.length} users selected` : "Select Assignees"}
                            <ChevronDown className="ml-2 h-4 w-4 opacity-50"/>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-full">
                        {allStaff.map(user => (
                        <DropdownMenuCheckboxItem key={user.uid} checked={currentTaskForm.assignedToUserIds.includes(user.uid)} onCheckedChange={checked => {
                            const newAssigned = checked ? [...currentTaskForm.assignedToUserIds, user.uid] : currentTaskForm.assignedToUserIds.filter((uid:string) => uid !== user.uid);
                            setCurrentTaskForm({...currentTaskForm, assignedToUserIds: newAssigned});
                        }}>{user.fullName} ({user.role})</DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div>
                <Label htmlFor="points">Points on Completion</Label>
                <Input id="points" type="number" value={currentTaskForm.pointsOnCompletion} onChange={e => setCurrentTaskForm({...currentTaskForm, pointsOnCompletion: Number(e.target.value)})} disabled={userProfile?.role === 'organizer'} />
              </div>

          </div>
          <DialogFooter>
            <Button onClick={handleTaskFormSubmit}>Save Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteConfirmDialogOpen} onOpenChange={setIsDeleteConfirmDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the task: &quot;{taskToDelete?.title}&quot;.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTask} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
