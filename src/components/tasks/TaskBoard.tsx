
'use client';

import { useMemo } from 'react';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useToast } from '@/hooks/use-toast';
import type { Task, UserProfileData, TaskStatus } from '@/types';
import TaskColumn from './TaskColumn';

interface TaskBoardProps {
  tasks: Task[];
  staff: UserProfileData[];
  onEditTask: (task: Task) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
}

const statuses: TaskStatus[] = ['Not Started', 'In Progress', 'Pending Review', 'Completed'];

export default function TaskBoard({ tasks, staff, onEditTask, onStatusChange }: TaskBoardProps) {
  const { toast } = useToast();

  const tasksByStatus = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    statuses.forEach(status => grouped[status] = []);
    tasks.forEach(task => {
      if (task.status) {
        grouped[task.status].push(task);
      }
    });
    return grouped;
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const getTaskById = (id: string) => tasks.find(task => task.id === id);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    
    const activeId = String(active.id);
    
    const activeTask = getTaskById(activeId);
    if (!activeTask) return;

    const overContainerId = over.data.current?.sortable?.containerId || over.id;
    const activeContainerId = active.data.current?.sortable?.containerId || active.id;

    if (activeContainerId !== overContainerId) {
      const newStatus = overContainerId as TaskStatus;
      if (statuses.includes(newStatus)) {
        try {
          onStatusChange(activeId, newStatus);
        } catch (error) {
          console.error("Error updating task status:", error);
          toast({ title: "Error", description: "Could not update task status.", variant: "destructive" });
        }
      }
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="inline-flex gap-4 h-full p-1">
        {statuses.map(status => (
          <TaskColumn
            key={status}
            id={status}
            title={status}
            tasks={tasksByStatus[status]}
            staff={staff}
            onEditTask={onEditTask}
          />
        ))}
      </div>
    </DndContext>
  );
}
