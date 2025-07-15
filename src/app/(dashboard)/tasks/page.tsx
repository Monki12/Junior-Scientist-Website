
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { Task, UserProfileData, Board, BoardMember } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { ListChecks, Loader2, PlusCircle, Users, Users2 } from 'lucide-react';
import { nanoid } from 'nanoid';
import TaskBoard from '@/components/tasks/TaskBoard';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';
import { Input } from '@/components/ui/input';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, doc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';


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

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        setAllUsers(snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserProfileData)));
    });

    const boardsQuery = query(collection(db, 'boards'), where('memberUids', 'array-contains', userProfile.uid));
    const unsubBoards = onSnapshot(boardsQuery, (snapshot) => {
        setBoards(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Board)));
        setLoading(false);
    });
    
    return () => {
        unsubUsers();
        unsubBoards();
    }
  }, [userProfile?.uid, toast]);

  useEffect(() => {
    if (!currentBoard) {
      setTasks([]);
      setBoardMembers([]);
      return;
    }
    setLoading(true);

    const members = currentBoard.memberUids.map(uid => {
        const user = allUsers.find(u => u.uid === uid);
        return {
            userId: uid,
            name: user?.fullName || 'Unknown User',
            role: user?.role || 'member',
            photoURL: user?.photoURL
        }
    });
    setBoardMembers(members);

    const tasksQuery = query(collection(db, 'tasks'), where('boardId', '==', currentBoard.id));
    const unsubTasks = onSnapshot(tasksQuery, (snapshot) => {
        setTasks(snapshot.docs.map(doc => ({...doc.data(), id: doc.id} as Task)));
        setLoading(false);
    });

    return () => unsubTasks();

  }, [currentBoard, allUsers]);

  const handleCreateBoard = async () => {
    if (!newBoardName.trim() || !userProfile) return;
    setIsNewBoardModalOpen(false);

    try {
        const newBoardData: Omit<Board, 'id'> = {
            name: newBoardName,
            type: 'team', // Or another default type
            memberUids: [userProfile.uid],
            managerUids: [userProfile.uid],
            createdAt: serverTimestamp(),
            createdBy: userProfile.uid,
        };
        const docRef = await addDoc(collection(db, 'boards'), newBoardData);
        // The real-time listener will automatically update the UI.
        setCurrentBoard({ ...newBoardData, id: docRef.id, createdAt: new Date() });
        toast({ title: "Board Created", description: `Board "${newBoardName}" has been added.` });
        setNewBoardName('');
    } catch (e: any) {
        toast({ title: "Error", description: `Could not create board: ${e.message}`, variant: "destructive" });
    }
  };

  const handleOpenTaskModal = (task: Task | null) => {
    setEditingTask(task);
  };
  
  const handleTaskUpdate = async (updatedTask: Task) => {
    if (!currentBoard) return;
    onCloseModal();

    if (updatedTask.id) { // Update existing task
        const taskRef = doc(db, 'tasks', updatedTask.id);
        await updateDoc(taskRef, {
            ...updatedTask,
            updatedAt: serverTimestamp(),
        });
        toast({ title: "Task Updated" });
    } else { // Create new task
        await addDoc(collection(db, 'tasks'), {
            ...updatedTask,
            boardId: currentBoard.id,
            creatorId: userProfile?.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        toast({ title: "Task Created" });
    }
  };

  const onCloseModal = () => {
    setEditingTask(null);
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
        {loading && !currentBoard ? (
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
                                <p className="text-sm text-muted-foreground"><Users2 className="inline h-4 w-4 mr-1"/>{board.memberUids.length} members</p>
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
            onClose={onCloseModal}
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
