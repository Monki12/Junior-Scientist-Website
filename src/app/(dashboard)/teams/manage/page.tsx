
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { Board, UserProfileData } from '@/types';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Users2, ShieldAlert, Edit, Users } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';


export default function ManageTeamsPage() {
  const { userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [boards, setBoards] = useState<Board[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfileData[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [boardForm, setBoardForm] = useState<{ name: string; description: string; memberUids: string[] }>({ name: '', description: '', memberUids: [] });

  const canManagePage = userProfile && ['admin', 'overall_head'].includes(userProfile.role);

  useEffect(() => {
    if (authLoading) return;
    if (!canManagePage) {
        toast({ title: 'Access Denied', description: 'You do not have permission to manage boards.', variant: 'destructive' });
        router.push('/dashboard');
        return;
    }

    setLoadingData(true);
    const unsubBoards = onSnapshot(collection(db, 'boards'), (snapshot) => {
      setBoards(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Board)));
      if(loadingData) setLoadingData(false);
    });
    
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setAllUsers(snapshot.docs.map(doc => ({...doc.data(), uid: doc.id} as UserProfileData)));
    });

    return () => {
      unsubBoards();
      unsubUsers();
    };
  }, [userProfile, authLoading, canManagePage, router, toast]);

  const handleOpenModal = (board: Board | null) => {
    setEditingBoard(board);
    if (board) {
        setBoardForm({ name: board.name, description: board.description || '', memberUids: board.memberUids });
    } else {
        setBoardForm({ name: '', description: '', memberUids: userProfile ? [userProfile.uid] : [] });
    }
    setIsModalOpen(true);
  };
  
  const handleFormSubmit = async () => {
    if (!boardForm.name.trim()) {
        toast({ title: "Name is required", variant: "destructive" });
        return;
    }

    try {
        if (editingBoard) {
            const boardRef = doc(db, 'boards', editingBoard.id);
            await updateDoc(boardRef, { ...boardForm, updatedAt: serverTimestamp() });
            toast({title: "Board Updated"});
        } else {
            await addDoc(collection(db, 'boards'), { ...boardForm, createdBy: userProfile?.uid, createdAt: serverTimestamp() });
            toast({title: "Board Created"});
        }
        setIsModalOpen(false);
    } catch(e) {
        console.error(e);
        toast({title: "Operation Failed", variant: "destructive"});
    }
  };

  if (authLoading || loadingData) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!canManagePage) {
    return (
      <div className="flex flex-col h-full w-full items-center justify-center text-center p-4">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
        <p className="text-muted-foreground">You do not have permission to manage boards.</p>
        <Button onClick={() => router.push('/dashboard')} className="mt-4">Go to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-3 text-2xl text-primary">
              <Users2 className="h-7 w-7"/>
              Manage All Task Boards (Teams)
            </CardTitle>
            <CardDescription>
              Create new boards, edit members, and manage all task groups.
            </CardDescription>
          </div>
          <Button onClick={() => handleOpenModal(null)}>
            <PlusCircle className="mr-2 h-4 w-4"/> Create Board
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards.map(board => (
              <Card key={board.id} className="p-4 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-lg">{board.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{board.description || 'No description'}</p>
                </div>
                <div className="mt-4 flex justify-between items-center">
                   <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4"/> {board.memberUids.length} Members
                   </div>
                   <Button variant="outline" size="sm" onClick={() => handleOpenModal(board)}><Edit className="mr-2 h-4 w-4"/>Manage</Button>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{editingBoard ? "Edit Board" : "Create New Board"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div>
                    <Label htmlFor="boardName">Board Name</Label>
                    <Input id="boardName" value={boardForm.name} onChange={e => setBoardForm({...boardForm, name: e.target.value})} />
                </div>
                <div>
                    <Label htmlFor="boardDesc">Description</Label>
                    <Textarea id="boardDesc" value={boardForm.description} onChange={e => setBoardForm({...boardForm, description: e.target.value})} />
                </div>
                <div>
                    <Label>Members</Label>
                    <div className="p-2 border rounded-md max-h-60 overflow-y-auto space-y-2">
                        {allUsers.map(user => (
                            <div key={user.uid} className="flex items-center gap-2">
                                <Checkbox
                                    id={`user-${user.uid}`}
                                    checked={boardForm.memberUids.includes(user.uid)}
                                    onCheckedChange={(checked) => {
                                        const newUids = checked
                                            ? [...boardForm.memberUids, user.uid]
                                            : boardForm.memberUids.filter(id => id !== user.uid);
                                        setBoardForm({...boardForm, memberUids: newUids});
                                    }}
                                />
                                <Label htmlFor={`user-${user.uid}`} className="flex-grow">{user.fullName} ({user.role})</Label>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button onClick={handleFormSubmit}>Save</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
