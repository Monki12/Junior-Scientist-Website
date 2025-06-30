
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import type { SubEvent, EventRegistration, UserProfileData, CustomColumnDefinition, ActiveDynamicFilter } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { db, storage } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, runTransaction, serverTimestamp, getDoc, addDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ArrowLeft, Loader2, Users, Search, Filter, PlusCircle, UploadCloud, FileCog, Columns, X } from 'lucide-react';
import { nanoid } from 'nanoid';
import { Textarea } from '@/components/ui/textarea';

interface DisplayParticipant extends UserProfileData {
  registrationId: string;
  registrationStatus: EventRegistration['registrationStatus'];
  presentee: boolean;
  admitCardUrl?: string | null;
  registeredAt: string;
  [key: string]: any; // For custom columns
}

const DEFAULT_COLUMNS: CustomColumnDefinition[] = [
    { id: 'fullName', name: 'Name', dataType: 'text' },
    { id: 'email', name: 'Email', dataType: 'text' },
    { id: 'schoolName', name: 'School', dataType: 'text' },
    { id: 'standard', name: 'Standard', dataType: 'text' },
    { id: 'registrationStatus', name: 'Status', dataType: 'dropdown', options: ['pending', 'approved', 'declined', 'cancelled'] },
    { id: 'presentee', name: 'Present', dataType: 'checkbox' },
    { id: 'admitCardUrl', name: 'Admit Card', dataType: 'file' },
];


