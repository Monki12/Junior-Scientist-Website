
'use client';

import type { UserProfileData } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Mail, Phone, GraduationCap, Shield } from 'lucide-react';

interface StudentCardProps {
  student: UserProfileData & { registeredEventNames?: string[] };
  onStatusChange: (field: string, value: any, isCustom: boolean) => void;
}

export default function StudentCard({ student, onStatusChange }: StudentCardProps) {
  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-4">
        <div>
          <CardTitle className="text-xl">{student.fullName}</CardTitle>
          <CardDescription className="flex items-center gap-1.5"><GraduationCap className="h-4 w-4" />{student.schoolName}</CardDescription>
        </div>
        <Badge variant={student.schoolVerifiedByOrganizer ? 'default' : 'secondary'}>
          {student.schoolVerifiedByOrganizer ? 'Verified' : 'Pending'}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between border-t border-b py-3">
            <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground"/>
                <span className="text-sm text-muted-foreground">ID: {student.shortId || 'N/A'}</span>
            </div>
            <div className="flex items-center space-x-2">
                <Label htmlFor={`verify-${student.uid}`} className="text-sm">School Verified</Label>
                <Checkbox
                    id={`verify-${student.uid}`}
                    checked={student.schoolVerifiedByOrganizer}
                    onCheckedChange={(checked) => onStatusChange('schoolVerifiedByOrganizer', !!checked, false)}
                />
            </div>
        </div>
        
        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="details">
                <AccordionTrigger>More Details</AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2 text-sm">
                    <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> {student.email}</p>
                    <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> {student.phoneNumbers?.[0] || 'N/A'}</p>
                    <div className="space-y-1">
                        <p className="font-medium">Registered Events:</p>
                        {student.registeredEventNames && student.registeredEventNames.length > 0 ? (
                             <div className="flex flex-wrap gap-1">
                                {student.registeredEventNames.map(eventName => (
                                    <Badge key={eventName} variant="outline">{eventName}</Badge>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground italic">No registered events.</p>
                        )}
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
