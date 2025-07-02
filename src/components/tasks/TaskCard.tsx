
'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task, UserProfileData, TaskPriority } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckSquare, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface TaskCardProps {
  task: Task;
  staff: UserProfileData[];
  onEditTask: (task: Task) => void;
}

const getPriorityBadgeVariant = (priority: TaskPriority) => {
  if (priority === 'High') return 'destructive';
  if (priority === 'Medium') return 'secondary';
  return 'outline';
};

export default function TaskCard({ task, staff, onEditTask }: TaskCardProps) {
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

  const assignedStaff = task.assignedToUserIds
    ? staff.filter(s => task.assignedToUserIds.includes(s.uid))
    : [];

  const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        onClick={() => onEditTask(task)}
        className="mb-2 bg-card/70 hover:bg-card cursor-pointer shadow-sm hover:shadow-md transition-shadow"
      >
        <CardHeader className="p-3">
          <CardTitle className="text-base font-semibold">{task.title}</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 space-y-3">
          <div className="flex flex-wrap gap-1">
            <Badge variant={getPriorityBadgeVariant(task.priority)}>{task.priority}</Badge>
            {task.subEventId && task.subEventId !== 'general' && (
              <Badge variant="outline">Event</Badge>
            )}
          </div>
          <div className="flex justify-between items-center text-xs text-muted-foreground">
             {task.dueDate && (
                <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{format(parseISO(task.dueDate), 'MMM dd')}</span>
                </div>
             )}
             {totalSubtasks > 0 && (
                <div className="flex items-center gap-1">
                    <CheckSquare className="h-3 w-3" />
                    <span>{completedSubtasks}/{totalSubtasks}</span>
                </div>
             )}
          </div>
          <div className="flex -space-x-2 overflow-hidden">
            {assignedStaff.map(user => (
              <Avatar key={user.uid} className="inline-block h-6 w-6 border-2 border-background">
                <AvatarImage src={user.photoURL || undefined} />
                <AvatarFallback>{(user.fullName || 'U')[0]}</AvatarFallback>
              </Avatar>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
