
'use client';

import { useEffect, useState, useMemo, FormEvent } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { subEventsData } from '@/data/subEvents';
import type { SubEvent, EventParticipant, CustomColumnDefinition, ParticipantCustomData } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Users, Search, ShieldAlert, Filter, PlusCircle, BarChart2, PieChart, Users2, Tag, XIcon } from 'lucide-react';

// Enhanced mock data
const initialMockEventParticipants: EventParticipant[] = [
  { id: 'stud1', name: 'Alice Smith', email: 'alice.smith@example.com', contactNumber: '555-0101', schoolName: 'Springfield High', registrationDate: new Date('2024-07-01T10:00:00Z').toISOString(), paymentStatus: 'paid', customData: {} },
  { id: 'stud2', name: 'Bob Johnson', email: 'bob.johnson@example.com', contactNumber: '555-0102', schoolName: 'Northwood Academy', registrationDate: new Date('2024-07-02T11:30:00Z').toISOString(), paymentStatus: 'pending', customData: {} },
  { id: 'stud3', name: 'Charlie Brown', email: 'charlie.brown@example.com', contactNumber: '555-0103', schoolName: 'Springfield High', registrationDate: new Date('2024-07-03T09:15:00Z').toISOString(), paymentStatus: 'paid', customData: {} },
  { id: 'stud4', name: 'Diana Prince', email: 'diana.prince@example.com', contactNumber: '555-0104', schoolName: 'Riverside Prep', registrationDate: new Date('2024-07-04T14:00:00Z').toISOString(), paymentStatus: 'waived', customData: {} },
  { id: 'stud5', name: 'Edward Nigma', email: 'edward.nigma@example.com', contactNumber: '555-0105', schoolName: 'Northwood Academy', registrationDate: new Date('2024-07-05T16:45:00Z').toISOString(), paymentStatus: 'failed', customData: {} },
  { id: 'stud6', name: 'Fiona Gallagher', email: 'fiona.gallagher@example.com', contactNumber: '555-0106', schoolName: 'Springfield High', registrationDate: new Date('2024-07-06T08:00:00Z').toISOString(), paymentStatus: 'paid', customData: {} },
];

interface ActiveDynamicFilter {
  id: string;
  columnId: string;
  columnName: string;
  value: string;
  isCustom: boolean;
}

