
'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Added Select
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { SignUpFormData } from '@/types';
import { UserPlus, Loader2, LogIn, School } from 'lucide-react'; // Added School icon
import type { AuthError } from 'firebase/auth';
import { mockSchoolsData } from '@/data/mockSchools'; // Import mock schools

const gradeLevels = Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`);

export default function SignUpPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<SignUpFormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    schoolName: '',
    standard: '',
    division: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSelectChange = (name: keyof SignUpFormData, value: string) => {
    setFormData({ ...formData, [name]: value });
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
    if (!formData.email || !formData.password || !formData.fullName || !formData.schoolName || !formData.standard) {
      toast({
        title: 'Missing Fields',
        description: 'Full Name, Email, Password, School, and Standard are required.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await signUp(formData); // Pass all form data
      if (typeof result === 'object' && 'code' in result && (result as AuthError).code) {
        const authError = result as AuthError;
        if (authError.code === 'auth/email-already-in-use') {
          toast({
            title: 'Email Already Exists',
            description: 'This email address is already registered. Please try logging in or use a different email.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Sign Up Failed',
            description: authError.message || 'An unknown error occurred.',
            variant: 'destructive',
          });
        }
      } else {
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
      <Card className="w-full max-w-lg shadow-xl"> {/* Increased max-w-md to max-w-lg */}
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
              <Label htmlFor="fullName">Full Name <span className="text-destructive">*</span></Label>
              <Input id="fullName" type="text" placeholder="Your Full Name" value={formData.fullName} onChange={handleChange} required disabled={isLoading} />
            </div>
            <div>
              <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
              <Input id="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} required disabled={isLoading} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
                <Input id="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required disabled={isLoading} />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password <span className="text-destructive">*</span></Label>
                <Input id="confirmPassword" type="password" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} required disabled={isLoading} />
              </div>
            </div>
            <div>
              <Label htmlFor="schoolName">School Name <span className="text-destructive">*</span></Label>
              <div className="relative">
                <School className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="schoolName"
                  type="text"
                  placeholder="Type or select your school"
                  value={formData.schoolName}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  list="schools-datalist"
                  className="pl-10"
                />
                <datalist id="schools-datalist">
                  {mockSchoolsData.map(school => (
                    <option key={school.id} value={school.name} />
                  ))}
                </datalist>
              </div>
              <p className="text-xs text-muted-foreground mt-1">If your school is not listed, please type its full name.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="standard">Standard (Grade) <span className="text-destructive">*</span></Label>
                <Select
                  value={formData.standard}
                  onValueChange={(value) => handleSelectChange('standard', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger id="standard">
                    <SelectValue placeholder="Select your grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {gradeLevels.map(grade => (
                      <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="division">Division (Optional)</Label>
                <Input id="division" type="text" placeholder="e.g., A, B, Blue" value={formData.division} onChange={handleChange} disabled={isLoading} />
              </div>
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
