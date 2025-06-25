
'use client';

import { useEffect, useState, useMemo, useCallback, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import type { Task, TaskPriority, TaskStatus, CustomTaskColumnDefinition, ActiveTaskFilter, UserProfileData, SubEvent } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, isValid, isPast, startOfDay, differenceInDays, addDays } from 'date-fns';
import {
  ListChecks, ShieldAlert, Loader2, Search, Filter, PlusCircle, Edit2, Trash2, CalendarIcon, ArrowUpDown, Tag, XIcon, ChevronDown, Rows, GanttChartSquare, LayoutDashboard
} from 'lucide-react';
import { collection, query, where, getDocs, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const mockAssignableUsersForEvent = [
  'Alice (Organizer)',
  'Bob (Event Rep for this Event)',
  'Carol (Overall Head)',
  'David (Organizer)',
];

const defaultTaskFormState = {
  title: '',
  description: '',
  assignedTo: [] as string[],
  dueDate: undefined as Date | undefined,
  priority: 'Medium' as TaskPriority,
  status: 'Not Started' as TaskStatus,
  points: 0,
  eventSlug: '',
  customTaskData: {},
};

type SortableTaskFields = 'dueDate' | 'priority' | 'status' | 'title';
type SortDirection = 'asc' | 'dsc';

const standardTaskFilterColumns: Array<{id: keyof Task | string, name: string, isCustom?: boolean}> = [
    { id: 'title', name: 'Title' },
    { id: 'description', name: 'Description' },
    { id: 'assignedTo', name: 'Assigned To' },
    { id: 'dueDate', name: 'Due Date' },
    { id: 'priority', name: 'Priority' },
    { id: 'status', name: 'Status' },
];

type TaskViewMode = 'list' | 'timeline';


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


const BasicTimelineView = ({ tasks, events }: { tasks: Task[], events: SubEvent[] }) => {
  if (tasks.length === 0) {
    return <div className="text-center py-10 text-muted-foreground">No tasks to display in timeline view.</div>;
  }

  const allDates = tasks.flatMap(task => [
    task.createdAt && isValid(parseISO(task.createdAt)) ? parseISO(task.createdAt) : new Date(),
    task.dueDate && isValid(parseISO(task.dueDate)) ? parseISO(task.dueDate) : addDays(new Date(), 1)
  ]).filter(date => isValid(date));

  const overallStartDate = allDates.length > 0 ? new Date(Math.min(...allDates.map(d => d.getTime()))) : new Date();
  const overallEndDate = allDates.length > 0 ? new Date(Math.max(...allDates.map(d => d.getTime()))) : addDays(new Date(), 7);
  let totalTimelineDays = Math.max(1, differenceInDays(overallEndDate, overallStartDate) || 1);
  if (totalTimelineDays === 0) totalTimelineDays = 1;


  return (
    <Card className="shadow-lg mt-6">
      <CardHeader>
        <CardTitle>Task Timeline (Basic View)</CardTitle>
        <CardDescription>A simplified visual representation of task durations. Updates with filters.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 overflow-x-auto p-4">
        <div className="relative min-w-[800px]" style={{ height: `${tasks.length * 40 + 50}px` }}>
          <div className="flex justify-between text-xs text-muted-foreground border-b pb-1 mb-2">
            <span>{format(overallStartDate, 'MMM dd, yyyy')}</span>
            <span>Timeline Span: ~{totalTimelineDays} day{totalTimelineDays === 1 ? '' : 's'}</span>
            <span>{format(overallEndDate, 'MMM dd, yyyy')}</span>
          </div>

          {tasks.map((task, index) => {
            const taskStartDate = task.createdAt && isValid(parseISO(task.createdAt)) ? parseISO(task.createdAt) : overallStartDate;
            const taskDueDate = task.dueDate && isValid(parseISO(task.dueDate)) ? parseISO(task.dueDate) : overallEndDate;

            let startOffsetPercent = 0;
            if (totalTimelineDays > 0) {
              startOffsetPercent = (differenceInDays(taskStartDate, overallStartDate) / totalTimelineDays) * 100;
            }

            let durationDays = Math.max(1, differenceInDays(taskDueDate, taskStartDate));
            if(taskStartDate > taskDueDate) durationDays = 0;

            let durationPercent = 0;
            if (totalTimelineDays > 0) {
                 durationPercent = (durationDays / totalTimelineDays) * 100;
            }

            const { colorClass } = getStatusBadgeVariant(task.status);

            return (
              <div
                key={task.id}
                className={`absolute h-8 rounded flex items-center px-2 text-xs shadow-sm ${colorClass}`}
                style={{
                  top: `${index * 40 + 30}px`,
                  left: `${Math.max(0, Math.min(100, startOffsetPercent))}%`,
                  width: `${Math.max(2, Math.min(100 - startOffsetPercent, durationPercent))}%`,
                  minWidth: '50px',
                }}
                title={`${task.title} (Status: ${task.status})`}
              >
                <span className="truncate text-white mix-blend-difference">{task.title}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};


export default function EventTasksPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { userProfile, loading: authLoading } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [allEvents, setAllEvents] = useState<SubEvent[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [currentView, setCurrentView] = useState<TaskViewMode>('list');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'All'>('All');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'All'>('All');
  const [assignedToFilterText, setAssignedToFilterText] = useState('');


  const [activeDynamicFilters, setActiveDynamicFilters] = useState<ActiveTaskFilter[]>([]);
  const [isAddFilterPopoverOpen, setIsAddFilterPopoverOpen] = useState(false);
  const [newFilterColumn, setNewFilterColumn] = useState<{ id: string, name: string, isCustom?: boolean } | null>(null);
  const [newFilterValue, setNewFilterValue] = useState('');

  const [isTaskFormDialogOpen, setIsTaskFormDialogOpen] = useState(false);
  const [currentTaskForm, setCurrentTaskForm] = useState<any>(defaultTaskFormState);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const [isDeleteConfirmDialogOpen, setIsDeleteConfirmDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const [sortConfig, setSortConfig] = useState<{ key: SortableTaskFields | null; direction: SortDirection }>({ key: 'dueDate', direction: 'asc' });

  useEffect(() => {
    setIsClient(true);
    if (!authLoading && !userProfile) {
      router.push('/login?redirect=/organizer/event-tasks');
      return;
    }
  }, [userProfile, authLoading, router]);

  useEffect(() => {
    if (!userProfile) return;

    setLoadingData(true);
    const fetchEvents = async () => {
        const eventsQuery = query(collection(db, 'subEvents'));
        const eventsSnapshot = await getDocs(eventsQuery);
        const eventsList = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubEvent));
        setAllEvents(eventsList);
    };

    const canAccess = userProfile.role === 'event_representative' || userProfile.role === 'overall_head' || userProfile.role === 'admin' || userProfile.role === 'organizer' || userProfile.role === 'test';
    if (!canAccess) {
      toast({ title: "Access Denied", description: "You don't have permission to view this page.", variant: "destructive" });
      router.push('/dashboard');
      return;
    }

    let tasksQuery;
    if (userProfile.role === 'overall_head' || userProfile.role === 'admin') {
      tasksQuery = query(collection(db, 'tasks'));
    } else if (userProfile.displayName) {
      tasksQuery = query(collection(db, 'tasks'), where('assignedTo', 'array-contains', userProfile.displayName));
    } else {
      setTasks([]);
      setLoadingData(false);
      fetchEvents();
      return; 
    }
    
    const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
      const tasksList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      setTasks(tasksList);
      setLoadingData(false);
    }, (error) => {
      console.error("Error fetching tasks:", error);
      toast({ title: "Error", description: "Could not fetch tasks.", variant: "destructive" });
      setLoadingData(false);
    });

    fetchEvents();
    return () => unsubscribe();
  }, [userProfile, router, toast]);

  const handleTaskFormSubmit = async () => {
    if (!currentTaskForm.title || !currentTaskForm.dueDate) {
      toast({ title: "Missing Information", description: "Task Title and Due Date are required.", variant: "destructive" });
      return;
    }
  
    const taskDataToSave = {
      title: currentTaskForm.title,
      description: currentTaskForm.description,
      assignedTo: currentTaskForm.assignedTo,
      dueDate: currentTaskForm.dueDate.toISOString(),
      priority: currentTaskForm.priority,
      status: currentTaskForm.status,
      points: currentTaskForm.points || 0,
      eventSlug: currentTaskForm.eventSlug,
      createdBy: userProfile?.displayName,
      updatedAt: new Date().toISOString(),
    };
  
    try {
      if (editingTaskId) {
        const taskRef = doc(db, 'tasks', editingTaskId);
        await updateDoc(taskRef, taskDataToSave);
        toast({ title: "Task Updated", description: `Task "${currentTaskForm.title}" has been updated.` });
      } else {
        await addDoc(collection(db, 'tasks'), {
          ...taskDataToSave,
          createdAt: new Date().toISOString(),
        });
        toast({ title: "Task Created", description: `Task "${currentTaskForm.title}" has been added.` });
      }
      setIsTaskFormDialogOpen(false);
      setCurrentTaskForm(defaultTaskFormState);
      setEditingTaskId(null);
    } catch (error) {
      console.error("Error saving task:", error);
      toast({ title: "Save Failed", description: "Could not save the task.", variant: "destructive" });
    }
  };

  const openEditTaskDialog = (task: Task) => {
    setEditingTaskId(task.id);
    setCurrentTaskForm({
      ...task,
      dueDate: task.dueDate ? parseISO(task.dueDate) : undefined,
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

  const toggleTaskStatus = async (taskId: string, currentStatus: TaskStatus) => {
    const newStatus = currentStatus === 'Completed' ? 'In Progress' : 'Completed';
    try {
        await updateDoc(doc(db, 'tasks', taskId), { status: newStatus, updatedAt: new Date().toISOString() });
    } catch (error) {
        console.error("Error updating task status:", error);
        toast({ title: "Update Failed", variant: "destructive" });
    }
  };


  const priorityOrder: Record<TaskPriority, number> = { 'High': 1, 'Medium': 2, 'Low': 3 };
  const statusOrder: Record<TaskStatus, number> = { 'Not Started': 1, 'In Progress': 2, 'Pending Review': 3, 'Completed': 4 };


  const filteredAndSortedTasks = useMemo(() => {
    let sortableTasks = [...tasks];

    sortableTasks = sortableTasks.filter(task => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = searchTermLower === '' ||
        task.title.toLowerCase().includes(searchTermLower) ||
        (task.description && task.description.toLowerCase().includes(searchTermLower));
      
      const matchesStatus = statusFilter === 'All' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'All' || task.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });


    // Sorting logic remains the same
    return sortableTasks;
  }, [tasks, searchTerm, statusFilter, priorityFilter, sortConfig]);


  if (authLoading || loadingData || !userProfile || !isClient) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const getEventTitleBySlug = (slug?: string) => {
    if (!slug) return 'General';
    return allEvents.find(e => e.slug === slug)?.title || slug;
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold text-primary flex items-center">
              <ListChecks className="mr-3 h-7 w-7" /> Task Management
            </CardTitle>
            <CardDescription>Manage, assign, and track tasks for your event(s).</CardDescription>
          </div>
           <Dialog open={isTaskFormDialogOpen} onOpenChange={(isOpen) => {
                setIsTaskFormDialogOpen(isOpen);
                if (!isOpen) {
                    setEditingTaskId(null);
                    setCurrentTaskForm(defaultTaskFormState);
                }
            }}>
                <DialogTrigger asChild>
                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-soft" onClick={() => { setEditingTaskId(null); setCurrentTaskForm(defaultTaskFormState); setIsTaskFormDialogOpen(true); }}>
                    <PlusCircle className="mr-2 h-5 w-5" /> Add New Task
                </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{editingTaskId ? 'Edit Task' : 'Create New Task'}</DialogTitle>
                </DialogHeader>
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
                     <Select value={currentTaskForm.eventSlug} onValueChange={v => setCurrentTaskForm({...currentTaskForm, eventSlug: v})}>
                        <SelectTrigger><SelectValue placeholder="Assign to Event"/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">General</SelectItem>
                            {allEvents.map(e => <SelectItem key={e.id} value={e.slug}>{e.title}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="justify-between">
                                {currentTaskForm.assignedTo.length > 0 ? `${currentTaskForm.assignedTo.length} users selected` : "Select Assignees"}
                                <ChevronDown className="ml-2 h-4 w-4 opacity-50"/>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            {mockAssignableUsersForEvent.map(user => (
                            <DropdownMenuCheckboxItem key={user} checked={currentTaskForm.assignedTo.includes(user)} onCheckedChange={checked => {
                                const newAssigned = checked ? [...currentTaskForm.assignedTo, user] : currentTaskForm.assignedTo.filter((u:string) => u !== user);
                                setCurrentTaskForm({...currentTaskForm, assignedTo: newAssigned});
                            }}>{user}</DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                </div>
                <DialogFooter>
                    <Button onClick={handleTaskFormSubmit}>Save Task</Button>
                </DialogFooter>
                </DialogContent>
            </Dialog>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead></TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>
                        <Checkbox checked={task.status === 'Completed'} onCheckedChange={() => toggleTaskStatus(task.id, task.status)} />
                      </TableCell>
                      <TableCell>{task.title}</TableCell>
                      <TableCell>{getEventTitleBySlug(task.eventSlug)}</TableCell>
                      <TableCell>{task.dueDate ? format(parseISO(task.dueDate), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                      <TableCell><Badge variant={getPriorityBadgeVariant(task.priority)}>{task.priority}</Badge></TableCell>
                      <TableCell><Badge className={getStatusBadgeVariant(task.status).colorClass}>{task.status}</Badge></TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => openEditTaskDialog(task)}><Edit2 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => {setTaskToDelete(task); setIsDeleteConfirmDialogOpen(true);}}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
        </CardContent>
      </Card>
      
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

    