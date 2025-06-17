
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, User, Shield } from 'lucide-react';
import type { UserRole } from '@/types';
import Link from 'next/link';

const mockRolesToTest: UserRole[] = ['student', 'organizer', 'event_representative', 'overall_head', 'admin', 'test'];

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { setMockUserRole, loading: authLoading } = useAuth(); // Use the new setMockUserRole
  const router = useRouter();

  const handleMockLogin = async (role: UserRole) => {
    setIsLoading(true);
    // The setMockUserRole function in the context will handle setting authUser and userProfile
    setMockUserRole(role); 
    // Simulate a small delay for UX if needed, then navigate
    // No actual async operation, so loading is mostly for UX feedback here
    setTimeout(() => {
      setIsLoading(false);
      router.push('/dashboard'); 
    }, 300);
  };

  if (authLoading && !isLoading) { // Show loader if context is loading but page isn't processing a click
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center animate-fade-in-up">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline text-primary">Select Mock Role to Login</CardTitle>
          <CardDescription>Authentication is in MOCK mode. Select a role to continue.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mockRolesToTest.map((role) => (
            <Button
              key={role}
              onClick={() => handleMockLogin(role)}
              className="w-full bg-primary hover:bg-primary/90"
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                role === 'student' || role === 'test' ? <User className="mr-2 h-4 w-4" /> : <Shield className="mr-2 h-4 w-4" />
              )}
              Log in as {role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')}
            </Button>
          ))}
        </CardContent>
         <CardFooter className="flex flex-col items-center space-y-2">
           <p className="text-sm text-muted-foreground">
            Want to "Sign Up"? (Currently Mocked)
            <Link href="/signup" className="font-semibold text-primary hover:underline ml-1">
              Go to Sign Up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
