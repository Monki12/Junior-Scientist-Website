
'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task, TaskPriority, TaskStatus } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckSquare, Clock, Flag, Trash2 } from 'lucide-react';
import { format, parseISO, isPast } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

interface TaskCardProps {
  task: Task;
  canManage: boolean;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
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

export default function TaskCard({ task, canManage, onEditTask, onDeleteTask }: TaskCardProps) {
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
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 'auto',
  };

  const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const dueDate = task.dueDate ? parseISO(task.dueDate) : null;
  const isOverdue = dueDate && isPast(dueDate) && task.status !== 'Completed';
  
  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent opening modal if the delete button was clicked
    if ((e.target as HTMLElement).closest('.delete-task-btn')) {
        return;
    }
    onEditTask(task);
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        onClick={handleCardClick}
        className="group mb-2 bg-card/70 hover:bg-card cursor-pointer shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
      >
        <div className={cn("absolute left-0 top-0 bottom-0 w-1.5", statusStyles[task.status]?.barColor || 'bg-gray-400')}></div>
        <CardContent className="p-3 pl-5 space-y-2">
            <div className="flex justify-between items-start gap-2">
                <p className="text-base font-semibold leading-tight pr-6">{task.caption || task.title}</p>
                {canManage && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="delete-task-btn absolute top-1 right-1 h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => onDeleteTask(task.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Delete Task</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center gap-1">
                                <Flag className={cn("h-3 w-3", priorityStyles[task.priority]?.iconColor)} />
                                <span>{task.priority}</span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent><p>{task.priority} Priority</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                {dueDate && (
                     <TooltipProvider>
                        <Tooltip>
                             <TooltipTrigger asChild>
                                <div className={cn("flex items-center gap-1", isOverdue && "text-destructive font-semibold")}>
                                    <Clock className="h-3 w-3" />
                                    <span>{format(dueDate, 'MMM dd')}</span>
                                </div>
                             </TooltipTrigger>
                             <TooltipContent><p>Due Date: {format(dueDate, 'PPP')}</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
                {totalSubtasks > 0 && (
                     <TooltipProvider>
                        <Tooltip>
                             <TooltipTrigger asChild>
                                <div className="flex items-center gap-1">
                                    <CheckSquare className="h-3 w-3" />
                                    <span>{completedSubtasks}/{totalSubtasks}</span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent><p>{completedSubtasks} of {totalSubtasks} subtasks completed</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
