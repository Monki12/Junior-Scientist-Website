
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import type { UserProfileData } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Mail, Shield, Edit3, Check, X, Building, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function ProfilePage() {
  const { authUser, userProfile, loading, setUserProfile } = useAuth();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editableProfile, setEditableProfile] = useState<Partial<UserProfileData>>({});
  const [isUpdating, setIsUpdating] = useState(false);
  

  useEffect(() => {
    if (userProfile) {
      setEditableProfile({
        displayName: userProfile.displayName || '',
        fullName: userProfile.fullName || '',
        schoolName: userProfile.schoolName || '',
        standard: userProfile.standard || '',
        division: userProfile.division || '',
        phoneNumbers: userProfile.phoneNumbers || [''],
        additionalNumber: userProfile.additionalNumber || '',
        photoURL: userProfile.photoURL || '',
        department: userProfile.department || '',
      });
    }
  }, [userProfile]);
  
  const handleInputChange = (field: keyof UserProfileData, value: string) => {
    setEditableProfile(prev => ({ ...prev, [field]: value }));
  };

  const handlePhoneNumberChange = (index: number, value: string) => {
    setEditableProfile(prev => {
      const newPhoneNumbers = [...(prev.phoneNumbers || [])];
      newPhoneNumbers[index] = value;
      return { ...prev, phoneNumbers: newPhoneNumbers };
    });
  };

  const handleProfileUpdate = async () => {
    if (!authUser || !userProfile || !setUserProfile || !editableProfile) {
      toast({ title: "Error", description: "User not authenticated or profile data is missing.", variant: "destructive" });
      return;
    }

    setIsUpdating(true);
    
    try {
      if (userProfile.role === 'student' || userProfile.role === 'test') {
        const numericStandard = parseInt(editableProfile.standard || '0', 10);
        if (isNaN(numericStandard) || numericStandard < 4 || numericStandard > 12) {
          toast({ title: 'Invalid Grade', description: 'Standard must be a number between 4 and 12.', variant: 'destructive' });
          setIsUpdating(false);
          return;
        }
      }
      
      const userDocRef = doc(db, 'users', authUser.uid);
      
      const updatesToSave: Partial<UserProfileData> = {
        phoneNumbers: (editableProfile.phoneNumbers || []).filter(Boolean),
        additionalNumber: editableProfile.additionalNumber || null,
        photoURL: editableProfile.photoURL || null,
        updatedAt: serverTimestamp(),
      };
      
      if (userProfile.role === 'student' || userProfile.role === 'test') {
        updatesToSave.schoolName = editableProfile.schoolName;
        updatesToSave.standard = editableProfile.standard;
        updatesToSave.division = editableProfile.division || null;
        updatesToSave.schoolVerifiedByOrganizer = userProfile.schoolName === editableProfile.schoolName ? userProfile.schoolVerifiedByOrganizer : false;
      }
      
      if (userProfile.role !== 'student') {
        updatesToSave.department = editableProfile.department;
      }


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
  
  if (loading || !authUser || !userProfile) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  const displayEmail = authUser.email || userProfile.email;
  const currentDisplayName = userProfile.fullName || userProfile.displayName;
  const avatarFallback = (currentDisplayName?.[0])?.toUpperCase() || (displayEmail?.[0])?.toUpperCase() || 'U';
  const currentPhotoURL = userProfile?.photoURL || authUser.photoURL;
  const isStudentRole = userProfile.role === 'student' || userProfile.role === 'test';
  const isOrganizerRole = !isStudentRole;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header className="text-left">
        <h1 className="text-3xl font-bold text-primary">My Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your account details and preferences.</p>
      </header>

      <Card className="shadow-xl">
        <CardHeader className="flex flex-col items-center text-center border-b pb-6 bg-muted/20">
          <Avatar className="h-24 w-24 mb-4 border-2 border-primary shadow-md">
            <AvatarImage src={currentPhotoURL || undefined} alt={currentDisplayName || displayEmail || 'User'} />
            <AvatarFallback className="text-3xl">{avatarFallback}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl">{currentDisplayName || 'User Profile'}</CardTitle>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-1">
            {displayEmail && <p className="text-sm text-muted-foreground flex items-center gap-1.5"><Mail className="h-4 w-4"/>{displayEmail}</p>}
            {userProfile.shortId && isStudentRole && <p className="text-sm text-muted-foreground flex items-center gap-1.5"><Shield className="h-4 w-4"/>ID: {userProfile.shortId}</p>}
            {userProfile.collegeRollNumber && isOrganizerRole && <p className="text-sm text-muted-foreground flex items-center gap-1.5"><Shield className="h-4 w-4"/>Roll No: {userProfile.collegeRollNumber}</p>}
          </div>
           {userProfile.role && (
            <Badge variant="secondary" className="mt-2 capitalize text-sm py-1 px-3">
                <Shield className="mr-2 h-4 w-4" /> Role: {userProfile.role.replace(/_/g, ' ')}
            </Badge>
           )}
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
            {isOrganizerRole && (
                <div className="space-y-1 text-center">
                    <Label>Credibility Score</Label>
                    <p className="text-4xl font-bold text-accent flex items-center justify-center gap-2"><Award className="h-8 w-8"/> {userProfile.credibilityScore || 0}</p>
                </div>
            )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="space-y-1">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" value={userProfile.fullName || 'N/A'} disabled />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" value={displayEmail || 'N/A'} disabled />
            </div>
            
            {isOrganizerRole && (
                 <div className="space-y-1">
                    <Label htmlFor="collegeRollNumber">College Roll Number</Label>
                    <Input id="collegeRollNumber" value={userProfile.collegeRollNumber || 'N/A'} disabled />
                 </div>
            )}
            {isOrganizerRole && (
                 <div className="space-y-1">
                    <Label htmlFor="department">Department</Label>
                    {isEditing ? (
                        <Input id="department" value={editableProfile?.department || ''} onChange={(e) => handleInputChange('department', e.target.value)} placeholder="e.g., Computer Science" />
                    ) : (
                        <p className="text-base p-2 min-h-[40px] bg-muted/50 rounded-md">{userProfile.department || 'Not Set'}</p>
                    )}
                 </div>
            )}

            {isStudentRole && (
            <>
             <div className="space-y-1">
              <Label htmlFor="schoolName">School Name</Label>
              {isEditing ? (
                 <Input id="schoolName" value={editableProfile?.schoolName || ''} onChange={(e) => handleInputChange('schoolName', e.target.value)} placeholder="Your School Name" />
              ) : (
                <div className="flex items-center gap-2 p-2 min-h-[40px] bg-muted/50 rounded-md">
                    <p className="text-base">{userProfile.schoolName || 'Not Set'}</p>
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
                    <p className="text-base p-2 min-h-[40px] bg-muted/50 rounded-md">{userProfile.standard ? `Grade ${userProfile.standard}` : 'Not Set'}</p>
                )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="division">Division</Label>
              {isEditing ? (
                <Input id="division" value={editableProfile?.division || ''} onChange={(e) => handleInputChange('division', e.target.value)} placeholder="e.g., A" />
              ) : (
                <p className="text-base p-2 min-h-[40px] bg-muted/50 rounded-md">{userProfile.division || 'Not Set'}</p>
              )}
            </div>
            </>
            )}

            <div className="space-y-1">
              <Label htmlFor="phoneNumber">Primary Phone Number</Label>
              {isEditing ? (
                <Input id="phoneNumber" type="tel" value={editableProfile?.phoneNumbers?.[0] || ''} onChange={(e) => handlePhoneNumberChange(0, e.target.value)} placeholder="+91 12345 67890" />
              ) : (
                <p className="text-base p-2 min-h-[40px] bg-muted/50 rounded-md">{userProfile.phoneNumbers?.[0] || 'Not Set'}</p>
              )}
            </div>
             <div className="space-y-1 md:col-span-2">
              <Label htmlFor="additionalNumber">Additional Phone Number (Optional)</Label>
              {isEditing ? (
                <Input id="additionalNumber" type="tel" value={editableProfile?.additionalNumber || ''} onChange={(e) => handleInputChange('additionalNumber', e.target.value)} placeholder="Secondary contact number" />
              ) : (
                <p className="text-base p-2 min-h-[40px] bg-muted/50 rounded-md">{userProfile.additionalNumber || 'Not Set'}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-4 border-t">
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
    </div>
  );
}
