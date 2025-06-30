
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Ticket } from 'lucide-react';

export default function MyRegistrationsPage() {
  return (
    <div className="animate-fade-in-up">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Ticket className="h-6 w-6 text-primary"/>My Registered Events</CardTitle>
          <CardDescription>A list of all events you have registered for will appear here, along with their status and details.</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">You have not registered for any events yet.</p>
          <Button asChild variant="default" className="mt-4">
            <Link href="/events">Explore Events Now</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
