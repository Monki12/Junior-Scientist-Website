
'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task, TaskPriority, TaskStatus } from '@/types';
import { Card } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckSquare, Clock, Flag, Trash2, Edit, MoreVertical, XCircle, GripVertical } from 'lucide-react';
import { format, parseISO, isPast } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { useState } from 'react';

interface TaskCardProps {
  task: Task;
  canManage: boolean;
  onEditTask: (task: Task) => void;
  onInitiateDelete: (task: Task) => void;
}

const priorityStyles: Record<TaskPriority, { iconColor: string; }> = {
    High: { iconColor: 'text-red-500' },
    Medium: { iconColor: 'text-yellow-500' },
    Low: { iconColor: 'text-blue-500' },
};

const statusStyles: Record<TaskStatus, { barColor: string }> = {
    'Not Started': { barColor: 'bg-gray-400' },
    'In Progress': { barColor: 'bg-blue-500' },
    'Pending Review': { barColor: 'bg-yellow-500' },
    'Completed': { barColor: 'bg-green-500' },
}

export default function TaskCard({ task, canManage, onEditTask, onInitiateDelete }: TaskCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: {type: 'Task', task} });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    boxShadow: isDragging ? '0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1)' : 'none',
    transformOrigin: '0 0',
  };
  
  const rotationStyle = isDragging ? { transform: `rotate(2deg)` } : {};


  const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const dueDate = task.dueDate ? parseISO(task.dueDate) : null;
  const isOverdue = dueDate && isPast(dueDate) && task.status !== 'Completed';

  return (
    <div ref={setNodeRef} style={{...style, ...rotationStyle}} {...attributes}>
      <Card className="group mb-2 bg-card/70 hover:bg-card shadow-sm hover:shadow-lg transition-shadow relative overflow-hidden cursor-grab active:cursor-grabbing">
        <div className={cn("absolute left-0 top-0 bottom-0 w-1.5", statusStyles[task.status]?.barColor || 'bg-gray-400')}></div>
        <div className="flex items-start justify-between p-3 pl-5">
            <div className="flex-grow space-y-2" {...listeners}>
              <p className="text-base font-semibold leading-tight">{task.caption || task.title}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <TooltipProvider><Tooltip>
                      <TooltipTrigger asChild>
                          <div className="flex items-center gap-1">
                              <Flag className={cn("h-3 w-3", priorityStyles[task.priority]?.iconColor)} />
                              <span>{task.priority}</span>
                          </div>
                      </TooltipTrigger>
                      <TooltipContent><p>{task.priority} Priority</p></TooltipContent>
                  </Tooltip></TooltipProvider>
                  {dueDate && (
                      <TooltipProvider><Tooltip>
                          <TooltipTrigger asChild>
                              <div className={cn("flex items-center gap-1", isOverdue && "text-destructive font-semibold")}>
                                  <Clock className="h-3 w-3" />
                                  <span>{format(dueDate, 'MMM dd')}</span>
                              </div>
                          </TooltipTrigger>
                          <TooltipContent><p>Due Date: {format(dueDate, 'PPP')}</p></TooltipContent>
                      </Tooltip></TooltipProvider>
                  )}
                  {totalSubtasks > 0 && (
                        <TooltipProvider><Tooltip>
                          <TooltipTrigger asChild>
                              <div className="flex items-center gap-1">
                                  <CheckSquare className="h-3 w-3" />
                                  <span>{completedSubtasks}/{totalSubtasks}</span>
                              </div>
                          </TooltipTrigger>
                          <TooltipContent><p>{completedSubtasks} of {totalSubtasks} subtasks completed</p></TooltipContent>
                      </Tooltip></TooltipProvider>
                  )}
              </div>
            </div>
            
             <Popover open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" side="bottom" align="end">
                  <div className="flex flex-col gap-1">
                      <Button variant="ghost" className="w-full justify-start" onClick={() => { onEditTask(task); setIsMenuOpen(false); }}>
                          <Edit className="mr-2 h-4 w-4"/> Edit Task
                      </Button>
                      {canManage && (
                          <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => { onInitiateDelete(task); setIsMenuOpen(false); }}>
                              <Trash2 className="mr-2 h-4 w-4"/> Delete Task
                          </Button>
                      )}
                      <Button variant="ghost" className="w-full justify-start" onClick={() => setIsMenuOpen(false)}>
                          <XCircle className="mr-2 h-4 w-4"/> Cancel
                      </Button>
                  </div>
              </PopoverContent>
            </Popover>
        </div>
      </Card>
    </div>
  );
}
