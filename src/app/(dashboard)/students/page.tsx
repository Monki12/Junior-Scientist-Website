
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import type { UserProfileData, CustomColumnDefinition, ActiveDynamicFilter, SubEvent, EventRegistration } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, runTransaction, serverTimestamp, getDocs, addDoc } from 'firebase/firestore';
import { Loader2, Users, Search, ShieldAlert, Filter, GraduationCap, PlusCircle, Columns, X, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { nanoid } from 'nanoid';
import { Textarea } from '@/components/ui/textarea';

interface DisplayStudent extends UserProfileData {
  registeredEventNames?: string[];
  schoolVerifiedByOrganizer: boolean;
  customData: Record<string, any>;
  [key: string]: any;
}

const DEFAULT_COLUMNS: CustomColumnDefinition[] = [
    { id: 'fullName', name: 'Full Name', dataType: 'text' },
    { id: 'email', name: 'Email', dataType: 'text' },
    { id: 'shortId', name: 'Student ID', dataType: 'text' },
    { id: 'standard', name: 'Grade', dataType: 'text' },
    { id: 'schoolName', name: 'School', dataType: 'text' },
    { id: 'phoneNumbers', name: 'Primary Phone', dataType: 'text'},
    { id: 'schoolVerifiedByOrganizer', name: 'School Verified', dataType: 'checkbox' },
    { id: 'registeredEventNames', name: 'Registered Events', dataType: 'text' },
];

const displayValue = (value: any, placeholder: string = '(N/A)') => {
    if (value === null || value === undefined || value === '') {
        return <span className="text-muted-foreground italic">{placeholder}</span>;
    }
    if (Array.isArray(value) && value.length === 0) {
        return <span className="text-muted-foreground italic">(None)</span>;
    }
    if (typeof value === 'boolean') {
        return value ? <Badge variant="default">Yes</Badge> : <Badge variant="outline">No</Badge>;
    }
    if (value && typeof value.toDate === 'function') {
        return value.toDate().toLocaleDateString();
    }
    if (Array.isArray(value)) {
        return value.join(', ');
    }
    return value.toString();
};


function AddColumnModal({ isOpen, onClose, userProfile, onColumnAdded }: { isOpen: boolean, onClose: () => void, userProfile: UserProfileData, onColumnAdded: (colDef: CustomColumnDefinition) => void }) {
    const { toast } = useToast();
    const [newColumn, setNewColumn] = useState<Omit<CustomColumnDefinition, 'id'>>({ name: '', dataType: 'text', options: [] });
    const [newColumnOptions, setNewColumnOptions] = useState('');
    const [visibility, setVisibility] = useState<'meOnly' | 'allAdmins'>('meOnly');
    const [editableByOthers, setEditableByOthers] = useState(false);
    
    if (!isOpen) return null;

    const handleAddCustomColumn = async () => {
        if (!newColumn.name) {
            toast({ title: "Column name is required.", variant: "destructive"});
            return;
        }
        const newId = `custom_${newColumn.name.toLowerCase().replace(/\s/g, '_')}_${nanoid(4)}`;
        let finalOptions: string[] | undefined = undefined;

        if (newColumn.dataType === 'dropdown') {
            finalOptions = newColumnOptions.split(',').map(opt => opt.trim()).filter(Boolean);
            if (finalOptions.length === 0) {
                toast({ title: "Invalid Options", description: "Please provide at least one comma-separated option for the dropdown.", variant: "destructive" });
                return;
            }
        }
        
        const newDef: CustomColumnDefinition = { 
            ...newColumn, 
            id: newId, 
            options: finalOptions,
            isSharedGlobally: visibility === 'allAdmins',
            editableByOthers: visibility === 'allAdmins' ? editableByOthers : false,
            createdBy: userProfile.uid,
            createdAt: serverTimestamp(),
        };

        const collectionPath = visibility === 'allAdmins' 
            ? 'systemPreferences/columnDefinitions/studentData'
            : `users/${userProfile.uid}/preferences/columnDefinitions/studentData`;
            
        try {
            await addDoc(collection(db, collectionPath), newDef);
            onColumnAdded(newDef);
            toast({title: "Column Added", description: `Column "${newDef.name}" is now available.`});
            onClose();
            setNewColumn({ name: '', dataType: 'text', options: [] });
            setNewColumnOptions('');
            setVisibility('meOnly');
            setEditableByOthers(false);
        } catch(e) {
            console.error(e);
            toast({title: "Error", description: "Could not save column definition.", variant: "destructive"});
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader><DialogTitle>Add New Custom Column</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                    <Label htmlFor="newColName">Column Name</Label>
                    <Input id="newColName" value={newColumn.name} onChange={e => setNewColumn({...newColumn, name: e.target.value})} placeholder="e.g., T-Shirt Size"/>
                    
                    <Label htmlFor="newColType">Data Type</Label>
                    <Select value={newColumn.dataType} onValueChange={(val: any) => setNewColumn({...newColumn, dataType: val})}>
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
                            <Textarea id="newColOptions" placeholder="Enter options separated by a comma, e.g., Small, Medium, Large" value={newColumnOptions} onChange={e => setNewColumnOptions(e.target.value)} />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>View by:</Label>
                        <div className="flex flex-col gap-2">
                            <label className="flex items-center gap-2">
                                <input type="radio" name="visibility" value="meOnly" checked={visibility === 'meOnly'} onChange={() => { setVisibility('meOnly'); setEditableByOthers(false); }} />
                                Only me
                            </label>
                            { (userProfile.role === 'admin' || userProfile.role === 'overall_head') &&
                                <label className="flex items-center gap-2">
                                    <input type="radio" name="visibility" value="allAdmins" checked={visibility === 'allAdmins'} onChange={() => setVisibility('allAdmins')} />
                                    All Overall Heads and Admins
                                </label>
                            }
                        </div>
                    </div>

                    {visibility === 'allAdmins' && (
                         <div className="flex items-center gap-2">
                            <Checkbox id="editableByOthers" checked={editableByOthers} onCheckedChange={(checked) => setEditableByOthers(!!checked)} />
                            <Label htmlFor="editableByOthers">Allow others to edit data in this column</Label>
                        </div>
                    )}

                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleAddCustomColumn} disabled={!newColumn.name}>Add Column</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function CustomizeColumnsModal({ isOpen, onClose, availableColumns, visibleColumns, setVisibleColumns }: { isOpen: boolean, onClose: () => void, availableColumns: CustomColumnDefinition[], visibleColumns: string[], setVisibleColumns: (cols: string[]) => void }) {
    if (!isOpen) return null;
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader><DialogTitle>Customize Visible Columns</DialogTitle></DialogHeader>
                <div className="grid gap-2 py-4 max-h-80 overflow-y-auto">
                    {availableColumns.map(col => (
                        <div key={col.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted">
                            <Checkbox id={`vis-${col.id}`} checked={visibleColumns.includes(col.id)} onCheckedChange={checked => {
                                setVisibleColumns(prev => checked ? [...prev, col.id] : prev.filter(id => id !== col.id));
                            }}/>
                            <Label htmlFor={`vis-${col.id}`}>{col.name}</Label>
                        </div>
                    ))}
                </div>
                <DialogFooter><DialogClose asChild><Button>Done</Button></DialogClose></DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


export default function StudentsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { userProfile, loading: authLoading } = useAuth();
  
  const [students, setStudents] = useState<DisplayStudent[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [eventsMap, setEventsMap] = useState<Map<string, string>>(new Map());
  const [registrationsMap, setRegistrationsMap] = useState<Map<string, string[]>>(new Map());

  // --- Dynamic UI State ---
  const [customColumnDefinitions, setCustomColumnDefinitions] = useState<CustomColumnDefinition[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_COLUMNS.map(c => c.id));
  const [activeFilters, setActiveFilters] = useState<ActiveDynamicFilter[]>([]);
  
  const [isAddColumnDialogOpen, setIsAddColumnDialogOpen] = useState(false);
  const [isCustomizeDialogOpen, setIsCustomizeDialogOpen] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);

  const availableColumns = useMemo(() => {
    return [...DEFAULT_COLUMNS, ...customColumnDefinitions];
  }, [customColumnDefinitions]);

  const canManageStudents = userProfile?.role === 'admin' || userProfile?.role === 'overall_head' || userProfile?.role === 'event_representative';
  const canManageColumns = userProfile?.role === 'admin' || userProfile?.role === 'overall_head' || userProfile?.role === 'event_representative';

  useEffect(() => {
    if (!authLoading && !canManageStudents) {
        toast({ title: 'Access Denied', description: 'You do not have permission to view this page.', variant: 'destructive' });
        router.push('/dashboard');
        return;
    }

    if (canManageStudents && userProfile) {
        setLoadingData(true);

        const setupListeners = async () => {
          // Listen to global columns
          const globalColsRef = collection(db, `systemPreferences/columnDefinitions/studentData`);
          onSnapshot(globalColsRef, (snapshot) => {
              const globalCols = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as CustomColumnDefinition);
              setCustomColumnDefinitions(prev => [...prev.filter(p => !p.isSharedGlobally), ...globalCols]);
          });
          
          // Listen to user-specific columns
          const userColsRef = collection(db, `users/${userProfile.uid}/preferences/columnDefinitions/studentData`);
          onSnapshot(userColsRef, (snapshot) => {
              const userCols = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as CustomColumnDefinition);
              setCustomColumnDefinitions(prev => [...prev.filter(p => p.createdBy !== userProfile.uid), ...userCols]);
          });

          // Fetch other data
          const studentsQuery = query(collection(db, 'users'), where('role', 'in', ['student', 'test']));
          const eventsQuery = query(collection(db, 'subEvents'));
          const registrationsQuery = query(collection(db, 'event_registrations'));

          onSnapshot(studentsQuery, (snapshot) => {
              const fetchedStudents = snapshot.docs.map(doc => {
                const data = doc.data();
                return { ...data, uid: doc.id, customData: data.customData || {}, } as DisplayStudent
              });
              setStudents(fetchedStudents);
              if (loadingData) setLoadingData(false);
          });
          
          onSnapshot(eventsQuery, (snapshot) => {
              const newMap = new Map<string, string>();
              snapshot.docs.forEach(doc => newMap.set(doc.id, (doc.data() as SubEvent).title));
              setEventsMap(newMap);
          });

          onSnapshot(registrationsQuery, (snapshot) => {
              const newMap = new Map<string, string[]>();
              snapshot.docs.forEach(doc => {
                  const regData = doc.data() as EventRegistration;
                  const userRegs = newMap.get(regData.userId) || [];
                  userRegs.push(regData.subEventId);
                  newMap.set(regData.userId, userRegs);
              });
              setRegistrationsMap(newMap);
          });
        };
        
        setupListeners().catch(err => {
          console.error("Error setting up listeners:", err);
          toast({ title: "Error", description: "Could not initialize page data.", variant: "destructive"});
        });
    }
  }, [userProfile, authLoading, canManageStudents, router, toast]);

  const enrichedStudents = useMemo(() => {
    return students.map(student => {
      const registeredEventIds = registrationsMap.get(student.uid) || [];
      const registeredEventNames = registeredEventIds.map(id => eventsMap.get(id) || 'Unknown Event').filter(Boolean);
      return { ...student, registeredEventNames, schoolVerifiedByOrganizer: !!student.schoolVerifiedByOrganizer };
    });
  }, [students, registrationsMap, eventsMap]);

  const filteredStudents = useMemo(() => {
    return enrichedStudents.filter(student => {
      if (!activeFilters.length) return true;
      return activeFilters.every(filter => {
        const value = (student as any)[filter.columnId];
        if (filter.operator === 'contains' && typeof value === 'string') {
          return value.toLowerCase().includes(String(filter.value).toLowerCase());
        }
        if (filter.operator === 'equals') {
          return String(value) === String(filter.value);
        }
        return true;
      });
    });
  }, [enrichedStudents, activeFilters]);

  const handleStudentUpdate = async (studentId: string, field: string, value: any, isCustom: boolean) => {
    const studentRef = doc(db, 'users', studentId);
    try {
      await runTransaction(db, async (transaction) => {
        const studentDoc = await transaction.get(studentRef);
        if (!studentDoc.exists()) throw new Error("Student document does not exist!");
        
        let updateData: {[key: string]: any} = {};
        if (isCustom) {
            const currentCustomData = studentDoc.data()?.customData || {};
            updateData = { customData: { ...currentCustomData, [field]: value } };
        } else {
            updateData[field] = value;
        }
        updateData.updatedAt = serverTimestamp();
        
        transaction.update(studentRef, updateData);
      });
      return true;
    } catch (error: any) {
      console.error("Error updating student:", error);
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
      return false;
    }
  };

  const handleOptimisticUpdate = (studentId: string, field: string, value: any, isCustom: boolean) => {
    const originalStudents = JSON.parse(JSON.stringify(students));
    
    setStudents(prevStudents => 
      prevStudents.map(s => {
        if (s.uid === studentId) {
          if (isCustom) {
            return { ...s, customData: { ...s.customData, [field]: value } };
          }
          return { ...s, [field]: value };
        }
        return s;
      })
    );

    handleStudentUpdate(studentId, field, value, isCustom).then(success => {
      if (!success) {
        setStudents(originalStudents);
        toast({ title: "Reverted Change", description: "The update failed and was reverted.", variant: "destructive" });
      }
    });
  };

  const handleColumnAdded = (newDef: CustomColumnDefinition) => {
      setCustomColumnDefinitions(prev => [...prev, newDef]);
      setVisibleColumns(prev => [...prev, newDef.id]);

      let defaultValue: any = null;
      if (newDef.dataType === 'checkbox') defaultValue = false;
      if (newDef.dataType === 'text' || newDef.dataType === 'dropdown') defaultValue = '';

      setStudents(prevStudents => prevStudents.map(s => ({
          ...s,
          customData: {
              ...s.customData,
              [newDef.id]: defaultValue
          }
      })));
  };
  
  if (authLoading || (!canManageStudents && !authLoading) || loadingData) {
    return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }
  
  if (!canManageStudents) {
      return (
        <div className="flex flex-col h-full w-full items-center justify-center text-center p-4">
            <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
            <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
            <p className="text-muted-foreground">You do not have permission to manage student data.</p>
            <Button onClick={() => router.push('/dashboard')} className="mt-4">Go to Dashboard</Button>
        </div>
      )
  }

  return (
    <div className="space-y-6">
       <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <CardTitle className="text-3xl font-headline text-primary flex items-center">
                    <GraduationCap className="mr-3 h-8 w-8"/>Student Management
                </CardTitle>
                <CardDescription>
                    View, filter, and manage student accounts. ({filteredStudents.length} of {students.length} students showing)
                </CardDescription>
            </div>
             <div className="flex items-center gap-2 self-start md:self-center">
                <Button variant="outline" onClick={() => setIsFilterDialogOpen(true)}><Filter className="mr-2 h-4 w-4" />Filter ({activeFilters.length})</Button>
                <Button variant="outline" onClick={() => setIsCustomizeDialogOpen(true)}><Settings className="mr-2 h-4 w-4" />Customize Columns</Button>
                {canManageColumns && <Button onClick={() => setIsAddColumnDialogOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />Add Column</Button>}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {availableColumns.filter(c => visibleColumns.includes(c.id)).map(col => (
                    <TableHead key={col.id}>{col.name}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingData ? (
                    <TableRow><TableCell colSpan={visibleColumns.length} className="text-center py-10"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                ) : enrichedStudents.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={visibleColumns.length}>
                            <div className="text-center py-12 text-muted-foreground">
                                <GraduationCap className="h-16 w-16 mx-auto mb-4 text-primary/30" />
                                <h3 className="text-xl font-semibold text-foreground mb-2">No Students Found</h3>
                                <p>No student accounts have been created yet. Students can sign up on the public site.</p>
                            </div>
                        </TableCell>
                    </TableRow>
                ) : filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                  <TableRow key={student.uid}>
                    {availableColumns.filter(c => visibleColumns.includes(c.id)).map(col => {
                        const isCustom = !DEFAULT_COLUMNS.some(c => c.id === col.id);
                        const cellValue = isCustom ? student.customData?.[col.id] : student[col.id];

                        if (col.dataType === 'checkbox') {
                          return (
                            <TableCell key={col.id} className="text-center">
                              <Checkbox 
                                checked={!!cellValue}
                                onCheckedChange={(checked) => handleOptimisticUpdate(student.uid, col.id, !!checked, isCustom)}
                                disabled={!canManageStudents}
                              />
                            </TableCell>
                          )
                        }
                        
                         if (col.dataType === 'dropdown') {
                          return (
                            <TableCell key={col.id}>
                                <Select value={cellValue || ''} onValueChange={(val) => handleOptimisticUpdate(student.uid, col.id, val, isCustom)}>
                                    <SelectTrigger className="text-xs h-8"><SelectValue placeholder="Select..."/></SelectTrigger>
                                    <SelectContent>
                                        {(col.options || []).map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </TableCell>
                          )
                        }

                        if (col.id === 'phoneNumbers') return <TableCell key={col.id}>{displayValue(student.phoneNumbers?.[0])}</TableCell>;
                        if (col.id === 'registeredEventNames') return <TableCell key={col.id}>{displayValue(student.registeredEventNames)}</TableCell>

                        return <TableCell key={col.id}>{displayValue(cellValue)}</TableCell>
                    })}
                  </TableRow>
                  ))
                ) : (
                    <TableRow><TableCell colSpan={visibleColumns.length} className="text-center py-10 text-muted-foreground">No students found matching your criteria.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

    {userProfile && <AddColumnModal isOpen={isAddColumnDialogOpen} onClose={() => setIsAddColumnDialogOpen(false)} userProfile={userProfile} onColumnAdded={handleColumnAdded} />}
    <CustomizeColumnsModal isOpen={isCustomizeDialogOpen} onClose={() => setIsCustomizeDialogOpen(false)} availableColumns={availableColumns} visibleColumns={visibleColumns} setVisibleColumns={setVisibleColumns} />

    </div>
  );
}
