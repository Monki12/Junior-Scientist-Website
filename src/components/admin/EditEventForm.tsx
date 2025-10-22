
'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { SubEvent, UserProfileData } from '@/types';
import { db, storage } from '@/lib/firebase';
import { doc, updateDoc, deleteDoc, collection, getDocs, query, where, arrayUnion } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { format, parseISO, isValid } from 'date-fns';
import Image from 'next/image';
import dynamic from 'next/dynamic';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Loader2, Save, Trash2, CalendarIcon, ChevronDown, Trash, CheckCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const ReactQuill = dynamic(() => import('@/components/admin/QuillEditorWrapper'), { 
  ssr: false,
  loading: () => (
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-32 w-full rounded-md" />
    </div>
  ),
});

const eventImageMap: Record<string, { src: string; alt: string; dataAiHint: string }> = {
    'catapultikon': { src: '/images/catalogopng.jpg', alt: 'Catapultikon Banner', dataAiHint: 'event catapult' },
    'exquizit': { src: '/images/EXQUIZITLogo.png', alt: 'Exquizit Banner', dataAiHint: 'event quiz' },
    'jso': { src: '/images/jso.jpg', alt: 'JSO Banner', dataAiHint: 'event science' },
    'modelothon': { src: '/images/jsologo.jpg', alt: 'Modelothon Banner', dataAiHint: 'event model' },
    'mathamaze': { src: '/images/mathamazelogo.jpg', alt: 'Mathamaze Banner', dataAiHint: 'event math' },
    'mun': { src: '/images/munlogo.jpg', alt: 'MUN Banner', dataAiHint: 'event debate' },
    'arduino': { src: '/images/new event logo blac....png', alt: 'Arduino Event Banner', dataAiHint: 'event circuit' },
    'default': { src: '/images/jsologo.jpg', alt: 'Junior Scientist Event Banner', dataAiHint: 'event banner' },
};

interface EditEventFormProps {
  event: SubEvent;
}

