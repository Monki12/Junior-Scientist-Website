
'use client';

import { useEffect, useState, useMemo, useCallback, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { subEventsData } from '@/data/subEvents';
import type { Task, TaskPriority, TaskStatus, CustomTaskColumnDefinition, ActiveTaskFilter, UserProfileData } from '@/types';
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
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, isValid, isPast, startOfDay, differenceInDays, addDays } from 'date-fns';
import {
  ListChecks, ShieldAlert, Loader2, Search, Filter, PlusCircle, Edit2, Trash2, CalendarIcon, ArrowUpDown, Tag, XIcon, ChevronDown, Rows, GanttChartSquare, LayoutDashboard
} from 'lucide-react';

const mockAssignableUsersForEvent = [
  'Alice (Organizer)', 
  'Bob (Event Rep for this Event)', 
  'Carol (Overall Head)', 
  'David (Organizer)',
  'Self (Current User)' 
];

const initialMockTasks: Task[] = [
  { id: 'task-1', title: 'Prepare Quiz Questions Set A', description: 'Create 50 multiple choice questions for round 1.', assignedTo: ['Alice (Organizer)'], dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), priority: 'High', status: 'In Progress', eventSlug: 'ex-quiz-it', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), updatedAt: new Date().toISOString(), createdBy: 'Event Rep Bob', customTaskData: { notes: 'Focus on STEM', difficulty: 5 } },
  { id: 'task-2', title: 'Book Auditorium', description: 'Finalize booking for the main hall for Dec 5th.', assignedTo: ['Self (Current User)'], dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), priority: 'High', status: 'Pending Review', eventSlug: 'ex-quiz-it', createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), updatedAt: new Date().toISOString(), createdBy: 'Event Rep Bob' },
  { id: 'task-3', title: 'Design Participation Certificates', description: 'Create a template for certificates.', assignedTo: ['Carol (Overall Head)'], dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), priority: 'Medium', status: 'Not Started', eventSlug: 'ex-quiz-it', createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), updatedAt: new Date().toISOString(), createdBy: 'Event Rep Bob' },
  { id: 'task-4', title: 'Arrange Volunteer Refreshments', description: 'Coordinate with catering for volunteer snacks and drinks.', assignedTo: ['Bob (Event Rep for this Event)'], dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), priority: 'Low', status: 'Completed', eventSlug: 'ex-quiz-it', createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), updatedAt: new Date().toISOString(), createdBy: 'Admin' },
  { id: 'task-5', title: 'Setup Online Registration Form', description: 'Deploy and test the online registration portal for the event.', assignedTo: ['David (Organizer)', 'Self (Current User)'], dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), priority: 'High', status: 'Not Started', eventSlug: 'ex-quiz-it', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: 'Event Rep Bob' },
  { id: 'task-6', title: 'Finalize Judge Panel', description: 'Confirm availability of all judges for the main event days.', assignedTo: ['Carol (Overall Head)'], dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(), priority: 'Medium', status: 'In Progress', eventSlug: 'ex-quiz-it', createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), updatedAt: new Date().toISOString(), createdBy: 'Event Rep Bob' },
];

