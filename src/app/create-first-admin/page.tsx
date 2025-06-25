
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import CreateOrganizerForm from '@/components/admin/CreateOrganizerForm';

export default function CreateFirstAdminPage() {

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center animate-fade-in-up py-12">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline text-primary">Create Initial Admin Account</CardTitle>
          <CardDescription>
            Use this form to create the first 'Overall Head' or 'Admin' user for your application.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Alert>
                <Terminal className="h-4 w-4" />
                <AlertTitle>Important!</AlertTitle>
                <AlertDescription>
                    After creating your first administrative account, you should log in with it and use the regular 'User Management' page to create other staff members. This page is for initial setup only.
                </AlertDescription>
            </Alert>
            <div className="mt-6">
                 <CreateOrganizerForm currentAdminRole="admin" onSuccess={() => {
                    // Optional: could add a router.push('/login') here after a delay
                 }} />
            </div>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2 pt-6">
          <p className="text-sm text-muted-foreground">
            Once your account is created, you can log in here:
          </p>
          <Button variant="outline" asChild className="w-full">
            <Link href="/auth/org-login">
              Go to Organizational Login
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
