
'use client';

import { useDroppable, useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Task, UserProfileData } from '@/types';
import TaskCard from './TaskCard';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TaskColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  users: UserProfileData[];
  onEditTask: (task: Task) => void;
  isBacklog?: boolean;
  onTaskCreate?: () => void;
}

export default function TaskColumn({ id, title, tasks, users, onEditTask, isBacklog = false, onTaskCreate }: TaskColumnProps) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <SortableContext id={id} items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
      <div
        ref={setNodeRef}
        className="flex flex-col w-72 min-w-72 h-full bg-muted/50 rounded-lg shadow-sm"
      >
        <div className="p-3 border-b sticky top-0 bg-muted/80 backdrop-blur-sm rounded-t-lg z-10 flex justify-between items-center">
          <h3 className="font-semibold text-foreground">{title}</h3>
          <span className="text-sm font-normal text-muted-foreground">({tasks.length})</span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isBacklog && (
            <Button variant="outline" className="w-full mb-2" onClick={onTaskCreate}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Task
            </Button>
          )}
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              users={users}
              onEditTask={onEditTask}
            />
          ))}
        </div>
      </div>
    </SortableContext>
  );
}