const defaultTaskFormState = {
  title: '',
  description: '',
  assignedTo: [] as string[],
  dueDate: undefined as Date | undefined,
  priority: 'Medium' as TaskPriority,
  status: 'Not Started' as TaskStatus,
  points: 0,
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


const BasicTimelineView = ({ tasks }: { tasks: Task[] }) => {
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
            if(taskStartDate > taskDueDate) durationDays = 0; // Handle cases where start is after due

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

  const [tasks, setTasks] = useState<Task[]>(initialMockTasks);
  const [eventTitle, setEventTitle] = useState<string>('Event Tasks');
  const [isClient, setIsClient] = useState(false);
  const [currentView, setCurrentView] = useState<TaskViewMode>('list');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'All'>('All');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'All'>('All');
  const [assignedToFilter, setAssignedToFilter] = useState('');
  
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
    customTaskData?: Record<string, any>;
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
        // Mock: Filter tasks by assigned event if needed for specific user views, or show all for admin/overall head
        // For now, using initialMockTasks which may not be event-specific
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

    let finalAssignedTo = currentTaskForm.assignedTo;
    if (currentTaskForm.assignedTo.includes('Self (Current User)') && userProfile?.displayName) {
      finalAssignedTo = finalAssignedTo.map(u => u === 'Self (Current User)' ? userProfile.displayName! : u).filter((value, index, self) => self.indexOf(value) === index);
    }
    
    const taskDataToSave = {
      title: currentTaskForm.title,
      description: currentTaskForm.description,
      assignedTo: finalAssignedTo,
      dueDate: currentTaskForm.dueDate!.toISOString(),
      priority: currentTaskForm.priority,
      status: currentTaskForm.status,
      points: currentTaskForm.points || 0,
      customTaskData: currentTaskForm.customTaskData || {},
      updatedAt: new Date().toISOString(),
    };

    if (editingTaskId) { 
      setTasks(prev => prev.map(task => task.id === editingTaskId ? {
        ...task,
        ...taskDataToSave,
      } : task));
      toast({ title: "Task Updated", description: `Task "${currentTaskForm.title}" has been updated.` });
    } else { 
      const newTask: Task = {
        id: `task-${Date.now()}`,
        ...taskDataToSave,
        createdBy: userProfile?.displayName || 'Current User',
        createdAt: new Date().toISOString(),
        eventSlug: (userProfile?.role === 'event_representative' && userProfile.assignedEventSlug) ? userProfile.assignedEventSlug : 'general',
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
    let assignedToForForm = task.assignedTo || [];
    if (userProfile?.displayName && assignedToForForm.includes(userProfile.displayName)) {
      assignedToForForm = assignedToForForm.map(u => u === userProfile.displayName ? 'Self (Current User)' : u);
    }

    setCurrentTaskForm({
      id: task.id,
      title: task.title,
      description: task.description || '',
      assignedTo: assignedToForForm,
      dueDate: task.dueDate ? parseISO(task.dueDate) : undefined,
      priority: task.priority,
      status: task.status,
      points: task.points || 0,
      customTaskData: task.customTaskData || {},
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
  const statusOrder: Record<TaskStatus, number> = { 'Not Started': 1, 'In Progress': 2, 'Pending Review': 3, 'Completed': 4 };


  const filteredAndSortedTasks = useMemo(() => {
    let sortableTasks = [...tasks];
    
    sortableTasks = sortableTasks.filter(task => {
      const searchTermLower = searchTerm.toLowerCase();
      const assignedToFilterLower = assignedToFilter.toLowerCase();

      const matchesSearch = searchTermLower === '' ||
        task.title.toLowerCase().includes(searchTermLower) ||
        (task.description && task.description.toLowerCase().includes(searchTermLower));
      
      const matchesAssignedTo = assignedToFilterLower === '' || 
        (task.assignedTo && task.assignedTo.some(assignee => assignee.toLowerCase().includes(assignedToFilterLower)));

      const matchesStatus = statusFilter === 'All' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'All' || task.priority === priorityFilter;
      
      let matchesDynamic = true;
      if (activeDynamicFilters.length > 0) {
        matchesDynamic = activeDynamicFilters.every(filter => {
          let taskValue: any;
          if (filter.isCustom) {
            taskValue = task.customTaskData?.[filter.columnId];
          } else {
            taskValue = (task as any)[filter.columnId];
          }

          if (taskValue === undefined || taskValue === null) {
            if (typeof taskValue === 'boolean' && filter.value.toLowerCase() === 'false') return true;
            return false;
          }
          
          const valueStr = String(taskValue).toLowerCase();
          const filterValueStr = filter.value.toLowerCase();

          if (filter.columnId === 'assignedTo' && Array.isArray(taskValue)) {
            return taskValue.some(assignee => String(assignee).toLowerCase().includes(filterValueStr));
          }
          if (typeof taskValue === 'boolean') {
            return filterValueStr === String(taskValue).toLowerCase();
          }
          return valueStr.includes(filterValueStr);
        });
      }
      
      return matchesSearch && matchesAssignedTo && matchesStatus && matchesPriority && matchesDynamic;
    });


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
  }, [tasks, searchTerm, statusFilter, priorityFilter, assignedToFilter, activeDynamicFilters, sortConfig]);
  

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
        ? { ...p, customTaskData: { ...(p.customTaskData || {}), [columnId]: value }, updatedAt: new Date().toISOString() }
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
          return <Input type="date" value={value && isValid(parseISO(String(value))) ? format(parseISO(String(value)), 'yyyy-MM-dd') : ''} onChange={(e) => handleCustomTaskDataChange(task.id, column.id, e.target.value ? new Date(e.target.value).toISOString() : '')} onBlur={() => setEditingCustomCell(null)} autoFocus className="h-8 text-xs"/>;
        case 'checkbox':
           return <Checkbox checked={!!value} onCheckedChange={(checked) => {handleCustomTaskDataChange(task.id, column.id, !!checked); setEditingCustomCell(null);}} />;
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
        case 'date':
            return <span onClick={() => setEditingCustomCell({ taskId: task.id, columnId: column.id })} className="cursor-pointer hover:bg-muted/50 p-1 rounded min-h-[2rem] block">{value && isValid(parseISO(String(value))) ? format(parseISO(String(value)), 'MMM dd, yyyy') : 'N/A'}</span>;
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
        <Button onClick={() => router.push('/dashboard')} className="mt-4">Go to Dashboard</Button>
      </div>
    );
  }

  const getSortIndicator = (columnKey: SortableTaskFields) => {
    if (sortConfig.key === columnKey) {
      return sortConfig.direction === 'asc' ? '↑' : '↓';
    }
    return <ArrowUpDown className="h-3 w-3 opacity-30 group-hover:opacity-70 inline-block ml-1" />;
  };

  const activeStaticFiltersForDisplay = [
    searchTerm && { label: 'Search', value: searchTerm },
    statusFilter !== 'All' && { label: 'Status', value: statusFilter },
    priorityFilter !== 'All' && { label: 'Priority', value: priorityFilter },
    assignedToFilter && { label: 'Assigned To', value: assignedToFilter },
  ].filter(Boolean);

  const allActiveFiltersForDisplay = [
    ...activeStaticFiltersForDisplay.map(f => ({ ...f, isDynamic: false, id: f!.label.toLowerCase()})),
    ...activeDynamicFilters.map(df => ({ label: df.columnName, value: df.value, id: df.id, isDynamic: true }))
  ];


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
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" asChild>
                <Link href="/dashboard">
                  <LayoutDashboard className="mr-2 h-4 w-4" /> Go to Dashboard
                </Link>
            </Button>
            <Button 
                variant={currentView === 'list' ? 'secondary' : 'outline'} 
                onClick={() => setCurrentView('list')}
                className="shadow-sm hover:shadow-md-soft transition-shadow"
            >
                <Rows className="mr-2 h-4 w-4"/> List View
            </Button>
            <Button 
                variant={currentView === 'timeline' ? 'secondary' : 'outline'} 
                onClick={() => setCurrentView('timeline')}
                className="shadow-sm hover:shadow-md-soft transition-shadow"
            >
                <GanttChartSquare className="mr-2 h-4 w-4"/> Timeline View
            </Button>
            <Dialog open={isTaskFormDialogOpen} onOpenChange={(isOpen) => {
                setIsTaskFormDialogOpen(isOpen);
                if (!isOpen) {
                    setEditingTaskId(null);
                    setCurrentTaskForm(defaultTaskFormState);
                }
            }}>
                <DialogTrigger asChild>
                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-soft hover:shadow-md-soft transition-all hover:scale-105" onClick={() => { setEditingTaskId(null); setCurrentTaskForm(defaultTaskFormState); setIsTaskFormDialogOpen(true); }}>
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
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="col-span-3 justify-between text-left font-normal h-auto min-h-10 hover:bg-accent/10">
                                <span className="flex-1 truncate pr-1">
                                {currentTaskForm.assignedTo.length > 0 ? currentTaskForm.assignedTo.join(', ') : "Select Assignees"}
                                </span>
                                <ChevronDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                                <DropdownMenuLabel>Assignable Users (Mock)</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {mockAssignableUsersForEvent.map(user => (
                                <DropdownMenuCheckboxItem
                                    key={user}
                                    checked={currentTaskForm.assignedTo.includes(user)}
                                    onCheckedChange={(checked) => {
                                    setCurrentTaskForm(f => {
                                        const newAssignedTo = checked 
                                        ? [...f.assignedTo, user] 
                                        : f.assignedTo.filter(u => u !== user);
                                        return { ...f, assignedTo: newAssignedTo.filter((v, i, a) => a.indexOf(v) === i) }; 
                                    });
                                    }}
                                >
                                    {user}
                                </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="taskDueDate" className="text-right">Due Date</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button variant="outline" className={`col-span-3 justify-start text-left font-normal hover:bg-accent/10 ${!currentTaskForm.dueDate && "text-muted-foreground"}`}>
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
                        <SelectTrigger className="col-span-3 hover:bg-accent/10"><SelectValue /></SelectTrigger>
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
                        <SelectTrigger className="col-span-3 hover:bg-accent/10"><SelectValue /></SelectTrigger>
                        <SelectContent>
                        <SelectItem value="Not Started">Not Started</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Pending Review">Pending Review</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        </SelectContent>
                    </Select>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="taskPoints" className="text-right">Points</Label>
                        <Input id="taskPoints" type="number" value={currentTaskForm.points || 0} onChange={e => setCurrentTaskForm(f => ({ ...f, points: parseInt(e.target.value) || 0 }))} className="col-span-3" placeholder="Optional points" />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button onClick={handleTaskFormSubmit} className="bg-primary hover:bg-primary/90">Save Task</Button>
                </DialogFooter>
                </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="relative">
                <Label htmlFor="search-tasks">Search Tasks</Label>
                <Search className="absolute left-2.5 top-[calc(50%+0.3rem)] -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="search-tasks" placeholder="Title, description..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
             <div>
                <Label htmlFor="assignedTo-filter">Filter Assigned To</Label>
                <Input id="assignedTo-filter" placeholder="Assignee name..." value={assignedToFilter} onChange={e => setAssignedToFilter(e.target.value)} />
            </div>
            <div>
                <Label htmlFor="status-filter">Filter Status</Label>
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
                <Label htmlFor="priority-filter">Filter Priority</Label>
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
            <div className="lg:col-span-1">
                 <Popover open={isAddFilterPopoverOpen} onOpenChange={setIsAddFilterPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full hover:bg-accent/10">
                            <Tag className="mr-2 h-4 w-4" /> Add Dynamic Filter
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <h4 className="font-medium leading-none">Add Dynamic Filter</h4>
                                <p className="text-sm text-muted-foreground">Select column & value.</p>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="filter-column">Column</Label>
                                <Select
                                    value={newFilterColumn?.id}
                                    onValueChange={(value) => {
                                        const selected = availableTaskFilterColumns.find(col => col.id === value);
                                        if (selected) setNewFilterColumn(selected);
                                    }}
                                >
                                    <SelectTrigger id="filter-column" className="h-8">
                                    <SelectValue placeholder="Select column" />
                                    </SelectTrigger>
                                    <SelectContent>
                                    {availableTaskFilterColumns.map(col => (
                                        <SelectItem key={col.id} value={col.id}>{col.name}</SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                                <Label htmlFor="filter-value">Value</Label>
                                <Input
                                    id="filter-value"
                                    value={newFilterValue}
                                    onChange={(e) => setNewFilterValue(e.target.value)}
                                    className="h-8"
                                    placeholder="Enter value"
                                />
                            </div>
                            <Button onClick={handleAddDynamicFilter}>Apply Filter</Button>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
          </div>
            {allActiveFiltersForDisplay.length > 0 && (
                <div className="mb-4 space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground">Active Filters:</Label>
                    <div className="flex flex-wrap gap-1.5 items-center">
                    {allActiveFiltersForDisplay.map((filter: any) => (
                        <Badge key={filter.id || filter.label} variant="secondary" className="flex items-center gap-1 pr-1 text-xs py-0.5 px-1.5 rounded hover:bg-muted/80">
                        {filter.label}: {filter.value}
                        {filter.isDynamic && (
                             <button onClick={() => removeDynamicFilter(filter.id)} className="ml-1 rounded-full hover:bg-destructive/20 hover:text-destructive p-0.5">
                                <XIcon className="h-2.5 w-2.5" />
                                <span className="sr-only">Remove filter</span>
                            </button>
                        )}
                        </Badge>
                    ))}
                    </div>
                </div>
            )}


          {currentView === 'list' ? (
            filteredAndSortedTasks.length > 0 ? (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/80 group" onClick={() => requestSort('title')}>
                        <div className="flex items-center gap-1">
                            Task Title {getSortIndicator('title')}
                        </div>
                    </TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/80 group" onClick={() => requestSort('dueDate')}>
                         <div className="flex items-center gap-1">
                            Due Date {getSortIndicator('dueDate')}
                        </div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/80 group" onClick={() => requestSort('priority')}>
                        <div className="flex items-center gap-1">
                            Priority {getSortIndicator('priority')}
                        </div>
                    </TableHead>
                     <TableHead className="cursor-pointer hover:bg-muted/80 group" onClick={() => requestSort('status')}>
                        <div className="flex items-center gap-1">
                            Status {getSortIndicator('status')}
                        </div>
                    </TableHead>
                    {customTaskColumnDefinitions.map(col => (
                      <TableHead key={col.id}>{col.name}</TableHead>
                    ))}
                    <TableHead className="text-right">
                        <AlertDialog open={isAddCustomTaskColumnDialogOpen} onOpenChange={setIsAddCustomTaskColumnDialogOpen}>
                          <AlertDialogTrigger asChild>
                           <Button variant="outline" size="sm" className="border-dashed hover:border-primary hover:text-primary h-8">
                             <PlusCircle className="mr-2 h-4 w-4" /> Add Column
                           </Button>
                          </AlertDialogTrigger>
                          <DialogContent>
                          <form onSubmit={handleAddCustomTaskColumnSubmit}>
                            <DialogHeader>
                              <DialogTitle>Add New Custom Task Column</DialogTitle>
                              <DialogDescription>
                                Define a new column to track additional task information.
                              </DialogDescription>
                            </DialogHeader>
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
                            <DialogFooter>
                              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                              <Button type="submit">Save Column</Button>
                            </DialogFooter>
                          </form>
                          </DialogContent>
                       </AlertDialog>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedTasks.map((task) => (
                    <TableRow 
                        key={task.id} 
                        className={`hover:bg-muted/30 transition-colors duration-150 ${task.status === 'Completed' ? 'opacity-60 bg-green-500/5' : ''} ${taskToDelete?.id === task.id ? 'bg-destructive/10' : ''}`}
                    >
                      <TableCell>
                        <Checkbox
                          checked={task.status === 'Completed'}
                          onCheckedChange={() => toggleTaskStatus(task.id, task.status)}
                          aria-label={`Mark task ${task.title} as ${task.status === 'Completed' ? 'incomplete' : 'complete'}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium max-w-xs truncate" title={task.title}>{task.title}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{task.assignedTo && task.assignedTo.length > 0 ? task.assignedTo.join(', ') : <span className="italic">Unassigned</span>}</TableCell>
                      <TableCell className={`${task.dueDate && isValid(parseISO(task.dueDate)) && isPast(startOfDay(parseISO(task.dueDate))) && task.status !== 'Completed' ? 'text-red-600 font-semibold' : 'text-muted-foreground'}`}>
                        {task.dueDate && isValid(parseISO(task.dueDate)) ? format(parseISO(task.dueDate), 'MMM dd, yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPriorityBadgeVariant(task.priority)} className="capitalize text-xs py-0.5 px-2">{task.priority}</Badge>
                      </TableCell>
                      <TableCell>
                         <Badge variant={getStatusBadgeVariant(task.status).variant} className={`capitalize text-xs py-0.5 px-2 ${getStatusBadgeVariant(task.status).colorClass}`}>{task.status.replace('-', ' ')}</Badge>
                      </TableCell>
                       {customTaskColumnDefinitions.map(colDef => (
                        <TableCell key={colDef.id}>
                          {renderCustomTaskCell(task, colDef)}
                        </TableCell>
                      ))}
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" className="hover:bg-muted/50 h-8 w-8" onClick={() => openEditTaskDialog(task)}>
                          <Edit2 className="h-4 w-4" />
                           <span className="sr-only">Edit Task</span>
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 h-8 w-8" onClick={() => openDeleteConfirmDialog(task)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete Task</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground border rounded-md">
              <Filter className="h-12 w-12 mx-auto mb-3 text-primary/30" />
              <p className="text-lg">No tasks match your current filters.</p>
              <p className="text-sm">Try adjusting your search criteria or add a new task.</p>
            </div>
          )) : (
            <BasicTimelineView tasks={filteredAndSortedTasks} />
          )}
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteConfirmDialogOpen} onOpenChange={(isOpen) => {
          setIsDeleteConfirmDialogOpen(isOpen);
          if (!isOpen && taskToDelete) { 
            setTimeout(() => setTaskToDelete(null), 150); 
          } else if (!isOpen) {
            setTaskToDelete(null);
          }
      }}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the task
                <span className="font-semibold"> &quot;{taskToDelete?.title}&quot;</span>.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTask} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Confirm Delete
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

