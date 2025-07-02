
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { Task, TaskPriority, TaskStatus, UserProfileData, SubEvent } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, isValid } from 'date-fns';
import { ListChecks, Loader2, PlusCircle, Trash2, CalendarIcon, ChevronDown, CheckCircle } from 'lucide-react';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Unsubscribe, runTransaction, serverTimestamp, increment, getDocs, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import TaskBoard from '@/components/tasks/TaskBoard';

const defaultTaskFormState: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'assignedToUserIds'> & { assignedToUserIds: string[] } = {
  title: '',
  description: '',
  assignedToUserIds: [],
  dueDate: undefined,
  priority: 'Medium',
  status: 'Not Started',
  pointsOnCompletion: 10,
  subEventId: 'general',
  subtasks: [],
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
  const { toast } = useToast();
  const { userProfile } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [allEvents, setAllEvents] = useState<SubEvent[]>([]);
  const [allStaff, setAllStaff] = useState<UserProfileData[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [isTaskFormDialogOpen, setIsTaskFormDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  const [currentTaskForm, setCurrentTaskForm] = useState<any>(defaultTaskFormState);

  const [isDeleteConfirmDialogOpen, setIsDeleteConfirmDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  useEffect(() => {
    if (!userProfile) return;

    setLoadingData(true);
    const unsubs: Unsubscribe[] = [];

    const setupListeners = async () => {
      try {
        const eventsQuery = query(collection(db, 'subEvents'));
        unsubs.push(onSnapshot(eventsQuery, (snapshot) => setAllEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubEvent)))));
        
        const staffRoles = ['organizer', 'event_representative', 'overall_head', 'admin'];
        const staffQuery = query(collection(db, 'users'), where('role', 'in', staffRoles));
        unsubs.push(onSnapshot(staffQuery, (snapshot) => setAllStaff(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfileData)))));

        const tasksQuery = query(collection(db, 'tasks'));
        unsubs.push(onSnapshot(tasksQuery, (snapshot) => {
          const tasksList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
          setTasks(tasksList);
          if (loadingData) setLoadingData(false);
        }));

      } catch (error) {
        console.error("Error setting up listeners:", error);
        toast({ title: "Error", description: "Could not initialize page data.", variant: "destructive" });
        setLoadingData(false);
      }
    };

    setupListeners();
    return () => unsubs.forEach(unsub => unsub());
  }, [userProfile, toast, loadingData]);

  const handleOpenTaskModal = (task: Task | null) => {
    setEditingTask(task);
    if (task) {
      setCurrentTaskForm({
        ...task,
        dueDate: task.dueDate && isValid(parseISO(task.dueDate)) ? parseISO(task.dueDate) : undefined,
        subtasks: task.subtasks || [],
      });
    } else {
      setCurrentTaskForm(defaultTaskFormState);
    }
    setIsTaskFormDialogOpen(true);
  };
  
  const handleTaskFormSubmit = async () => {
    if (!currentTaskForm.title || !currentTaskForm.dueDate) {
      toast({ title: "Missing Information", description: "Title and Due Date are required.", variant: "destructive" });
      return;
    }

    const taskDataToSave: Partial<Task> = {
      ...currentTaskForm,
      assignedByUserId: userProfile?.uid,
      dueDate: currentTaskForm.dueDate.toISOString(),
      updatedAt: serverTimestamp(),
      subtasks: currentTaskForm.subtasks || [],
    };

    try {
      if (editingTask) {
        const taskRef = doc(db, 'tasks', editingTask.id);
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

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    if (!userProfile) return;
    const taskRef = doc(db, "tasks", taskId);
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Award points only when moving to 'Completed' from another status
    if (newStatus === 'Completed' && task.status !== 'Completed') {
        const pointsToAdd = task.pointsOnCompletion || 10;
        try {
            await runTransaction(db, async (transaction) => {
                const taskDoc = await transaction.get(taskRef);
                if (!taskDoc.exists() || taskDoc.data().status === 'Completed') {
                    throw new Error("Task is already completed or does not exist.");
                }

                // Update the task status
                transaction.update(taskRef, {
                    status: 'Completed',
                    completedByUserId: userProfile.uid,
                    completedAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });

                // Update credibility score for each assigned user
                if (task.assignedToUserIds && task.assignedToUserIds.length > 0) {
                    for (const assigneeId of task.assignedToUserIds) {
                        const userRef = doc(db, "users", assigneeId);
                        const userDoc = await transaction.get(userRef);
                        if(userDoc.exists()) {
                            const oldScore = userDoc.data().credibilityScore || 0;
                            transaction.update(userRef, { credibilityScore: increment(pointsToAdd) });
                            // Check for notifications outside transaction if it's complex
                        }
                    }
                }
            });

            toast({ title: "Task Completed!", description: `${pointsToAdd} points awarded.` });

            // Post-transaction logic (like notifications)
            if (task.assignedToUserIds && task.assignedToUserIds.length > 0) {
                 for (const assigneeId of task.assignedToUserIds) {
                    const userRef = doc(db, "users", assigneeId);
                    const userDoc = await getDoc(userRef);
                    if (userDoc.exists()) {
                        const oldScore = (userDoc.data().credibilityScore || 0) - pointsToAdd;
                        const newScore = userDoc.data().credibilityScore || 0;
                        await checkAndSendRankNotification(assigneeId, oldScore, newScore);
                    }
                 }
            }

        } catch (e: any) {
            console.error("Transaction failed: ", e);
            toast({ title: "Error", description: e.message || "Failed to update task and scores.", variant: "destructive" });
        }
    } else {
        // Handle regular status changes without score updates
        await updateDoc(taskRef, { status: newStatus, updatedAt: serverTimestamp() });
    }
};

  const handleDeleteTask = async () => {
    if (taskToDelete) {
      try {
        await deleteDoc(doc(db, 'tasks', taskToDelete.id));
        toast({ title: "Task Deleted" });
      } catch (error) {
        console.error("Error deleting task:", error);
        toast({ title: "Delete Failed", variant: "destructive" });
      } finally {
        setIsDeleteConfirmDialogOpen(false);
        setTaskToDelete(null);
      }
    }
  };

  const canCreateTasks = userProfile && ['admin', 'overall_head', 'event_representative'].includes(userProfile.role);

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col space-y-4">
      <header className="flex flex-shrink-0 flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center">
            <ListChecks className="mr-3 h-7 w-7" /> Task Board
          </h1>
          <p className="text-muted-foreground">A collaborative board for all event-related tasks.</p>
        </div>
        {canCreateTasks && (
          <Button onClick={() => handleOpenTaskModal(null)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Task
          </Button>
        )}
      </header>

      <div className="flex-grow overflow-x-auto">
        {loadingData ? (
          <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <TaskBoard
            tasks={tasks}
            staff={allStaff}
            onEditTask={handleOpenTaskModal}
            onStatusChange={handleStatusChange}
          />
        )}
      </div>

      <Dialog open={isTaskFormDialogOpen} onOpenChange={setIsTaskFormDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editingTask ? 'Edit Task' : 'Create New Task'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
              <Input placeholder="Title" value={currentTaskForm.title} onChange={e => setCurrentTaskForm({ ...currentTaskForm, title: e.target.value })} />
              <Textarea placeholder="Description" value={currentTaskForm.description} onChange={e => setCurrentTaskForm({ ...currentTaskForm, description: e.target.value })} />
              <Popover>
                  <PopoverTrigger asChild>
                  <Button variant="outline" className={`justify-start text-left font-normal ${!currentTaskForm.dueDate && "text-muted-foreground"}`}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {currentTaskForm.dueDate ? format(currentTaskForm.dueDate, "PPP") : <span>Pick a due date</span>}
                  </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={currentTaskForm.dueDate} onSelect={date => setCurrentTaskForm({ ...currentTaskForm, dueDate: date })} initialFocus /></PopoverContent>
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
                        <Button variant="outline" className="w-full justify-between">
                            {currentTaskForm.assignedToUserIds.length > 0 ? `${currentTaskForm.assignedToUserIds.length} users selected` : "Select Assignees"}
                            <ChevronDown className="ml-2 h-4 w-4 opacity-50"/>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-full">
                        {allStaff.map(user => (
                        <DropdownMenuCheckboxItem key={user.uid} checked={currentTaskForm.assignedToUserIds.includes(user.uid)} onCheckedChange={checked => {
                            const newAssigned = checked ? [...currentTaskForm.assignedToUserIds, user.uid] : currentTaskForm.assignedToUserIds.filter((uid:string) => uid !== user.uid);
                            setCurrentTaskForm({...currentTaskForm, assignedToUserIds: newAssigned});
                        }}>{user.fullName} ({user.role?.replace(/_/g, ' ')})</DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div>
                <Label htmlFor="points">Points on Completion</Label>
                <Input id="points" type="number" value={currentTaskForm.pointsOnCompletion} onChange={e => setCurrentTaskForm({...currentTaskForm, pointsOnCompletion: Number(e.target.value)})} />
              </div>
              <div>
                <Label>Subtasks</Label>
                <div className="space-y-2">
                    {(currentTaskForm.subtasks || []).map((subtask: any, index: number) => (
                        <div key={subtask.id} className="flex items-center gap-2">
                            <CheckCircle className={`h-4 w-4 ${subtask.completed ? 'text-green-500' : 'text-muted-foreground'}`} />
                            <Input value={subtask.text} className="h-8" onChange={(e) => {
                                const newSubtasks = [...currentTaskForm.subtasks];
                                newSubtasks[index].text = e.target.value;
                                setCurrentTaskForm({...currentTaskForm, subtasks: newSubtasks});
                            }}/>
                             <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                                const newSubtasks = [...currentTaskForm.subtasks];
                                newSubtasks[index].completed = !newSubtasks[index].completed;
                                setCurrentTaskForm({...currentTaskForm, subtasks: newSubtasks});
                             }}><CheckCircle className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                                const newSubtasks = currentTaskForm.subtasks.filter((_:any, i:number) => i !== index);
                                setCurrentTaskForm({...currentTaskForm, subtasks: newSubtasks});
                            }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => {
                        const newSubtasks = [...(currentTaskForm.subtasks || []), { id: `subtask-${Date.now()}`, text: '', completed: false }];
                        setCurrentTaskForm({...currentTaskForm, subtasks: newSubtasks});
                    }}>Add Subtask</Button>
                </div>
              </div>
          </div>
          <div className="p-6 pt-0">
            <Button onClick={handleTaskFormSubmit} className="w-full">Save Task</Button>
          </div>
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
