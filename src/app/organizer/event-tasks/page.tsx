
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { subEventsData } from '@/data/subEvents';
import type { Task, TaskPriority, TaskStatus, SubEvent } from '@/types';
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, isValid, isPast } from 'date-fns';
import {
  ListChecks, ShieldAlert, Loader2, Search, Filter, PlusCircle, Edit2, Trash2, CalendarIcon, ArrowUpDown
} from 'lucide-react';

// Mock users for assignment (in a real app, this would come from user data)
const mockAssignableUsers = ['Alice (Organizer)', 'Bob (Event Rep)', 'Carol (Overall Head)', 'Self'];

const initialMockTasks: Task[] = [
  { id: 'task-1', title: 'Prepare Quiz Questions Set A', description: 'Create 50 multiple choice questions for round 1.', assignedTo: ['Alice (Organizer)'], dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), priority: 'High', status: 'In Progress', eventSlug: 'ex-quiz-it', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: 'Event Rep Bob' },
  { id: 'task-2', title: 'Book Auditorium', description: 'Finalize booking for the main hall for Dec 5th.', assignedTo: ['Self'], dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), priority: 'High', status: 'Pending Review', eventSlug: 'ex-quiz-it', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: 'Event Rep Bob' },
  { id: 'task-3', title: 'Design Participation Certificates', description: 'Create a template for certificates.', assignedTo: ['Carol (Overall Head)'], dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), priority: 'Medium', status: 'Not Started', eventSlug: 'ex-quiz-it', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: 'Event Rep Bob' },
  { id: 'task-4', title: 'Arrange Volunteer Refreshments', description: 'Coordinate with catering for volunteer snacks and drinks.', assignedTo: ['Bob (Event Rep)'], dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), priority: 'Low', status: 'Completed', eventSlug: 'ex-quiz-it', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: 'Admin' },
];

type SortableTaskFields = 'dueDate' | 'priority' | 'status';
type SortDirection = 'asc' | 'dsc';

