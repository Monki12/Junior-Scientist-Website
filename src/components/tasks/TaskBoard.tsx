
'use client';

import { useMemo, useState, useEffect } from 'react';
import { DndContext, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useToast } from '@/hooks/use-toast';
import type { Task, Board, BoardMember, UserProfileData } from '@/types';
import TaskColumn from './TaskColumn';
import TaskDetailModal from './TaskDetailModal';
import { useAuth } from '@/hooks/use-auth';
import { AlertTriangle, ChevronRight, Users, Settings, X, Search as SearchIcon } from 'lucide-react';
import { doc, updateDoc, serverTimestamp, deleteDoc, addDoc, collection, arrayUnion, arrayRemove, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Label } from '../ui/label';

const RoleGroup = ({ 
  title, 
  members, 
  tasks, 
  onEditTask,
  onInitiateDelete,
  canManageBoard 
}: { 
  title: string; 
  members: BoardMember[], 
  tasks: Task[], 
  onEditTask: (task: Task | null) => void,
  onInitiateDelete: (task: Task) => void,
  canManageBoard: boolean 
}) => {
    const [isOpen, setIsOpen] = useState(true);

    const pendingTasksCount = useMemo(() => {
        let count = 0;
        members.forEach(member => {
            count += tasks.filter(task => task.assignedToUserIds?.includes(member.userId) && task.status !== 'Completed').length;
        });
        return count;
    }, [tasks, members]);

    const bucketBreakdown = useMemo(() => {
        const userTasks = tasks.filter(task => members.some(m => task.assignedToUserIds.includes(m.userId)));
        return userTasks.reduce((acc, task) => {
            const bucket = task.bucket || 'other';
            acc[bucket] = (acc[bucket] || 0) + 1;
            return acc;
        }, { a: 0, b: 0, c: 0, other: 0 } as Record<string, number>);
    }, [tasks, members]);
    
    if (members.length === 0) {
      return (
        <div className="px-4 py-2">
           <button 
              className="w-full flex items-center gap-2 text-left"
              onClick={() => setIsOpen(!isOpen)}
            >
              <ChevronRight className={cn("h-5 w-5 transition-transform", isOpen && "rotate-90")} />
              <h2 className="text-xl font-bold text-foreground">{title}</h2>
            </button>
            {isOpen && (
              <div className="text-center py-4 text-sm text-muted-foreground border-2 border-dashed rounded-lg mt-2">
                No {title.toLowerCase()} in this board.
              </div>
            )}
        </div>
      )
    }

    return (
        <div>
            <button 
              className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-muted/80 rounded-t-lg"
              onClick={() => setIsOpen(!isOpen)}
            >
                <ChevronRight className={cn("h-5 w-5 transition-transform", isOpen && "rotate-90")} />
                <h2 className="text-xl font-bold text-foreground">{title}</h2>
                <span className="text-sm font-medium text-muted-foreground">({members.length})</span>
                <Popover>
                    <PopoverTrigger asChild>
                       <Button variant="ghost" size="icon" className="ml-auto text-sm font-bold text-primary cursor-pointer h-6 w-6 flex items-center justify-center rounded-full bg-primary/20 hover:bg-primary/30" onClick={(e) => e.stopPropagation()}>
                          {pendingTasksCount}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 text-sm p-2">
                         <div className="space-y-1">
                          <p className="font-bold mb-1 text-center">Pending Tasks: {pendingTasksCount}</p>
                          <Separator />
                          <p>Bucket A: {bucketBreakdown.a}</p>
                          <p>Bucket B: {bucketBreakdown.b}</p>
                          <p>Bucket C: {bucketBreakdown.c}</p>
                          <p>Other: {bucketBreakdown.other}</p>
                        </div>
                    </PopoverContent>
                </Popover>
            </button>
            {isOpen && (
              <ScrollArea className="w-full whitespace-nowrap">
                  <div className="flex gap-4 p-4">
                      {members.map(member => (
                          <TaskColumn
                              key={member.userId}
                              id={member.userId}
                              title={member.name}
                              tasks={tasks.filter(task => task.assignedToUserIds?.includes(member.userId))}
                              member={member}
                              onEditTask={onEditTask}
                              onInitiateDelete={onInitiateDelete}
                              canManageBoard={canManageBoard}
                          />
                      ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
              </ScrollArea>
            )}
        </div>
    );
};

const ManageMembersModal = ({ 
  isOpen, 
  onClose, 
  board, 
  currentMembers 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  board: Board, 
  currentMembers: BoardMember[] 
}) => {
  const { toast } = useToast();
  const [allStaff, setAllStaff] = useState<UserProfileData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchStaff = async () => {
        const staffRoles = ['admin', 'overall_head', 'event_representative', 'organizer'];
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('role', 'in', staffRoles));
        const querySnapshot = await getDocs(q);
        const staffList = querySnapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserProfileData));
        setAllStaff(staffList);
      };
      fetchStaff();
    }
  }, [isOpen]);

  const handleUpdateMembers = async (userId: string, action: 'add' | 'remove') => {
    setIsUpdating(true);
    const boardRef = doc(db, 'boards', board.id);
    try {
      await updateDoc(boardRef, {
        memberUids: action === 'add' ? arrayUnion(userId) : arrayRemove(userId),
      });
      toast({ title: `Member ${action === 'add' ? 'Added' : 'Removed'}`, description: `The user has been successfully ${action === 'add' ? 'added to' : 'removed from'} the board.` });
      // The main TaskBoard component will update its members list via its own listener.
    } catch (error: any) {
      toast({ title: "Update Failed", description: error.message, variant: 'destructive' });
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredStaff = useMemo(() => {
    const memberIds = new Set(currentMembers.map(m => m.userId));
    return allStaff.filter(staff => 
      !memberIds.has(staff.uid) &&
      (staff.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || staff.email?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [allStaff, currentMembers, searchTerm]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Members for &quot;{board.name}&quot;</DialogTitle>
          <DialogDescription>Add or remove staff from this task board.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-6 py-4">
          <div className="space-y-4">
            <h4 className="font-semibold">Current Members ({currentMembers.length})</h4>
            <ScrollArea className="h-64 border rounded-md p-2">
              {currentMembers.length > 0 ? (
                currentMembers.map(member => (
                  <div key={member.userId} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.photoURL || ''} />
                        <AvatarFallback>{(member.name || 'U')[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{member.name}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleUpdateMembers(member.userId, 'remove')} disabled={isUpdating}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-center text-muted-foreground p-4">No members yet.</p>
              )}
            </ScrollArea>
          </div>
          <div className="space-y-4">
            <h4 className="font-semibold">Add New Members</h4>
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search staff..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <ScrollArea className="h-[228px] border rounded-md p-2">
              {filteredStaff.length > 0 ? (
                filteredStaff.map(staff => (
                  <div key={staff.uid} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={staff.photoURL || ''} />
                        <AvatarFallback>{(staff.fullName || 'U')[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{staff.fullName}</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleUpdateMembers(staff.uid, 'add')} disabled={isUpdating}>
                      Add
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-center text-muted-foreground p-4">
                  {searchTerm ? 'No matching staff found.' : 'All available staff are already members.'}
                </p>
              )}
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


export default function TaskBoard({ board, tasks, members, onBack }: { board: Board, tasks: Task[], members: BoardMember[], onBack: () => void }) {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isManageMembersModalOpen, setIsManageMembersModalOpen] = useState(false);
  
  const canManageBoard = userProfile && (board.managerUids?.includes(userProfile.uid) || ['admin', 'overall_head'].includes(userProfile.role));

  const { leadership, representatives, organisers, unassignedTasks } = useMemo(() => {
    const unassigned = tasks.filter(task => !task.assignedToUserIds || task.assignedToUserIds.length === 0);
    const leadership = members.filter(m => m.role === 'admin' || m.role === 'overall_head');
    const representatives = members.filter(m => m.role === 'event_representative');
    const organisers = members.filter(m => m.role === 'organizer');
    
    return { leadership, representatives, organisers, unassignedTasks: unassigned };
  }, [tasks, members]);


  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require pointer to move 8px before initiating drag
      },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  
  const handleOpenTaskModal = (task: Task | null) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const onInitiateDelete = (task: Task) => {
    setTaskToDelete(task);
  };
  
  const handleTaskUpdate = async (updatedTask: Partial<Task>) => {
    if (!userProfile) return;

    if (updatedTask.id) { // This is an update to an existing task
        const taskRef = doc(db, 'tasks', updatedTask.id);
        await updateDoc(taskRef, {
            ...updatedTask,
            updatedAt: serverTimestamp(),
        });
        toast({ title: "Task Updated" });
    } else { // This is a new task creation
        const { id, ...taskData } = updatedTask;
        const newTaskData: any = {
            ...taskData,
            boardId: board.id,
            creatorId: userProfile.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };
        await addDoc(collection(db, 'tasks'), newTaskData);
        toast({ title: "Task Created" });
    }
    setIsTaskModalOpen(false);
  };
  
  const handleConfirmDelete = async () => {
    if (!taskToDelete || !canManageBoard) {
        toast({ title: "Error", description: "Task ID missing or insufficient permissions.", variant: "destructive" });
        setTaskToDelete(null);
        return;
    }
    try {
        await deleteDoc(doc(db, "tasks", taskToDelete.id));
        toast({ title: "Task Deleted", description: `Task "${taskToDelete.caption}" has been permanently removed.`});
    } catch (e: any) {
        toast({ title: "Error Deleting Task", description: e.message, variant: "destructive" });
    } finally {
        setTaskToDelete(null);
    }
  };


  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!active || !over || !userProfile) return;
    
    const targetColumnId = String(over.id);
    const draggedTaskId = String(active.id);

    const task = tasks.find(t => t.id === draggedTaskId);
    if (!task) return;

    const originalAssigneeId = task.assignedToUserIds && task.assignedToUserIds.length > 0 ? task.assignedToUserIds[0] : 'unassigned';
    
    if (originalAssigneeId === targetColumnId) return;

    const isSelfAssign = targetColumnId === userProfile.uid && originalAssigneeId === 'unassigned';
    if (!canManageBoard && !isSelfAssign) {
        toast({ title: "Permission Denied", description: "You can only assign tasks from 'New Tasks' to yourself.", variant: "destructive"});
        return;
    }
    
    const newAssignedIds = targetColumnId === 'unassigned' ? [] : [targetColumnId];
    
    try {
        const taskRef = doc(db, 'tasks', draggedTaskId);
        await updateDoc(taskRef, {
            assignedToUserIds: newAssignedIds,
            status: task.status === 'Not Started' && targetColumnId !== 'unassigned' ? 'In Progress' : task.status,
            updatedAt: serverTimestamp(),
        });
        toast({ title: "Task Reassigned", description: `Task moved successfully.`});
    } catch(e: any) {
        toast({ title: "Error Reassigning Task", description: e.message, variant: "destructive" });
    }
  };
  
  const onCloseModal = () => {
    setEditingTask(null);
    setIsTaskModalOpen(false);
  };
  

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="flex h-[calc(100vh-8rem)] flex-col space-y-4">
          <header className="flex flex-shrink-0 flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="space-y-2">
                <Button variant="link" size="sm" onClick={onBack} className="p-0 h-auto text-sm">
                  &larr; Back to board selection
                </Button>
                <h1 className="text-2xl font-bold text-primary flex items-center gap-3">
                    Board: {board.name}
                </h1>
            </div>
            {canManageBoard && (
                <Button variant="outline" size="sm" onClick={() => setIsManageMembersModalOpen(true)}>
                    <Settings className="mr-2 h-4 w-4" />
                    Manage Members
                </Button>
            )}
          </header>
        
          <main className="flex-1 overflow-auto pb-4">
             <div className="flex flex-col h-full space-y-4">
                <div className="px-4">
                    <TaskColumn
                        id="unassigned"
                        title="New Tasks"
                        tasks={unassignedTasks}
                        member={null}
                        onEditTask={handleOpenTaskModal}
                        onInitiateDelete={onInitiateDelete}
                        canManageBoard={!!canManageBoard}
                    />
                </div>
                
                <RoleGroup title="Admins & Overall Heads" members={leadership} tasks={tasks} onEditTask={handleOpenTaskModal} onInitiateDelete={onInitiateDelete} canManageBoard={!!canManageBoard} />
                <RoleGroup title="Event Representatives" members={representatives} tasks={tasks} onEditTask={handleOpenTaskModal} onInitiateDelete={onInitiateDelete} canManageBoard={!!canManageBoard} />
                <RoleGroup title="Organisers" members={organisers} tasks={tasks} onEditTask={handleOpenTaskModal} onInitiateDelete={onInitiateDelete} canManageBoard={!!canManageBoard} />

                {members.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg mx-4">
                        <Users className="h-12 w-12 mx-auto mb-3 text-primary/30" />
                        <h3 className="text-lg font-semibold text-foreground mb-1">No Members Added</h3>
                        <p className="text-sm">Click "Manage Members" to add staff to this board.</p>
                    </div>
                )}
            </div>
          </main>
        
          <TaskDetailModal
              isOpen={isTaskModalOpen}
              onClose={onCloseModal}
              task={editingTask}
              board={board}
              boardMembers={members}
              allUsers={[]} 
              canManage={!!canManageBoard}
              onTaskUpdate={handleTaskUpdate}
          />
          
           {canManageBoard && (
              <ManageMembersModal
                isOpen={isManageMembersModalOpen}
                onClose={() => setIsManageMembersModalOpen(false)}
                board={board}
                currentMembers={members}
              />
           )}

           <AlertDialog open={!!taskToDelete} onOpenChange={(open) => !open && setTaskToDelete(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                    <div className="flex justify-center">
                      <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
                    </div>
                    <AlertDialogTitle className="text-center text-2xl">Confirm Deletion</AlertDialogTitle>
                    <AlertDialogDescription className="text-center">
                        <p>Are you sure you want to delete this task?</p>
                        <p className="font-semibold text-foreground mt-2">Task: "{taskToDelete?.caption}"</p>
                        <p className="text-xs text-muted-foreground mt-4">This action cannot be undone.</p>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="sm:justify-center">
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                        Delete Task
                    </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>
        </div>
    </DndContext>
  );
}
