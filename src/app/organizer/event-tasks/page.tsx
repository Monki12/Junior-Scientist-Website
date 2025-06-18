
'use client';

import { useEffect, useState, useMemo, useCallback, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { subEventsData } from '@/data/subEvents';
import type { Task, TaskPriority, TaskStatus, SubEvent, UserProfileData, CustomTaskColumnDefinition, ActiveTaskFilter } from '@/types';
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, isValid, isPast, parse } from 'date-fns';
import {
  ListChecks, ShieldAlert, Loader2, Search, Filter, PlusCircle, Edit2, Trash2, CalendarIcon, ArrowUpDown, Tag, XIcon
} from 'lucide-react';

// Mock users for assignment (in a real app, this would come from user data)
const mockAssignableUsers = ['Alice (Organizer)', 'Bob (Event Rep)', 'Carol (Overall Head)', 'Self'];

const initialMockTasks: Task[] = [
  { id: 'task-1', title: 'Prepare Quiz Questions Set A', description: 'Create 50 multiple choice questions for round 1.', assignedTo: ['Alice (Organizer)'], dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), priority: 'High', status: 'In Progress', eventSlug: 'ex-quiz-it', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: 'Event Rep Bob', customTaskData: { notes: 'Focus on STEM', difficulty: 5 } },
  { id: 'task-2', title: 'Book Auditorium', description: 'Finalize booking for the main hall for Dec 5th.', assignedTo: ['Self'], dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), priority: 'High', status: 'Pending Review', eventSlug: 'ex-quiz-it', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: 'Event Rep Bob' },
  { id: 'task-3', title: 'Design Participation Certificates', description: 'Create a template for certificates.', assignedTo: ['Carol (Overall Head)'], dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), priority: 'Medium', status: 'Not Started', eventSlug: 'ex-quiz-it', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: 'Event Rep Bob' },
  { id: 'task-4', title: 'Arrange Volunteer Refreshments', description: 'Coordinate with catering for volunteer snacks and drinks.', assignedTo: ['Bob (Event Rep)'], dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), priority: 'Low', status: 'Completed', eventSlug: 'ex-quiz-it', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: 'Admin' },
];

