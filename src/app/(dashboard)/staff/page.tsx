
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, ShieldAlert, PlusCircle, Loader2, Edit } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import CreateOrganizerForm from '@/components/admin/CreateOrganizerForm';
import { collection, getDocs, query, doc, updateDoc, getDoc, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserProfileData, SubEvent, UserRole } from '@/types';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export default function StaffPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { userProfile, loading } = useAuth();
  const [isCreateOrganizerDialogOpen, setIsCreateOrganizerDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfileData | null>(null);
  
  const [allStaff, setAllStaff] = useState<UserProfileData[]>([]);
  const [allEvents, setAllEvents] = useState<SubEvent[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && userProfile && (userProfile.role === 'admin' || userProfile.role === 'overall_head')) {
      setIsLoadingData(true);

      const staffRoles = ['admin', 'overall_head', 'event_representative', 'organizer'];
      const usersCollectionRef = collection(db, 'users');
      const staffQuery = query(usersCollectionRef, where('role', 'in', staffRoles));
      
      const unsubStaff = onSnapshot(staffQuery, (usersSnapshot) => {
        const usersList = usersSnapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserProfileData));
        setAllStaff(usersList);
        if (isLoadingData) setIsLoadingData(false);
      }, (error) => {
        console.error("Error fetching staff data:", error);
        toast({ title: "Error", description: "Could not load staff data.", variant: "destructive"});
        setIsLoadingData(false);
      });

      const eventsCollectionRef = collection(db, 'subEvents');
      const unsubEvents = onSnapshot(eventsCollectionRef, (eventsSnapshot) => {
        const eventsList = eventsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as SubEvent));
        setAllEvents(eventsList);
      }, (error) => {
        console.error("Error fetching event data:", error);
        toast({ title: "Error", description: "Could not load event data.", variant: "destructive"});
      });

      return () => {
        unsubStaff();
        unsubEvents();
      };

    } else if (!loading && userProfile) {
      router.push('/dashboard');
    }
  }, [userProfile, loading, router, toast]);
  
  const handleOpenEditDialog = (user: UserProfileData) => {
    setEditingUser(user);
    setIsEditUserDialogOpen(true);
  };
  
  const handleUserUpdate = async () => {
    if (!editingUser) return;
    try {
        const userRef = doc(db, 'users', editingUser.uid);
        const updates: Partial<UserProfileData> = {
            role: editingUser.role,
            assignedEventUids: editingUser.assignedEventUids || [],
            studentDataEventAccess: editingUser.studentDataEventAccess || {},
            points: Number(editingUser.points) || 0,
        };
        await updateDoc(userRef, updates);

        if (editingUser.role === 'event_representative' && editingUser.assignedEventUids) {
            for (const eventId of editingUser.assignedEventUids) {
                const eventRef = doc(db, 'subEvents', eventId);
                const eventSnap = await getDoc(eventRef);
                if (eventSnap.exists()) {
                    const eventData = eventSnap.data();
                    const reps = eventData.eventReps || [];
                    if (!reps.includes(editingUser.uid)) {
                        await updateDoc(eventRef, { eventReps: [...reps, editingUser.uid] });
                    }
                }
            }
        }

        // Synchronize organizerUids on event documents based on studentDataEventAccess
        if (editingUser.role === 'organizer') {
            const accessMap = editingUser.studentDataEventAccess || {};
            for (const event of allEvents) {
                const eventRef = doc(db, 'subEvents', event.id);
                // Use a fresh read of the event document to avoid stale data issues
                const eventSnap = await getDoc(eventRef);
                if (!eventSnap.exists()) continue;

                const currentOrganizers = eventSnap.data().organizerUids || [];
                const shouldBeAssigned = accessMap[event.id] === true;
                const isCurrentlyAssigned = currentOrganizers.includes(editingUser.uid);

                if (shouldBeAssigned && !isCurrentlyAssigned) {
                    // Add organizer to the event's organizerUids array
                    await updateDoc(eventRef, { organizerUids: [...currentOrganizers, editingUser.uid] });
                } else if (!shouldBeAssigned && isCurrentlyAssigned) {
                    // Remove organizer from the event's organizerUids array
                    await updateDoc(eventRef, { organizerUids: currentOrganizers.filter((uid: string) => uid !== editingUser.uid) });
                }
            }
        }
        
        toast({ title: "User Updated", description: `${editingUser.fullName}'s profile has been updated.`});
        setIsEditUserDialogOpen(false);
        setEditingUser(null);
    } catch(e) {
        console.error("Error updating user:", e);
        toast({title: "Error", description: "Failed to update user.", variant: "destructive"});
    }
  };
  
  if (loading || isLoadingData) {
     return (
      <div className="flex min-h-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (userProfile?.role !== 'admin' && userProfile?.role !== 'overall_head') {
    return (
      <div className="flex flex-col min-h-full items-center justify-center text-center p-4">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
        <p className="text-muted-foreground">You do not have permission to manage staff.</p>
        <Button onClick={() => router.push('/dashboard')} className="mt-4">Go to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-3xl font-headline text-primary flex items-center"><Users className="mr-3 h-8 w-8"/>Staff Management</CardTitle>
              <CardDescription>
                Create new staff accounts and manage all platform administrators, representatives, and organizers.
              </CardDescription>
            </div>
             <Dialog open={isCreateOrganizerDialogOpen} onOpenChange={setIsCreateOrganizerDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" /> Create Staff Account
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Staff Account</DialogTitle>
                  <DialogDescription>
                    Fill in the details to create a new account for an organizer, representative, or admin.
                  </DialogDescription>
                </DialogHeader>
                <CreateOrganizerForm
                  currentAdminRole={userProfile.role as 'admin' | 'overall_head'}
                  onSuccess={() => { setIsCreateOrganizerDialogOpen(false); }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader><TableRow><TableHead>Full Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Points</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {allStaff.map((user) => (
                  <TableRow key={user.uid}>
                    <TableCell className="font-medium">{user.fullName || user.displayName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{user.role?.replace(/_/g, ' ')}</Badge></TableCell>
                    <TableCell className="font-semibold text-accent">{user.points || 0}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenEditDialog(user)}>
                        <Edit className="mr-2 h-4 w-4"/>Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Manage User: {editingUser?.fullName}</DialogTitle>
            </DialogHeader>
            {editingUser && (
                <div className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="role">Role</Label>
                        <Select value={editingUser.role} onValueChange={(value: UserRole) => setEditingUser(u => u ? {...u, role: value} : null)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="student">Student</SelectItem>
                                <SelectItem value="organizer">Organizer</SelectItem>
                                <SelectItem value="event_representative">Event Representative</SelectItem>
                                <SelectItem value="overall_head">Overall Head</SelectItem>
                                {userProfile.role === 'admin' && <SelectItem value="admin">Admin</SelectItem>}
                            </SelectContent>
                        </Select>
                    </div>
                    {editingUser.role === 'event_representative' && (
                        <div>
                            <Label>Assign Events to Representative</Label>
                            <div className="space-y-1 p-2 border rounded-md max-h-40 overflow-y-auto">
                                {allEvents.map(event => (
                                    <div key={event.id} className="flex items-center gap-2">
                                        <Checkbox 
                                            id={`event-${event.id}`} 
                                            checked={editingUser.assignedEventUids?.includes(event.id)}
                                            onCheckedChange={(checked) => {
                                                const uids = editingUser.assignedEventUids || [];
                                                const newUids = checked ? [...uids, event.id] : uids.filter(id => id !== event.id);
                                                setEditingUser(u => u ? {...u, assignedEventUids: newUids} : null);
                                            }}
                                        />
                                        <Label htmlFor={`event-${event.id}`}>{event.title}</Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {editingUser.role === 'organizer' && (
                        <div>
                            <Label>Grant Student Data Access</Label>
                             <div className="space-y-1 p-2 border rounded-md max-h-40 overflow-y-auto">
                                {allEvents.map(event => (
                                    <div key={event.id} className="flex items-center gap-2">
                                         <Checkbox 
                                            id={`access-${event.id}`} 
                                            checked={editingUser.studentDataEventAccess?.[event.id] === true}
                                            onCheckedChange={(checked) => {
                                                const accessMap = editingUser.studentDataEventAccess || {};
                                                const newAccessMap = {...accessMap, [event.id]: !!checked};
                                                setEditingUser(u => u ? {...u, studentDataEventAccess: newAccessMap} : null);
                                            }}
                                        />
                                        <Label htmlFor={`access-${event.id}`}>{event.title}</Label>
                                    </div>
                                ))}
                             </div>
                        </div>
                    )}
                    <div>
                        <Label htmlFor="points">Points</Label>
                        <Input 
                            id="points" 
                            type="number" 
                            value={editingUser.points} 
                            onChange={(e) => setEditingUser(u => u ? {...u, points: Number(e.target.value)} : null)} 
                        />
                    </div>
                    <Button onClick={handleUserUpdate}>Save Changes</Button>
                </div>
            )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
