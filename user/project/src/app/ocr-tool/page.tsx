
'use client';

import { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { processRegistrationForm } from '@/actions/ocr';
import type { StudentData } from '@/types';
import { Loader2, UploadCloud, FileText, User, School, BookOpen, Phone, Mail, AlertTriangle, ShieldAlert } from 'lucide-react';
import Image from 'next/image';

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const ALLOWED_OCR_ROLES = ['organizer', 'overall_head', 'admin', 'test']; // 'test' role can also use OCR for testing

export default function OcrToolPage() {
  const { authUser, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<StudentData[] | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading) {
      if (!authUser) {
        router.push('/login?redirect=/ocr-tool');
      } else if (userProfile && !ALLOWED_OCR_ROLES.includes(userProfile.role)) {
        // If user is logged in but not an authorized role, redirect or show an error
        // For now, redirecting to dashboard. Could show an "Access Denied" message too.
        toast({
          title: "Access Denied",
          description: "You do not have permission to access the OCR tool.",
          variant: "destructive",
        });
        router.push('/dashboard');
      }
    }
  }, [authUser, userProfile, authLoading, router, toast]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File Too Large",
          description: "Please upload a file smaller than 5MB.",
          variant: "destructive",
        });
        setFile(null);
        setFilePreview(null);
        return;
      }
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a JPG, PNG, or PDF file.",
          variant: "destructive",
        });
        setFile(null);
        setFilePreview(null);
        return;
      }
      setFile(selectedFile);
      setExtractedData(null); // Clear previous results

      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setFile(null);
      setFilePreview(null);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!file) {
      toast({
        title: 'No File Selected',
        description: 'Please select a registration form to scan.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setExtractedData(null);

    try {
      const formDataUri = await fileToDataUri(file);
      const result = await processRegistrationForm(formDataUri);

      if (result.success && result.data) {
        setExtractedData(result.data);
        // Non-error toast, so omitted as per guidelines.
      } else {
        toast({
          title: 'OCR Processing Failed',
          description: result.error || 'Could not extract data from the form.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (authLoading || !authUser || !userProfile) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Additional check in case useEffect redirect is slow or fails
  if (!ALLOWED_OCR_ROLES.includes(userProfile.role)) {
    return (
       <div className="flex flex-col min-h-[calc(100vh-10rem)] items-center justify-center text-center p-4">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-4">
          You do not have the necessary permissions to view this page.
        </p>
        <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
      </div>
    );
  }


  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-fade-in-up">
      <header className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-primary">Registration Form Scanner (OCR)</h1>
        <p className="text-muted-foreground mt-2">
          Upload a scanned registration form (image or PDF) to automatically extract student data.
        </p>
      </header>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>Upload Form</CardTitle>
          <CardDescription>Select a file (JPG, PNG, or PDF, max 5MB).</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="formFile" className="block text-sm font-medium text-foreground mb-2">
                Registration Form File
              </Label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md hover:border-primary transition-colors">
                <div className="space-y-1 text-center">
                  {filePreview && file?.type.startsWith('image/') ? (
                     <Image src={filePreview} alt="File preview" width={200} height={200} className="mx-auto h-32 w-auto object-contain rounded-md" />
                  ) : filePreview && file?.type === 'application/pdf' ? (
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  ) : (
                    <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                  )}
                  <div className="flex text-sm text-muted-foreground">
                    <Label
                      htmlFor="formFile"
                      className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary"
                    >
                      <span>Upload a file</span>
                      <Input id="formFile" name="formFile" type="file" className="sr-only" onChange={handleFileChange} accept=".jpg,.jpeg,.png,.pdf" />
                    </Label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{file ? file.name : 'PNG, JPG, PDF up to 5MB'}</p>
                </div>
              </div>
            </div>
            
            {file && (
                 <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  'Scan Form'
                )}
              </Button>
            )}
          </CardContent>
        </form>
      </Card>

      {extractedData && extractedData.length > 0 && (
        <Card className="shadow-xl animate-fade-in">
          <CardHeader>
            <CardTitle>Extracted Student Data</CardTitle>
            <CardDescription>Review the data extracted from the form. You can then copy or use this data as needed.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {extractedData.map((student, index) => (
              <Card key={index} className="bg-secondary/30 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-primary mb-2 flex items-center"><User className="mr-2 h-5 w-5"/>Student #{index + 1}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <p className="flex items-center"><User className="mr-2 h-4 w-4 text-muted-foreground" /><strong>Name:</strong> {student.name}</p>
                  <p className="flex items-center"><School className="mr-2 h-4 w-4 text-muted-foreground" /><strong>School:</strong> {student.school}</p>
                  <p className="flex items-center"><BookOpen className="mr-2 h-4 w-4 text-muted-foreground" /><strong>Grade:</strong> {student.grade}</p>
                  <p className="flex items-center"><Phone className="mr-2 h-4 w-4 text-muted-foreground" /><strong>Contact:</strong> {student.contactNumber}</p>
                  <p className="flex items-center col-span-1 md:col-span-2"><Mail className="mr-2 h-4 w-4 text-muted-foreground" /><strong>Email:</strong> {student.email}</p>
                </div>
              </Card>
            ))}
          </CardContent>
           <CardFooter>
            <Button variant="outline" onClick={() => navigator.clipboard.writeText(JSON.stringify(extractedData, null, 2))}>
              Copy JSON Data
            </Button>
          </CardFooter>
        </Card>
      )}
      {extractedData && extractedData.length === 0 && !isLoading &&(
         <Card className="shadow-xl animate-fade-in">
          <CardHeader className="items-center text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mb-2" />
            <CardTitle>No Data Extracted</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">The AI could not find any student data in the uploaded form, or the form might be empty/unclear.</p>
            <p className="text-muted-foreground mt-1">Please try with a different form or ensure the image quality is good.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
