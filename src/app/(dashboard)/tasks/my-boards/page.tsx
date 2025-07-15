
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { Board } from '@/types';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users2, Users, Search } from 'lucide-react';
import { getMockBoards } from '@/data/mock-tasks';

// --- DEV FLAG ---
const USE_MOCK_DATA = process.env.NODE_ENV === 'development';

export default function MyBoardsPage() {
  const { userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [myBoards, setMyBoards] = useState<Board[]>([]);
  const [otherBoards, setOtherBoards] = useState<Board[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (authLoading || !userProfile) return;
    setLoadingData(true);

    if (USE_MOCK_DATA) {
        const { myBoards, otherBoards } = getMockBoards(userProfile.uid);
        setMyBoards(myBoards);
        setOtherBoards(otherBoards);
        setLoadingData(false);
        return;
    }

    const boardsRef = collection(db, 'boards');
    const unsubscribe = onSnapshot(boardsRef, (snapshot) => {
      const allBoards = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Board));
      const userBoards = allBoards.filter(board => board.memberUids.includes(userProfile.uid));
      const discoverBoards = allBoards.filter(board => !board.memberUids.includes(userProfile.uid));
      
      setMyBoards(userBoards);
      setOtherBoards(discoverBoards);
      setLoadingData(false);
    }, (error) => {
        console.error("Error fetching boards:", error);
        toast({ title: "Error", description: "Could not fetch board data.", variant: "destructive" });
        setLoadingData(false);
    });

    return () => unsubscribe();
  }, [userProfile, authLoading, toast]);
  
  const handleJoinBoard = async (boardId: string) => {
    if(!userProfile || USE_MOCK_DATA) {
        toast({ title: "Mock Data Mode", description: "Cannot join boards in development." });
        return;
    }
    try {
        const boardRef = doc(db, 'boards', boardId);
        await updateDoc(boardRef, {
            memberUids: arrayUnion(userProfile.uid)
        });
        toast({ title: "Joined Board", description: "You are now a member of the board." });
        setIsJoinModalOpen(false);
    } catch(e) {
        toast({ title: "Error", description: "Failed to join board.", variant: "destructive" });
    }
  }
  
  if (authLoading || loadingData) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const filteredOtherBoards = otherBoards.filter(board => board.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-3 text-2xl text-primary">
              <Users2 className="h-7 w-7"/> My Task Boards
            </CardTitle>
            <CardDescription>
              A list of all the task boards you are currently a member of.
            </CardDescription>
          </div>
          <Button onClick={() => setIsJoinModalOpen(true)}>Join a Board</Button>
        </CardHeader>
        <CardContent>
          {myBoards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myBoards.map(board => (
                    <Card key={board.id} className="p-4 flex flex-col justify-between">
                        <div>
                            <h3 className="font-bold text-lg">{board.name}</h3>
                            <p className="text-sm text-muted-foreground">{board.description || 'No description'}</p>
                        </div>
                        <div className="mt-4 flex justify-between items-center">
                            <span className="text-sm text-muted-foreground flex items-center gap-2"><Users className="h-4 w-4"/> {board.memberUids.length} members</span>
                            <Button size="sm" onClick={() => router.push('/tasks')}>View Board</Button>
                        </div>
                    </Card>
                ))}
            </div>
          ) : (
             <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                <h3 className="text-lg font-semibold text-foreground mb-2">You haven't joined any boards yet.</h3>
                <p>Click "Join a Board" to find and join a board.</p>
             </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isJoinModalOpen} onOpenChange={setIsJoinModalOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>Join a Board</DialogTitle></DialogHeader>
            <div className="py-4 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                  <Input placeholder="Search for a board..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10"/>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                    {filteredOtherBoards.map(board => (
                        <div key={board.id} className="p-2 border rounded-md flex justify-between items-center">
                            <span>{board.name}</span>
                            <Button size="sm" onClick={() => handleJoinBoard(board.id)}>Join</Button>
                        </div>
                    ))}
                    {filteredOtherBoards.length === 0 && <p className="text-sm text-muted-foreground text-center">No boards found.</p>}
                </div>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
