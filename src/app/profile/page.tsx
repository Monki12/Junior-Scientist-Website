
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { subEventsData } from '@/data/subEvents';
import type { SubEvent, UserProfileData } from '@/types'; // Added UserProfileData
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UserCircle, Mail, Shield, LogOut, ArrowLeft, CalendarDays, Info, Users, GraduationCap, School, Edit3, Check, X, HelpCircle } from 'lucide-react'; // Added Edit3, Check, X, HelpCircle
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge'; // Added Badge

interface RegisteredEventDisplay extends SubEvent {
  teamName?: string;
}

export default function ProfilePage() {
  const { authUser, userProfile, loading, logOut, setUserProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  // Form state for editable fields
  const [isEditing, setIsEditing] = useState(false);
  const [editableProfile, setEditableProfile] = useState<Partial<UserProfileData>>({});
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [studentRegisteredFullEvents, setStudentRegisteredFullEvents] = useState<RegisteredEventDisplay[]>([]);

  useEffect(() => {
    if (!loading && !authUser) {
      router.push('/login?redirect=/profile');
    }
    if (userProfile) {
      setEditableProfile({
        displayName: userProfile.displayName || '',
        fullName: userProfile.fullName || '',
        schoolName: userProfile.schoolName || '',
        standard: userProfile.standard || '',
        division: userProfile.division || '',
        // Add other fields if they become editable for students
      });
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
    } else if (authUser && authUser.displayName && !userProfile) { // Only set if userProfile is null initially
        setEditableProfile(prev => ({...prev, displayName: authUser.displayName || '' }));
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
    if (!authUser || !userProfile || !setUserProfile) return;
    setIsUpdating(true);
    
    // Simulate API call for update
    await new Promise(resolve => setTimeout(resolve, 700)); 
    
    // Simulate grade validation if standard is being updated by a student
    if (userProfile.role === 'student' && editableProfile.standard) {
        const numericStandard = parseInt(editableProfile.standard, 10);
        if (isNaN(numericStandard) || numericStandard < 4 || numericStandard > 12) {
            toast({
                title: 'Invalid Grade',
                description: 'Standard must be between Grade 4 and Grade 12.',
                variant: 'destructive',
            });
            setIsUpdating(false);
            return;
        }
    }
    
    setUserProfile(prev => {
        if (!prev) return null;
        const updatedProfile = {
            ...prev,
            displayName: editableProfile.fullName || editableProfile.displayName || prev.displayName, // Prefer fullName for displayName if student
            fullName: editableProfile.fullName || prev.fullName,
            schoolName: editableProfile.schoolName || prev.schoolName,
            standard: editableProfile.standard || prev.standard,
            division: editableProfile.division || prev.division,
            updatedAt: new Date().toISOString(),
            // If schoolName changed by student, reset verification status (mock logic)
            schoolVerifiedByOrganizer: prev.schoolName === editableProfile.schoolName ? prev.schoolVerifiedByOrganizer : false,
        };
        return updatedProfile;
    });

    toast({
      title: 'Profile Updated (Mock)',
      description: 'Your profile information has been updated locally for this session.',
    });
    setIsUpdating(false);
    setIsEditing(false); // Exit editing mode
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditableProfile({ ...editableProfile, [e.target.id]: e.target.value });
  };


  if (loading || !authUser || !userProfile) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  const displayEmail = authUser.email || userProfile.email;
  const currentDisplayName = isEditing ? (editableProfile.fullName || editableProfile.displayName) : (userProfile.fullName || userProfile.displayName);
  const avatarFallback = (currentDisplayName?.[0])?.toUpperCase() || (displayEmail?.[0])?.toUpperCase() || 'U';
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
            <AvatarImage src={currentPhotoURL || undefined} alt={currentDisplayName || displayEmail || 'User'} />
            <AvatarFallback className="text-3xl">{avatarFallback}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl">{currentDisplayName || 'User Profile'}</CardTitle>
          {displayEmail && <CardDescription className="flex items-center gap-1"><Mail className="h-4 w-4 text-muted-foreground" />{displayEmail}</CardDescription>}
           {userProfile.role && (
            <Badge variant="secondary" className="mt-2 capitalize text-sm py-1 px-3">
                <Shield className="mr-2 h-4 w-4" /> Role: {userProfile.role.replace('_', ' ')}
            </Badge>
           )}
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {isEditing ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" value={editableProfile.fullName || ''} onChange={handleInputChange} placeholder="Your Full Name" />
              </div>
              {userProfile.role === 'student' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="schoolName">School Name</Label>
                    <Input id="schoolName" value={editableProfile.schoolName || ''} onChange={handleInputChange} placeholder="Your School Name" />
                    {userProfile.schoolVerifiedByOrganizer === false && !editableProfile.schoolName?.includes(userProfile.schoolName || '') && (
                        <p className="text-xs text-yellow-600 flex items-center gap-1"><HelpCircle className="h-3 w-3" /> Changing school will require re-verification.</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="standard">Standard (Grade 4-12)</Label>
                        <Input id="standard" type="number" min="4" max="12" value={editableProfile.standard || ''} onChange={handleInputChange} placeholder="e.g., 10" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="division">Division (Optional)</Label>
                        <Input id="division" value={editableProfile.division || ''} onChange={handleInputChange} placeholder="e.g., A" />
                    </div>
                  </div>
                </>
              )}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => { setIsEditing(false); setEditableProfile({ fullName: userProfile.fullName, schoolName: userProfile.schoolName, standard: userProfile.standard, division: userProfile.division }); }} disabled={isUpdating}>
                    <X className="mr-2 h-4 w-4" />Cancel
                </Button>
                <Button onClick={handleProfileUpdate} className="bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isUpdating}>
                  {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                  Save Changes
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Full Name</Label>
                <p className="text-lg">{userProfile.fullName || userProfile.displayName || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Email Address</Label>
                <p className="text-lg">{displayEmail || 'N/A'}</p>
              </div>
               {userProfile.role === 'student' && (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">School Name</Label>
                    <div className="flex items-center gap-2">
                        <p className="text-lg">{userProfile.schoolName || 'N/A'}</p>
                        {userProfile.schoolName && (
                            <Badge variant={userProfile.schoolVerifiedByOrganizer ? "default" : "outline"} className={`text-xs ${userProfile.schoolVerifiedByOrganizer ? 'bg-green-100 text-green-700 border-green-300' : 'text-yellow-700 border-yellow-400 bg-yellow-50'}`}>
                            {userProfile.schoolVerifiedByOrganizer ? 'Verified' : 'Pending Review'}
                            </Badge>
                        )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Standard (Grade)</Label>
                        <p className="text-lg">{userProfile.standard ? `Grade ${userProfile.standard}` : 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Division</Label>
                        <p className="text-lg">{userProfile.division || 'N/A'}</p>
                    </div>
                  </div>
                </>
               )}
              <Button onClick={() => setIsEditing(true)} variant="outline" className="w-full mt-4">
                <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
              </Button>
            </>
          )}
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
                          fill
                          style={{objectFit: 'cover'}}
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