const defaultTaskFormState = {
  title: '',
  description: '',
  assignedTo: [] as string[],
  dueDate: undefined as Date | undefined,
  priority: 'Medium' as TaskPriority,
  status: 'Not Started' as TaskStatus,
  points: 0,
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
  
  const [activeDynamicFilters, setActiveDynamicFilters] = useState<ActiveTaskFilter[]>([]);
  const [isAddFilterPopoverOpen, setIsAddFilterPopoverOpen] = useState(false);
  const [newFilterColumn, setNewFilterColumn] = useState<{ id: string, name: string, isCustom?: boolean } | null>(null);
  const [newFilterValue, setNewFilterValue] = useState('');

  const [isTaskFormDialogOpen, setIsTaskFormDialogOpen] = useState(false);
  const [currentTaskForm, setCurrentTaskForm] = useState<{
    id?: string;
    title: string;
    description: string;
    assignedTo: string[];
    dueDate?: Date;
    priority: TaskPriority;
    status: TaskStatus;
    points?: number;
  }>(defaultTaskFormState);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  
  const [isDeleteConfirmDialogOpen, setIsDeleteConfirmDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const [sortConfig, setSortConfig] = useState<{ key: SortableTaskFields | null; direction: SortDirection }>({ key: 'dueDate', direction: 'asc' });

  const [customTaskColumnDefinitions, setCustomTaskColumnDefinitions] = useState<CustomTaskColumnDefinition[]>([]);
  const [isAddCustomTaskColumnDialogOpen, setIsAddCustomTaskColumnDialogOpen] = useState(false);
  const [newCustomTaskColumnForm, setNewCustomTaskColumnForm] = useState<{
    name: string;
    dataType: CustomTaskColumnDefinition['dataType'];
    options: string;
    defaultValue: string;
  }>({ name: '', dataType: 'text', options: '', defaultValue: '' });
  const [editingCustomCell, setEditingCustomCell] = useState<{ taskId: string; columnId: string } | null>(null);


  useEffect(() => {
    setIsClient(true);
    if (!authLoading && userProfile) {
      const canAccess = userProfile.role === 'event_representative' || userProfile.role === 'overall_head' || userProfile.role === 'admin';
      if (!canAccess) {
        toast({ title: "Access Denied", description: "You don't have permission to view this page.", variant: "destructive" });
        router.push('/dashboard');
      } else if (userProfile.role === 'event_representative' && userProfile.assignedEventSlug) {
        const assignedEvent = subEventsData.find(e => e.slug === userProfile.assignedEventSlug);
        setEventTitle(assignedEvent ? `Tasks for "${assignedEvent.title}"` : 'My Event Tasks');
        setTasks(prevTasks => prevTasks.map(t => ({...t, eventSlug: userProfile.assignedEventSlug })));
      } else if (userProfile.role === 'overall_head' || userProfile.role === 'admin') {
        setEventTitle('All Event Tasks Overview');
      }
    } else if (!authLoading && !userProfile) {
      router.push('/login?redirect=/organizer/event-tasks');
    }
  }, [userProfile, authLoading, router, toast]);

  const handleTaskFormSubmit = () => {
    if (!currentTaskForm.title || !currentTaskForm.dueDate) {
      toast({ title: "Missing Information", description: "Task Title and Due Date are required.", variant: "destructive" });
      return;
    }

    if (editingTaskId) { // Update existing task
      setTasks(prev => prev.map(task => task.id === editingTaskId ? {
        ...task,
        ...currentTaskForm,
        assignedTo: currentTaskForm.assignedTo,
        dueDate: currentTaskForm.dueDate!.toISOString(),
        updatedAt: new Date().toISOString(),
      } : task));
      toast({ title: "Task Updated", description: `Task "${currentTaskForm.title}" has been updated.` });
    } else { // Add new task
      const newTask: Task = {
        id: `task-${Date.now()}`,
        ...currentTaskForm,
        assignedTo: currentTaskForm.assignedTo,
        dueDate: currentTaskForm.dueDate!.toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: userProfile?.displayName || 'Current User',
        eventSlug: (userProfile?.role === 'event_representative' && userProfile.assignedEventSlug) ? userProfile.assignedEventSlug : 'general',
        customTaskData: customTaskColumnDefinitions.reduce((acc, colDef) => {
          acc[colDef.id] = colDef.defaultValue || getInitialValueForTaskDataType(colDef.dataType);
          return acc;
        }, {} as Record<string, any>),
      };
      setTasks(prev => [newTask, ...prev]);
      toast({ title: "Task Created", description: `Task "${newTask.title}" has been added.` });
    }
    setCurrentTaskForm(defaultTaskFormState);
    setEditingTaskId(null);
    setIsTaskFormDialogOpen(false);
  };

  const openEditTaskDialog = (task: Task) => {
    setEditingTaskId(task.id);
    setCurrentTaskForm({
      ...task,
      assignedTo: task.assignedTo || [],
      dueDate: task.dueDate ? parseISO(task.dueDate) : undefined,
    });
    setIsTaskFormDialogOpen(true);
  };
  
  const openDeleteConfirmDialog = (task: Task) => {
    setTaskToDelete(task);
    setIsDeleteConfirmDialogOpen(true);
  };

  const handleDeleteTask = () => {
    if (taskToDelete) {
      setTasks(prev => prev.filter(task => task.id !== taskToDelete.id));
      toast({ title: "Task Deleted", description: `Task "${taskToDelete.title}" has been deleted.` });
      setTaskToDelete(null);
      setIsDeleteConfirmDialogOpen(false);
    }
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
    
    // Static Filters
    sortableTasks = sortableTasks.filter(task => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = searchTermLower === '' ||
        task.title.toLowerCase().includes(searchTermLower) ||
        (task.description && task.description.toLowerCase().includes(searchTermLower));
      const matchesStatus = statusFilter === 'All' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'All' || task.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });

    // Dynamic Filters
    if (activeDynamicFilters.length > 0) {
        sortableTasks = sortableTasks.filter(task => {
            return activeDynamicFilters.every(filter => {
                let taskValue: any;
                 if (filter.isCustom) {
                    taskValue = task.customTaskData?.[filter.columnId];
                } else {
                    taskValue = (task as any)[filter.columnId];
                }

                if (taskValue === undefined || taskValue === null) {
                    return filter.value.toLowerCase() === 'false' && typeof taskValue === 'boolean' ? true : false;
                }
                
                const valueStr = String(taskValue).toLowerCase();
                const filterValueStr = filter.value.toLowerCase();

                if (filter.columnId === 'assignedTo' && Array.isArray(taskValue)) {
                    return taskValue.some(assignee => String(assignee).toLowerCase().includes(filterValueStr));
                }
                if (typeof taskValue === 'boolean') {
                    return filterValueStr === valueStr;
                }
                return valueStr.includes(filterValueStr);
            });
        });
    }

    // Sorting
    if (sortConfig.key) {
      sortableTasks.sort((a, b) => {
        let valA = a[sortConfig.key! as keyof Task];
        let valB = b[sortConfig.key! as keyof Task];

        if (sortConfig.key === 'priority') {
          valA = priorityOrder[a.priority];
          valB = priorityOrder[b.priority];
        } else if (sortConfig.key === 'status') {
          valA = statusOrder[a.status];
          valB = statusOrder[b.status];
        } else if (sortConfig.key === 'dueDate' && a.dueDate && b.dueDate) {
          const dateA = isValid(parseISO(a.dueDate)) ? parseISO(a.dueDate).getTime() : 0;
          const dateB = isValid(parseISO(b.dueDate)) ? parseISO(b.dueDate).getTime() : 0;
          if (dateA === 0 && dateB === 0) return 0;
          if (dateA === 0) return sortConfig.direction === 'asc' ? 1 : -1;
          if (dateB === 0) return sortConfig.direction === 'asc' ? -1 : 1;
          valA = dateA;
          valB = dateB;
        }
        
        if (valA === undefined || valA === null) valA = '' as any;
        if (valB === undefined || valB === null) valB = '' as any;

        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortConfig.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        } else {
          const numA = Number(valA);
          const numB = Number(valB);
          if (numA < numB) return sortConfig.direction === 'asc' ? -1 : 1;
          if (numA > numB) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
        }
      });
    }
    return sortableTasks;
  }, [tasks, searchTerm, statusFilter, priorityFilter, activeDynamicFilters, sortConfig]);
  
  const getPriorityBadgeVariant = (priority: TaskPriority) => {
    if (priority === 'High') return 'destructive';
    if (priority === 'Medium') return 'secondary';
    return 'outline';
  };
  
  const getStatusBadgeVariant = (status: TaskStatus) => {
    if (status === 'Completed') return 'default';
    if (status === 'In Progress') return 'secondary';
    if (status === 'Pending Review') return 'outline'; // Consider a yellowish variant if theme supports
    return 'outline';
  };

  const handleAddDynamicFilter = () => {
    if (newFilterColumn && newFilterValue.trim() !== '') {
      const newFilter: ActiveTaskFilter = {
        id: Date.now().toString(),
        columnId: newFilterColumn.id,
        columnName: newFilterColumn.name,
        value: newFilterValue,
        isCustom: newFilterColumn.isCustom,
      };
      setActiveDynamicFilters(prev => [...prev, newFilter]);
      setNewFilterColumn(null);
      setNewFilterValue('');
      setIsAddFilterPopoverOpen(false);
    } else {
      toast({ title: "Incomplete Filter", description: "Please select a column and enter a value.", variant: "destructive"});
    }
  };

  const removeDynamicFilter = (filterId: string) => {
    setActiveDynamicFilters(prev => prev.filter(f => f.id !== filterId));
  };
  
  const availableTaskFilterColumns = useMemo(() => {
    const customCols = customTaskColumnDefinitions.map(col => ({ id: col.id, name: col.name, isCustom: true }));
    return [...standardTaskFilterColumns, ...customCols];
  }, [customTaskColumnDefinitions]);

  const getInitialValueForTaskDataType = (dataType: CustomTaskColumnDefinition['dataType']) => {
    switch (dataType) {
      case 'checkbox': return false;
      case 'number': return 0;
      default: return '';
    }
  };

  const handleAddCustomTaskColumnSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newCustomTaskColumnForm.name || !newCustomTaskColumnForm.dataType) {
      toast({ title: "Error", description: "Column Name and Data Type are required.", variant: "destructive" });
      return;
    }
    const newColumnId = `custom_task_${Date.now()}_${newCustomTaskColumnForm.name.toLowerCase().replace(/\s+/g, '_')}`;
    const newDefinition: CustomTaskColumnDefinition = {
      id: newColumnId,
      name: newCustomTaskColumnForm.name,
      dataType: newCustomTaskColumnForm.dataType,
      options: newCustomTaskColumnForm.dataType === 'dropdown' ? newCustomTaskColumnForm.options.split(',').map(opt => opt.trim()).filter(Boolean) : undefined,
      defaultValue: newCustomTaskColumnForm.defaultValue,
    };
    setCustomTaskColumnDefinitions(prev => [...prev, newDefinition]);

    setTasks(prevTasks => 
      prevTasks.map(p => ({
        ...p,
        customTaskData: {
          ...(p.customTaskData || {}),
          [newColumnId]: newCustomTaskColumnForm.defaultValue || getInitialValueForTaskDataType(newCustomTaskColumnForm.dataType)
        }
      }))
    );

    setNewCustomTaskColumnForm({ name: '', dataType: 'text', options: '', defaultValue: ''});
    setIsAddCustomTaskColumnDialogOpen(false);
    toast({ title: "Success", description: `Custom task column "${newDefinition.name}" added.` });
  };
  
  const handleCustomTaskDataChange = (taskId: string, columnId: string, value: any) => {
    setTasks(prev => 
      prev.map(p => 
        p.id === taskId 
        ? { ...p, customTaskData: { ...(p.customTaskData || {}), [columnId]: value } }
        : p
      )
    );
  };
  
  const renderCustomTaskCell = (task: Task, column: CustomTaskColumnDefinition) => {
    const value = task.customTaskData?.[column.id] ?? column.defaultValue ?? getInitialValueForTaskDataType(column.dataType);
    const isEditing = editingCustomCell?.taskId === task.id && editingCustomCell?.columnId === column.id;

    if (isEditing) {
       switch (column.dataType) {
        case 'text':
          return <Input type="text" value={String(value)} onChange={(e) => handleCustomTaskDataChange(task.id, column.id, e.target.value)} onBlur={() => setEditingCustomCell(null)} autoFocus className="h-8 text-xs"/>;
        case 'number':
          return <Input type="number" value={Number(value)} onChange={(e) => handleCustomTaskDataChange(task.id, column.id, parseFloat(e.target.value) || 0)} onBlur={() => setEditingCustomCell(null)} autoFocus className="h-8 text-xs"/>;
        case 'date':
          return <Input type="date" value={String(value)} onChange={(e) => handleCustomTaskDataChange(task.id, column.id, e.target.value)} onBlur={() => setEditingCustomCell(null)} autoFocus className="h-8 text-xs"/>;
        case 'checkbox':
           return <Checkbox checked={!!value} onCheckedChange={(checked) => handleCustomTaskDataChange(task.id, column.id, !!checked)} />;
        case 'dropdown':
          return (
            <Select value={String(value)} onValueChange={(val) => { handleCustomTaskDataChange(task.id, column.id, val); setEditingCustomCell(null); }} >
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                {column.options?.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
              </SelectContent>
            </Select>
          );
        default:
          return String(value);
      }
    }

    switch (column.dataType) {
        case 'checkbox':
            return <Checkbox checked={!!value} onCheckedChange={(checked) => handleCustomTaskDataChange(task.id, column.id, !!checked)} aria-label={`Toggle ${column.name} for ${task.title}`}/>;
        default:
            return <span onClick={() => column.dataType !== 'checkbox' && setEditingCustomCell({ taskId: task.id, columnId: column.id })} className="cursor-pointer hover:bg-muted/50 p-1 rounded min-h-[2rem] block">{String(value)}</span>;
    }
  };


  if (authLoading || !userProfile || !isClient) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
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
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold text-primary flex items-center">
              <ListChecks className="mr-3 h-7 w-7" /> {eventTitle}
            </CardTitle>
            <CardDescription>Manage, assign, and track tasks for your event(s).</CardDescription>
          </div>
          <Dialog open={isTaskFormDialogOpen} onOpenChange={setIsTaskFormDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => { setEditingTaskId(null); setCurrentTaskForm(defaultTaskFormState); setIsTaskFormDialogOpen(true); }}>
                <PlusCircle className="mr-2 h-5 w-5" /> Add New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingTaskId ? 'Edit Task' : 'Create New Task'}</DialogTitle>
                <DialogDescription>Fill in the details for the task.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="taskTitle" className="text-right">Title</Label>
                  <Input id="taskTitle" value={currentTaskForm.title} onChange={e => setCurrentTaskForm(f => ({ ...f, title: e.target.value }))} className="col-span-3" placeholder="Task title" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="taskDesc" className="text-right">Description</Label>
                  <Textarea id="taskDesc" value={currentTaskForm.description} onChange={e => setCurrentTaskForm(f => ({ ...f, description: e.target.value }))} className="col-span-3" placeholder="Detailed description" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="taskAssignedTo" className="text-right">Assigned To</Label>
                  <Input 
                    id="taskAssignedTo" 
                    value={currentTaskForm.assignedTo.join(', ')} 
                    onChange={e => setCurrentTaskForm(f => ({ ...f, assignedTo: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} 
                    className="col-span-3" placeholder="Comma-separated names (mock)" 
                   />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="taskDueDate" className="text-right">Due Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={`col-span-3 justify-start text-left font-normal ${!currentTaskForm.dueDate && "text-muted-foreground"}`}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {currentTaskForm.dueDate ? format(currentTaskForm.dueDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={currentTaskForm.dueDate} onSelect={date => setCurrentTaskForm(f => ({ ...f, dueDate: date }))} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="taskPriority" className="text-right">Priority</Label>
                  <Select value={currentTaskForm.priority} onValueChange={(value: TaskPriority) => setCurrentTaskForm(f => ({ ...f, priority: value }))}>
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
                  <Select value={currentTaskForm.status} onValueChange={(value: TaskStatus) => setCurrentTaskForm(f => ({ ...f, status: value }))}>
                    <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Not Started">Not Started</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Pending Review">Pending Review</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Points input (optional based on your blueprint) */}
                {/* <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="taskPoints" className="text-right">Points</Label>
                  <Input id="taskPoints" type="number" value={currentTaskForm.points || ''} onChange={e => setCurrentTaskForm(f => ({ ...f, points: parseInt(e.target.value) || 0 }))} className="col-span-3" />
                </div> */}
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline" onClick={() => { setIsTaskFormDialogOpen(false); setEditingTaskId(null); }}>Cancel</Button></DialogClose>
                <Button onClick={handleTaskFormSubmit}>Save Task</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
            <div className="relative">
                <Label htmlFor="search-tasks">Search</Label>
                <Search className="absolute left-2.5 top-[calc(50%+0.3rem)] -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="search-tasks" placeholder="Search tasks..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <div>
                <Label htmlFor="status-filter">Status</Label>
                <Select value={statusFilter} onValueChange={(value: TaskStatus | 'All') => setStatusFilter(value)}>
                <SelectTrigger id="status-filter"><SelectValue placeholder="Filter by status..." /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="All">All Statuses</SelectItem>
                    <SelectItem value="Not Started">Not Started</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Pending Review">Pending Review</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
                </Select>
            </div>
            <div>
                <Label htmlFor="priority-filter">Priority</Label>
                <Select value={priorityFilter} onValueChange={(value: TaskPriority | 'All') => setPriorityFilter(value)}>
                <SelectTrigger id="priority-filter"><SelectValue placeholder="Filter by priority..." /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="All">All Priorities</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
                </Select>
            </div>
             <Popover open={isAddFilterPopoverOpen} onOpenChange={setIsAddFilterPopoverOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full md:w-auto mt-auto"> {/* Ensure button aligns with others */}
                        <Tag className="mr-2 h-4 w-4" /> Add Dynamic Filter
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <h4 className="font-medium leading-none">Add New Filter</h4>
                            <p className="text-sm text-muted-foreground">Select a column and value to filter tasks.</p>
                        </div>
                        <div className="grid gap-2">
                            <div className="grid grid-cols-3 items-center gap-4">
                            <Label htmlFor="filter-column">Column</Label>
                            <Select
                                value={newFilterColumn?.id}
                                onValueChange={(value) => {
                                    const selected = availableTaskFilterColumns.find(col => col.id === value);
                                    if (selected) setNewFilterColumn(selected);
                                }}
                            >
                                <SelectTrigger id="filter-column" className="col-span-2 h-8">
                                <SelectValue placeholder="Select column" />
                                </SelectTrigger>
                                <SelectContent>
                                {availableTaskFilterColumns.map(col => (
                                    <SelectItem key={col.id} value={col.id}>{col.name}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            </div>
                            <div className="grid grid-cols-3 items-center gap-4">
                            <Label htmlFor="filter-value">Value</Label>
                            <Input
                                id="filter-value"
                                value={newFilterValue}
                                onChange={(e) => setNewFilterValue(e.target.value)}
                                className="col-span-2 h-8"
                                placeholder="Enter value"
                            />
                            </div>
                        </div>
                        <Button onClick={handleAddDynamicFilter}>Apply Filter</Button>
                    </div>
                </PopoverContent>
            </Popover>
          </div>
            {activeDynamicFilters.length > 0 && (
                <div className="mt-4 space-y-2">
                    <Label>Active Dynamic Filters:</Label>
                    <div className="flex flex-wrap gap-2">
                    {activeDynamicFilters.map(filter => (
                        <Badge key={filter.id} variant="secondary" className="flex items-center gap-1 pr-1">
                        {filter.columnName}: &quot;{filter.value}&quot;
                        <button onClick={() => removeDynamicFilter(filter.id)} className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5">
                            <XIcon className="h-3 w-3" />
                            <span className="sr-only">Remove filter</span>
                        </button>
                        </Badge>
                    ))}
                    </div>
                </div>
            )}


          {filteredAndSortedTasks.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestSort('title')}>
                        Task Title <ArrowUpDown className={`ml-2 h-3 w-3 inline ${sortConfig.key === 'title' ? 'opacity-100' : 'opacity-30'}`} />
                    </TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestSort('dueDate')}>
                        Due Date <ArrowUpDown className={`ml-2 h-3 w-3 inline ${sortConfig.key === 'dueDate' ? 'opacity-100' : 'opacity-30'}`} />
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestSort('priority')}>
                        Priority <ArrowUpDown className={`ml-2 h-3 w-3 inline ${sortConfig.key === 'priority' ? 'opacity-100' : 'opacity-30'}`} />
                    </TableHead>
                     <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestSort('status')}>
                        Status <ArrowUpDown className={`ml-2 h-3 w-3 inline ${sortConfig.key === 'status' ? 'opacity-100' : 'opacity-30'}`} />
                    </TableHead>
                    {customTaskColumnDefinitions.map(col => (
                      <TableHead key={col.id}>{col.name}</TableHead>
                    ))}
                    <TableHead className="text-right">
                        <AlertDialog open={isAddCustomTaskColumnDialogOpen} onOpenChange={setIsAddCustomTaskColumnDialogOpen}>
                        <AlertDialogTrigger asChild>
                           <Button variant="outline" size="sm">
                             <PlusCircle className="mr-2 h-4 w-4" /> Add Column
                           </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <form onSubmit={handleAddCustomTaskColumnSubmit}>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Add New Custom Task Column</AlertDialogTitle>
                              <AlertDialogDescription>
                                Define a new column to track additional task information.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="space-y-4 py-4">
                              <div>
                                <Label htmlFor="newCustomTaskColName">Column Name</Label>
                                <Input id="newCustomTaskColName" value={newCustomTaskColumnForm.name} onChange={e => setNewCustomTaskColumnForm({...newCustomTaskColumnForm, name: e.target.value})} placeholder="E.g., Reviewer" required />
                              </div>
                              <div>
                                <Label htmlFor="newCustomTaskColDataType">Data Type</Label>
                                <Select value={newCustomTaskColumnForm.dataType} onValueChange={val => setNewCustomTaskColumnForm({...newCustomTaskColumnForm, dataType: val as CustomTaskColumnDefinition['dataType']})}>
                                  <SelectTrigger id="newCustomTaskColDataType"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="text">Text</SelectItem>
                                    <SelectItem value="number">Number</SelectItem>
                                    <SelectItem value="checkbox">Checkbox</SelectItem>
                                    <SelectItem value="dropdown">Dropdown</SelectItem>
                                    <SelectItem value="date">Date</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              {newCustomTaskColumnForm.dataType === 'dropdown' && (
                                <div>
                                  <Label htmlFor="newCustomTaskColOptions">Options (comma-separated)</Label>
                                  <Input id="newCustomTaskColOptions" value={newCustomTaskColumnForm.options} onChange={e => setNewCustomTaskColumnForm({...newCustomTaskColumnForm, options: e.target.value})} placeholder="E.g., Option A, Option B" />
                                </div>
                              )}
                              <div>
                                <Label htmlFor="newCustomTaskColDefaultValue">Default Value (optional)</Label>
                                <Input id="newCustomTaskColDefaultValue" value={newCustomTaskColumnForm.defaultValue} onChange={e => setNewCustomTaskColumnForm({...newCustomTaskColumnForm, defaultValue: e.target.value})} />
                              </div>
                            </div>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction type="submit">Save Column</AlertDialogAction>
                            </AlertDialogFooter>
                          </form>
                        </AlertDialogContent>
                       </AlertDialog>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedTasks.map((task) => (
                    <TableRow key={task.id} className={`${task.status === 'Completed' ? 'opacity-70' : ''} ${taskToDelete?.id === task.id ? 'bg-destructive/20' : ''}`}>
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
                       {customTaskColumnDefinitions.map(colDef => (
                        <TableCell key={colDef.id}>
                          {renderCustomTaskCell(task, colDef)}
                        </TableCell>
                      ))}
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditTaskDialog(task)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" onClick={() => openDeleteConfirmDialog(task)}>
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

      <AlertDialog open={isDeleteConfirmDialogOpen} onOpenChange={setIsDeleteConfirmDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the task
                <span className="font-semibold"> &quot;{taskToDelete?.title}&quot;</span>.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTaskToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTask} className={buttonVariants({ variant: "destructive" })}>
                Confirm Delete
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Helper function for buttonVariants, replace with actual import if it exists
const buttonVariants = (opts: any) => "";
