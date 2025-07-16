
'use client';

import { useMemo } from 'react';
import { DndContext, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useToast } from '@/hooks/use-toast';
import type { Task, Board, BoardMember, UserRole } from '@/types';
import TaskColumn from './TaskColumn';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface TaskBoardProps {
  board: Board;
  tasks: Task[];
  members: BoardMember[];
  onEditTask: (task: Task | null) => void;
  loading: boolean;
}

const RoleGroup = ({ title, members, tasks, onEditTask, canManageBoard }: { title: string; members: BoardMember[], tasks: Task[], onEditTask: (task: Task | null) => void, canManageBoard: boolean }) => {
    if (members.length === 0) return null;
    return (
        <div>
            <h2 className="text-xl font-bold text-foreground px-4 py-2">{title}</h2>
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
                            canManageBoard={canManageBoard}
                        />
                    ))}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    );
};


export default function TaskBoard({ board, tasks, members, onEditTask, loading }: TaskBoardProps) {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  
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
             {/* Unassigned Column - Fixed on left */}
            <div className="px-4">
                <TaskColumn
                    id="unassigned"
                    title="New Tasks"
                    tasks={unassignedTasks}
                    member={null}
                    onEditTask={onEditTask}
                    canManageBoard={!!canManageBoard}
                />
            </div>
            
            {/* Role-based groups */}
            <RoleGroup title="Admins & Overall Heads" members={leadership} tasks={tasks} onEditTask={onEditTask} canManageBoard={!!canManageBoard} />
            <RoleGroup title="Event Representatives" members={representatives} tasks={tasks} onEditTask={onEditTask} canManageBoard={!!canManageBoard} />
            <RoleGroup title="Organisers" members={organisers} tasks={tasks} onEditTask={onEditTask} canManageBoard={!!canManageBoard} />
        </div>
    </DndContext>
  );
}
