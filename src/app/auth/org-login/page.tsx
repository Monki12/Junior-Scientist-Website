
'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { LoginFormData } from '@/types';
import { Loader2, LogIn, ShieldCheck, Eye, EyeOff } from 'lucide-react';

export default function OrgLoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { logIn, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };
  
  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast({ title: "Missing Fields", description: "Email and Password are required.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const result = await logIn(formData);
      if (result && typeof result === 'object' && ('code' in result || 'message' in result)) {
        const errorMessage = (result as any).message || 'Login failed. Please check your credentials or ensure your account is active.';
        toast({ title: "Login Failed", description: errorMessage, variant: "destructive" });
      } else {
        toast({ title: "Login Successful!", description: "Redirecting to your dashboard..." });
        const redirectUrl = searchParams.get('redirect') || '/dashboard'; // Redirect to dashboard or intended page
        router.push(redirectUrl);
      }
    } catch (error: any) {
      toast({ title: "Login Error", description: error.message || "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (authLoading && !isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-15rem)] items-center justify-center py-12 animate-fade-in-up">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <ShieldCheck className="mx-auto h-12 w-12 text-primary mb-4" />
          <CardTitle className="text-3xl font-headline text-primary">Organizational Login</CardTitle>
          <CardDescription>Access for Event Organizers, Representatives, and Admins.</CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="org.user@example.com" value={formData.email} onChange={handleChange} required disabled={isLoading} />
            </div>
            <div>
              <div className="flex items-center justify-between">
                 <Label htmlFor="password">Password</Label>
                 <Link href="/forgot-password" tabIndex={-1} className="text-sm text-primary hover:underline">Forgot Password?</Link>
              </div>
               <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="••••••••" 
                  value={formData.password} 
                  onChange={handleChange} 
                  required 
                  disabled={isLoading}
                  className="pr-10"
                />
                <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                    onClick={togglePasswordVisibility}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
              Login
            </Button>
          </CardContent>
        </form>
        <CardFooter className="flex justify-center pt-6">
          <p className="text-sm text-muted-foreground">
            Student? <Link href="/login" className="font-semibold text-primary hover:underline ml-1">Login here</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
