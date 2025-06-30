
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
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Loader2, Users, Search, ShieldAlert, Filter, GraduationCap, PlusCircle, Columns, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { nanoid } from 'nanoid';

// Enriched student type for local display
interface DisplayStudent extends UserProfileData {
  registeredEventNames?: string[];
}

const DEFAULT_COLUMNS: CustomColumnDefinition[] = [
    { id: 'fullName', name: 'Full Name', dataType: 'text' },
    { id: 'email', name: 'Email', dataType: 'text' },
    { id: 'shortId', name: 'Student ID', dataType: 'text' },
    { id: 'standard', name: 'Grade', dataType: 'text' },
    { id: 'schoolName', name: 'School', dataType: 'text' },
    { id: 'phoneNumbers', name: 'Primary Phone', dataType: 'text'},
    { id: 'additionalNumber', name: 'Additional Phone', dataType: 'text'},
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

export default function StudentsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { userProfile, loading: authLoading } = useAuth();
  
  const [students, setStudents] = useState<DisplayStudent[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // For joining data
  const [eventsMap, setEventsMap] = useState<Map<string, string>>(new Map());
  const [registrationsMap, setRegistrationsMap] = useState<Map<string, string[]>>(new Map());

  // --- Dynamic Column & Filter State ---
  const [customColumnDefinitions, setCustomColumnDefinitions] = useState<CustomColumnDefinition[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_COLUMNS.map(c => c.id));
  const [activeFilters, setActiveFilters] = useState<ActiveDynamicFilter[]>([]);

  const availableColumns = useMemo(() => {
    return [...DEFAULT_COLUMNS, ...customColumnDefinitions];
  }, [customColumnDefinitions]);

  // --- Dialog States ---
  const [isAddColumnDialogOpen, setIsAddColumnDialogOpen] = useState(false);
  const [isCustomizeDialogOpen, setIsCustomizeDialogOpen] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [newColumn, setNewColumn] = useState<Omit<CustomColumnDefinition, 'id'>>({ name: '', dataType: 'text' });

  const canViewPage = userProfile?.role === 'admin' || userProfile?.role === 'overall_head' || userProfile?.role === 'event_representative';
  const canManageColumns = userProfile?.role === 'admin' || userProfile?.role === 'overall_head';

  useEffect(() => {
    if (!authLoading && !canViewPage) {
        toast({ title: 'Access Denied', description: 'You do not have permission to view this page.', variant: 'destructive' });
        router.push('/dashboard');
        return;
    }

    if (canViewPage) {
        setLoadingData(true);
        const studentsQuery = query(collection(db, 'users'), where('role', 'in', ['student', 'test']));
        const eventsQuery = query(collection(db, 'subEvents'));
        const registrationsQuery = query(collection(db, 'event_registrations'));

        const unsubStudents = onSnapshot(studentsQuery, (snapshot) => {
            const fetchedStudents = snapshot.docs.map(doc => ({...doc.data(), uid: doc.id} as UserProfileData));
            setStudents(fetchedStudents);
            if (loadingData) setLoadingData(false);
        }, (error) => {
            console.error("Error fetching students:", error);
            toast({ title: "Error", description: "Could not fetch student data.", variant: "destructive" });
        });

        const unsubEvents = onSnapshot(eventsQuery, (snapshot) => {
            const newMap = new Map<string, string>();
            snapshot.docs.forEach(doc => {
                const eventData = doc.data() as SubEvent;
                newMap.set(doc.id, eventData.title);
            });
            setEventsMap(newMap);
        });

        const unsubRegistrations = onSnapshot(registrationsQuery, (snapshot) => {
            const newMap = new Map<string, string[]>();
            snapshot.docs.forEach(doc => {
                const regData = doc.data() as EventRegistration;
                const userRegs = newMap.get(regData.userId) || [];
                userRegs.push(regData.subEventId);
                newMap.set(regData.userId, userRegs);
            });
            setRegistrationsMap(newMap);
        });

        return () => {
            unsubStudents();
            unsubEvents();
            unsubRegistrations();
        };
    }
  }, [userProfile, authLoading, canViewPage, router, toast]);


  const enrichedStudents = useMemo(() => {
    return students.map(student => {
      const registeredEventIds = registrationsMap.get(student.uid) || [];
      const registeredEventNames = registeredEventIds.map(id => eventsMap.get(id) || 'Unknown Event').filter(Boolean);
      return { ...student, registeredEventNames };
    });
  }, [students, registrationsMap, eventsMap]);


  const filteredStudents = useMemo(() => {
    return enrichedStudents.filter(student => {
      if (!activeFilters.length) return true;
      return activeFilters.every(filter => {
        const value = (student as any)[filter.columnId]; // Basic filtering
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

  const handleAddCustomColumn = () => {
    const newId = `custom_${newColumn.name.toLowerCase().replace(/\s/g, '_')}`;
    const newDef: CustomColumnDefinition = { ...newColumn, id: newId };
    setCustomColumnDefinitions([...customColumnDefinitions, newDef]);
    setVisibleColumns([...visibleColumns, newId]);
    setIsAddColumnDialogOpen(false);
    setNewColumn({ name: '', dataType: 'text' });
    toast({title: "Column Added", description: `Column "${newDef.name}" is now available.`});
  };
  
  if (authLoading || (!canViewPage && !authLoading) || loadingData) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!canViewPage) {
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
          <div className="flex justify-between items-start">
            <div>
                <CardTitle className="text-3xl font-headline text-primary flex items-center">
                    <GraduationCap className="mr-3 h-8 w-8"/>Student Management
                </CardTitle>
                <CardDescription>
                    View, filter, and manage all student accounts across all events. ({filteredStudents.length} of {students.length} students showing)
                </CardDescription>
            </div>
            {canManageColumns && (
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setIsFilterDialogOpen(true)}><Filter className="mr-2 h-4 w-4" />Filter ({activeFilters.length})</Button>
                    <Button variant="outline" onClick={() => setIsCustomizeDialogOpen(true)}><Columns className="mr-2 h-4 w-4" />Customize Columns</Button>
                    <Button onClick={() => setIsAddColumnDialogOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />Add Column</Button>
                </div>
            )}
          </div>
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
                {loadingData ? (
                    <TableRow><TableCell colSpan={visibleColumns.length} className="text-center py-10"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                ) : filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                  <TableRow key={student.uid}>
                    {availableColumns.filter(c => visibleColumns.includes(c.id)).map(col => {
                        let cellValue;
                        if (col.id === 'phoneNumbers') {
                            cellValue = student.phoneNumbers?.[0];
                        } else if (col.id === 'registeredEventNames') {
                            cellValue = student.registeredEventNames;
                        } else {
                            cellValue = (student as any)[col.id];
                        }
                        return (
                            <TableCell key={col.id}>
                                {col.dataType === 'checkbox' ? (
                                    <Checkbox checked={!!cellValue} disabled />
                                ) : (
                                    displayValue(cellValue)
                                )}
                            </TableCell>
                        )
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

    {/* --- DIALOGS --- */}

    <Dialog open={isAddColumnDialogOpen} onOpenChange={setIsAddColumnDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Custom Column</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
              <Label htmlFor="newColName">Column Name</Label>
              <Input id="newColName" value={newColumn.name} onChange={e => setNewColumn({...newColumn, name: e.target.value})} placeholder="e.g., T-Shirt Size"/>
              <Label htmlFor="newColType">Data Type</Label>
              <Select value={newColumn.dataType} onValueChange={(val: any) => setNewColumn({...newColumn, dataType: val})}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="checkbox">Checkbox (True/False)</SelectItem>
                      {/* More types can be added here */}
                  </SelectContent>
              </Select>
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
          <DialogHeader><DialogTitle>Filter Students</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
                <div className="flex items-center justify-between">
                    <Label>Active Filters</Label>
                    {activeFilters.length > 0 && <Button variant="link" size="sm" onClick={() => setActiveFilters([])}>Clear All</Button>}
                </div>
                <div className="space-y-2">
                    {activeFilters.map((filter) => (
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
                    const mockFilter: ActiveDynamicFilter = {
                        id: nanoid(), columnId: 'fullName', columnName: 'Full Name', operator: 'contains', value: 'Test', isCustom: false
                    };
                    setActiveFilters(prev => [...prev, mockFilter]);
                    toast({title: "Filter Added", description: "This is a mock filter. Full filter builder UI coming soon."});
                }}>Add Mock Filter</Button>
            </div>
          <DialogFooter>
             <DialogClose asChild><Button>Apply</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