export function EditEventForm({ event }: EditEventFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [formData, setFormData] = useState<any>({
    ...event,
    deadline: event.deadline && isValid(parseISO(event.deadline)) ? parseISO(event.deadline) : null,
    eventDate: event.eventDate && isValid(parseISO(event.eventDate)) ? parseISO(event.eventDate) : null,
    organizerUids: event.organizerUids || [],
    eventReps: event.eventReps || [],
    galleryImages: event.galleryImages || [],
    registrationFee: event.registrationFee || 0,
  });
  const [allStaff, setAllStaff] = useState<UserProfileData[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(event.mainImage.src);
  const [galleryImageFiles, setGalleryImageFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);


  useEffect(() => {
    const fetchStaff = async () => {
      const staffRoles = ['organizer', 'event_representative', 'overall_head', 'admin'];
      const q = query(collection(db, 'users'), where('role', 'in', staffRoles));
      const querySnapshot = await getDocs(q);
      const staffList = querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfileData));
      setAllStaff(staffList);
    };
    fetchStaff();
  }, []);

  const handleInputChange = (field: keyof SubEvent, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };
  
  const handleMainImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMainImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setMainImagePreview(previewUrl);
      setFormData((prev: any) => ({ ...prev, mainImage: { ...prev.mainImage, src: previewUrl } }));
    }
  };

  const handleGalleryFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setGalleryImageFiles(prev => [...prev, ...files]);
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setGalleryPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeGalleryPreview = (index: number) => {
    setGalleryImageFiles(files => files.filter((_, i) => i !== index));
    setGalleryPreviews(previews => previews.filter((_, i) => i !== index));
  };
  
  const handleSelectDefaultImage = (imageKey: string) => {
    const selectedImage = eventImageMap[imageKey];
    if (selectedImage) {
        setMainImageFile(null); // Clear any uploaded file
        setMainImagePreview(selectedImage.src);
        setFormData((prev: any) => ({ ...prev, mainImage: selectedImage }));
    }
  };


  const syncBoardMembers = async (boardId: string, assignedUids: string[]) => {
    try {
      const boardRef = doc(db, 'boards', boardId);
      // Using a loop with arrayUnion is safer than overwriting the whole array
      // if multiple updates could happen, but here we can just set it.
      // However, to be more robust, we'll merge the assigned UIDs with existing ones.
      const boardSnap = await getDocs(query(collection(db, 'boards'), where('eventId', '==', event.id)));
      if(boardSnap.empty) return; // No board to update
      
      const boardDocRef = boardSnap.docs[0].ref;
      await updateDoc(boardDocRef, {
        memberUids: arrayUnion(...assignedUids)
      });

    } catch(error) {
       console.error("Error syncing board members:", error);
       toast({
         title: "Board Sync Warning",
         description: "Could not automatically add new members to the task board.",
         variant: "destructive"
       });
    }
  };


  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    
    const slug = formData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    let mainImageUrl = formData.mainImage.src;
    let mainImageDataAiHint = formData.mainImage.dataAiHint || 'event banner';

    try {
        if (mainImageFile) {
            const imageRef = ref(storage, `event_images/${slug}/${mainImageFile.name}`);
            await uploadBytes(imageRef, mainImageFile);
            mainImageUrl = await getDownloadURL(imageRef);
        }
        
        const uploadedGalleryUrls: SubEvent['galleryImages'] = [...formData.galleryImages];
        for (const file of galleryImageFiles) {
            const galleryImageRef = ref(storage, `event_images/${slug}/gallery/${file.name}_${Date.now()}`);
            await uploadBytes(galleryImageRef, galleryImageRef);
            const url = await getDownloadURL(galleryImageRef);
            uploadedGalleryUrls.push({ src: url, alt: file.name, dataAiHint: 'event gallery' });
        }

        const dataToSave = {
            ...formData,
            deadline: formData.deadline ? formData.deadline.toISOString() : null,
            eventDate: formData.eventDate ? formData.eventDate.toISOString() : null,
            slug: slug,
            mainImage: { ...formData.mainImage, src: mainImageUrl, dataAiHint: mainImageDataAiHint },
            galleryImages: uploadedGalleryUrls,
            registrationFee: Number(formData.registrationFee) || 0,
        };

        const eventRef = doc(db, 'subEvents', event.id);
        await updateDoc(eventRef, dataToSave);
        
        // Sync members to the event's board
        const allAssignedUids = [...new Set([...dataToSave.organizerUids, ...dataToSave.eventReps])];
        await syncBoardMembers(event.id, allAssignedUids);


        toast({ title: "Event Updated", description: "Changes have been saved successfully." });
        router.push(`/events/manage/${dataToSave.slug}`);
    } catch (error: any) {
      console.error("Error updating event:", error);
      toast({ title: "Update Failed", description: error.message || "Could not save changes.", variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setIsUpdating(true);
    try {
      await deleteDoc(doc(db, 'subEvents', event.id));
      toast({ title: "Event Deleted", description: `"${event.title}" has been permanently deleted.` });
      router.push('/dashboard');
    } catch (error: any) {
      console.error("Error deleting event:", error);
      toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
      setIsUpdating(false);
    }
  };

  return (
    <>
      <form onSubmit={handleUpdate}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Core Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Event Title</Label>
              <Input id="title" value={formData.title} onChange={e => handleInputChange('title', e.target.value)} required />
            </div>
             <div>
                <Label htmlFor="superpowerCategory">Superpower Category</Label>
                <Select value={formData.superpowerCategory} onValueChange={val => handleInputChange('superpowerCategory', val)}>
                    <SelectTrigger id="superpowerCategory"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="The Thinker">The Thinker</SelectItem>
                        <SelectItem value="The Brainiac">The Brainiac</SelectItem>
                        <SelectItem value="The Strategist">The Strategist</SelectItem>
                        <SelectItem value="The Innovator">The Innovator</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div>
              <Label htmlFor="shortDescription">Short Description</Label>
              <Textarea id="shortDescription" value={formData.shortDescription} onChange={e => handleInputChange('shortDescription', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="detailedDescription">Detailed Description</Label>
              <ReactQuill theme="snow" value={formData.detailedDescription} onChange={value => handleInputChange('detailedDescription', value)} />
            </div>
            <div>
              <Label htmlFor="venue">Venue</Label>
              <Input id="venue" value={formData.venue} onChange={e => handleInputChange('venue', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="registrationFee">Registration Fee (₹)</Label>
              <Input id="registrationFee" type="number" value={formData.registrationFee} onChange={e => handleInputChange('registrationFee', e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="eventDate">Event Date</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button id="eventDate" variant="outline" className={`w-full justify-start text-left font-normal ${!formData.eventDate && "text-muted-foreground"}`}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.eventDate ? format(formData.eventDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={formData.eventDate} onSelect={date => handleInputChange('eventDate', date)} initialFocus />
                        </PopoverContent>
                    </Popover>
                </div>
                <div>
                    <Label htmlFor="deadline">Registration Deadline</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button id="deadline" variant="outline" className={`w-full justify-start text-left font-normal ${!formData.deadline && "text-muted-foreground"}`}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.deadline ? format(formData.deadline, "PPP") : <span>Pick a date</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                         <Calendar mode="single" selected={formData.deadline} onSelect={date => handleInputChange('deadline', date)} initialFocus />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg mt-6">
          <CardHeader><CardTitle>Media</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div>
                <Label>Main Event Image</Label>
                {mainImagePreview && (
                    <div className="mt-2 mb-4 relative w-full h-48 rounded-md overflow-hidden border-2 border-primary">
                        <Image src={mainImagePreview} alt="Event image preview" fill style={{ objectFit: 'cover' }} />
                    </div>
                )}
                 <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Select a default banner or upload a new one.</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        {Object.entries(eventImageMap).map(([key, image]) => (
                            <button
                                type="button"
                                key={key}
                                onClick={() => handleSelectDefaultImage(key)}
                                className={cn(
                                    "relative aspect-video rounded-md overflow-hidden border-2 transition-all",
                                    formData.mainImage.src === image.src && !mainImageFile ? 'border-primary ring-2 ring-primary' : 'border-transparent hover:border-primary/50'
                                )}
                            >
                                <Image src={image.src} alt={image.alt} fill style={{objectFit: 'cover'}} />
                                {formData.mainImage.src === image.src && !mainImageFile && (
                                    <div className="absolute inset-0 bg-primary/70 flex items-center justify-center">
                                        <CheckCircle className="h-6 w-6 text-primary-foreground" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                 </div>

                <div className="mt-4">
                    <Label htmlFor="mainImageFile">Upload Custom Image</Label>
                    <Input id="mainImageFile" type="file" accept="image/*" onChange={handleMainImageFileChange} />
                </div>
            </div>

            <div>
                <Label htmlFor="galleryImageFiles">Gallery Images (optional)</Label>
                <Input id="galleryImageFiles" type="file" accept="image/*" multiple onChange={handleGalleryFilesChange} />
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {/* Existing gallery images */}
                    {formData.galleryImages.map((image: {src: string, alt: string}, index: number) => (
                        <div key={index} className="relative group">
                            <Image src={image.src} alt={image.alt} width={100} height={100} className="w-full h-24 object-cover rounded-md" />
                            <Button type="button" size="icon" variant="destructive" className="absolute top-1 right-1 h-6 w-6 opacity-70 group-hover:opacity-100" onClick={() => handleInputChange('galleryImages', formData.galleryImages.filter((_: any, i: number) => i !== index))}>
                                <Trash className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    {/* New gallery image previews */}
                    {galleryPreviews.map((src, index) => (
                        <div key={index} className="relative group">
                            <Image src={src} alt={`Gallery preview ${index + 1}`} width={100} height={100} className="w-full h-24 object-cover rounded-md" />
                            <Button type="button" size="icon" variant="destructive" className="absolute top-1 right-1 h-6 w-6 opacity-70 group-hover:opacity-100" onClick={() => removeGalleryPreview(index)}>
                                <Trash className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg mt-6">
          <CardHeader>
            <CardTitle>Structure & Role Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className='flex items-center space-x-2'>
                <Checkbox id="isTeamBased" checked={formData.isTeamBased} onCheckedChange={checked => handleInputChange('isTeamBased', !!checked)} />
                <Label htmlFor='isTeamBased' className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">This is a team-based event</Label>
            </div>
            {formData.isTeamBased && (
                <div className='grid grid-cols-2 gap-4 pl-6'>
                    <div>
                        <Label htmlFor="minTeamMembers">Min Team Size</Label>
                        <Input id="minTeamMembers" type="number" value={formData.minTeamMembers} onChange={e => handleInputChange('minTeamMembers', Number(e.target.value))} />
                    </div>
                    <div>
                        <Label htmlFor="maxTeamMembers">Max Team Size</Label>
                        <Input id="maxTeamMembers" type="number" value={formData.maxTeamMembers} onChange={e => handleInputChange('maxTeamMembers', Number(e.target.value))} />
                    </div>
                </div>
            )}
             <div>
                <Label>Assign Organizers</Label>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                            {formData.organizerUids.length > 0 ? `${formData.organizerUids.length} organizers selected` : "Select Organizers"}
                            <ChevronDown className="ml-2 h-4 w-4 opacity-50"/>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-full">
                        {allStaff.map(user => (
                        <DropdownMenuCheckboxItem key={user.uid} checked={formData.organizerUids.includes(user.uid)} onCheckedChange={checked => {
                            const newUids = checked ? [...formData.organizerUids, user.uid] : formData.organizerUids.filter((uid:string) => uid !== user.uid);
                            handleInputChange('organizerUids', newUids);
                        }}>{user.fullName} ({user.role})</DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
             <div>
                <Label>Assign Event Representatives</Label>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                            {formData.eventReps.length > 0 ? `${formData.eventReps.length} reps selected` : "Select Representatives"}
                            <ChevronDown className="ml-2 h-4 w-4 opacity-50"/>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-full">
                        {allStaff.filter(u => u.role === 'event_representative').map(user => (
                        <DropdownMenuCheckboxItem key={user.uid} checked={formData.eventReps.includes(user.uid)} onCheckedChange={checked => {
                            const newUids = checked ? [...formData.eventReps, user.uid] : formData.eventReps.filter((uid:string) => uid !== user.uid);
                            handleInputChange('eventReps', newUids);
                        }}>{user.fullName}</DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-between items-center">
            <Button type="button" variant="destructive" onClick={() => setIsDeleteDialogOpen(true)} disabled={isUpdating}>
              <Trash2 className="mr-2" /> Delete Event
            </Button>
            <Button type="submit" disabled={isUpdating} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              {isUpdating ? <Loader2 className="mr-2 animate-spin" /> : <Save className="mr-2" />}
              Save Changes
            </Button>
        </div>
      </form>
      
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the event
                &quot;{event.title}&quot; and all associated data, including registrations.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isUpdating} className="bg-destructive hover:bg-destructive/90">
                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Yes, delete event
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
