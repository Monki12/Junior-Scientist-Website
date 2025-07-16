
'use client';

import { useMemo, useState } from 'react';
import { DndContext, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useToast } from '@/hooks/use-toast';
import type { Task, Board, BoardMember } from '@/types';
import TaskColumn from './TaskColumn';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, ChevronRight, Users } from 'lucide-react';
import { doc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
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

    if (members.length === 0) return null;

    const pendingTasksCount = useMemo(() => {
        let count = 0;
        members.forEach(member => {
            count += tasks.filter(task => task.assignedToUserIds?.includes(member.userId) && task.status !== 'Completed').length;
        });
        return count;
    }, [tasks, members]);

    return (
        <div>
            <button 
              className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-muted/80 rounded-t-lg"
              onClick={() => setIsOpen(!isOpen)}
            >
                <ChevronRight className={cn("h-5 w-5 transition-transform", isOpen && "rotate-90")} />
                <h2 className="text-xl font-bold text-foreground">{title}</h2>
                <span className="text-sm font-medium text-muted-foreground">({members.length})</span>
                 <span className="ml-auto text-sm font-bold text-primary h-6 w-6 flex items-center justify-center rounded-full bg-primary/20">
                  {pendingTasksCount}
                </span>
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


export default function TaskBoard({ board, tasks, members, onEditTask, loading }: { board: Board, tasks: Task[], members: BoardMember[], onEditTask: (task: Task | null) => void, loading: boolean }) {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const canManageBoard = userProfile && (board.managerUids?.includes(userProfile.uid) || ['admin', 'overall_head'].includes(userProfile.role));

  const { leadership, representatives, organisers, unassignedTasks } = useMemo(() => {
    const unassigned = tasks.filter(task => !task.assignedToUserIds || task.assignedToUserIds.length === 0);
    const leadership = members.filter(m => m.role === 'admin' || m.role === 'overall_head');
    const representatives = members.filter(m => m.role === 'event_representative');
    const organisers = members.filter(m => m.role === 'organizer');
    
    return { leadership, representatives, organisers, unassignedTasks: unassigned };
  }, [tasks, members]);


  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  
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
  
  if (loading) {
     return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="flex flex-col h-full space-y-4">
            <div className="px-4">
                <TaskColumn
                    id="unassigned"
                    title="New Tasks"
                    tasks={unassignedTasks}
                    member={null}
                    onEditTask={onEditTask}
                    onInitiateDelete={setTaskToDelete}
                    canManageBoard={!!canManageBoard}
                />
            </div>
            
            <RoleGroup title="Admins & Overall Heads" members={leadership} tasks={tasks} onEditTask={onEditTask} onInitiateDelete={setTaskToDelete} canManageBoard={!!canManageBoard} />
            <RoleGroup title="Event Representatives" members={representatives} tasks={tasks} onEditTask={onEditTask} onInitiateDelete={setTaskToDelete} canManageBoard={!!canManageBoard} />
            <RoleGroup title="Organisers" members={organisers} tasks={tasks} onEditTask={onEditTask} onInitiateDelete={setTaskToDelete} canManageBoard={!!canManageBoard} />

            {members.length === 0 && (
                <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg mx-4">
                    <Users className="h-12 w-12 mx-auto mb-3 text-primary/30" />
                    <h3 className="text-lg font-semibold text-foreground mb-1">No Members Added</h3>
                    <p className="text-sm">Click "Manage Members" to add staff to this board.</p>
                </div>
            )}
        </div>
         <AlertDialog open={!!taskToDelete} onOpenChange={(open) => !open && setTaskToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the task "{taskToDelete?.caption}".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">
                  Yes, Delete Task
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </DndContext>
  );
}
