
'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { SignUpFormData } from '@/types';
import { UserPlus, Loader2, LogIn } from 'lucide-react';

export default function SignUpPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<SignUpFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Password Mismatch',
        description: 'Passwords do not match.',
        variant: 'destructive',
      });
      return;
    }
    if (!formData.email || !formData.password) {
      toast({
        title: 'Missing Fields',
        description: 'Email and Password are required.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // AuthContext.signUp will default new users to 'student' role
      const result = await signUp(formData);
      if (typeof result === 'object' && 'code' in result) { // AuthError
        toast({
          title: 'Sign Up Failed',
          description: result.message || 'An unknown error occurred.',
          variant: 'destructive',
        });
      } else { // FirebaseUser
        toast({
          title: 'Sign Up Successful!',
          description: 'Welcome! Redirecting to your dashboard...',
        });
        router.push('/dashboard');
      }
    } catch (error: any) {
      toast({
        title: 'Sign Up Error',
        description: error.message || 'An unexpected error occurred during sign up.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center animate-fade-in-up py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <UserPlus className="mx-auto h-12 w-12 text-primary mb-4" />
          <CardTitle className="text-3xl font-headline text-primary">Student Sign Up</CardTitle>
          <CardDescription>
            Create your student account to explore and participate in events.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name (Optional)</Label>
              <Input id="name" type="text" placeholder="Your Name" value={formData.name} onChange={handleChange} disabled={isLoading} />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} required disabled={isLoading} />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required disabled={isLoading} />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} required disabled={isLoading} />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              Create Student Account
            </Button>
          </CardContent>
        </form>
        <CardFooter className="flex flex-col items-center space-y-2 pt-6">
          <p className="text-sm text-muted-foreground">
            Already have an account?
          </p>
          <Button variant="outline" asChild className="w-full">
            <Link href="/login">
              <LogIn className="mr-2 h-4 w-4" /> Log In
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