export default function ManageParticipantsPage() {
  const router = useRouter();
  const params = useParams();
  const eventSlug = params.eventSlug as string;
  const { toast } = useToast();

  const { userProfile: organizerProfile, loading: authLoading } = useAuth();
  const [event, setEvent] = useState<SubEvent | null>(null);
  const [loadingEventData, setLoadingEventData] = useState(true);
  
  const [participants, setParticipants] = useState<DisplayParticipant[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(true);

  // --- Dynamic Column & Filter State ---
  const [availableColumns, setAvailableColumns] = useState<CustomColumnDefinition[]>(DEFAULT_COLUMNS);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_COLUMNS.map(c => c.id));
  const [customColumnDefinitions, setCustomColumnDefinitions] = useState<CustomColumnDefinition[]>([]);
  const [activeFilters, setActiveFilters] = useState<ActiveDynamicFilter[]>([]);

  // --- Dialog States ---
  const [isAddColumnDialogOpen, setIsAddColumnDialogOpen] = useState(false);
  const [isCustomizeDialogOpen, setIsCustomizeDialogOpen] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [newColumn, setNewColumn] = useState<Omit<CustomColumnDefinition, 'id'>>({ name: '', dataType: 'text', options: [] });
  const [newColumnOptions, setNewColumnOptions] = useState('');
  
  const [isAdmitCardUploadOpen, setIsAdmitCardUploadOpen] = useState(false);
  const [selectedParticipantForAdmitCard, setSelectedParticipantForAdmitCard] = useState<DisplayParticipant | null>(null);
  const [admitCardFile, setAdmitCardFile] = useState<File | null>(null);
  const [isUploadingAdmitCard, setIsUploadingAdmitCard] = useState(false);

  useEffect(() => {
    // In a real implementation, this would fetch column preferences from Firestore
    // For now, we combine default and locally managed custom columns
    const allCols = [...DEFAULT_COLUMNS];
    customColumnDefinitions.forEach(customCol => {
      if (!allCols.some(c => c.id === customCol.id)) {
        allCols.push(customCol);
      }
    });
    setAvailableColumns(allCols);
  }, [customColumnDefinitions]);


  useEffect(() => {
    if (eventSlug) {
      setLoadingEventData(true);
      const fetchEvent = async () => {
        const q = query(collection(db, 'subEvents'), where('slug', '==', eventSlug));
        try {
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const eventDoc = querySnapshot.docs[0];
            const eventData = { id: eventDoc.id, ...eventDoc.data() } as SubEvent
            setEvent(eventData);
            if(eventData.customData) {
                const customCols = Object.values(eventData.customData) as CustomColumnDefinition[];
                setCustomColumnDefinitions(customCols);
            }
          } else {
            notFound();
          }
        } catch (error) {
          console.error("Error fetching event data:", error);
          notFound();
        } finally {
          setLoadingEventData(false);
        }
      };
      fetchEvent();
    } else {
      setLoadingEventData(false);
      notFound();
    }
  }, [eventSlug]);

  useEffect(() => {
    if (!authLoading && organizerProfile && event) {
        const canViewPage =
            organizerProfile.role === 'admin' ||
            organizerProfile.role === 'overall_head' ||
            (organizerProfile.role === 'event_representative' && organizerProfile.assignedEventUids?.includes(event.id)) ||
            (organizerProfile.role === 'organizer' && organizerProfile.studentDataEventAccess?.[event.id]);

        if (!canViewPage) {
            toast({ title: "Access Denied", description: "You do not have permission to view student data for this event.", variant: "destructive" });
            router.push('/dashboard');
        }
    } else if (!authLoading && !organizerProfile) {
        router.push(`/login?redirect=/events/manage/${eventSlug}/participants`);
    }
  }, [organizerProfile, authLoading, event, router, toast, eventSlug]);


  useEffect(() => {
    if (event && organizerProfile) {
      setLoadingParticipants(true);
      const fetchParticipants = async () => {
        try {
          const registrationsRef = collection(db, 'event_registrations');
          const q = query(registrationsRef, where('subEventId', '==', event.id));
          const querySnapshot = await getDocs(q);
          
          const fetchedParticipantsPromises = querySnapshot.docs.map(async (regDoc) => {
            const regData = regDoc.data() as EventRegistration;
            const userDocRef = doc(db, 'users', regData.userId);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              const userData = userDocSnap.data() as UserProfileData;
              
              // Merge customData from registration into the root of the display participant
              const customData = regData.customData || {};

              return {
                ...userData,
                ...customData,
                registrationId: regDoc.id,
                registrationStatus: regData.registrationStatus,
                presentee: regData.presentee || false,
                admitCardUrl: regData.admitCardUrl,
                registeredAt: regData.registeredAt?.toDate ? regData.registeredAt.toDate().toISOString() : new Date().toISOString(),
              } as DisplayParticipant;
            }
            return null;
          });

          const fetchedParticipants = (await Promise.all(fetchedParticipantsPromises)).filter(p => p !== null) as DisplayParticipant[];
          setParticipants(fetchedParticipants);

        } catch (error) {
          console.error("Error fetching participants:", error);
          toast({ title: "Error", description: "Could not fetch participant data.", variant: "destructive" });
        } finally {
          setLoadingParticipants(false);
        }
      };
      fetchParticipants();
    }
  }, [event, organizerProfile, toast]);

  const filteredParticipants = useMemo(() => {
    return participants.filter(participant => {
      if (!activeFilters.length) return true;
      return activeFilters.every(filter => {
        const value = participant[filter.columnId];
        switch (filter.operator) {
            case 'contains': return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
            case 'equals': return String(value).toLowerCase() === String(filter.value).toLowerCase();
            case 'is': return value === filter.value;
            // Add more operators as needed
            default: return true;
        }
      })
    });
  }, [participants, activeFilters]);
  
  const handleOptimisticUpdate = (registrationId: string, field: string, value: any, isCustom: boolean) => {
    setParticipants(prev => prev.map(p => {
        if (p.registrationId === registrationId) {
            if (isCustom) {
                return { ...p, [field]: value, customData: { ...(p.customData || {}), [field]: value } };
            }
            return { ...p, [field]: value };
        }
        return p;
    }));
    
    const regDocRef = doc(db, 'event_registrations', registrationId);
    runTransaction(db, async (transaction) => {
        const regDoc = await transaction.get(regDocRef);
        if (!regDoc.exists()) throw new Error("Registration document does not exist!");
        
        let updatePayload: { [key: string]: any } = { lastUpdatedAt: serverTimestamp() };
        if (isCustom) {
            const customData = regDoc.data()?.customData || {};
            updatePayload.customData = { ...customData, [field]: value };
        } else {
            updatePayload[field] = value;
        }
        transaction.update(regDocRef, updatePayload);
    }).catch((error: any) => {
        toast({ title: "Update Failed", description: error.message || `Could not update ${field}.`, variant: "destructive" });
    });
  };

  const handleAdmitCardUpload = async () => {
    if (!admitCardFile || !selectedParticipantForAdmitCard || !event) return;
    setIsUploadingAdmitCard(true);
    try {
      const storageRef = ref(storage, `admit_cards/${event.id}/${selectedParticipantForAdmitCard.uid}_${admitCardFile.name}`);
      await uploadBytes(storageRef, admitCardFile);
      const downloadURL = await getDownloadURL(storageRef);

      setParticipants(prev => prev.map(p => 
        p.registrationId === selectedParticipantForAdmitCard.registrationId ? { ...p, admitCardUrl: downloadURL } : p
      ));
      
      const regDocRef = doc(db, 'event_registrations', selectedParticipantForAdmitCard.registrationId);
      await updateDoc(regDocRef, { admitCardUrl: downloadURL, lastUpdatedAt: serverTimestamp() });
      
      setIsAdmitCardUploadOpen(false);
    } catch (error: any) {
       toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsUploadingAdmitCard(false);
    }
  };

 const handleAddCustomColumn = async () => {
    if (!event) return;
    const newId = `custom_${newColumn.name.toLowerCase().replace(/\s/g, '_')}`;
    let finalOptions: string[] | undefined = undefined;

    if (newColumn.dataType === 'dropdown') {
      finalOptions = newColumnOptions.split(',').map(opt => opt.trim()).filter(Boolean);
      if (finalOptions.length === 0) {
        toast({ title: "Invalid Options", description: "Please provide at least one comma-separated option for the dropdown.", variant: "destructive" });
        return;
      }
    }
    
    const newDef: CustomColumnDefinition = { ...newColumn, id: newId, options: finalOptions };
    
    try {
        const eventRef = doc(db, 'subEvents', event.id);
        const currentEvent = await getDoc(eventRef);
        const existingCustomData = currentEvent.data()?.customData || {};
        
        await updateDoc(eventRef, {
            customData: {
                ...existingCustomData,
                [newId]: newDef
            }
        });

        setCustomColumnDefinitions([...customColumnDefinitions, newDef]);
        setVisibleColumns([...visibleColumns, newId]);
        setIsAddColumnDialogOpen(false);
        setNewColumn({ name: '', dataType: 'text', options: [] });
        setNewColumnOptions('');
        toast({title: "Column Added", description: `Column "${newDef.name}" is now available.`});
    } catch (e: any) {
        toast({title: "Error", description: `Could not save column: ${e.message}`, variant: "destructive"});
    }
  };

  if (authLoading || loadingEventData || !organizerProfile || !event) {
    return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Event Dashboard
        </Button>
        <div className="flex items-center gap-2">
           <Button variant="outline" onClick={() => setIsFilterDialogOpen(true)}><Filter className="mr-2 h-4 w-4" />Filter ({activeFilters.length})</Button>
           <Button variant="outline" onClick={() => setIsCustomizeDialogOpen(true)}><Columns className="mr-2 h-4 w-4" />Customize Columns</Button>
           <Button onClick={() => setIsAddColumnDialogOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />Add Column</Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Manage Participants: {event.title}</CardTitle>
          <CardDescription>View, filter, and manage all participants registered for this event. ({filteredParticipants.length} of {participants.length} showing)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  {availableColumns.filter(c => visibleColumns.includes(c.id)).map(col => (
                    <TableHead key={col.id}>{col.name}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingParticipants ? (
                  <TableRow><TableCell colSpan={visibleColumns.length} className="text-center h-24"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>
                ) : participants.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={visibleColumns.length}>
                            <div className="text-center py-12 text-muted-foreground">
                                <Users className="h-16 w-16 mx-auto mb-4 text-primary/30" />
                                <h3 className="text-xl font-semibold text-foreground mb-2">No Participants Yet</h3>
                                <p>No one has registered for this event. Share the event to get registrations!</p>
                            </div>
                        </TableCell>
                    </TableRow>
                ) : filteredParticipants.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={visibleColumns.length}>
                            <div className="text-center py-12 text-muted-foreground">
                                <Filter className="h-16 w-16 mx-auto mb-4 text-primary/30" />
                                <h3 className="text-xl font-semibold text-foreground mb-2">No Matches Found</h3>
                                <p>No participants match your current filter criteria.</p>
                            </div>
                        </TableCell>
                    </TableRow>
                ) : (
                  filteredParticipants.map(p => (
                  <TableRow key={p.registrationId}>
                    {availableColumns.filter(c => visibleColumns.includes(c.id)).map(col => (
                      <TableCell key={`${p.registrationId}-${col.id}`}>
                        {(() => {
                          const value = p[col.id];
                          const isDefaultColumn = DEFAULT_COLUMNS.some(c => c.id === col.id);

                          switch (col.dataType) {
                            case 'checkbox':
                              return <Checkbox checked={!!value} onCheckedChange={(checked) => handleOptimisticUpdate(p.registrationId, col.id, !!checked, !isDefaultColumn)} />;
                            case 'dropdown':
                              return (
                                <Select value={value || ''} onValueChange={(val: any) => handleOptimisticUpdate(p.registrationId, col.id, val, !isDefaultColumn)}>
                                  <SelectTrigger className="text-xs capitalize h-8"><SelectValue placeholder="Select..."/></SelectTrigger>
                                  <SelectContent>{(col.options || []).map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                                </Select>
                              );
                            case 'file':
                                return value ? (
                                    <Button variant="link" size="sm" asChild><a href={value} target="_blank" rel="noreferrer">View</a></Button>
                                ) : (
                                    <Button variant="outline" size="xs" onClick={() => { setSelectedParticipantForAdmitCard(p); setIsAdmitCardUploadOpen(true); }}>
                                        <UploadCloud className="mr-1 h-3 w-3" /> Upload
                                    </Button>
                                );
                            default:
                              return <span className="text-sm">{value || 'N/A'}</span>;
                          }
                        })()}
                      </TableCell>
                    ))}
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* --- DIALOGS --- */}

      <Dialog open={isAddColumnDialogOpen} onOpenChange={setIsAddColumnDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Custom Column</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
              <Label htmlFor="newColName">Column Name</Label>
              <Input id="newColName" value={newColumn.name} onChange={e => setNewColumn({...newColumn, name: e.target.value})} placeholder="e.g., T-Shirt Size" />
              <Label htmlFor="newColType">Data Type</Label>
              <Select 
                value={newColumn.dataType} 
                onValueChange={(val: any) => {
                  setNewColumn({...newColumn, dataType: val});
                  if (val !== 'dropdown') setNewColumnOptions('');
                }}
              >
                  <SelectTrigger><SelectValue placeholder="Select data type..." /></SelectTrigger>
                  <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="checkbox">Checkbox (True/False)</SelectItem>
                      <SelectItem value="dropdown">Dropdown</SelectItem>
                  </SelectContent>
              </Select>
              {newColumn.dataType === 'dropdown' && (
                <div className="space-y-2">
                    <Label htmlFor="newColOptions">Dropdown Options</Label>
                    <Textarea
                        id="newColOptions"
                        placeholder="Enter options separated by a comma. e.g., Small, Medium, Large"
                        value={newColumnOptions}
                        onChange={e => setNewColumnOptions(e.target.value)}
                    />
                </div>
              )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddColumnDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddCustomColumn} disabled={!newColumn.name}>Add Column</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isCustomizeDialogOpen} onOpenChange={setIsCustomizeDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Customize Visible Columns</DialogTitle></DialogHeader>
          <div className="grid gap-2 py-4 max-h-80 overflow-y-auto">
            {availableColumns.map(col => (
              <div key={col.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted">
                <Checkbox id={`vis-${col.id}`} checked={visibleColumns.includes(col.id)} onCheckedChange={checked => {
                    setVisibleColumns(prev => checked ? [...prev, col.id] : prev.filter(id => id !== col.id))
                }}/>
                <Label htmlFor={`vis-${col.id}`}>{col.name}</Label>
              </div>
            ))}
          </div>
          <DialogFooter>
             <DialogClose asChild><Button>Done</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Filter Participants</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
                <div className="flex items-center justify-between">
                    <Label>Active Filters</Label>
                    {activeFilters.length > 0 && <Button variant="link" size="sm" onClick={() => setActiveFilters([])}>Clear All</Button>}
                </div>
                <div className="space-y-2">
                    {activeFilters.map((filter, index) => (
                        <div key={filter.id} className="flex items-center gap-2 p-2 border rounded-md">
                           <span className="text-sm font-medium">{filter.columnName}</span>
                           <span className="text-sm text-muted-foreground">{filter.operator}</span>
                           <span className="text-sm font-semibold text-primary">{`"${filter.value}"`}</span>
                           <Button variant="ghost" size="icon" className="ml-auto h-6 w-6" onClick={() => setActiveFilters(prev => prev.filter(f => f.id !== filter.id))}>
                                <X className="h-4 w-4"/>
                           </Button>
                        </div>
                    ))}
                    {activeFilters.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">No filters applied.</p>}
                </div>
                <Button onClick={() => {
                    const searchTermFilter: ActiveDynamicFilter = {
                        id: nanoid(), columnId: 'fullName', columnName: 'Name', operator: 'contains', value: 'Test', isCustom: false
                    };
                    setActiveFilters([searchTermFilter]);
                    toast({title: "Filter Added", description: "This is a mock filter. Full filter builder UI coming soon."});
                }}>Add Mock Filter</Button>
            </div>
          <DialogFooter>
             <DialogClose asChild><Button>Apply</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
       <AlertDialog open={isAdmitCardUploadOpen} onOpenChange={setIsAdmitCardUploadOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Upload Admit Card for {selectedParticipantForAdmitCard?.fullName}</AlertDialogTitle>
                <AlertDialogDescription>Select a PDF or image file.</AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
                <Label htmlFor="admitCardFile">Admit Card File</Label>
                <Input id="admitCardFile" type="file" accept="application/pdf,image/*" onChange={(e) => setAdmitCardFile(e.target.files?.[0] || null)} />
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setAdmitCardFile(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleAdmitCardUpload} disabled={!admitCardFile || isUploadingAdmitCard}>
                    {isUploadingAdmitCard && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Upload & Save
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
