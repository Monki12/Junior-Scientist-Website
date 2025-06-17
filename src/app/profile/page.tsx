
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { subEventsData } from '@/data/subEvents';
import type { SubEvent } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UserCircle, Mail, Shield, LogOut, ArrowLeft, CalendarDays, Info, Users, GraduationCap, School } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';


interface RegisteredEventDisplay extends SubEvent {
  teamName?: string;
}

export default function ProfilePage() {
  const { authUser, userProfile, loading, logOut, setUserProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [studentRegisteredFullEvents, setStudentRegisteredFullEvents] = useState<RegisteredEventDisplay[]>([]);

  useEffect(() => {
    if (!loading && !authUser) {
      router.push('/login?redirect=/profile');
    }
    if (userProfile) { // Ensure userProfile exists before accessing its properties
      setDisplayName(userProfile.displayName || ''); // Default to empty string if displayName is null
      if ((userProfile.role === 'student' || userProfile.role === 'test') && userProfile.registeredEvents) {
        const fullEvents = userProfile.registeredEvents
          .map(registeredInfo => {
            const eventDetail = subEventsData.find(event => event.slug === registeredInfo.eventSlug);
            if (eventDetail) {
              return { ...eventDetail, teamName: registeredInfo.teamName };
            }
            return null;
          })
          .filter(event => event !== null) as RegisteredEventDisplay[];
        setStudentRegisteredFullEvents(fullEvents);
      }
    } else if (authUser && authUser.displayName) { // Fallback to authUser.displayName if userProfile is not yet loaded or doesn't have one
        setDisplayName(authUser.displayName);
    }
  }, [authUser, userProfile, loading, router]);

  const handleLogout = async () => {
    try {
      await logOut();
      router.push('/');
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
    } catch (error) {
       toast({
        title: 'Logout Failed',
        description: (error as Error).message || 'An unexpected error occurred during logout.',
        variant: 'destructive',
      });
    }
  };
  
  const handleProfileUpdate = async () => {
    if (!authUser || !userProfile || !setUserProfile) return; // Added !setUserProfile check
    setIsUpdating(true);
    
    await new Promise(resolve => setTimeout(resolve, 500)); 
    
    setUserProfile(prev => { // Use functional update for setUserProfile
        if (!prev) return null;
        return {...prev, displayName };
    });

    toast({
      title: 'Profile Updated (Mock)',
      description: 'Your display name has been updated locally for this session.',
    });
    setIsUpdating(false);
  };

  if (loading || !authUser || !userProfile) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  const displayEmail = authUser.email || userProfile.email;
  const avatarFallback = (displayName?.[0])?.toUpperCase() || (displayEmail?.[0])?.toUpperCase() || 'U';
  const currentPhotoURL = userProfile?.photoURL || authUser.photoURL;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in-up">
      <div className="flex justify-between items-center mb-6">
        <header className="text-left">
          <h1 className="text-3xl md:text-4xl font-bold text-primary">My Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your account details and preferences.</p>
        </header>
        <Button variant="outline" asChild>
            <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Link>
        </Button>
      </div>

      <Card className="shadow-xl">
        <CardHeader className="flex flex-col items-center text-center border-b pb-6">
          <Avatar className="h-24 w-24 mb-4 border-2 border-primary shadow-md">
            <AvatarImage src={currentPhotoURL || undefined} alt={displayName || displayEmail || 'User'} />
            <AvatarFallback className="text-3xl">{avatarFallback}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl">{displayName || 'User Profile'}</CardTitle>
          {displayEmail && <CardDescription className="flex items-center gap-1"><Mail className="h-4 w-4 text-muted-foreground" />{displayEmail}</CardDescription>}
           {userProfile.role && (
            <CardDescription className="mt-1 flex items-center gap-1 text-sm">
                <Shield className="h-4 w-4 text-muted-foreground" /> Role: <span className="font-medium text-foreground capitalize">{userProfile.role.replace('_', ' ')}</span>
            </CardDescription>
           )}
           {userProfile.school && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <School className="h-4 w-4" /> {userProfile.school}
            </p>
            )}
            {userProfile.grade && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
                <GraduationCap className="h-4 w-4" /> {userProfile.grade}
            </p>
            )}
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
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
            <Label htmlFor="email">Email Address (Cannot be changed)</Label>
            <Input id="email" type="email" value={displayEmail || ''} disabled className="bg-muted/50" />
          </div>
          <Button onClick={handleProfileUpdate} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isUpdating}>
            {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Update Profile
          </Button>
        </CardContent>
      </Card>

      {(userProfile.role === 'student' || userProfile.role === 'test') && (
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-primary" /> My Registered Events</CardTitle>
            <CardDescription>Events you are currently registered for.</CardDescription>
          </CardHeader>
          <CardContent>
            {studentRegisteredFullEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {studentRegisteredFullEvents.map(event => (
                  <Card key={event.id} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                     <Link href={`/events/${event.slug}`} className="block group">
                      <div className="relative w-full h-32">
                        <Image
                          src={event.mainImage.src}
                          alt={event.mainImage.alt}
                          fill // Changed from layout="fill"
                          style={{objectFit: 'cover'}} // Changed from objectFit="cover"
                          data-ai-hint={event.mainImage.dataAiHint}
                          className="group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <CardHeader className="pb-1 pt-3 px-4">
                        <CardTitle className="text-md group-hover:text-primary line-clamp-1">{event.title}</CardTitle>
                         {event.teamName && (
                          <p className="text-xs text-accent font-medium flex items-center">
                            <Users className="mr-1 h-3 w-3"/> Team: {event.teamName}
                          </p>
                        )}
                      </CardHeader>
                      <CardFooter className="px-4 pb-3 pt-1">
                         <Button variant="outline" size="sm" className="w-full text-xs">View Event Details</Button>
                      </CardFooter>
                     </Link>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Info className="h-8 w-8 mx-auto mb-2" />
                <p>You haven&apos;t registered for any events yet.</p>
                <Button variant="link" asChild className="mt-2 text-primary"><Link href="/events">Explore Events</Link></Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      <div className="text-center pt-4">
        <Button variant="destructive" onClick={handleLogout} className="w-full sm:w-auto">
          <LogOut className="mr-2 h-4 w-4" /> Log Out
        </Button>
      </div>
    </div>
  );
}

