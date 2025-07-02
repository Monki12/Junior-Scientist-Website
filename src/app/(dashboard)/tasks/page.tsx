
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { Task, UserProfileData, Board, Subtask } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { ListChecks, Loader2, PlusCircle, Trash2, Users } from 'lucide-react';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, Unsubscribe, serverTimestamp, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import TaskBoard from '@/components/tasks/TaskBoard';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';

export default function TasksPage() {
  const { toast } = useToast();
  const { userProfile } = useAuth();

  const [allUsers, setAllUsers] = useState<UserProfileData[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [currentBoard, setCurrentBoard] = useState<Board | null>(null);
  const [boardUsers, setBoardUsers] = useState<UserProfileData[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [loadingBoardData, setLoadingBoardData] = useState(false);

  const [isNewBoardModalOpen, setIsNewBoardModalOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Fetch all boards the user is a member of and all potential users
  useEffect(() => {
    if (!userProfile?.uid) return;
    
    setLoading(true);
    const boardsQuery = query(collection(db, 'boards'), where('memberUids', 'array-contains', userProfile.uid));
    const unsubBoards = onSnapshot(boardsQuery, (snapshot) => {
      const userBoards = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Board));
      setBoards(userBoards);
      if (userBoards.length > 0 && !currentBoard) {
        // Automatically select the first board if none is selected
        // selectBoard(userBoards[0]);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching boards:", error);
      setLoading(false);
    });

    const usersQuery = query(collection(db, 'users'));
    const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
        const usersList = snapshot.docs.map(doc => ({...doc.data(), uid: doc.id} as UserProfileData));
        setAllUsers(usersList);
    });

    return () => {
        unsubBoards();
        unsubUsers();
    };
  }, [userProfile?.uid]);

  const selectBoard = (board: Board | null) => {
    setCurrentBoard(board);
    if (!board) {
      setTasks([]);
      setBoardUsers([]);
      return;
    }

    setLoadingBoardData(true);
    const unsubs: Unsubscribe[] = [];

    const tasksQuery = query(collection(db, 'tasks'), where('boardId', '==', board.id));
    unsubs.push(onSnapshot(tasksQuery, (snapshot) => {
      const boardTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      setTasks(boardTasks);
      setLoadingBoardData(false); // Can set loading to false after tasks are fetched
    }));

    if (board.memberUids && board.memberUids.length > 0) {
      const usersQuery = query(collection(db, 'users'), where('uid', 'in', board.memberUids));
      unsubs.push(onSnapshot(usersQuery, (snapshot) => {
        const users = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfileData));
        setBoardUsers(users);
      }));
    } else {
        setBoardUsers([]);
    }
    
    // Cleanup function to be called when board changes
    return () => unsubs.forEach(unsub => unsub());
  };

  useEffect(() => {
    if (currentBoard) {
      const cleanup = selectBoard(currentBoard);
      return cleanup;
    }
  }, [currentBoard?.id]);


  const handleCreateBoard = async () => {
    if (!newBoardName.trim() || !userProfile) return;
    try {
        await addDoc(collection(db, 'boards'), {
            name: newBoardName,
            memberUids: [userProfile.uid],
            managerUids: [userProfile.uid],
            createdAt: serverTimestamp(),
            createdBy: userProfile.uid,
        });
        toast({ title: "Board Created", description: `Board "${newBoardName}" has been created.` });
        setNewBoardName('');
        setIsNewBoardModalOpen(false);
    } catch(e) {
        toast({ title: "Error", description: "Failed to create board.", variant: "destructive"});
    }
  };

  const handleOpenTaskModal = (task: Task | null) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };
  
  const canManageCurrentBoard = userProfile && currentBoard && (currentBoard.managerUids?.includes(userProfile.uid) || ['admin', 'overall_head'].includes(userProfile.role));
  const canCreateBoards = userProfile && ['admin', 'overall_head'].includes(userProfile.role);

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col space-y-4">
      <header className="flex flex-shrink-0 flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-2">
            <h1 className="text-2xl font-bold text-primary flex items-center gap-3">
                <ListChecks className="h-7 w-7" />
                {currentBoard ? `Board: ${currentBoard.name}` : 'Team Boards'}
            </h1>
        </div>
        <div className="flex items-center gap-2">
            {canManageCurrentBoard && (
                <Button onClick={() => handleOpenTaskModal(null)} disabled={!currentBoard || loadingBoardData}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Task
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
                            <button key={board.id} onClick={() => selectBoard(board)} className="p-4 border rounded-lg text-left hover:border-primary transition-colors">
                                <h3 className="font-bold text-lg">{board.name}</h3>
                                <p className="text-sm text-muted-foreground">{board.memberUids.length} members</p>
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
            users={boardUsers}
            onEditTask={handleOpenTaskModal}
            loading={loadingBoardData}
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
      
      {isTaskModalOpen && (
          <TaskDetailModal
            isOpen={isTaskModalOpen}
            onClose={() => { setIsTaskModalOpen(false); setEditingTask(null); }}
            task={editingTask}
            board={currentBoard}
            boardMembers={boardUsers}
            allUsers={allUsers}
            canManage={!!canManageCurrentBoard}
          />
      )}
    </div>
  );
}
