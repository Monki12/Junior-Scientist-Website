
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import type { UserProfileData } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Loader2, Users, Search, ShieldAlert, Filter, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StudentsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { userProfile, loading: authLoading } = useAuth();
  
  const [students, setStudents] = useState<UserProfileData[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('all');
  
  const canViewPage = userProfile?.role === 'admin' || userProfile?.role === 'overall_head' || userProfile?.role === 'event_representative';

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

  const uniqueSchoolNames = useMemo(() => {
    const schools = new Set(students.map(p => p.schoolName).filter(Boolean) as string[]);
    return ['all', ...Array.from(schools).sort()];
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = searchTermLower === '' ||
        (student.fullName && student.fullName.toLowerCase().includes(searchTermLower)) ||
        (student.email && student.email.toLowerCase().includes(searchTermLower)) ||
        (student.schoolName && student.schoolName.toLowerCase().includes(searchTermLower));
      
      const matchesSchool = schoolFilter === 'all' || student.schoolName === schoolFilter;
      
      return matchesSearch && matchesSchool;
    });
  }, [students, searchTerm, schoolFilter]);
  
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
          <CardTitle className="text-3xl font-headline text-primary flex items-center">
            <GraduationCap className="mr-3 h-8 w-8"/>Student Management
          </CardTitle>
          <CardDescription>
            View, filter, and manage all student accounts across all events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end mb-4 p-4 border rounded-lg bg-background">
            <div className="relative">
                <Label htmlFor="search-students">Search by Name/Email/School</Label>
                <Search className="absolute left-2.5 top-[calc(50%+0.3rem)] -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="search-students" type="search" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9"/>
            </div>
            <div>
                <Label htmlFor="school-filter">Filter by School</Label>
                <Select value={schoolFilter} onValueChange={setSchoolFilter}>
                <SelectTrigger id="school-filter"><SelectValue placeholder="Filter by school" /></SelectTrigger>
                <SelectContent>{uniqueSchoolNames.map(school => (<SelectItem key={school} value={school}>{school === 'all' ? 'All Schools' : school}</SelectItem>))}</SelectContent>
                </Select>
            </div>
             <Button variant="outline" onClick={() => { setSearchTerm(''); setSchoolFilter('all'); }}>Clear Filters</Button>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader><TableRow><TableHead>Full Name</TableHead><TableHead>Email</TableHead><TableHead>School</TableHead><TableHead>Standard</TableHead><TableHead>School Verified</TableHead></TableRow></TableHeader>
              <TableBody>
                {loadingStudents ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-10"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                ) : filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                  <TableRow key={student.uid}>
                    <TableCell className="font-medium">{student.fullName || student.displayName}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>{student.schoolName}</TableCell>
                    <TableCell>{student.standard}</TableCell>
                    <TableCell>
                        <Badge variant={student.schoolVerifiedByOrganizer ? "default" : "outline"} className={cn(student.schoolVerifiedByOrganizer ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700')}>
                            {student.schoolVerifiedByOrganizer ? 'Verified' : 'Pending'}
                        </Badge>
                    </TableCell>
                  </TableRow>
                  ))
                ) : (
                    <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No students found matching your criteria.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
