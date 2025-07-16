
'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { db } from '@/lib/firebase'; // Keep 'db' for Firestore operations
import { initializeApp, deleteApp } from 'firebase/app'; // Import app management functions
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'; // Import auth functions
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs, updateDoc, arrayUnion } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { organizerSignupSchema, type OrganizerSignupFormData } from '@/schemas/organizerSignupSchema';

// Reconstruct Firebase config to initialize a temporary app instance.
// This is necessary to create a user without signing out the current admin.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};


interface CreateOrganizerFormProps {
  currentAdminRole: 'overall_head' | 'admin';
  onSuccess?: () => void;
}

export default function CreateOrganizerForm({ currentAdminRole, onSuccess }: CreateOrganizerFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<OrganizerSignupFormData>({
    resolver: zodResolver(organizerSignupSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      department: '',
      phoneNumber: '',
      collegeRollNumber: '',
      role: 'organizer',
      photoURL: '',
      additionalNumber: '',
    },
  });

  const { handleSubmit, register, formState: { errors }, control, watch, setError } = form;
  const selectedRole = watch('role');
  
  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const onSubmit = async (data: OrganizerSignupFormData) => {
    setIsSubmitting(true);

    const tempAppName = `auth-worker-${Date.now()}`;
    const tempApp = initializeApp(firebaseConfig, tempAppName);
    const tempAuth = getAuth(tempApp);

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('collegeRollNumber', '==', data.collegeRollNumber));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setError('collegeRollNumber', { type: 'manual', message: 'This College Roll Number is already registered.' });
        toast({ title: "Registration Failed", description: "The College Roll Number provided is already in use.", variant: "destructive" });
        setIsSubmitting(false);
        await deleteApp(tempApp); 
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(tempAuth, data.email, data.password);
      const newUserUid = userCredential.user.uid;

      const userProfileData = {
        uid: newUserUid,
        fullName: data.fullName,
        displayName: data.fullName,
        email: data.email,
        role: data.role,
        department: data.department,
        phoneNumbers: [data.phoneNumber],
        collegeRollNumber: data.collegeRollNumber,
        shortId: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        photoURL: data.photoURL || null,
        additionalNumber: data.additionalNumber || null,
        assignedEventUids: [],
        boardIds: [],
        points: 0,
      };

      await setDoc(doc(db, 'users', newUserUid), userProfileData);

      // Automatically add the new staff member to the "general" board
      const generalBoardQuery = query(collection(db, 'boards'), where('name', '==', 'general'));
      const generalBoardSnapshot = await getDocs(generalBoardQuery);
      if (!generalBoardSnapshot.empty) {
        const generalBoardDoc = generalBoardSnapshot.docs[0];
        await updateDoc(generalBoardDoc.ref, {
          memberUids: arrayUnion(newUserUid)
        });
      } else {
        console.warn("Could not find a 'general' board to add the new user to.");
      }


      toast({
        title: "Success",
        description: `${data.role} account created successfully!`,
        variant: "default",
      });

      form.reset();
      onSuccess?.();

    } catch (error: any) {
      let errorMessage = "Failed to create account. Please try again.";
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = "The email address is already in use by another account.";
            setError('email', { type: 'manual', message: errorMessage });
            break;
          case 'auth/invalid-email':
            errorMessage = "The email address is invalid.";
            setError('email', { type: 'manual', message: errorMessage });
            break;
          case 'auth/weak-password':
            errorMessage = "The password is too weak. " + error.message;
            setError('password', { type: 'manual', message: errorMessage });
            break;
          default:
            errorMessage = `Firebase Error: ${error.message}`;
        }
      } else {
        errorMessage = `General Error: ${error.message}`;
      }
      toast({
        title: "Account Creation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      await deleteApp(tempApp);
    }
  };

  const allowedRoles =
    currentAdminRole === 'admin'
      ? ['organizer', 'event_representative', 'overall_head', 'admin']
      : ['organizer', 'event_representative', 'overall_head'];

  return (
    <div className="p-1">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="fullName">Full Name</Label>
          <Input id="fullName" {...register('fullName')} disabled={isSubmitting} />
          {errors.fullName && <p className="text-destructive text-sm mt-1">{errors.fullName.message}</p>}
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register('email')} disabled={isSubmitting} />
          {errors.email && <p className="text-destructive text-sm mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <Label htmlFor="password">Password (min 8 chars, A-Z, a-z, 0-9, special)</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
              disabled={isSubmitting}
              className="pr-10"
            />
            <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground" onClick={togglePasswordVisibility} tabIndex={-1}>
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          {errors.password && <p className="text-destructive text-sm mt-1">{errors.password.message}</p>}
        </div>
        <div>
          <Label htmlFor="department">Department</Label>
          <Input id="department" {...register('department')} disabled={isSubmitting} />
          {errors.department && <p className="text-destructive text-sm mt-1">{errors.department.message}</p>}
        </div>
        <div>
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <Input id="phoneNumber" type="tel" {...register('phoneNumber')} disabled={isSubmitting} />
          {errors.phoneNumber && <p className="text-destructive text-sm mt-1">{errors.phoneNumber.message}</p>}
        </div>
        <div>
          <Label htmlFor="collegeRollNumber">College Roll Number (e.g., BT23CSE012)</Label>
          <Input id="collegeRollNumber" {...register('collegeRollNumber')} disabled={isSubmitting} />
          {errors.collegeRollNumber && <p className="text-destructive text-sm mt-1">{errors.collegeRollNumber.message}</p>}
        </div>
        <div>
          <Label htmlFor="role">Assign Role</Label>
          <Select onValueChange={(value) => form.setValue('role', value as any)} defaultValue={selectedRole} disabled={isSubmitting}>
            <SelectTrigger id="role">
              <SelectValue placeholder="Select Role" />
            </SelectTrigger>
            <SelectContent>
              {allowedRoles.map(roleOption => (
                <SelectItem key={roleOption} value={roleOption}>
                  {roleOption.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.role && <p className="text-destructive text-sm mt-1">{errors.role.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isSubmitting ? 'Creating Account...' : 'Create Account'}
        </Button>
      </form>
    </div>
  );
}
