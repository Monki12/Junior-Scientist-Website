
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { Task, UserProfileData, Board, BoardMember } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { ListChecks, Loader2, PlusCircle, Users, Users2 } from 'lucide-react';
import { getMockBoards, getMockTasksForBoard, getMockUsers } from '@/data/mock-tasks';
import { nanoid } from 'nanoid';
import TaskBoard from '@/components/tasks/TaskBoard';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';
import { Input } from '@/components/ui/input';

const USE_MOCK_DATA = process.env.NODE_ENV !== 'production';

export default function TasksPage() {
  const { toast } = useToast();
  const { userProfile } = useAuth();

  const [allUsers, setAllUsers] = useState<UserProfileData[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [currentBoard, setCurrentBoard] = useState<Board | null>(null);
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([]);
  
  const [loading, setLoading] = useState(true);

  const [isNewBoardModalOpen, setIsNewBoardModalOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');

  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    if (!userProfile?.uid) return;
    setLoading(true);

    if (USE_MOCK_DATA) {
        setAllUsers(getMockUsers());
        const { myBoards } = getMockBoards(userProfile.uid);
        setBoards(myBoards);
        setLoading(false);
        return;
    }
    
    // Firestore logic would go here in a real scenario
    console.log("Fetching live data is disabled in this development mode.");
    setLoading(false);

  }, [userProfile?.uid, toast]);

  useEffect(() => {
    if (!currentBoard) {
      setTasks([]);
      setBoardMembers([]);
      return;
    }
    setLoading(true);

    if (USE_MOCK_DATA) {
        setTasks(getMockTasksForBoard(currentBoard.id));
        setBoardMembers(currentBoard.members);
    } else {
        // Firestore logic for tasks would go here
    }
    setLoading(false);
  }, [currentBoard]);

  const handleCreateBoard = async () => {
    if (!newBoardName.trim() || !userProfile) return;
    
    if (USE_MOCK_DATA) {
        const newMockBoard: Board = {
            id: `mock_board_${nanoid()}`,
            name: newBoardName,
            type: 'general',
            memberUids: [userProfile.uid],
            members: [{ userId: userProfile.uid, name: userProfile.fullName || userProfile.displayName || 'Me', role: userProfile.role as string, photoURL: userProfile.photoURL }],
            managerUids: [userProfile.uid],
            createdAt: new Date(),
            createdBy: userProfile.uid,
        };
        setBoards(prev => [...prev, newMockBoard]);
        setCurrentBoard(newMockBoard);
        toast({ title: "Board Created (Mock)", description: `Board "${newBoardName}" has been added.` });
        setNewBoardName('');
        setIsNewBoardModalOpen(false);
        return;
    }

    // Firestore logic for creating a board would go here
  };

  const handleOpenTaskModal = (task: Task | null) => {
    setEditingTask(task);
  };
  
  const handleTaskUpdate = (updatedTask: Task) => {
    // If task has an ID, it's an update.
    if (updatedTask.id && tasks.some(t => t.id === updatedTask.id)) {
        setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    } else {
        // This is a new task. Give it a mock ID and add it to the state.
        const newTaskWithId: Task = { 
            ...updatedTask, 
            id: `mock_task_${nanoid()}`,
            assignedToUserIds: [], // New tasks are always unassigned
            createdAt: new Date().toISOString(),
            boardId: currentBoard!.id, // Assign to current board
        };
        setTasks(prev => [...prev, newTaskWithId]);
    }
  };

  const canCreateBoards = userProfile && ['admin', 'overall_head', 'event_representative'].includes(userProfile.role);

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col space-y-4">
      <header className="flex flex-shrink-0 flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-2">
            <h1 className="text-2xl font-bold text-primary flex items-center gap-3">
                <ListChecks className="h-7 w-7" />
                {currentBoard ? `Board: ${currentBoard.name}` : 'Team Boards'}
            </h1>
            {currentBoard && (
              <Button variant="link" size="sm" onClick={() => setCurrentBoard(null)} className="p-0 h-auto text-sm">
                &larr; Back to board selection
              </Button>
            )}
        </div>
      </header>
      
      <main className="flex-1 overflow-auto pb-4">
        {loading ? (
            <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : !currentBoard ? (
            <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Select a Board</h2>
                    {canCreateBoards && (
                        <Button onClick={() => setIsNewBoardModalOpen(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Create New Board
                        </Button>
                    )}
                </div>
                 {boards.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {boards.map(board => (
                            <button key={board.id} onClick={() => setCurrentBoard(board)} className="p-4 border rounded-lg text-left hover:border-primary transition-colors">
                                <h3 className="font-bold text-lg">{board.name}</h3>
                                <p className="text-sm text-muted-foreground"><Users2 className="inline h-4 w-4 mr-1"/>{board.members?.length || board.memberUids.length} members</p>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                        <Users className="h-12 w-12 mx-auto mb-3 text-primary/30" />
                        <h3 className="text-lg font-semibold text-foreground mb-1">No Boards Found</h3>
                        <p className="text-sm">You are not a member of any boards yet.</p>
                        {canCreateBoards && <p className="text-sm mt-1">Click "Create New Board" to get started.</p>}
                    </div>
                )}
            </div>
        ) : (
          <TaskBoard
            board={currentBoard}
            tasks={tasks}
            members={boardMembers}
            onEditTask={handleOpenTaskModal}
            loading={loading}
            setTasks={setTasks}
          />
        )}
      </main>

      <Dialog open={isNewBoardModalOpen} onOpenChange={setIsNewBoardModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create New Board</DialogTitle></DialogHeader>
          <div className="py-4">
            <Input 
                placeholder="New board name..." 
                value={newBoardName} 
                onChange={(e) => setNewBoardName(e.target.value)} 
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewBoardModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateBoard} disabled={!newBoardName.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {editingTask !== undefined && (
        <TaskDetailModal
            isOpen={editingTask !== null}
            onClose={() => setEditingTask(null)}
            task={editingTask}
            board={currentBoard}
            boardMembers={boardMembers}
            allUsers={allUsers}
            canManage={!!(userProfile && currentBoard && (currentBoard.managerUids?.includes(userProfile.uid) || ['admin', 'overall_head'].includes(userProfile.role)))}
            onTaskUpdate={handleTaskUpdate}
        />
       )}
    </div>
  );
}
