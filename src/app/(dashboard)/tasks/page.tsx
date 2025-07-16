
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { Task, Board, BoardMember, UserProfileData } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { ListChecks, Loader2, PlusCircle, Users, Users2, Settings, Trash2 } from 'lucide-react';
import TaskBoard from '@/components/tasks/TaskBoard';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';
import { Input } from '@/components/ui/input';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, doc, addDoc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { nanoid } from 'nanoid';
import { Card } from '@/components/ui/card';

export default function TasksPage() {
  const { toast } = useToast();
  const { userProfile } = useAuth();

  const [allUsers, setAllUsers] = useState<UserProfileData[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [currentBoard, setCurrentBoard] = useState<Board | null>(null);
  
  const [loading, setLoading] = useState(true);

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const [isManageMembersModalOpen, setIsManageMembersModalOpen] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);


  useEffect(() => {
    if (!userProfile?.uid) return;
    setLoading(true);

    const staffRoles = ['admin', 'overall_head', 'event_representative', 'organizer'];
    const usersQuery = query(collection(db, 'users'), where('role', 'in', staffRoles));
    const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
        setAllUsers(snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserProfileData)));
    });

    const boardsQuery = query(collection(db, 'boards'), where('memberUids', 'array-contains', userProfile.uid));
    const unsubBoards = onSnapshot(boardsQuery, (snapshot) => {
        const boardList = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Board));
        setBoards(boardList);
        setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });
    
    return () => {
        unsubUsers();
        unsubBoards();
    }
  }, [userProfile?.uid]);

  useEffect(() => {
    if (!currentBoard) {
      setTasks([]);
      return;
    }
    setLoading(true);
    setSelectedMemberIds(currentBoard.memberUids); // Sync selection with current members

    const tasksQuery = query(collection(db, 'tasks'), where('boardId', '==', currentBoard.id));
    const unsubTasks = onSnapshot(tasksQuery, (snapshot) => {
        setTasks(snapshot.docs.map(doc => ({...doc.data(), id: doc.id} as Task)));
        setLoading(false);
    });

    return () => unsubTasks();

  }, [currentBoard]);

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

  const handleOpenTaskModal = (task: Task | null) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };
  
  const handleTaskUpdate = async (updatedTask: Partial<Task>) => {
    if (!currentBoard || !userProfile) return;

    if (updatedTask.id) { // This is an update to an existing task
        const taskRef = doc(db, 'tasks', updatedTask.id);
        await updateDoc(taskRef, {
            ...updatedTask,
            updatedAt: serverTimestamp(),
        });
        toast({ title: "Task Updated" });
    } else { // This is a new task creation
        const { id, ...taskData } = updatedTask;
        const newTaskData: any = {
            ...taskData,
            boardId: currentBoard.id,
            creatorId: userProfile.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };
        await addDoc(collection(db, 'tasks'), newTaskData);
        toast({ title: "Task Created" });
    }
    setIsTaskModalOpen(false);
  };

  const handleTaskDelete = async (taskId: string) => {
    try {
        await deleteDoc(doc(db, "tasks", taskId));
        toast({ title: "Task Deleted", description: "The task has been permanently removed."});
    } catch (e: any) {
        toast({ title: "Error", description: "Could not delete task.", variant: "destructive"});
        console.error("Error deleting task:", e);
    }
  }

  const handleMemberSelectionChange = (memberId: string, isSelected: boolean) => {
      setSelectedMemberIds(prev => isSelected ? [...prev, memberId] : prev.filter(id => id !== memberId));
  };

  const handleSaveMembers = async () => {
      if (!currentBoard) return;
      try {
          const boardRef = doc(db, 'boards', currentBoard.id);
          await updateDoc(boardRef, {
              memberUids: selectedMemberIds,
              updatedAt: serverTimestamp(),
          });
          toast({ title: "Members Updated", description: "Board members have been successfully updated." });
          setIsManageMembersModalOpen(false);
      } catch (e: any) {
          toast({ title: "Error", description: `Could not update members: ${e.message}`, variant: "destructive" });
      }
  };

  const onCloseModal = () => {
    setEditingTask(null);
    setIsTaskModalOpen(false);
  };

  const canManageCurrentBoard = userProfile && currentBoard && (currentBoard.managerUids?.includes(userProfile.uid) || ['admin', 'overall_head'].includes(userProfile.role));

  if (loading && !currentBoard) {
      return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  // Main Conditional Rendering
  if (currentBoard) {
    return (
      <div className="flex h-[calc(100vh-8rem)] flex-col space-y-4">
        <header className="flex flex-shrink-0 flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-2">
              <h1 className="text-2xl font-bold text-primary flex items-center gap-3">
                  <ListChecks className="h-7 w-7" />
                  Board: {currentBoard.name}
              </h1>
              <div className="flex items-center gap-4">
                <Button variant="link" size="sm" onClick={() => setCurrentBoard(null)} className="p-0 h-auto text-sm">
                  &larr; Back to board selection
                </Button>
                {canManageCurrentBoard && (
                    <Button variant="outline" size="sm" onClick={() => setIsManageMembersModalOpen(true)}>
                        <Settings className="mr-2 h-4 w-4" />
                        Manage Members
                    </Button>
                )}
              </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto pb-4">
           <TaskBoard
              board={currentBoard}
              tasks={tasks}
              members={boardMembers}
              onEditTask={handleOpenTaskModal}
              onInitiateDelete={(task) => handleOpenTaskModal(task)} // Reusing modal for now
            />
        </main>
        
        <TaskDetailModal
            isOpen={isTaskModalOpen}
            onClose={onCloseModal}
            task={editingTask}
            board={currentBoard}
            boardMembers={boardMembers}
            allUsers={allUsers}
            canManage={!!canManageCurrentBoard}
            onTaskUpdate={handleTaskUpdate}
            onTaskDelete={handleTaskDelete}
        />

        <Dialog open={isManageMembersModalOpen} onOpenChange={setIsManageMembersModalOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Manage Board Members</DialogTitle>
                    <DialogDescription>Add or remove staff from this board.</DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-72 my-4">
                    <div className="space-y-2 pr-4">
                        {allUsers.map(user => (
                            <div key={user.uid} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                               <div className="flex items-center gap-2">
                                 <Avatar className="h-8 w-8">
                                    <AvatarImage src={user.photoURL || ''} />
                                    <AvatarFallback>{(user.fullName||'U')[0]}</AvatarFallback>
                                 </Avatar>
                                 <div>
                                     <p className="text-sm font-medium">{user.fullName}</p>
                                     <p className="text-xs text-muted-foreground capitalize">{user.role.replace(/_/g, ' ')}</p>
                                 </div>
                               </div>
                                <Checkbox 
                                    id={`member-${user.uid}`}
                                    checked={selectedMemberIds.includes(user.uid)}
                                    onCheckedChange={(checked) => handleMemberSelectionChange(user.uid, !!checked)}
                                />
                            </div>
                        ))}
                    </div>
                </ScrollArea>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button onClick={handleSaveMembers}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>
    )
  }

  // Board Selection View
  return (
    <div className="p-4">
        <h1 className="text-2xl font-bold text-primary flex items-center gap-3 mb-6">
            <ListChecks className="h-7 w-7" />
            Team Task Boards
        </h1>
        {boards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {boards.map(board => (
                    <Card 
                        key={board.id} 
                        onClick={() => setCurrentBoard(board)} 
                        className="p-4 text-left hover:border-primary transition-colors cursor-pointer shadow-soft hover:shadow-md-soft"
                    >
                        <h3 className="font-bold text-lg text-foreground">{board.name}</h3>
                        <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1.5">
                          <Users2 className="h-4 w-4"/>
                          {board.memberUids.length} members
                        </p>
                    </Card>
                ))}
            </div>
        ) : (
            <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                <Users className="h-12 w-12 mx-auto mb-3 text-primary/30" />
                <h3 className="text-lg font-semibold text-foreground mb-1">No Boards Found</h3>
                <p className="text-sm">You are not a member of any boards yet.</p>
                <p className="text-sm mt-1">Boards are created automatically when a new event is made.</p>
            </div>
        )}
    </div>
  );
}
