
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { SignUpFormData } from '@/types';
import { Loader2 } from 'lucide-react';
import type { AuthError } from 'firebase/auth';

const signUpSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }).optional(),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  confirmPassword: z.string().min(6, { message: 'Password must be at least 6 characters' }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"], // path of error
});


export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit: SubmitHandler<SignUpFormData> = async (data) => {
    setIsLoading(true);
    const result = await signUp(data);
    setIsLoading(false);

    if ('code' in result) { // AuthError
      const firebaseError = result as AuthError;
      let userFriendlyMessage = firebaseError.message; // Default to Firebase's message

      // Provide more user-friendly messages for common errors
      switch (firebaseError.code) {
        case 'auth/email-already-in-use':
          userFriendlyMessage = 'This email is already registered. Please log in or use a different email.';
          break;
        case 'auth/weak-password':
          userFriendlyMessage = 'The password is too weak. Please choose a stronger password (at least 6 characters).';
          break;
        case 'auth/invalid-email':
          userFriendlyMessage = 'The email address is not valid. Please check the format.';
          break;
        case 'auth/operation-not-allowed':
          userFriendlyMessage = 'Email/password sign-up is not enabled. Please contact support.';
          break;
        default:
          // For less common or unexpected Firebase errors, log the code for debugging.
          // The default firebaseError.message might be technical.
          console.error("Firebase SignUp Error Code:", firebaseError.code, "Message:", firebaseError.message);
          userFriendlyMessage = `Sign up failed: ${firebaseError.message}. Please try again.`;
          break;
      }

      toast({
        title: 'Sign Up Error',
        description: userFriendlyMessage,
        variant: 'destructive',
      });
    } else { // FirebaseUser
      // Toast for successful signup is not an error, so omitted as per guidelines
      router.push('/dashboard');
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center animate-fade-in-up">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline text-primary">Create an Account</CardTitle>
          <CardDescription>Join EventFlow to manage and discover events seamlessly.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name (Optional)</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                {...register('name')}
                aria-invalid={errors.name ? 'true' : 'false'}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register('email')}
                aria-invalid={errors.email ? 'true' : 'false'}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
                aria-invalid={errors.password ? 'true' : 'false'}
              />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
             <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                {...register('confirmPassword')}
                aria-invalid={errors.confirmPassword ? 'true' : 'false'}
              />
              {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign Up
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Log In
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
