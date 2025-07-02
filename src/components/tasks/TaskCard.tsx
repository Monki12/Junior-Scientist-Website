
'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task, UserProfileData, TaskPriority } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckSquare, Clock } from 'lucide-react';
import { format, parseISO, isPast } from 'date-fns';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  users: UserProfileData[];
  onEditTask: (task: Task) => void;
}

const priorityStyles: Record<TaskPriority, { dot: string; badge: string; }> = {
    High: { dot: 'bg-red-500', badge: 'border-red-500/50 bg-red-500/10 text-red-400' },
    Medium: { dot: 'bg-yellow-500', badge: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400' },
    Low: { dot: 'bg-blue-500', badge: 'border-blue-500/50 bg-blue-500/10 text-blue-400' },
};

export default function TaskCard({ task, users, onEditTask }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const assignedUsers = task.assignedToUserIds
    ? users.filter(u => task.assignedToUserIds.includes(u.uid))
    : [];

  const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const dueDate = task.dueDate ? parseISO(task.dueDate) : null;
  const isOverdue = dueDate && isPast(dueDate) && task.status !== 'Completed';

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        onClick={() => onEditTask(task)}
        className="mb-2 bg-card/70 hover:bg-card cursor-pointer shadow-sm hover:shadow-md transition-shadow"
      >
        <CardHeader className="p-3 pb-2">
            <div className="flex items-center gap-2">
                 <span className={cn("h-2 w-2 rounded-full", priorityStyles[task.priority].dot)}></span>
                 <CardTitle className="text-base font-semibold leading-tight">{task.title}</CardTitle>
            </div>
        </CardHeader>
        <CardContent className="p-3 pt-0 space-y-3">
            {task.description && <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>}
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className={cn("capitalize", priorityStyles[task.priority].badge)}>{task.priority}</Badge>
          </div>
          <div className="flex justify-between items-center text-xs text-muted-foreground">
             {dueDate && (
                <div className={cn("flex items-center gap-1", isOverdue && "text-destructive font-semibold")}>
                    <Clock className="h-3 w-3" />
                    <span>{format(dueDate, 'MMM dd')}</span>
                </div>
             )}
             {totalSubtasks > 0 && (
                <div className="flex items-center gap-1">
                    <CheckSquare className="h-3 w-3" />
                    <span>{completedSubtasks}/{totalSubtasks}</span>
                </div>
             )}
          </div>
          <div className="flex justify-end -space-x-2 overflow-hidden">
            <TooltipProvider>
            {assignedUsers.map(user => (
              <Tooltip key={user.uid}>
                <TooltipTrigger asChild>
                    <Avatar className="inline-block h-7 w-7 border-2 border-background">
                        <AvatarImage src={user.photoURL || undefined} />
                        <AvatarFallback>{(user.fullName || 'U')[0]}</AvatarFallback>
                    </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{user.fullName}</p>
                </TooltipContent>
              </Tooltip>
            ))}
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
