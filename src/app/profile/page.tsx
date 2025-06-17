
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UserCircle, Mail, CalendarCheck2, LogOut, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { updateProfile as updateFirebaseProfile } from 'firebase/auth';


export default function ProfilePage() {
  const { authUser, userProfile, loading, logOut, setUserProfile } = useAuth(); // setUserProfile may not be exposed, depends on context setup
  const router = useRouter();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!loading && !authUser) {
      router.push('/login?redirect=/profile');
    }
    if (authUser && (userProfile?.displayName || authUser.displayName)) {
      setDisplayName(userProfile?.displayName || authUser.displayName || '');
    }
  }, [authUser, userProfile, loading, router]);

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
  
  const handleProfileUpdate = async () => {
    if (!authUser) return;
    setIsUpdating(true);
    try {
      // Update Firebase Auth profile
      await updateFirebaseProfile(authUser, { displayName });
      
      // Update Firestore profile
      const userDocRef = doc(db, 'users', authUser.uid);
      await updateDoc(userDocRef, { displayName });

      // Optimistically update local state or refetch if context supports it
      if (setUserProfile && userProfile) { // Check if setUserProfile is available
         // @ts-ignore
        setUserProfile(prev => prev ? {...prev, displayName } : null);
      }


      toast({
        title: 'Profile Updated',
        description: 'Your display name has been updated.',
        // Variant is not 'destructive', so this is a success toast.
      });
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: (error as Error).message || 'Could not update profile.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };


  if (loading || !authUser || !userProfile) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  const displayEmail = authUser.email || userProfile.email;
  const avatarFallback = displayEmail?.[0].toUpperCase() || 'U';
  const currentPhotoURL = userProfile?.photoURL || authUser.photoURL;


  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in-up">
      <header className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-primary">My Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your account details and preferences.</p>
      </header>

      <Card className="shadow-xl">
        <CardHeader className="flex flex-col items-center text-center">
          <Avatar className="h-24 w-24 mb-4 border-2 border-primary shadow-md">
            <AvatarImage src={currentPhotoURL || undefined} alt={displayName || displayEmail || 'User'} />
            <AvatarFallback className="text-3xl">{avatarFallback}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl">{displayName || 'User Profile'}</CardTitle>
          <CardDescription>{displayEmail}</CardDescription>
           {userProfile.role && (
            <CardDescription className="mt-1 flex items-center gap-1 text-sm">
                <Shield className="h-4 w-4 text-muted-foreground" /> Role: <span className="font-medium text-foreground capitalize">{userProfile.role.replace('_', ' ')}</span>
            </CardDescription>
           )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input 
              id="displayName" 
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)} 
              placeholder="Your Name" 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" value={displayEmail || ''} disabled />
          </div>
          <Button onClick={handleProfileUpdate} className="w-full bg-primary hover:bg-primary/90" disabled={isUpdating}>
            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Profile
          </Button>
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
