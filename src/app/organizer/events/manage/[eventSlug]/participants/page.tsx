
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { subEventsData } from '@/data/subEvents';
import type { SubEvent, EventParticipant } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Users, Search, ShieldAlert, Filter } from 'lucide-react';

// Mock data for participants - in a real app, this would come from a backend
const mockEventParticipants: EventParticipant[] = [
  { id: 'stud1', name: 'Alice Smith', email: 'alice.smith@example.com', contactNumber: '555-0101', schoolName: 'Springfield High', registrationDate: new Date('2024-07-01T10:00:00Z').toISOString(), paymentStatus: 'paid' },
  { id: 'stud2', name: 'Bob Johnson', email: 'bob.johnson@example.com', contactNumber: '555-0102', schoolName: 'Northwood Academy', registrationDate: new Date('2024-07-02T11:30:00Z').toISOString(), paymentStatus: 'pending' },
  { id: 'stud3', name: 'Charlie Brown', email: 'charlie.brown@example.com', contactNumber: '555-0103', schoolName: 'Springfield High', registrationDate: new Date('2024-07-03T09:15:00Z').toISOString(), paymentStatus: 'paid' },
  { id: 'stud4', name: 'Diana Prince', email: 'diana.prince@example.com', contactNumber: '555-0104', schoolName: 'Riverside Prep', registrationDate: new Date('2024-07-04T14:00:00Z').toISOString(), paymentStatus: 'waived' },
  { id: 'stud5', name: 'Edward Nigma', email: 'edward.nigma@example.com', contactNumber: '555-0105', schoolName: 'Northwood Academy', registrationDate: new Date('2024-07-05T16:45:00Z').toISOString(), paymentStatus: 'failed' },
  { id: 'stud6', name: 'Fiona Gallagher', email: 'fiona.gallagher@example.com', contactNumber: '555-0106', schoolName: 'Springfield High', registrationDate: new Date('2024-07-06T08:00:00Z').toISOString(), paymentStatus: 'paid' },
];


export default function ManageParticipantsPage() {
  const router = useRouter();
  const params = useParams();
  const eventSlug = params.eventSlug as string;

  const { userProfile, loading: authLoading } = useAuth();
  const [event, setEvent] = useState<SubEvent | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');

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
    const schools = new Set(mockEventParticipants.map(p => p.schoolName).filter(Boolean) as string[]);
    return ['all', ...Array.from(schools)];
  }, []);

  const paymentStatuses: Array<EventParticipant['paymentStatus'] | 'all'> = ['all', 'paid', 'pending', 'waived', 'failed'];

  const filteredParticipants = useMemo(() => {
    return mockEventParticipants.filter(participant => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = searchTermLower === '' ||
        participant.name.toLowerCase().includes(searchTermLower) ||
        participant.email.toLowerCase().includes(searchTermLower) ||
        (participant.schoolName && participant.schoolName.toLowerCase().includes(searchTermLower));
      
      const matchesSchool = schoolFilter === 'all' || participant.schoolName === schoolFilter;
      const matchesPaymentStatus = paymentStatusFilter === 'all' || participant.paymentStatus === paymentStatusFilter;

      return matchesSearch && matchesSchool && matchesPaymentStatus;
    });
  }, [searchTerm, schoolFilter, paymentStatusFilter]);


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
    <div className="max-w-7xl mx-auto py-8 px-4 animate-fade-in-up space-y-6">
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
          <CardTitle>Participant Filters</CardTitle>
          <CardDescription>Use the filters below to narrow down the participant list.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
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
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Participant List ({filteredParticipants.length} found)</CardTitle>
          <CardDescription>Total Participants: {mockEventParticipants.length}</CardDescription>
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
                    <TableHead className="text-right">Actions</TableHead>
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
                          'outline' // 'waived' or 'failed'
                        } className="capitalize">
                          {participant.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" disabled>View</Button> 
                        {/* Placeholder for future actions like edit, view profile, add note */}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <Filter className="h-12 w-12 mx-auto mb-3 text-primary/50" />
              <p>No participants match the current filters.</p>
              { (searchTerm || schoolFilter !== 'all' || paymentStatusFilter !== 'all') &&
                <Button variant="link" onClick={() => { setSearchTerm(''); setSchoolFilter('all'); setPaymentStatusFilter('all');}} className="mt-2">
                  Clear Filters
                </Button>
              }
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