export default function ManageParticipantsPage() {
  const router = useRouter();
  const params = useParams();
  const eventSlug = params.eventSlug as string;
  const { toast } = useToast();

  const { userProfile, loading: authLoading } = useAuth();
  const [event, setEvent] = useState<SubEvent | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  
  const [participants, setParticipants] = useState<EventParticipant[]>(initialMockEventParticipants);
  const [searchTerm, setSearchTerm] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');

  const [customColumnDefinitions, setCustomColumnDefinitions] = useState<CustomColumnDefinition[]>([]);
  const [isAddColumnDialogOpen, setIsAddColumnDialogOpen] = useState(false);
  const [newColumnForm, setNewColumnForm] = useState<{
    name: string;
    dataType: CustomColumnDefinition['dataType'];
    options: string; 
    defaultValue: string;
    description: string;
  }>({ name: '', dataType: 'text', options: '', defaultValue: '', description: '' });
  const [editingCell, setEditingCell] = useState<{ participantId: string; columnId: string } | null>(null);

  const [isAddFilterPopoverOpen, setIsAddFilterPopoverOpen] = useState(false);
  const [newFilterColumn, setNewFilterColumn] = useState<{ id: string, name: string, isCustom: boolean } | null>(null);
  const [newFilterValue, setNewFilterValue] = useState('');
  const [activeDynamicFilters, setActiveDynamicFilters] = useState<ActiveDynamicFilter[]>([]);


  useEffect(() => {
    if (eventSlug) {
      const foundEvent = subEventsData.find(e => e.slug === eventSlug);
      if (foundEvent) {
        setEvent(foundEvent);
      } else {
        notFound();
      }
    }
    setLoadingEvent(false);
  }, [eventSlug]);

  useEffect(() => {
    if (!authLoading && userProfile) {
      const isOverallHeadOrAdmin = userProfile.role === 'overall_head' || userProfile.role === 'admin';
      const isEventManagerForThisEvent = userProfile.role === 'event_representative' && userProfile.assignedEventSlug === eventSlug;
      
      if (!isOverallHeadOrAdmin && !isEventManagerForThisEvent) {
        router.push('/dashboard'); 
      }
    } else if (!authLoading && !userProfile) {
      router.push(`/login?redirect=/organizer/events/manage/${eventSlug}/participants`);
    }
  }, [userProfile, authLoading, router, eventSlug]);

  const uniqueSchoolNames = useMemo(() => {
    const schools = new Set(participants.map(p => p.schoolName).filter(Boolean) as string[]);
    return ['all', ...Array.from(schools)];
  }, [participants]);

  const paymentStatuses: Array<EventParticipant['paymentStatus'] | 'all'> = ['all', 'paid', 'pending', 'waived', 'failed'];

  const availableFilterColumns = useMemo(() => {
    const standardCols = [
      { id: 'name', name: 'Name', isCustom: false },
      { id: 'email', name: 'Email', isCustom: false },
      { id: 'contactNumber', name: 'Contact Number', isCustom: false },
      { id: 'schoolName', name: 'School Name', isCustom: false },
      { id: 'paymentStatus', name: 'Payment Status', isCustom: false },
    ];
    const customCols = customColumnDefinitions.map(col => ({ id: col.id, name: col.name, isCustom: true }));
    return [...standardCols, ...customCols];
  }, [customColumnDefinitions]);

  const filteredParticipants = useMemo(() => {
    return participants.filter(participant => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = searchTermLower === '' ||
        participant.name.toLowerCase().includes(searchTermLower) ||
        participant.email.toLowerCase().includes(searchTermLower) ||
        (participant.schoolName && participant.schoolName.toLowerCase().includes(searchTermLower));
      
      const matchesSchool = schoolFilter === 'all' || participant.schoolName === schoolFilter;
      const matchesPaymentStatus = paymentStatusFilter === 'all' || participant.paymentStatus === paymentStatusFilter;

      let matchesDynamicFilters = true;
      if (activeDynamicFilters.length > 0) {
        matchesDynamicFilters = activeDynamicFilters.every(filter => {
          let participantValue: any;
          if (filter.isCustom) {
            participantValue = participant.customData?.[filter.columnId];
          } else {
            participantValue = (participant as any)[filter.columnId];
          }

          if (participantValue === undefined || participantValue === null) return false;
          
          // Simple "contains" for strings, exact match for others (converted to string for comparison)
          const valueStr = String(participantValue).toLowerCase();
          const filterValueStr = filter.value.toLowerCase();
          return valueStr.includes(filterValueStr);
        });
      }
      return matchesSearch && matchesSchool && matchesPaymentStatus && matchesDynamicFilters;
    });
  }, [participants, searchTerm, schoolFilter, paymentStatusFilter, activeDynamicFilters]);
  
  const schoolBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    filteredParticipants.forEach(p => {
      if (p.schoolName) {
        breakdown[p.schoolName] = (breakdown[p.schoolName] || 0) + 1;
      } else {
        breakdown['N/A'] = (breakdown['N/A'] || 0) + 1;
      }
    });
    return breakdown;
  }, [filteredParticipants]);

  const paymentStatusBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    filteredParticipants.forEach(p => {
      breakdown[p.paymentStatus] = (breakdown[p.paymentStatus] || 0) + 1;
    });
    return breakdown;
  }, [filteredParticipants]);

  const handleAddColumnSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newColumnForm.name || !newColumnForm.dataType) {
      toast({ title: "Error", description: "Column Name and Data Type are required.", variant: "destructive" });
      return;
    }
    const newColumnId = `custom_${Date.now()}`;
    const newDefinition: CustomColumnDefinition = {
      id: newColumnId,
      name: newColumnForm.name,
      dataType: newColumnForm.dataType,
      options: newColumnForm.dataType === 'dropdown' ? newColumnForm.options.split(',').map(opt => opt.trim()).filter(Boolean) : undefined,
      defaultValue: newColumnForm.defaultValue,
      description: newColumnForm.description,
    };
    setCustomColumnDefinitions(prev => [...prev, newDefinition]);

    setParticipants(prevParticipants => 
      prevParticipants.map(p => ({
        ...p,
        customData: {
          ...p.customData,
          [newColumnId]: newColumnForm.defaultValue || getInitialValueForDataType(newColumnForm.dataType)
        }
      }))
    );

    setNewColumnForm({ name: '', dataType: 'text', options: '', defaultValue: '', description: '' });
    setIsAddColumnDialogOpen(false);
    toast({ title: "Success", description: `Column "${newDefinition.name}" added.` });
  };

  const getInitialValueForDataType = (dataType: CustomColumnDefinition['dataType']) => {
    switch (dataType) {
      case 'checkbox': return false;
      case 'number': return 0;
      default: return '';
    }
  };
  
  const handleCustomDataChange = (participantId: string, columnId: string, value: any) => {
    setParticipants(prev => 
      prev.map(p => 
        p.id === participantId 
        ? { ...p, customData: { ...p.customData, [columnId]: value } }
        : p
      )
    );
  };

  const renderCustomCell = (participant: EventParticipant, column: CustomColumnDefinition) => {
    const value = participant.customData?.[column.id] ?? column.defaultValue ?? getInitialValueForDataType(column.dataType);
    const isEditing = editingCell?.participantId === participant.id && editingCell?.columnId === column.id;

    if (isEditing) {
       switch (column.dataType) {
        case 'text':
          return <Input type="text" value={value} onChange={(e) => handleCustomDataChange(participant.id, column.id, e.target.value)} onBlur={() => setEditingCell(null)} autoFocus className="h-8 text-xs"/>;
        case 'number':
          return <Input type="number" value={value} onChange={(e) => handleCustomDataChange(participant.id, column.id, parseFloat(e.target.value) || 0)} onBlur={() => setEditingCell(null)} autoFocus className="h-8 text-xs"/>;
        case 'date':
          return <Input type="date" value={value} onChange={(e) => handleCustomDataChange(participant.id, column.id, e.target.value)} onBlur={() => setEditingCell(null)} autoFocus className="h-8 text-xs"/>;
        case 'checkbox':
           return <Checkbox checked={!!value} onCheckedChange={(checked) => handleCustomDataChange(participant.id, column.id, !!checked)} />;
        case 'dropdown':
          return (
            <Select value={value} onValueChange={(val) => { handleCustomDataChange(participant.id, column.id, val); setEditingCell(null); }} >
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                {column.options?.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
              </SelectContent>
            </Select>
          );
        default:
          return String(value);
      }
    }

    switch (column.dataType) {
        case 'checkbox':
            return <Checkbox checked={!!value} onCheckedChange={(checked) => handleCustomDataChange(participant.id, column.id, !!checked)} aria-label={`Toggle ${column.name} for ${participant.name}`}/>;
        default:
            return <span onClick={() => column.dataType !== 'checkbox' && setEditingCell({ participantId: participant.id, columnId: column.id })} className="cursor-pointer hover:bg-muted/50 p-1 rounded min-h-[2rem] block">{String(value)}</span>;
    }
  };

  const handleAddDynamicFilter = () => {
    if (newFilterColumn && newFilterValue.trim() !== '') {
      const newFilter: ActiveDynamicFilter = {
        id: Date.now().toString(),
        columnId: newFilterColumn.id,
        columnName: newFilterColumn.name,
        value: newFilterValue,
        isCustom: newFilterColumn.isCustom,
      };
      setActiveDynamicFilters(prev => [...prev, newFilter]);
      setNewFilterColumn(null);
      setNewFilterValue('');
      setIsAddFilterPopoverOpen(false);
    } else {
      toast({ title: "Incomplete Filter", description: "Please select a column and enter a value.", variant: "destructive"});
    }
  };

  const removeDynamicFilter = (filterId: string) => {
    setActiveDynamicFilters(prev => prev.filter(f => f.id !== filterId));
  };


  if (authLoading || loadingEvent || !userProfile || !event) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  const canManage = (userProfile.role === 'overall_head' || userProfile.role === 'admin') || 
                    (userProfile.role === 'event_representative' && userProfile.assignedEventSlug === eventSlug);

  if (!canManage) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-10rem)] items-center justify-center text-center p-4">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-4">
          You do not have the necessary permissions to manage participants for this event. Redirecting...
        </p>
         <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto py-8 px-4 animate-fade-in-up space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-2 sm:mb-0">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <Users className="h-8 w-8" /> Manage Participants: {event.title}
          </h1>
          <p className="text-muted-foreground">View, filter, and manage registered participants for this event.</p>
        </div>
        <Button variant="default" className="bg-accent hover:bg-accent/90 text-accent-foreground" disabled>
          Export Data (CSV)
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BarChart2 className="h-6 w-6 text-primary" />Statistics Overview</CardTitle>
          <CardDescription>Quick insights into your participant data. Updates with filters.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="bg-secondary/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1"><Users2 className="h-4 w-4"/>Total Participants</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{filteredParticipants.length}</p>
            </CardContent>
          </Card>
          <Card className="bg-secondary/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1"><PieChart className="h-4 w-4"/>By School</CardTitle>
            </CardHeader>
            <CardContent className="text-xs max-h-24 overflow-y-auto">
              {Object.entries(schoolBreakdown).map(([school, count]) => (
                <p key={school}>{school}: {count}</p>
              ))}
              {Object.keys(schoolBreakdown).length === 0 && <p className="text-muted-foreground">No school data in current view.</p>}
            </CardContent>
          </Card>
          <Card className="bg-secondary/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1"><PieChart className="h-4 w-4"/>Payment Status</CardTitle>
            </CardHeader>
            <CardContent className="text-xs">
               {Object.entries(paymentStatusBreakdown).map(([status, count]) => (
                <p key={status} className="capitalize">{status}: {count}</p>
              ))}
              {Object.keys(paymentStatusBreakdown).length === 0 && <p className="text-muted-foreground">No payment data.</p>}
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Participant Filters</CardTitle>
          <CardDescription>Use the filters below to narrow down the participant list.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
                <div className="relative">
                    <Label htmlFor="search-participants">Search</Label>
                    <Search className="absolute left-2.5 top-[calc(50%+0.3rem)] -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                    id="search-participants"
                    type="search"
                    placeholder="Search by name, email, school..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                    />
                </div>
                <div>
                    <Label htmlFor="school-filter">School</Label>
                    <Select value={schoolFilter} onValueChange={setSchoolFilter}>
                    <SelectTrigger id="school-filter">
                        <SelectValue placeholder="Filter by school" />
                    </SelectTrigger>
                    <SelectContent>
                        {uniqueSchoolNames.map(school => (
                        <SelectItem key={school} value={school}>
                            {school === 'all' ? 'All Schools' : school}
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="payment-status-filter">Payment Status</Label>
                    <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                    <SelectTrigger id="payment-status-filter">
                        <SelectValue placeholder="Filter by payment status" />
                    </SelectTrigger>
                    <SelectContent>
                        {paymentStatuses.map(status => (
                        <SelectItem key={status} value={status}>
                            {status === 'all' ? 'All Statuses' : status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                </div>
                <Popover open={isAddFilterPopoverOpen} onOpenChange={setIsAddFilterPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full md:w-auto">
                            <Tag className="mr-2 h-4 w-4" /> Add Dynamic Filter
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <h4 className="font-medium leading-none">Add New Filter</h4>
                                <p className="text-sm text-muted-foreground">
                                Select a column and value to filter by.
                                </p>
                            </div>
                            <div className="grid gap-2">
                                <div className="grid grid-cols-3 items-center gap-4">
                                <Label htmlFor="filter-column">Column</Label>
                                <Select
                                    value={newFilterColumn?.id}
                                    onValueChange={(value) => {
                                        const selected = availableFilterColumns.find(col => col.id === value);
                                        if (selected) setNewFilterColumn(selected);
                                    }}
                                >
                                    <SelectTrigger id="filter-column" className="col-span-2 h-8">
                                    <SelectValue placeholder="Select column" />
                                    </SelectTrigger>
                                    <SelectContent>
                                    {availableFilterColumns.map(col => (
                                        <SelectItem key={col.id} value={col.id}>{col.name}</SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                                </div>
                                <div className="grid grid-cols-3 items-center gap-4">
                                <Label htmlFor="filter-value">Value</Label>
                                <Input
                                    id="filter-value"
                                    value={newFilterValue}
                                    onChange={(e) => setNewFilterValue(e.target.value)}
                                    className="col-span-2 h-8"
                                    placeholder="Enter value"
                                />
                                </div>
                            </div>
                            <Button onClick={handleAddDynamicFilter}>Apply Filter</Button>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
            {activeDynamicFilters.length > 0 && (
                <div className="mt-4 space-y-2">
                    <Label>Active Dynamic Filters:</Label>
                    <div className="flex flex-wrap gap-2">
                    {activeDynamicFilters.map(filter => (
                        <Badge key={filter.id} variant="secondary" className="flex items-center gap-1 pr-1">
                        {filter.columnName}: &quot;{filter.value}&quot;
                        <button onClick={() => removeDynamicFilter(filter.id)} className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5">
                            <XIcon className="h-3 w-3" />
                            <span className="sr-only">Remove filter</span>
                        </button>
                        </Badge>
                    ))}
                    </div>
                </div>
            )}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Participant List ({filteredParticipants.length} found)</CardTitle>
          <CardDescription>Total Participants: {participants.length}</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredParticipants.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>School</TableHead>
                    <TableHead>Registered On</TableHead>
                    <TableHead>Payment</TableHead>
                    {customColumnDefinitions.map(col => (
                      <TableHead key={col.id}>{col.name}</TableHead>
                    ))}
                    <TableHead className="text-right">
                       <AlertDialog open={isAddColumnDialogOpen} onOpenChange={setIsAddColumnDialogOpen}>
                        <AlertDialogTrigger asChild>
                           <Button variant="outline" size="sm">
                             <PlusCircle className="mr-2 h-4 w-4" /> Add Column
                           </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <form onSubmit={handleAddColumnSubmit}>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Add New Custom Column</AlertDialogTitle>
                              <AlertDialogDescription>
                                Define a new column to track additional participant information.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="space-y-4 py-4">
                              <div>
                                <Label htmlFor="newColName">Column Name</Label>
                                <Input id="newColName" value={newColumnForm.name} onChange={e => setNewColumnForm({...newColumnForm, name: e.target.value})} placeholder="E.g., Quiz Score" required />
                              </div>
                              <div>
                                <Label htmlFor="newColDataType">Data Type</Label>
                                <Select value={newColumnForm.dataType} onValueChange={val => setNewColumnForm({...newColumnForm, dataType: val as CustomColumnDefinition['dataType']})}>
                                  <SelectTrigger id="newColDataType"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="text">Text</SelectItem>
                                    <SelectItem value="number">Number</SelectItem>
                                    <SelectItem value="checkbox">Checkbox</SelectItem>
                                    <SelectItem value="dropdown">Dropdown</SelectItem>
                                    <SelectItem value="date">Date</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              {newColumnForm.dataType === 'dropdown' && (
                                <div>
                                  <Label htmlFor="newColOptions">Options (comma-separated)</Label>
                                  <Input id="newColOptions" value={newColumnForm.options} onChange={e => setNewColumnForm({...newColumnForm, options: e.target.value})} placeholder="E.g., Option A, Option B" />
                                </div>
                              )}
                              <div>
                                <Label htmlFor="newColDefaultValue">Default Value (optional)</Label>
                                <Input id="newColDefaultValue" value={newColumnForm.defaultValue} onChange={e => setNewColumnForm({...newColumnForm, defaultValue: e.target.value})} />
                              </div>
                              <div>
                                <Label htmlFor="newColDesc">Description (optional)</Label>
                                <Textarea id="newColDesc" value={newColumnForm.description} onChange={e => setNewColumnForm({...newColumnForm, description: e.target.value})} placeholder="Purpose of this column..." />
                              </div>
                            </div>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction type="submit">Save Column</AlertDialogAction>
                            </AlertDialogFooter>
                          </form>
                        </AlertDialogContent>
                       </AlertDialog>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParticipants.map((participant) => (
                    <TableRow key={participant.id}>
                      <TableCell className="font-medium">{participant.name}</TableCell>
                      <TableCell>{participant.email}</TableCell>
                      <TableCell>{participant.contactNumber || 'N/A'}</TableCell>
                      <TableCell>{participant.schoolName || 'N/A'}</TableCell>
                      <TableCell>{new Date(participant.registrationDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={
                          participant.paymentStatus === 'paid' ? 'default' :
                          participant.paymentStatus === 'pending' ? 'secondary' :
                          'outline' 
                        } className="capitalize">
                          {participant.paymentStatus}
                        </Badge>
                      </TableCell>
                      {customColumnDefinitions.map(col => (
                        <TableCell key={col.id}>
                          {renderCustomCell(participant, col)}
                        </TableCell>
                      ))}
                       <TableCell></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <Filter className="h-12 w-12 mx-auto mb-3 text-primary/50" />
              <p>No participants match the current filters.</p>
              { (searchTerm || schoolFilter !== 'all' || paymentStatusFilter !== 'all' || activeDynamicFilters.length > 0) &&
                <Button variant="link" onClick={() => { setSearchTerm(''); setSchoolFilter('all'); setPaymentStatusFilter('all'); setActiveDynamicFilters([]);}} className="mt-2">
                  Clear All Filters
                </Button>
              }
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

