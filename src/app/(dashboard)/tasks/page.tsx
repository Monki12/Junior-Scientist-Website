
'use client';

import { useEffect, useState, useMemo, FormEvent } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { Task, Board, BoardMember, UserProfileData } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { ListChecks, Loader2, PlusCircle, Users, Briefcase } from 'lucide-react';
import TaskBoard from '@/components/tasks/TaskBoard';
import { Input } from '@/components/ui/input';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, doc, addDoc, serverTimestamp, Query } from 'firebase/firestore';
import { Card } from '@/components/ui/card';

export default function TasksPage() {
  const { toast } = useToast();
  const { userProfile } = useAuth();

  const [allUsers, setAllUsers] = useState<UserProfileData[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [currentBoard, setCurrentBoard] = useState<Board | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [isCreatingBoard, setIsCreatingBoard] = useState(false);
  const [isCreateBoardModalOpen, setIsCreateBoardModalOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');


  useEffect(() => {
    if (!userProfile?.uid) return;
    setLoading(true);

    const staffRoles = ['admin', 'overall_head', 'event_representative', 'organizer'];
    const usersQuery = query(collection(db, 'users'), where('role', 'in', staffRoles));
    const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
        setAllUsers(snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserProfileData)));
    });

    let boardsQuery: Query;
    if (userProfile.role === 'admin' || userProfile.role === 'overall_head') {
      // Admins and Overall Heads see all boards
      boardsQuery = query(collection(db, 'boards'));
    } else {
      // Other roles see only boards they are members of
      boardsQuery = query(collection(db, 'boards'), where('memberUids', 'array-contains', userProfile.uid));
    }

    const unsubBoards = onSnapshot(boardsQuery, (snapshot) => {
        const boardList = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Board));
        setBoards(boardList);
        setLoading(false);
    }, (err) => {
      console.error(err);
      toast({title: "Error", description: "Could not fetch task boards.", variant: "destructive"});
      setLoading(false);
    });
    
    return () => {
        unsubUsers();
        unsubBoards();
    }
  }, [userProfile?.uid, userProfile?.role, toast]);

  useEffect(() => {
    if (!currentBoard) {
      setTasks([]);
      return;
    }
    setLoading(true);
    
    const tasksQuery = query(collection(db, 'tasks'), where('boardId', '==', currentBoard.id));
    const unsubTasks = onSnapshot(tasksQuery, (snapshot) => {
        setTasks(snapshot.docs.map(doc => ({...doc.data(), id: doc.id} as Task)));
        setLoading(false);
    }, (err) => {
        console.error("Error fetching tasks for board:", err);
        toast({title: "Error", description: `Could not fetch tasks for ${currentBoard.name}.`, variant: "destructive"});
        setLoading(false);
    });

    return () => unsubTasks();

  }, [currentBoard, toast]);

  const boardMembers = useMemo(() => {
    if (!currentBoard) return [];
    let membersToDisplay = allUsers.filter(u => currentBoard.memberUids.includes(u.uid));
    return membersToDisplay.map(user => ({
        userId: user.uid,
        name: user?.fullName || 'Unknown User',
        role: user?.role || 'member',
        photoURL: user?.photoURL
    }));
  }, [currentBoard, allUsers]);

  const handleCreateBoard = async (e: FormEvent) => {
    e.preventDefault();
    if (!newBoardName.trim() || !userProfile) {
        toast({ title: "Board name is required.", variant: "destructive"});
        return;
    }
    setIsCreatingBoard(true);
    try {
        const newBoardData = {
            name: newBoardName,
            description: `A general purpose task board.`,
            type: 'general' as const,
            memberUids: [userProfile.uid],
            managerUids: [userProfile.uid],
            createdAt: serverTimestamp(),
            createdBy: userProfile.uid
        };
        await addDoc(collection(db, 'boards'), newBoardData);
        toast({ title: "Board Created", description: `Board "${newBoardName}" was successfully created.`});
        setNewBoardName('');
        setIsCreateBoardModalOpen(false);
    } catch(err: any) {
        toast({ title: "Error creating board", description: err.message, variant: "destructive"});
    } finally {
        setIsCreatingBoard(false);
    }
  }


  if (loading && !currentBoard) {
      return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  // Main Conditional Rendering
  if (currentBoard) {
    return <TaskBoard board={currentBoard} tasks={tasks} members={boardMembers} onBack={() => setCurrentBoard(null)} allUsers={allUsers}/>;
  }

  // Board Selection View
  return (
    <div className="p-4">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-primary flex items-center gap-3">
                <ListChecks className="h-7 w-7" />
                Team Task Boards
            </h1>
            <Dialog open={isCreateBoardModalOpen} onOpenChange={setIsCreateBoardModalOpen}>
                <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4"/> Create New Board
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create a General Board</DialogTitle>
                        <DialogDescription>Create a board for tasks not related to a specific event.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateBoard}>
                        <Input
                            placeholder="Board Name (e.g., Marketing, General)"
                            value={newBoardName}
                            onChange={(e) => setNewBoardName(e.target.value)}
                            disabled={isCreatingBoard}
                        />
                        <DialogFooter className="mt-4">
                            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                            <Button type="submit" disabled={isCreatingBoard}>
                                {isCreatingBoard && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Create Board
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
        {boards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {boards.map(board => (
                    <Card 
                        key={board.id} 
                        onClick={() => setCurrentBoard(board)} 
                        className="p-4 text-left hover:border-primary transition-colors cursor-pointer shadow-soft hover:shadow-md-soft"
                    >
                        <div className="flex items-start justify-between">
                            <h3 className="font-bold text-lg text-foreground">{board.name}</h3>
                            {board.type === 'event' && <Briefcase className="h-4 w-4 text-muted-foreground" title="Event Board" />}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1.5">
                          <Users className="h-4 w-4"/>
                          {board.memberUids.length} members
                        </p>
                    </Card>
                ))}
            </div>
        ) : (
            <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                <Users className="h-12 w-12 mx-auto mb-3 text-primary/30" />
                <h3 className="text-lg font-semibold text-foreground mb-1">No Boards Found</h3>
                <p className="text-sm">Create a general board or an event to get started.</p>
            </div>
        )}
    </div>
  );
}
