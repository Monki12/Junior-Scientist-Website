
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { subEventsData } from '@/data/subEvents';
import type { SubEvent, UserProfileData } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, UserCircle, Mail, Shield, LogOut, ArrowLeft, CalendarDays, Info, Users, GraduationCap, School, Edit3, Check, X, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface RegisteredEventDisplay extends SubEvent {
  teamName?: string;
}

export default function ProfilePage() {
  const { authUser, userProfile, loading, logOut, setUserProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editableProfile, setEditableProfile] = useState<Partial<UserProfileData>>({});
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [studentRegisteredFullEvents, setStudentRegisteredFullEvents] = useState<RegisteredEventDisplay[]>([]);

  useEffect(() => {
    if (!loading && !authUser) {
      router.push('/login?redirect=/profile');
    }
    if (userProfile) {
      // Initialize editableProfile from the main userProfile context
      setEditableProfile({
        displayName: userProfile.displayName || '',
        fullName: userProfile.fullName || '',
        schoolName: userProfile.schoolName || '',
        standard: userProfile.standard || '',
        division: userProfile.division || '',
        phoneNumbers: userProfile.phoneNumbers || [''],
        additionalNumber: userProfile.additionalNumber || '',
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
    }
  }, [authUser, userProfile, loading, router]);
  
  const handleInputChange = (field: keyof UserProfileData, value: string) => {
    setEditableProfile(prev => ({ ...prev, [field]: value }));
  };

  const handlePhoneNumberChange = (value: string) => {
    setEditableProfile(prev => ({ ...prev, phoneNumbers: [value, ...(prev.phoneNumbers?.slice(1) || [])] }));
  };

  const handleProfileUpdate = async () => {
    if (!authUser || !userProfile || !setUserProfile || !editableProfile) {
      toast({ title: "Error", description: "User not authenticated or profile data is missing.", variant: "destructive" });
      return;
    }

    setIsUpdating(true);
    
    try {
      const numericStandard = parseInt(editableProfile.standard || '0', 10);
      if (isNaN(numericStandard) || numericStandard < 4 || numericStandard > 12) {
        toast({ title: 'Invalid Grade', description: 'Standard must be a number between 4 and 12.', variant: 'destructive' });
        setIsUpdating(false);
        return;
      }
      
      const userDocRef = doc(db, 'users', authUser.uid);
      const updatesToSave: Partial<UserProfileData> = {
        schoolName: editableProfile.schoolName,
        standard: editableProfile.standard,
        division: editableProfile.division || null,
        phoneNumbers: editableProfile.phoneNumbers,
        additionalNumber: editableProfile.additionalNumber || null,
        schoolVerifiedByOrganizer: userProfile.schoolName === editableProfile.schoolName ? userProfile.schoolVerifiedByOrganizer : false,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(userDocRef, updatesToSave);

      setUserProfile(prev => prev ? { ...prev, ...updatesToSave, updatedAt: new Date().toISOString() } : null);

      toast({ title: 'Profile Updated', description: 'Your profile information has been successfully saved.' });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({ title: 'Update Failed', description: 'Could not save your profile changes. Please try again.', variant: 'destructive' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logOut();
      router.push('/');
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
    } catch (error) {
       toast({
        title: 'Logout Failed',
        description: "An error occurred during logout. Please try again.",
        variant: 'destructive',
      });
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
  const currentDisplayName = userProfile.fullName || userProfile.displayName;
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
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-1">
            {displayEmail && <p className="text-sm text-muted-foreground flex items-center gap-1.5"><Mail className="h-4 w-4"/>{displayEmail}</p>}
            {userProfile.shortId && <p className="text-sm text-muted-foreground flex items-center gap-1.5"><Shield className="h-4 w-4"/>ID: {userProfile.shortId}</p>}
          </div>
           {userProfile.role && (
            <Badge variant="secondary" className="mt-2 capitalize text-sm py-1 px-3">
                <Shield className="mr-2 h-4 w-4" /> Role: {userProfile.role.replace('_', ' ')}
            </Badge>
           )}
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {/* Non-Editable section */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Full Name</Label>
              <p className="text-lg font-medium p-2 bg-muted/50 rounded-md">{userProfile.fullName || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Email Address</Label>
              <p className="text-lg p-2 bg-muted/50 rounded-md">{displayEmail || 'N/A'}</p>
            </div>

            {/* Editable Section */}
             <div className="space-y-1">
              <Label htmlFor="schoolName">School Name</Label>
              {isEditing ? (
                 <Input id="schoolName" value={editableProfile?.schoolName || ''} onChange={(e) => handleInputChange('schoolName', e.target.value)} placeholder="Your School Name" />
              ) : (
                <div className="flex items-center gap-2 p-2 min-h-[40px]">
                    <p className="text-lg">{userProfile.schoolName || 'Not Set'}</p>
                    {userProfile.schoolName && (
                        <Badge variant={userProfile.schoolVerifiedByOrganizer ? "default" : "outline"} className={`text-xs ${userProfile.schoolVerifiedByOrganizer ? 'bg-green-100 text-green-700 border-green-300' : 'text-yellow-700 border-yellow-400 bg-yellow-50'}`}>
                        {userProfile.schoolVerifiedByOrganizer ? 'Verified' : 'Pending Review'}
                        </Badge>
                    )}
                </div>
              )}
            </div>

            <div className="space-y-1">
                <Label htmlFor="standard">Standard (Grade 4-12)</Label>
                {isEditing ? (
                     <Select value={editableProfile?.standard} onValueChange={(value) => handleInputChange('standard', value)}>
                        <SelectTrigger><SelectValue placeholder="Select Grade" /></SelectTrigger>
                        <SelectContent>
                            {Array.from({ length: 9 }, (_, i) => `${i + 4}`).map(grade => (
                                <SelectItem key={grade} value={grade}>{`Grade ${grade}`}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : (
                    <p className="text-lg p-2 min-h-[40px]">{userProfile.standard ? `Grade ${userProfile.standard}` : 'Not Set'}</p>
                )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="division">Division</Label>
              {isEditing ? (
                <Input id="division" value={editableProfile?.division || ''} onChange={(e) => handleInputChange('division', e.target.value)} placeholder="e.g., A" />
              ) : (
                <p className="text-lg p-2 min-h-[40px]">{userProfile.division || 'Not Set'}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="phoneNumber">Primary Phone Number</Label>
              {isEditing ? (
                <Input id="phoneNumber" type="tel" value={editableProfile?.phoneNumbers?.[0] || ''} onChange={(e) => handlePhoneNumberChange(e.target.value)} placeholder="+91 12345 67890" />
              ) : (
                <p className="text-lg p-2 min-h-[40px]">{userProfile.phoneNumbers?.[0] || 'Not Set'}</p>
              )}
            </div>
             <div className="space-y-1 md:col-span-2">
              <Label htmlFor="additionalNumber">Additional Phone Number (Optional)</Label>
              {isEditing ? (
                <Input id="additionalNumber" type="tel" value={editableProfile?.additionalNumber || ''} onChange={(e) => handleInputChange('additionalNumber', e.target.value)} placeholder="Secondary contact number" />
              ) : (
                <p className="text-lg p-2 min-h-[40px]">{userProfile.additionalNumber || 'Not Set'}</p>
              )}
            </div>

          </div>
          <div className="flex gap-2 justify-end mt-6">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => { setIsEditing(false); setEditableProfile(userProfile); }} disabled={isUpdating}>
                    <X className="mr-2 h-4 w-4" />Cancel
                </Button>
                <Button onClick={handleProfileUpdate} className="bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isUpdating}>
                  {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                  Save Changes
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
              </Button>
            )}
          </div>
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
