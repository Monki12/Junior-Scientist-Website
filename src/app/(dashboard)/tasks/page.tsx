
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { Task, UserProfileData, Board, BoardMember, SubEvent } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { ListChecks, Loader2, PlusCircle, Users } from 'lucide-react';
import { collection, query, onSnapshot, addDoc, serverTimestamp, where, getDocs, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import TaskBoard from '@/components/tasks/TaskBoard';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';
import { getMockBoards, getMockTasksForBoard, getMockUsers } from '@/data/mock-tasks';

// --- DEV FLAG ---
const USE_MOCK_DATA = process.env.NODE_ENV === 'development';

export default function TasksPage() {
  const { toast } = useToast();
  const { userProfile } = useAuth();

  const [allUsers, setAllUsers] = useState<UserProfileData[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [currentBoard, setCurrentBoard] = useState<Board | null>(null);
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [loadingBoardData, setLoadingBoardData] = useState(false);

  const [isNewBoardModalOpen, setIsNewBoardModalOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');

  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Auto-create event boards if they don't exist
  useEffect(() => {
      const syncEventBoards = async () => {
          if (!userProfile || !['admin', 'overall_head'].includes(userProfile.role) || USE_MOCK_DATA) return;

          const eventsRef = collection(db, 'subEvents');
          const eventsSnapshot = await getDocs(eventsRef);
          const allEvents = eventsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as SubEvent);
          
          const boardsRef = collection(db, 'boards');
          const boardsSnapshot = await getDocs(query(boardsRef, where('type', '==', 'event')));
          const existingEventBoardIds = boardsSnapshot.docs.map(doc => doc.data().eventId);

          for (const event of allEvents) {
              if (!existingEventBoardIds.includes(event.id)) {
                  // Create a board for this event
                  const newBoard = {
                      name: `${event.title} Board`,
                      type: 'event',
                      eventId: event.id,
                      memberUids: [userProfile.uid, ...event.eventReps, ...event.organizerUids],
                      members: [{ userId: userProfile.uid, name: userProfile.fullName || userProfile.displayName || '', role: userProfile.role }], // simplified initial member
                      managerUids: [userProfile.uid, ...event.eventReps],
                      createdAt: serverTimestamp(),
                      createdBy: userProfile.uid
                  };
                  await addDoc(boardsRef, newBoard);
              }
          }
      };
      
      syncEventBoards();
  }, [userProfile]);

  // Fetch all boards the user is a member of and all potential users
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

    const usersQuery = query(collection(db, 'users'));
    onSnapshot(usersQuery, (snapshot) => {
        const usersList = snapshot.docs.map(doc => ({...doc.data(), uid: doc.id} as UserProfileData));
        setAllUsers(usersList);
    });

    const boardsQuery = query(collection(db, 'boards'), where('memberUids', 'array-contains', userProfile.uid));
    const unsubBoards = onSnapshot(boardsQuery, (snapshot) => {
      const userBoards = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Board));
      setBoards(userBoards);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching boards:", error);
      toast({ title: "Error", description: "Could not fetch your boards.", variant: "destructive" });
      setLoading(false);
    });
    
    return () => unsubBoards();
  }, [userProfile?.uid, toast]);

  // Fetch tasks and members for the currently selected board
  useEffect(() => {
    if (!currentBoard) {
      setTasks([]);
      setBoardMembers([]);
      return;
    }
    setLoadingBoardData(true);

    if (USE_MOCK_DATA) {
        setTasks(getMockTasksForBoard(currentBoard.id));
        setBoardMembers(currentBoard.members);
        setLoadingBoardData(false);
        return;
    }

    const tasksQuery = query(collection(db, 'tasks'), where('boardId', '==', currentBoard.id));
    const unsubTasks = onSnapshot(tasksQuery, (snapshot) => {
      const boardTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      setTasks(boardTasks);
      setLoadingBoardData(false);
    });

    const membersWithDetails = currentBoard.members || [];
    setBoardMembers(membersWithDetails);
    
    return () => unsubTasks();
  }, [currentBoard]);


  const handleCreateBoard = async () => {
    if (!newBoardName.trim() || !userProfile) return;
    
    if (USE_MOCK_DATA) {
        toast({ title: "Mock Data Mode", description: "Cannot create boards in development."});
        setIsNewBoardModalOpen(false);
        return;
    }

    try {
        const newBoardRef = await addDoc(collection(db, 'boards'), {
            name: newBoardName,
            type: 'general',
            memberUids: [userProfile.uid],
            members: [{ userId: userProfile.uid, name: userProfile.fullName || userProfile.displayName, role: userProfile.role }],
            managerUids: [userProfile.uid],
            createdAt: serverTimestamp(),
            createdBy: userProfile.uid,
        });
        
        toast({ title: "Board Created", description: `Board "${newBoardName}" has been created.` });
        setNewBoardName('');
        setIsNewBoardModalOpen(false);
        
        // This part needs adjustment, as serverTimestamp is not immediately available client-side
        // For immediate feedback, we create a temporary object.
        setCurrentBoard({
          id: newBoardRef.id,
          name: newBoardName,
          type: 'general',
          memberUids: [userProfile.uid],
          members: [{ userId: userProfile.uid, name: userProfile.fullName || userProfile.displayName, role: userProfile.role }],
          managerUids: [userProfile.uid],
          createdAt: new Date(), // Use local date for immediate UI update
          createdBy: userProfile.uid
        });

    } catch(e) {
        toast({ title: "Error", description: "Failed to create board.", variant: "destructive"});
    }
  };

  const handleOpenTaskModal = (task: Task | null) => {
    setEditingTask(task);
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
                                <p className="text-sm text-muted-foreground">{board.members?.length || board.memberUids.length} members</p>
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
      
      <TaskDetailModal
        isOpen={editingTask !== null}
        onClose={() => setEditingTask(null)}
        task={editingTask}
        board={currentBoard}
        boardMembers={boardMembers}
        allUsers={allUsers}
        canManage={!!(userProfile && currentBoard && (currentBoard.managerUids?.includes(userProfile.uid) || ['admin', 'overall_head'].includes(userProfile.role)))}
      />
    </div>
  );
}
