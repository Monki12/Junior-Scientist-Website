
'use client';

import { useMemo } from 'react';
import { DndContext, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useToast } from '@/hooks/use-toast';
import type { Task, UserProfileData, Board } from '@/types';
import TaskColumn from './TaskColumn';
import { doc, updateDoc, arrayUnion, arrayRemove, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

interface TaskBoardProps {
  board: Board;
  tasks: Task[];
  users: UserProfileData[];
  onEditTask: (task: Task) => void;
  loading: boolean;
}

export default function TaskBoard({ board, tasks, users, onEditTask, loading }: TaskBoardProps) {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  
  const canManageBoard = userProfile && (board.managerUids?.includes(userProfile.uid) || ['admin', 'overall_head'].includes(userProfile.role));

  const columns = useMemo(() => {
    const unassignedTasks = tasks.filter(task => !task.assignedToUserIds || task.assignedToUserIds.length === 0);
    const memberColumns = users.map(user => ({
        id: user.uid,
        title: user.fullName || user.displayName || 'Unnamed User',
        tasks: tasks.filter(task => task.assignedToUserIds?.includes(user.uid)),
        user: user,
    }));

    return [
      { id: 'unassigned', title: 'New Tasks', tasks: unassignedTasks, user: null },
      ...memberColumns
    ];
  }, [tasks, users]);


  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!active || !over || !userProfile) return;
    
    const activeTaskId = String(active.id);
    const targetColumnId = String(over.id);

    const task = tasks.find(t => t.id === activeTaskId);
    if (!task) return;

    const originalColumnId = task.assignedToUserIds && task.assignedToUserIds.length > 0 ? task.assignedToUserIds[0] : 'unassigned';
    
    if (originalColumnId === targetColumnId) return;

    // Permissions check
    const isSelfAssign = targetColumnId === userProfile.uid && originalColumnId === 'unassigned';
    if (!canManageBoard && !isSelfAssign) {
        toast({ title: "Permission Denied", description: "You can only assign tasks from the backlog to yourself.", variant: "destructive"});
        return;
    }

    try {
        const taskRef = doc(db, "tasks", activeTaskId);
        await updateDoc(taskRef, {
            assignedToUserIds: targetColumnId === 'unassigned' ? [] : [targetColumnId],
            updatedAt: serverTimestamp(),
            status: task.status === 'Not Started' && targetColumnId !== 'unassigned' ? 'In Progress' : task.status,
        });
        toast({ title: "Task Reassigned", description: `Task moved successfully.`});
    } catch(e) {
        toast({ title: "Error", description: "Failed to reassign task.", variant: "destructive"});
    }
  };
  
  if (loading) {
     return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="inline-flex h-full gap-4 p-1">
        {columns.map(col => (
          <TaskColumn
            key={col.id}
            id={col.id}
            title={col.title}
            tasks={col.tasks}
            user={col.user}
            onEditTask={onEditTask}
          />
        ))}
      </div>
    </DndContext>
  );
}