export default function EventTasksPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { userProfile, loading: authLoading } = useAuth();

  const [tasks, setTasks] = useState<Task[]>(initialMockTasks);
  const [eventTitle, setEventTitle] = useState<string>('Event Tasks');
  const [isClient, setIsClient] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'All'>('All');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'All'>('All');

  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState<{
    title: string;
    description: string;
    assignedTo: string[];
    dueDate?: Date;
    priority: TaskPriority;
    status: TaskStatus;
  }>({ title: '', description: '', assignedTo: [], priority: 'Medium', status: 'Not Started' });
  
  const [sortConfig, setSortConfig] = useState<{ key: SortableTaskFields | null; direction: SortDirection }>({ key: null, direction: 'asc' });

  useEffect(() => {
    setIsClient(true); // Ensures client-side specific logic runs after mount
    if (!authLoading && userProfile) {
      const canAccess = userProfile.role === 'event_representative' || userProfile.role === 'overall_head' || userProfile.role === 'admin';
      if (!canAccess) {
        toast({ title: "Access Denied", description: "You don't have permission to view this page.", variant: "destructive" });
        router.push('/dashboard');
      } else if (userProfile.role === 'event_representative' && userProfile.assignedEventSlug) {
        const assignedEvent = subEventsData.find(e => e.slug === userProfile.assignedEventSlug);
        setEventTitle(assignedEvent ? `Tasks for "${assignedEvent.title}"` : 'My Event Tasks');
        // Filter tasks for this specific event if needed (mock data is generic for now)
        setTasks(prevTasks => prevTasks.map(t => ({...t, eventSlug: userProfile.assignedEventSlug })));
      } else if (userProfile.role === 'overall_head' || userProfile.role === 'admin') {
        setEventTitle('All Event Tasks Overview'); // Or implement event selection
      }
    } else if (!authLoading && !userProfile) {
      router.push('/login?redirect=/organizer/event-tasks');
    }
  }, [userProfile, authLoading, router, toast]);

  const handleAddTask = () => {
    if (!newTaskForm.title || !newTaskForm.dueDate) {
      toast({ title: "Missing Information", description: "Task Title and Due Date are required.", variant: "destructive" });
      return;
    }
    const newTask: Task = {
      id: `task-${Date.now()}`,
      ...newTaskForm,
      dueDate: newTaskForm.dueDate.toISOString(),
      assignedTo: newTaskForm.assignedTo.length > 0 ? newTaskForm.assignedTo : undefined, // Store as array of names for mock
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userProfile?.displayName || 'Current User',
      eventSlug: (userProfile?.role === 'event_representative' && userProfile.assignedEventSlug) ? userProfile.assignedEventSlug : 'general',
    };
    setTasks(prev => [newTask, ...prev]);
    setNewTaskForm({ title: '', description: '', assignedTo: [], priority: 'Medium', status: 'Not Started', dueDate: undefined });
    setIsAddTaskDialogOpen(false);
    toast({ title: "Task Created", description: `Task "${newTask.title}" has been added.` });
  };

  const toggleTaskStatus = (taskId: string, currentStatus: TaskStatus) => {
    setTasks(prevTasks => prevTasks.map(task =>
      task.id === taskId
        ? { ...task, status: currentStatus === 'Completed' ? 'In Progress' : 'Completed', updatedAt: new Date().toISOString() }
        : task
    ));
  };
  
  const requestSort = (key: SortableTaskFields) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'dsc';
    }
    setSortConfig({ key, direction });
  };

  const priorityOrder: Record<TaskPriority, number> = { 'High': 1, 'Medium': 2, 'Low': 3 };
  const statusOrder: Record<TaskStatus, number> = { 'Pending Review': 1, 'In Progress': 2, 'Not Started': 3, 'Completed': 4 };


  const filteredAndSortedTasks = useMemo(() => {
    let sortableTasks = [...tasks];
    // Filtering
    sortableTasks = sortableTasks.filter(task => {
      const matchesSearch = searchTerm === '' ||
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'All' || task.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });

    // Sorting
    if (sortConfig.key) {
      sortableTasks.sort((a, b) => {
        let valA = a[sortConfig.key!];
        let valB = b[sortConfig.key!];

        if (sortConfig.key === 'priority') {
          valA = priorityOrder[a.priority];
          valB = priorityOrder[b.priority];
        } else if (sortConfig.key === 'status') {
          valA = statusOrder[a.status];
          valB = statusOrder[b.status];
        } else if (sortConfig.key === 'dueDate') {
           // Handle undefined or invalid dates for sorting
          const dateA = a.dueDate && isValid(parseISO(a.dueDate)) ? parseISO(a.dueDate).getTime() : 0;
          const dateB = b.dueDate && isValid(parseISO(b.dueDate)) ? parseISO(b.dueDate).getTime() : 0;
          if (dateA === 0 && dateB === 0) return 0; // Both invalid or undefined
          if (dateA === 0) return sortConfig.direction === 'asc' ? 1 : -1; // Undefined dates last/first
          if (dateB === 0) return sortConfig.direction === 'asc' ? -1 : 1;
          valA = dateA;
          valB = dateB;
        }
        
        if (valA === undefined || valA === null) valA = ''; // Handle undefined for string comparison
        if (valB === undefined || valB === null) valB = '';


        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortConfig.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        } else {
           // Explicitly handle number comparison
          const numA = Number(valA);
          const numB = Number(valB);
          if (numA < numB) return sortConfig.direction === 'asc' ? -1 : 1;
          if (numA > numB) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
        }
      });
    }
    return sortableTasks;
  }, [tasks, searchTerm, statusFilter, priorityFilter, sortConfig]);
  
  const getPriorityBadgeVariant = (priority: TaskPriority) => {
    if (priority === 'High') return 'destructive';
    if (priority === 'Medium') return 'secondary'; // Use 'default' (primary) or 'secondary' for medium
    return 'outline'; // 'outline' or another subtle variant for Low
  };
  
  const getStatusBadgeVariant = (status: TaskStatus) => {
    if (status === 'Completed') return 'default'; // Greenish/Primary
    if (status === 'In Progress') return 'secondary';
    if (status === 'Pending Review') return 'outline'; // Yellowish (requires custom variant or use secondary)
    return 'outline'; // For 'Not Started'
  };


  if (authLoading || !userProfile || !isClient) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // Final access check after loading state
  const canAccessPage = userProfile.role === 'event_representative' || userProfile.role === 'overall_head' || userProfile.role === 'admin';
  if (!canAccessPage) {
     return (
      <div className="flex flex-col min-h-[calc(100vh-10rem)] items-center justify-center text-center p-4">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold text-primary flex items-center">
              <ListChecks className="mr-3 h-7 w-7" /> {eventTitle}
            </CardTitle>
            <CardDescription>Manage, assign, and track tasks for your event(s).</CardDescription>
          </div>
          <Dialog open={isAddTaskDialogOpen} onOpenChange={setIsAddTaskDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <PlusCircle className="mr-2 h-5 w-5" /> Add New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>Fill in the details for the new task.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="taskTitle" className="text-right">Title</Label>
                  <Input id="taskTitle" value={newTaskForm.title} onChange={e => setNewTaskForm(f => ({ ...f, title: e.target.value }))} className="col-span-3" placeholder="Task title" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="taskDesc" className="text-right">Description</Label>
                  <Textarea id="taskDesc" value={newTaskForm.description} onChange={e => setNewTaskForm(f => ({ ...f, description: e.target.value }))} className="col-span-3" placeholder="Detailed description" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="taskAssignedTo" className="text-right">Assigned To</Label>
                  <Input 
                    id="taskAssignedTo" 
                    value={newTaskForm.assignedTo.join(', ')} 
                    onChange={e => setNewTaskForm(f => ({ ...f, assignedTo: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} 
                    className="col-span-3" placeholder="Comma-separated names (mock)" 
                   />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="taskDueDate" className="text-right">Due Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={`col-span-3 justify-start text-left font-normal ${!newTaskForm.dueDate && "text-muted-foreground"}`}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newTaskForm.dueDate ? format(newTaskForm.dueDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={newTaskForm.dueDate} onSelect={date => setNewTaskForm(f => ({ ...f, dueDate: date }))} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="taskPriority" className="text-right">Priority</Label>
                  <Select value={newTaskForm.priority} onValueChange={(value: TaskPriority) => setNewTaskForm(f => ({ ...f, priority: value }))}>
                    <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="taskStatus" className="text-right">Status</Label>
                  <Select value={newTaskForm.status} onValueChange={(value: TaskStatus) => setNewTaskForm(f => ({ ...f, status: value }))}>
                    <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Not Started">Not Started</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Pending Review">Pending Review</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button onClick={handleAddTask}>Save Task</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search tasks..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={(value: TaskStatus | 'All') => setStatusFilter(value)}>
              <SelectTrigger><SelectValue placeholder="Filter by status..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                <SelectItem value="Not Started">Not Started</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Pending Review">Pending Review</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={(value: TaskPriority | 'All') => setPriorityFilter(value)}>
              <SelectTrigger><SelectValue placeholder="Filter by priority..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Priorities</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
            {/* Placeholder for Assignee & Deadline filters */}
            <Button variant="outline" disabled className="text-muted-foreground">Assignee Filter (Soon)</Button>
          </div>

          {filteredAndSortedTasks.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Task Title</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => requestSort('dueDate')}
                    >
                        Due Date <ArrowUpDown className={`ml-2 h-3 w-3 inline ${sortConfig.key === 'dueDate' ? 'opacity-100' : 'opacity-30'}`} />
                    </TableHead>
                    <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => requestSort('priority')}
                    >
                        Priority <ArrowUpDown className={`ml-2 h-3 w-3 inline ${sortConfig.key === 'priority' ? 'opacity-100' : 'opacity-30'}`} />
                    </TableHead>
                     <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => requestSort('status')}
                    >
                        Status <ArrowUpDown className={`ml-2 h-3 w-3 inline ${sortConfig.key === 'status' ? 'opacity-100' : 'opacity-30'}`} />
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedTasks.map((task) => (
                    <TableRow key={task.id} className={task.status === 'Completed' ? 'opacity-70' : ''}>
                      <TableCell>
                        <Checkbox
                          checked={task.status === 'Completed'}
                          onCheckedChange={() => toggleTaskStatus(task.id, task.status)}
                          aria-label={`Mark task ${task.title} as ${task.status === 'Completed' ? 'incomplete' : 'complete'}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium max-w-xs truncate" title={task.title}>{task.title}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{task.assignedTo && task.assignedTo.length > 0 ? task.assignedTo.join(', ') : 'Unassigned'}</TableCell>
                      <TableCell className={`${task.dueDate && isPast(parseISO(task.dueDate)) && task.status !== 'Completed' ? 'text-destructive font-semibold' : ''}`}>
                        {task.dueDate && isValid(parseISO(task.dueDate)) ? format(parseISO(task.dueDate), 'MMM dd, yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPriorityBadgeVariant(task.priority)}>{task.priority}</Badge>
                      </TableCell>
                      <TableCell>
                         <Badge variant={getStatusBadgeVariant(task.status)}>{task.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => toast({ title: "Edit (Soon)", description: `Editing task: ${task.title}`})}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" onClick={() => toast({ title: "Delete (Soon)", description: `Deleting task: ${task.title}`, variant: "destructive"})}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <Filter className="h-12 w-12 mx-auto mb-3 text-primary/50" />
              <p>No tasks match the current filters. Try adjusting your search or filters.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
