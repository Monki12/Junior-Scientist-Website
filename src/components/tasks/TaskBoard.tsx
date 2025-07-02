
'use client';

import { useMemo } from 'react';
import { DndContext, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useToast } from '@/hooks/use-toast';
import type { Task, UserProfileData, TaskStatus } from '@/types';
import TaskColumn from './TaskColumn';

interface TaskBoardProps {
  tasks: Task[];
  users: UserProfileData[];
  viewMode: 'status' | 'user';
  onEditTask: (task: Task) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onTaskCreate: () => void;
}

const statusColumns: TaskStatus[] = ['Not Started', 'In Progress', 'Pending Review', 'Completed'];

export default function TaskBoard({ tasks, users, viewMode, onEditTask, onStatusChange, onTaskCreate }: TaskBoardProps) {
  const { toast } = useToast();

  const columns = useMemo(() => {
    if (viewMode === 'user') {
      return users.map(user => ({
        id: user.uid,
        title: user.fullName || user.displayName || 'Unnamed User',
        tasks: tasks.filter(task => task.assignedToUserIds?.includes(user.uid)),
      }));
    }
    
    // Status View
    const unassignedTasks = tasks.filter(task => !task.assignedToUserIds || task.assignedToUserIds.length === 0);
    const statusBasedTasks = statusColumns.map(status => ({
        id: status,
        title: status,
        tasks: tasks.filter(task => task.status === status),
    }));

    return [
      { id: 'backlog', title: 'New Tasks (Backlog)', tasks: unassignedTasks },
      ...statusBasedTasks
    ];
  }, [viewMode, tasks, users]);


  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!active || !over) return;
    
    const activeId = String(active.id);
    const overId = String(over.id);

    // If a task is dropped on a column (not another task)
    if (active.id !== over.id && columns.some(c => c.id === overId)) {
        if (viewMode === 'status') {
            const newStatus = overId as TaskStatus;
            if (statusColumns.includes(newStatus)) {
                onStatusChange(activeId, newStatus);
            }
        }
        // User view drag and drop for reassignment would be handled here
        // For simplicity, we are focusing on status change for now.
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="inline-flex h-full gap-4 p-1">
        {viewMode === 'status' && (
            <TaskColumn 
                id="backlog"
                title="Create a Task"
                tasks={tasks.filter(t => t.status === 'Not Started' && (!t.assignedToUserIds || t.assignedToUserIds.length === 0))}
                users={users}
                onEditTask={onEditTask}
                isBacklog={true}
                onTaskCreate={onTaskCreate}
            />
        )}
        {columns.map(col => {
          if (viewMode === 'status' && col.id === 'backlog') return null; // Don't render backlog twice
          return (
            <TaskColumn
              key={col.id}
              id={col.id}
              title={col.title}
              tasks={col.tasks}
              users={users}
              onEditTask={onEditTask}
            />
          )
        })}
      </div>
    </DndContext>
  );
}
