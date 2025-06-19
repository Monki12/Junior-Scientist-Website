
'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth'; // To potentially update context after login if needed, but not for signup op itself
import { useToast } from '@/hooks/use-toast';
import type { SignUpFormData, UserProfileData } from '@/types';
import { UserPlus, Loader2, LogIn, School as SchoolIconLucide } from 'lucide-react';

import { auth, db } from '@/lib/firebase'; // Direct Firebase imports
import { createUserWithEmailAndPassword, type AuthError } from 'firebase/auth'; // Direct Firebase Auth import
import { doc, setDoc } from 'firebase/firestore'; // Direct Firestore imports
import { mockSchoolsData } from '@/data/mockSchools';

const gradeLevels = Array.from({ length: 9 }, (_, i) => `${i + 4}`); // Grades 4 through 12

export default function SignUpPage() {
  const router = useRouter();
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
    console.log("--- SIGN UP PROCESS STARTED ---");
    console.log("Attempting sign up with form data:", formData);

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Password Mismatch',
        description: 'Passwords do not match.',
        variant: 'destructive',
      });
      console.log("--- SIGN UP PROCESS ENDED (Password Mismatch) ---");
      return;
    }
    if (!formData.email || !formData.password || !formData.fullName || !formData.schoolName || !formData.standard) {
      toast({
        title: 'Missing Fields',
        description: 'Full Name, Email, Password, School, and Standard are required.',
        variant: 'destructive',
      });
      console.log("--- SIGN UP PROCESS ENDED (Missing Fields) ---");
      return;
    }

    setIsLoading(true);

    try {
        // --- Step 1: Client-Side Grade Validation (Crucial before any Firebase calls) ---
        const numericStandard = parseInt(formData.standard);
        if (isNaN(numericStandard) || numericStandard < 4 || numericStandard > 12) {
            toast({
                title: 'Invalid Grade',
                description: 'Standard must be between Grade 4 and Grade 12.',
                variant: 'destructive',
            });
            setIsLoading(false);
            console.log("--- SIGN UP PROCESS ENDED (Invalid Grade) ---");
            return;
        }

        // --- Step 2: Create user in Firebase Authentication ---
        console.log("Attempting Firebase Auth user creation for:", formData.email);
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;
        const uid = user.uid;
        console.log("Firebase Auth user created:", user.email, "UID:", uid);

        // --- Step 3: Prepare Student Profile Data for Firestore ---
        let schoolId: string | undefined = undefined;
        let schoolVerifiedByOrganizer = false;
        const schoolNameLower = formData.schoolName.toLowerCase();
        const matchedSchool = mockSchoolsData.find(s => s.name.toLowerCase() === schoolNameLower);

        if (matchedSchool) {
          schoolId = matchedSchool.id;
          schoolVerifiedByOrganizer = true;
        }

        const studentProfileData: UserProfileData = {
            uid: uid,
            email: user.email, // Use email from authenticated user
            fullName: formData.fullName,
            displayName: formData.fullName, // Set displayName initially to fullName
            schoolName: formData.schoolName,
            schoolId: schoolId,
            schoolVerifiedByOrganizer: schoolVerifiedByOrganizer,
            standard: formData.standard,
            division: formData.division || undefined,
            role: 'student',
            photoURL: user.photoURL, // Store photoURL from Auth if available
            registeredEvents: [],
            tasks: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        // --- Step 4: Save Student Profile to Cloud Firestore ---
        console.log("Attempting to save profile to Firestore for UID:", uid);
        console.log("Data to be saved:", studentProfileData);

        const userDocRef = doc(db, 'users', uid);
        await setDoc(userDocRef, studentProfileData);

        console.log("Firestore document for UID", uid, "created successfully!");
        console.log("Response from setDoc (implicitly void for success, but promise resolved): Promise fulfilled.");

        // --- Success: Both Auth & Firestore operations completed ---
        toast({
            title: 'Account created successfully!',
            description: 'Please sign in to continue.',
        });

        router.push('/login'); // Redirect to login page

    } catch (error: any) {
        console.error("--- SIGN UP PROCESS ERROR ---");
        console.error("Error type:", error.name);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        console.error("Full error object:", error);

        let errorMessage = 'An unexpected error occurred during registration.';
        let errorTitle = 'Sign Up Failed';

        if (error.code) { // Firebase errors usually have a code
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorTitle = 'Email Already Exists';
                    errorMessage = 'This email address is already registered. Please try logging in or use a different email.';
                    break;
                case 'auth/invalid-email':
                    errorTitle = 'Invalid Email';
                    errorMessage = 'The email address is not valid.';
                    break;
                case 'auth/weak-password':
                    errorTitle = 'Weak Password';
                    errorMessage = 'The password is too weak (minimum 6 characters).';
                    break;
                // Firestore specific errors
                case 'permission-denied':
                    errorTitle = 'Permission Error';
                    errorMessage = 'Failed to save profile data due to security rules. Please check Firestore rules in console.';
                    console.error("DEBUG: Firebase Security Rules likely denied the Firestore write!");
                    break;
                default:
                    errorMessage = error.message || 'An unknown error occurred.';
            }
        } else if (error.message) { // Fallback for other error types
            errorMessage = error.message;
        }
        
        toast({
          title: errorTitle,
          description: errorMessage,
          variant: 'destructive',
        });
    } finally {
      setIsLoading(false);
      console.log("--- SIGN UP PROCESS ENDED ---");
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center animate-fade-in-up py-12">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <UserPlus className="mx-auto h-12 w-12 text-primary mb-4" />
          <CardTitle className="text-3xl font-headline text-primary">Create Your Student Account</CardTitle>
          <CardDescription>
            Join EventFlow to explore and participate in exciting events.
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
                <Input id="password" type="password" placeholder="•••••••• (min. 6 characters)" value={formData.password} onChange={handleChange} required disabled={isLoading} />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password <span className="text-destructive">*</span></Label>
                <Input id="confirmPassword" type="password" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} required disabled={isLoading} />
              </div>
            </div>
            <div>
              <Label htmlFor="schoolName">School Name <span className="text-destructive">*</span></Label>
              <div className="relative">
                <SchoolIconLucide className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                <Label htmlFor="standard">Standard (Grade 4-12) <span className="text-destructive">*</span></Label>
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
                      <SelectItem key={grade} value={grade}>{`Grade ${grade}`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="division">Division (Optional)</Label>
                <Input id="division" type="text" placeholder="e.g., A, B, Blue" value={formData.division || ''} onChange={handleChange} disabled={isLoading} />
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
              <LogIn className="mr-2 h-4 w-4" /> Log In Now
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
    
