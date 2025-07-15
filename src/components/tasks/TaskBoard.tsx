
'use client';

import { useMemo } from 'react';
import { DndContext, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useToast } from '@/hooks/use-toast';
import type { Task, Board, BoardMember } from '@/types';
import TaskColumn from './TaskColumn';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { nanoid } from 'nanoid';

const USE_MOCK_DATA = process.env.NODE_ENV === 'development';

interface TaskBoardProps {
  board: Board;
  tasks: Task[];
  members: BoardMember[];
  onEditTask: (task: Task | null) => void;
  loading: boolean;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

export default function TaskBoard({ board, tasks, members, onEditTask, loading, setTasks }: TaskBoardProps) {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  
  const canManageBoard = userProfile && (board.managerUids?.includes(userProfile.uid) || ['admin', 'overall_head'].includes(userProfile.role));

  const columns = useMemo(() => {
    const unassignedTasks = tasks.filter(task => !task.assignedToUserIds || task.assignedToUserIds.length === 0);
    
    const memberColumns = members.map(member => ({
        id: member.userId,
        title: member.name,
        tasks: tasks.filter(task => task.assignedToUserIds?.includes(member.userId)),
        member: member,
    }));

    return [
      { id: 'unassigned', title: 'New Tasks', tasks: unassignedTasks, member: null },
      ...memberColumns
    ];
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
    
    // Prevent re-rendering if dropped in the same column
    if (originalAssigneeId === targetColumnId) return;

    const isSelfAssign = targetColumnId === userProfile.uid && originalAssigneeId === 'unassigned';
    if (!canManageBoard && !isSelfAssign) {
        toast({ title: "Permission Denied", description: "You can only assign tasks from 'New Tasks' to yourself.", variant: "destructive"});
        return;
    }
    
    const newAssignedIds = targetColumnId === 'unassigned' ? [] : [targetColumnId];

    if (USE_MOCK_DATA) {
      setTasks(prevTasks => prevTasks.map(t => 
        t.id === draggedTaskId 
          ? { ...t, 
              assignedToUserIds: newAssignedIds, 
              status: t.status === 'Not Started' && targetColumnId !== 'unassigned' ? 'In Progress' : t.status, 
              updatedAt: new Date().toISOString() 
            } 
          : t
      ));
      toast({ title: "Task Reassigned (Mock)", description: `Task moved successfully.`});
      return;
    }

    try {
        const taskRef = doc(db, "tasks", draggedTaskId);
        await updateDoc(taskRef, {
            assignedToUserIds: newAssignedIds,
            updatedAt: serverTimestamp(),
            status: task.status === 'Not Started' && targetColumnId !== 'unassigned' ? 'In Progress' : task.status,
        });
        toast({ title: "Task Reassigned", description: `Task moved successfully.`});
    } catch(e) {
        console.error("Error reassigning task: ", e);
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
            member={col.member}
            onEditTask={onEditTask}
            canManageBoard={!!canManageBoard}
          />
        ))}
      </div>
    </DndContext>
  );
}
