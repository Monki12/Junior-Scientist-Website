
'use client';

import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Task, UserProfileData } from '@/types';
import TaskCard from './TaskCard';

interface TaskColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  staff: UserProfileData[];
  onEditTask: (task: Task) => void;
}

export default function TaskColumn({ id, title, tasks, staff, onEditTask }: TaskColumnProps) {
  const { setNodeRef } = useSortable({ id });

  return (
    <SortableContext id={id} items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
      <div
        ref={setNodeRef}
        className="flex flex-col w-72 min-w-72 max-h-[calc(100vh-16rem)] bg-muted/50 rounded-lg"
      >
        <div className="p-3 border-b sticky top-0 bg-muted/80 backdrop-blur-sm rounded-t-lg z-10">
          <h3 className="font-semibold text-foreground">{title} <span className="text-sm font-normal text-muted-foreground">({tasks.length})</span></h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              staff={staff}
              onEditTask={onEditTask}
            />
          ))}
        </div>
      </div>
    </SortableContext>
  );
}
