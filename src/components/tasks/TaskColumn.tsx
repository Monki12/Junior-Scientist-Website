
'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Task, BoardMember } from '@/types';
import TaskCard from './TaskCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  onInitiateDelete: (task: Task) => void;
  canManageBoard: boolean;
}

export default function TaskColumn({ id, title, tasks, member, onEditTask, onInitiateDelete, canManageBoard }: TaskColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  const pendingTasks = useMemo(() => tasks.filter(t => t.status !== 'Completed'), [tasks]);
  const pendingTasksCount = pendingTasks.length;

  const bucketBreakdown = useMemo(() => {
    return pendingTasks.reduce((acc, task) => {
        const bucket = task.bucket || 'other';
        acc[bucket] = (acc[bucket] || 0) + 1;
        return acc;
    }, { a: 0, b: 0, c: 0, other: 0 } as Record<string, number>);
  }, [pendingTasks]);


  return (
    <div
      className="flex flex-col w-72 min-w-72 max-h-full bg-muted/50 rounded-lg shadow-sm"
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
          <Popover>
            <PopoverTrigger asChild>
               <button className="text-sm font-bold text-primary cursor-pointer h-6 w-6 flex items-center justify-center rounded-full bg-primary/20 hover:bg-primary/30">
                  {pendingTasksCount}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-48 text-sm p-2">
                <div className="space-y-1">
                  <p className="font-bold mb-1 text-center">Pending Tasks: {pendingTasksCount}</p>
                  <Separator />
                  <p>Bucket A: {bucketBreakdown.a}</p>
                  <p>Bucket B: {bucketBreakdown.b}</p>
                  <p>Bucket C: {bucketBreakdown.c}</p>
                  <p>Other: {bucketBreakdown.other}</p>
                </div>
              </PopoverContent>
          </Popover>
        )}
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto p-2 space-y-1 transition-colors ${isOver ? 'bg-primary/10' : ''}`}
      >
        <SortableContext id={id} items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              canManage={canManageBoard}
              onEditTask={onEditTask}
              onInitiateDelete={onInitiateDelete}
            />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
             <div className="text-center text-xs text-muted-foreground py-4 border-2 border-dashed border-muted-foreground/20 rounded-md">
                Drop tasks here
             </div>
          )}
      </div>
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
