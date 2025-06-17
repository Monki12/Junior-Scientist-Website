'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UserCircle, Mail, CalendarCheck2, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const { user, loading, logOut } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/profile');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    try {
      await logOut();
      router.push('/');
    } catch (error) {
       toast({
        title: 'Logout Failed',
        description: (error as Error).message || 'An unexpected error occurred during logout.',
        variant: 'destructive',
      });
    }
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in-up">
      <header className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-primary">My Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your account details and preferences.</p>
      </header>

      <Card className="shadow-xl">
        <CardHeader className="flex flex-col items-center text-center">
          <Avatar className="h-24 w-24 mb-4 border-2 border-primary shadow-md">
            <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'User'} />
            <AvatarFallback className="text-3xl">{user.email?.[0].toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl">{user.displayName || 'User Profile'}</CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input id="displayName" defaultValue={user.displayName || ''} placeholder="Your Name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" value={user.email || ''} disabled />
          </div>
          <Button className="w-full bg-primary hover:bg-primary/90">Update Profile</Button>
        </CardContent>
      </Card>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CalendarCheck2 className="h-5 w-5 text-accent" /> My Registered Events</CardTitle>
          <CardDescription>A list of events you have registered for.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Placeholder for event list */}
          <p className="text-muted-foreground">You have not registered for any events yet.</p>
          {/* Example:
          <ul className="space-y-2">
            <li className="p-2 border rounded-md">Tech Conference 2024</li>
            <li className="p-2 border rounded-md">Art Workshop</li>
          </ul>
          */}
        </CardContent>
      </Card>
      
      <div className="text-center">
        <Button variant="destructive" onClick={handleLogout} className="w-full sm:w-auto">
          <LogOut className="mr-2 h-4 w-4" /> Log Out
        </Button>
      </div>
    </div>
  );
}
