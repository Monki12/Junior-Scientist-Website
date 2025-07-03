
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { Task, Board } from '@/types';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Loader2, ListTodo, Inbox } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRouter } from 'next/navigation';

interface EnrichedTask extends Task {
  boardName?: string;
}

const statusColors: { [key: string]: string } = {
  'Not Started': 'bg-purple-500',
  'In Progress': 'bg-blue-500',
  'Pending Review': 'bg-yellow-500',
  'Completed': 'bg-green-500',
};


export default function MyTasksPage() {
  const { userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [tasks, setTasks] = useState<EnrichedTask[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  const [statusFilter, setStatusFilter] = useState('all');
  const [boardFilter, setBoardFilter] = useState('all');


  useEffect(() => {
    if (!authLoading && userProfile && userProfile.role === 'student') {
        toast({ title: 'Access Denied', description: 'This page is not available for students.', variant: 'destructive'});
        router.push('/dashboard');
        return;
    }
      
    if (!userProfile?.uid) {
        if (!authLoading) setLoading(false);
        return;
    };

    setLoading(true);
    let unsubTasks: () => void;
    let unsubBoards: () => void;

    try {
      const tasksQuery = query(collection(db, 'tasks'), where('assignedToUserIds', 'array-contains', userProfile.uid));
      unsubTasks = onSnapshot(tasksQuery, (snapshot) => {
        const userTasks = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Task));
        
        const boardsQuery = query(collection(db, 'boards'), where('memberUids', 'array-contains', userProfile.uid));
        unsubBoards = onSnapshot(boardsQuery, (boardSnapshot) => {
            const userBoards = boardSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Board));
            setBoards(userBoards);
            
            const boardsMap = new Map(userBoards.map(b => [b.id, b.name]));
            const enrichedTasks = userTasks.map(task => ({
                ...task,
                boardName: boardsMap.get(task.boardId) || 'Unknown Board'
            }));
            
            setTasks(enrichedTasks);
            setLoading(false);
        });
      }, (error) => {
        console.error("Error fetching tasks: ", error);
        toast({ title: "Error", description: "Could not fetch your tasks.", variant: "destructive" });
        setLoading(false);
      });

    } catch (error) {
       console.error("Error setting up listeners: ", error);
       toast({ title: "Error", description: "Could not initialize task page.", variant: "destructive" });
       setLoading(false);
    }
    
    return () => {
      if (unsubTasks) unsubTasks();
      if (unsubBoards) unsubBoards();
    };

  }, [userProfile, authLoading, toast, router]);

  const filteredTasks = tasks.filter(task => {
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesBoard = boardFilter === 'all' || task.boardId === boardFilter;
    return matchesStatus && matchesBoard;
  });
  
  if (loading || authLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4">Loading your tasks...</p>
      </div>
    );
  }

  if (!userProfile || userProfile.role === 'student') {
    return (
       <div className="flex h-full w-full items-center justify-center">
         <p>Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <ListTodo className="h-7 w-7 text-primary" />
            My Personal Tasks
          </CardTitle>
          <CardDescription>
            A consolidated view of all tasks assigned to you across all boards.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 border rounded-lg bg-muted/30">
                <div className="flex-1">
                    <label className="text-sm font-medium">Filter by Status</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="Not Started">Not Started</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Pending Review">Pending Review</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex-1">
                    <label className="text-sm font-medium">Filter by Board</label>
                    <Select value={boardFilter} onValueChange={setBoardFilter}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Boards</SelectItem>
                            {boards.map(board => (
                                <SelectItem key={board.id} value={board.id}>{board.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
          {filteredTasks.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
              <Inbox className="h-12 w-12 mx-auto mb-3 text-primary/30" />
              <h3 className="text-lg font-semibold text-foreground mb-1">No Tasks Found</h3>
              <p className="text-sm">Either you're all caught up, or no tasks match your filters!</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {filteredTasks.map(task => (
                <li key={task.id}>
                    <button onClick={() => setSelectedTask(task)} className="w-full text-left">
                        <Card className="hover:border-primary transition-all">
                            <CardContent className="p-4 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className={`w-2 h-10 rounded-full ${statusColors[task.status] || 'bg-gray-400'}`}></div>
                                    <div>
                                        <p className="font-semibold">{task.title}</p>
                                        <p className="text-sm text-muted-foreground">From Board: <span className="font-medium text-primary">{task.boardName}</span></p>
                                    </div>
                                </div>
                                <div className="text-right text-sm">
                                    <Badge variant="outline" className="capitalize mb-1">{task.status}</Badge>
                                    {task.dueDate && <p className="text-xs text-muted-foreground">Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}</p>}
                                </div>
                            </CardContent>
                        </Card>
                    </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      
      {selectedTask && (
        <TaskDetailModal
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          task={selectedTask}
          boardMembers={[]} // We don't have board context here, modal should handle this
          allUsers={[]} // Same as above
          canManage={false} // User can't manage from this view, only update their own status
        />
      )}
    </div>
  );
}
