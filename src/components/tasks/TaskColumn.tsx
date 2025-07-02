
'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Task, UserProfileData } from '@/types';
import TaskCard from './TaskCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface TaskColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  user: UserProfileData | null;
  onEditTask: (task: Task) => void;
}

const workloadColors: { [key: number]: string } = {
    0: 'bg-green-500/50', // light
    1: 'bg-yellow-500/50', // medium
    2: 'bg-red-500/50', // heavy
}

const getWorkloadLevel = (taskCount: number) => {
    if (taskCount <= 3) return 0; // light
    if (taskCount <= 7) return 1; // medium
    return 2; // heavy
}

export default function TaskColumn({ id, title, tasks, user, onEditTask }: TaskColumnProps) {
  const { setNodeRef } = useDroppable({ id });

  const workloadLevel = user ? getWorkloadLevel(tasks.length) : -1;

  return (
    <SortableContext id={id} items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
      <div
        className="flex flex-col w-72 min-w-72 h-full bg-muted/50 rounded-lg shadow-sm"
      >
        <div ref={setNodeRef} className="p-3 border-b sticky top-0 bg-muted/80 backdrop-blur-sm rounded-t-lg z-10 flex justify-between items-center">
          <div className="flex items-center gap-2">
            {user && (
                 <div className="relative">
                    <Avatar className="h-7 w-7">
                        <AvatarImage src={user.photoURL || undefined} />
                        <AvatarFallback>{(user.fullName || 'U')[0]}</AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-muted ${workloadColors[workloadLevel]}`}></div>
                </div>
            )}
            <h3 className="font-semibold text-foreground truncate">{title}</h3>
          </div>
          <span className="text-sm font-normal text-muted-foreground">({tasks.length})</span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onEditTask={onEditTask}
            />
          ))}
          {tasks.length === 0 && (
             <div className="text-center text-xs text-muted-foreground py-4 border-2 border-dashed border-muted-foreground/20 rounded-md">
                Drop tasks here
             </div>
          )}
        </div>
      </div>
    </SortableContext>
  );
}
