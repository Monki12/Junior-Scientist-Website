
'use client';

import { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { UserRole, LoginFormData } from '@/types';
import { Loader2, User, Shield, LogIn, KeyRound, UserPlus } from 'lucide-react';

const mockRolesToTest: UserRole[] = ['student', 'organizer', 'event_representative', 'overall_head', 'admin', 'test'];

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFirebaseLoading, setIsFirebaseLoading] = useState(false);
  const { authUser, logIn, setMockUserRole, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });

  useEffect(() => {
    if (!authLoading && authUser) {
      const redirectUrl = searchParams.get('redirect') || '/dashboard';
      router.replace(redirectUrl);
    }
  }, [authLoading, authUser, router, searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleDirectFirebaseLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast({ title: "Missing Fields", description: "Email and Password are required for direct login.", variant: "destructive" });
      return;
    }
    setIsFirebaseLoading(true);
    try {
      const result = await logIn(formData);
      if (result && typeof result === 'object' && ('code' in result || 'message' in result)) {
         const errorMessage = (result as any).message || 'Login failed. Please check your credentials.';
        toast({ title: "Login Failed", description: errorMessage, variant: "destructive" });
      } else {
        toast({ title: "Login Successful!", description: "Redirecting..." });
        // The useEffect hook will handle the redirection.
      }
    } catch (error: any) {
      toast({ title: "Login Error", description: error.message || "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsFirebaseLoading(false);
    }
  };

  const handleMockLogin = async (role: UserRole) => {
    setIsLoading(true);
    setMockUserRole(role);
  };

  if (authLoading || authUser) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-15rem)] items-center justify-center py-12">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <KeyRound className="mx-auto h-12 w-12 text-primary mb-4" />
          <CardTitle className="text-3xl font-headline text-primary">Welcome to Junior Scientist!</CardTitle>
          <CardDescription>Log in to access your student dashboard or use mock roles for testing.</CardDescription>
        </CardHeader>
        
        <form onSubmit={handleDirectFirebaseLogin}>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} required disabled={isFirebaseLoading || isLoading} />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required disabled={isFirebaseLoading || isLoading} />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isFirebaseLoading || isLoading}>
              {isFirebaseLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
              Login with Email
            </Button>
          </CardContent>
        </form>

        <div className="px-6 py-2">
           <div className="relative">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or use mock roles for testing</span>
            </div>
            </div>
        </div>

        <CardContent className="space-y-3 pt-4">
          {mockRolesToTest.map((role) => (
            <Button
              key={role}
              onClick={() => handleMockLogin(role)}
              className="w-full"
              disabled={isLoading || isFirebaseLoading}
              variant="outline"
            >
              {isLoading && !isFirebaseLoading ? ( 
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                role === 'student' || role === 'test' ? <User className="mr-2 h-4 w-4" /> : <Shield className="mr-2 h-4 w-4" />
              )}
              Log in as {role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')}
            </Button>
          ))}
        </CardContent>
         <CardFooter className="flex flex-col items-center space-y-2 pt-4">
           <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?
            <Link href="/signup" className="font-semibold text-primary hover:underline ml-1">
              <UserPlus className="inline mr-1 h-4 w-4" />Create Student Account
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
