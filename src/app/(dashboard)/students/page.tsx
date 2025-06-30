
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import type { UserProfileData, CustomColumnDefinition, ActiveDynamicFilter } from '@/types';
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

const DEFAULT_COLUMNS: CustomColumnDefinition[] = [
    { id: 'fullName', name: 'Full Name', dataType: 'text' },
    { id: 'email', name: 'Email', dataType: 'text' },
    { id: 'schoolName', name: 'School', dataType: 'text' },
    { id: 'standard', name: 'Standard', dataType: 'text' },
    { id: 'schoolVerifiedByOrganizer', name: 'School Verified', dataType: 'checkbox' },
];

export default function StudentsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { userProfile, loading: authLoading } = useAuth();
  
  const [students, setStudents] = useState<UserProfileData[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);

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
        setLoadingStudents(true);
        const studentsQuery = query(collection(db, 'users'), where('role', 'in', ['student', 'test']));
        
        const unsubscribe = onSnapshot(studentsQuery, (querySnapshot) => {
            const fetchedStudents = querySnapshot.docs.map(doc => ({...doc.data(), uid: doc.id} as UserProfileData));
            setStudents(fetchedStudents);
            setLoadingStudents(false);
        }, (error) => {
            console.error("Error fetching students:", error);
            toast({ title: "Error", description: "Could not fetch student data.", variant: "destructive" });
            setLoadingStudents(false);
        });

        return () => unsubscribe();
    }
  }, [userProfile, authLoading, canViewPage, router, toast]);


  const filteredStudents = useMemo(() => {
    return students.filter(student => {
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
  }, [students, activeFilters]);

  const handleAddCustomColumn = () => {
    const newId = `custom_${newColumn.name.toLowerCase().replace(/\s/g, '_')}`;
    const newDef: CustomColumnDefinition = { ...newColumn, id: newId };
    setCustomColumnDefinitions([...customColumnDefinitions, newDef]);
    setVisibleColumns([...visibleColumns, newId]);
    setIsAddColumnDialogOpen(false);
    setNewColumn({ name: '', dataType: 'text' });
    toast({title: "Column Added", description: `Column "${newDef.name}" is now available.`});
  };
  
  if (authLoading || (!canViewPage && !authLoading)) {
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
                    View, filter, and manage all student accounts across all events.
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
                {loadingStudents ? (
                    <TableRow><TableCell colSpan={visibleColumns.length} className="text-center py-10"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                ) : filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                  <TableRow key={student.uid}>
                    {availableColumns.filter(c => visibleColumns.includes(c.id)).map(col => (
                        <TableCell key={col.id}>
                            {(() => {
                                const value = (student as any)[col.id];
                                switch (col.dataType) {
                                    case 'checkbox':
                                    return <Checkbox checked={!!value} disabled />;
                                    default:
                                    return <span className="text-sm">{value || 'N/A'}</span>;
                                }
                            })()}
                        </TableCell>
                    ))}
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
