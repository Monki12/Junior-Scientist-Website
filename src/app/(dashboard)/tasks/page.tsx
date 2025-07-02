
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { Task, UserProfileData, SubEvent, Board, Subtask } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, isValid } from 'date-fns';
import { ListChecks, Loader2, PlusCircle, Trash2, CalendarIcon, Users, Columns, CheckCircle } from 'lucide-react';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Unsubscribe, runTransaction, serverTimestamp, increment, getDocs, where, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import TaskBoard from '@/components/tasks/TaskBoard';

const defaultTaskFormState: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'boardId'> = {
  title: '',
  description: '',
  assignedToUserIds: [],
  dueDate: null,
  priority: 'Medium',
  status: 'Not Started',
  pointsOnCompletion: 10,
  subtasks: [],
};

export default function TasksPage() {
  const { toast } = useToast();
  const { userProfile } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [currentBoard, setCurrentBoard] = useState<Board | null>(null);
  const [boardUsers, setBoardUsers] = useState<UserProfileData[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'status' | 'user'>('status');

  const [isTaskFormDialogOpen, setIsTaskFormDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskFormState, setTaskFormState] = useState<any>(defaultTaskFormState);

  // Fetch all boards the user is a member of
  useEffect(() => {
    if (!userProfile?.uid) return;
    
    setLoading(true);
    const boardsQuery = query(collection(db, 'boards'), where('memberUids', 'array-contains', userProfile.uid));
    
    const unsubscribe = onSnapshot(boardsQuery, (snapshot) => {
      const userBoards = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Board));
      setBoards(userBoards);
      if (userBoards.length > 0 && !currentBoard) {
        setCurrentBoard(userBoards[0]);
      } else if (userBoards.length === 0) {
        setLoading(false);
      }
    }, (error) => {
      console.error("Error fetching boards:", error);
      toast({ title: "Error", description: "Could not fetch your task boards.", variant: "destructive" });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile?.uid, toast]);

  // Fetch tasks and users for the currently selected board
  useEffect(() => {
    if (!currentBoard) return;

    const unsubs: Unsubscribe[] = [];

    // Fetch tasks for the board
    const tasksQuery = query(collection(db, 'tasks'), where('boardId', '==', currentBoard.id));
    unsubs.push(onSnapshot(tasksQuery, (snapshot) => {
      const boardTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      setTasks(boardTasks);
      setLoading(false);
    }));

    // Fetch users for the board
    const usersQuery = query(collection(db, 'users'), where('uid', 'in', currentBoard.memberUids));
    unsubs.push(onSnapshot(usersQuery, (snapshot) => {
      const users = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfileData));
      setBoardUsers(users);
    }));

    return () => unsubs.forEach(unsub => unsub());
  }, [currentBoard]);

  const handleOpenTaskModal = (task: Task | null) => {
    setEditingTask(task);
    if (task) {
      setTaskFormState({
        ...task,
        dueDate: task.dueDate && isValid(parseISO(task.dueDate)) ? parseISO(task.dueDate) : undefined,
        subtasks: task.subtasks || [],
      });
    } else {
      setTaskFormState(defaultTaskFormState);
    }
    setIsTaskFormDialogOpen(true);
  };

  const handleTaskFormSubmit = async () => {
    if (!taskFormState.title || !currentBoard) {
      toast({ title: "Missing Information", description: "Title and a selected board are required.", variant: "destructive" });
      return;
    }

    const taskDataToSave: Partial<Task> & { boardId: string } = {
      ...taskFormState,
      boardId: currentBoard.id,
      creatorId: userProfile?.uid,
      dueDate: taskFormState.dueDate ? taskFormState.dueDate.toISOString() : null,
      updatedAt: serverTimestamp(),
      subtasks: taskFormState.subtasks || [],
    };

    try {
      if (editingTask) {
        const taskRef = doc(db, 'tasks', editingTask.id);
        await updateDoc(taskRef, taskDataToSave);
        toast({ title: "Task Updated" });
      } else {
        await addDoc(collection(db, 'tasks'), {
          ...taskDataToSave,
          createdAt: serverTimestamp(),
          status: 'Not Started',
        });
        toast({ title: "Task Created" });
      }
      setIsTaskFormDialogOpen(false);
    } catch (error) {
      console.error("Error saving task:", error);
      toast({ title: "Save Failed", variant: "destructive" });
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
     // This function is now more complex, involving points. 
     // For this UI refactor, we are simplifying it.
     const taskRef = doc(db, "tasks", taskId);
     await updateDoc(taskRef, { status: newStatus, updatedAt: serverTimestamp() });
  };
  
  const canManageBoard = userProfile && ['admin', 'overall_head'].includes(userProfile.role);

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col space-y-4">
      <header className="flex flex-shrink-0 flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-2">
            <h1 className="text-2xl font-bold text-primary flex items-center gap-3">
                <ListChecks className="h-7 w-7" /> Task Management
            </h1>
            <div className="flex items-center gap-2">
              {boards.length > 0 && currentBoard ? (
                <Select value={currentBoard.id} onValueChange={(boardId) => setCurrentBoard(boards.find(b => b.id === boardId) || null)}>
                  <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select a Board"/></SelectTrigger>
                  <SelectContent>
                    {boards.map(board => <SelectItem key={board.id} value={board.id}>{board.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : !loading && (
                 <p className="text-muted-foreground">No boards found.</p>
              )}
            </div>
        </div>
        <div className="flex items-center gap-2">
            <Select value={viewMode} onValueChange={(v: 'status' | 'user') => setViewMode(v)}>
                <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="status"><Columns className="mr-2 h-4 w-4 inline"/> Status View</SelectItem>
                    <SelectItem value="user"><Users className="mr-2 h-4 w-4 inline"/> User View</SelectItem>
                </SelectContent>
            </Select>
            {canManageBoard && (
                <Button onClick={() => handleOpenTaskModal(null)} disabled={!currentBoard}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Task
                </Button>
            )}
        </div>
      </header>
      
      <main className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        {loading ? (
            <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : !currentBoard ? (
            <div className="flex justify-center items-center h-full text-muted-foreground">Please create or select a board to view tasks.</div>
        ) : (
          <TaskBoard
            tasks={tasks}
            users={boardUsers}
            viewMode={viewMode}
            onEditTask={handleOpenTaskModal}
            onStatusChange={handleStatusChange}
            onTaskCreate={handleOpenTaskModal}
          />
        )}
      </main>

       <Dialog open={isTaskFormDialogOpen} onOpenChange={setIsTaskFormDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>{editingTask ? 'Edit Task' : 'Create New Task'}</DialogTitle></DialogHeader>
          <div className="grid md:grid-cols-2 gap-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
              <div className="md:col-span-2 space-y-4">
                  <Input placeholder="Task Title" value={taskFormState.title} onChange={e => setTaskFormState({ ...taskFormState, title: e.target.value })} />
                  <Textarea placeholder="Task Description..." value={taskFormState.description} onChange={e => setTaskFormState({ ...taskFormState, description: e.target.value })} />
              </div>
              <div className="space-y-4">
                  <div>
                      <Label>Due Date</Label>
                      <Popover>
                          <PopoverTrigger asChild>
                          <Button variant="outline" className={`w-full justify-start text-left font-normal ${!taskFormState.dueDate && "text-muted-foreground"}`}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {taskFormState.dueDate ? format(taskFormState.dueDate, "PPP") : <span>Pick a due date</span>}
                          </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={taskFormState.dueDate} onSelect={date => setTaskFormState({ ...taskFormState, dueDate: date })} initialFocus /></PopoverContent>
                      </Popover>
                  </div>
                  <div>
                    <Label>Assignees</Label>
                    <Select onValueChange={(userIds: string[]) => setTaskFormState({...taskFormState, assignedToUserIds: userIds})} value={taskFormState.assignedToUserIds}>
                       <SelectTrigger>{taskFormState.assignedToUserIds.length} users selected</SelectTrigger>
                       <SelectContent>
                         {boardUsers.map(user => (
                            <SelectItem key={user.uid} value={user.uid}>{user.fullName}</SelectItem>
                         ))}
                       </SelectContent>
                    </Select>
                  </div>
              </div>
              <div className="space-y-4">
                  <div>
                      <Label>Priority</Label>
                      <Select value={taskFormState.priority} onValueChange={v => setTaskFormState({...taskFormState, priority: v})}>
                          <SelectTrigger><SelectValue/></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="High">High</SelectItem>
                              <SelectItem value="Medium">Medium</SelectItem>
                              <SelectItem value="Low">Low</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
                   <div>
                        <Label>Status</Label>
                        <Select value={taskFormState.status} onValueChange={v => setTaskFormState({...taskFormState, status: v})}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Not Started">Not Started</SelectItem>
                                <SelectItem value="In Progress">In Progress</SelectItem>
                                <SelectItem value="Pending Review">Pending Review</SelectItem>
                                <SelectItem value="Completed">Completed</SelectItem>
                            </SelectContent>
                        </Select>
                  </div>
              </div>
              <div className="md:col-span-2">
                <Label>Subtasks</Label>
                <div className="space-y-2 mt-1">
                    {(taskFormState.subtasks || []).map((subtask: Subtask, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                            <Checkbox checked={subtask.completed} onCheckedChange={(checked) => {
                                const newSubtasks = [...taskFormState.subtasks];
                                newSubtasks[index].completed = !!checked;
                                setTaskFormState({...taskFormState, subtasks: newSubtasks});
                            }} />
                            <Input value={subtask.text} className="h-8" onChange={(e) => {
                                const newSubtasks = [...taskFormState.subtasks];
                                newSubtasks[index].text = e.target.value;
                                setTaskFormState({...taskFormState, subtasks: newSubtasks});
                            }}/>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => {
                                const newSubtasks = taskFormState.subtasks.filter((_:any, i:number) => i !== index);
                                setTaskFormState({...taskFormState, subtasks: newSubtasks});
                            }}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => {
                        const newSubtasks = [...(taskFormState.subtasks || []), { id: `sub-${Date.now()}`, text: '', completed: false }];
                        setTaskFormState({...taskFormState, subtasks: newSubtasks});
                    }}><PlusCircle className="mr-2 h-4 w-4"/>Add Subtask</Button>
                </div>
              </div>
          </div>
          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" onClick={() => setIsTaskFormDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleTaskFormSubmit} className="w-full sm:w-auto">Save Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
