
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';

export default function SignUpPage() {
  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center animate-fade-in-up">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <Info className="mx-auto h-12 w-12 text-primary mb-4" />
          <CardTitle className="text-3xl font-headline text-primary">Sign Up Mock Mode</CardTitle>
          <CardDescription>
            User sign-up is currently in a temporary mock mode for development. 
            New accounts are not being created in Firebase.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-6">
            To test different user roles, please use the "Mock Login" page.
          </p>
          <Button asChild className="w-full bg-primary hover:bg-primary/90">
            <Link href="/login">Go to Mock Login</Link>
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Original sign-up functionality will be restored later.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
