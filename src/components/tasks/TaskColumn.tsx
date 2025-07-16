
'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Task, BoardMember } from '@/types';
import TaskCard from './TaskCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useMemo } from 'react';
import { Button } from '../ui/button';
import { PlusCircle } from 'lucide-react';
import { Separator } from '../ui/separator';

interface TaskColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  member: BoardMember | null;
  onEditTask: (task: Task | null) => void;
  canManageBoard: boolean;
}

export default function TaskColumn({ id, title, tasks, member, onEditTask, canManageBoard }: TaskColumnProps) {
  const { setNodeRef } = useDroppable({ id });

  const pendingTasks = useMemo(() => tasks.filter(t => t.status !== 'Completed'), [tasks]);
  const pendingTasksCount = pendingTasks.length;

  const bucketBreakdown = useMemo(() => {
    return pendingTasks.reduce((acc, task) => {
        const bucket = task.bucket || 'other';
        acc[bucket] = (acc[bucket] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
  }, [pendingTasks]);


  return (
    <div
      className="flex flex-col w-72 min-w-72 max-h-full bg-muted/50 rounded-lg shadow-sm"
      ref={setNodeRef}
    >
      <div className="p-3 border-b sticky top-0 bg-muted/80 backdrop-blur-sm rounded-t-lg z-10 flex justify-between items-center">
        <div className="flex items-center gap-2 overflow-hidden">
          {member && (
               <Avatar className="h-7 w-7">
                  <AvatarImage src={member.photoURL || undefined} />
                  <AvatarFallback>{(member.name || 'U')[0]}</AvatarFallback>
              </Avatar>
          )}
          <div className="flex flex-col overflow-hidden">
            <h3 className="font-semibold text-foreground truncate">{title}</h3>
            {member?.role && <p className="text-xs text-muted-foreground capitalize truncate">{member.role.replace(/_/g, ' ')}</p>}
          </div>
        </div>
        {member && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-sm font-bold text-primary cursor-default h-6 w-6 flex items-center justify-center rounded-full bg-primary/20">{pendingTasksCount}</span>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-sm p-1">
                  <p className="font-bold mb-1">Pending Tasks: {pendingTasksCount}</p>
                  <Separator className="my-1"/>
                  <p>Bucket A: {bucketBreakdown.a || 0}</p>
                  <p>Bucket B: {bucketBreakdown.b || 0}</p>
                  <p>Bucket C: {bucketBreakdown.c || 0}</p>
                  <p>Other: {bucketBreakdown.other || 0}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <SortableContext id={id} items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onEditTask={() => onEditTask(task)}
            />
          ))}
          {tasks.length === 0 && (
             <div className="text-center text-xs text-muted-foreground py-4 border-2 border-dashed border-muted-foreground/20 rounded-md">
                Drop tasks here
             </div>
          )}
        </div>
      </SortableContext>
      {id === 'unassigned' && canManageBoard && (
          <div className="p-2 border-t mt-auto">
              <Button variant="ghost" className="w-full justify-start" onClick={() => onEditTask(null)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Task
              </Button>
          </div>
      )}
    </div>
  );
}
