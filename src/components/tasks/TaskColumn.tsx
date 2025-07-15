
'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Task, UserProfileData } from '@/types';
import TaskCard from './TaskCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useMemo } from 'react';

interface TaskColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  user: UserProfileData | null;
  onEditTask: (task: Task) => void;
}

export default function TaskColumn({ id, title, tasks, user, onEditTask }: TaskColumnProps) {
  const { setNodeRef } = useDroppable({ id });

  const pendingTasksCount = tasks.filter(t => t.status !== 'Completed').length;

  const bucketBreakdown = useMemo(() => {
    const breakdown = { a: 0, b: 0, c: 0, other: 0 };
    tasks.forEach(task => {
        if (task.status !== 'Completed' && task.bucket) {
            if (task.bucket in breakdown) {
                breakdown[task.bucket as keyof typeof breakdown]++;
            } else {
                breakdown.other++;
            }
        }
    });
    return breakdown;
  }, [tasks]);

  return (
    <SortableContext id={id} items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
      <div
        className="flex flex-col w-72 min-w-72 h-full bg-muted/50 rounded-lg shadow-sm"
      >
        <div ref={setNodeRef} className="p-3 border-b sticky top-0 bg-muted/80 backdrop-blur-sm rounded-t-lg z-10 flex justify-between items-center">
          <div className="flex items-center gap-2 overflow-hidden">
            {user && (
                 <Avatar className="h-7 w-7">
                    <AvatarImage src={user.photoURL || undefined} />
                    <AvatarFallback>{(user.fullName || 'U')[0]}</AvatarFallback>
                </Avatar>
            )}
            <div className="flex flex-col overflow-hidden">
              <h3 className="font-semibold text-foreground truncate">{title}</h3>
              {user?.role && <p className="text-xs text-muted-foreground capitalize truncate">{user.role.replace(/_/g, ' ')}</p>}
            </div>
          </div>
          {user && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-sm font-bold text-primary cursor-default h-6 w-6 flex items-center justify-center rounded-full bg-primary/20">{pendingTasksCount}</span>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-sm">
                    <p className="font-bold mb-1">Pending Task Buckets:</p>
                    <p>Bucket A: {bucketBreakdown.a} tasks</p>
                    <p>Bucket B: {bucketBreakdown.b} tasks</p>
                    <p>Bucket C: {bucketBreakdown.c} tasks</p>
                    <p>Other: {bucketBreakdown.other} tasks</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
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
