
'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { createEventSchema, type CreateEventFormData } from '@/schemas/createEventSchema';
import { useAuth } from '@/hooks/use-auth';

interface CreateEventFormProps {
  onSuccess?: () => void;
}

const eventImageMap: Record<string, { src: string; alt: string; dataAiHint: string }> = {
    'catapultikon': { src: '/logos/catalogopng.jpg', alt: 'Catapultikon Banner', dataAiHint: 'event catapult' },
    'exquizit': { src: '/logos/EXQUIZITLogo.png', alt: 'Exquizit Banner', dataAiHint: 'event quiz' },
    'jso': { src: '/logos/jso.jpg', alt: 'JSO Banner', dataAiHint: 'event science' },
    'modelothon': { src: '/logos/jsologo.jpg', alt: 'Modelothon Banner', dataAiHint: 'event model' },
    'mathamaze': { src: '/logos/mathamazelogo.jpg', alt: 'Mathamaze Banner', dataAiHint: 'event math' },
    'mun': { src: '/logos/munlogo.jpg', alt: 'MUN Banner', dataAiHint: 'event debate' },
    'arduino': { src: '/logos/new event logo black ver.png', alt: 'Arduino Event Banner', dataAiHint: 'event circuit' },
    'default': { src: '/logos/jsologo.jpg', alt: 'Junior Scientist Event Banner', dataAiHint: 'event banner' },
};


export default function CreateEventForm({ onSuccess }: CreateEventFormProps) {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateEventFormData>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: '',
      shortDescription: '',
      registrationFee: 0,
    },
  });

  const { handleSubmit, register, formState: { errors }, control, watch, setValue } = form;

  const onSubmit = async (data: CreateEventFormData) => {
    if (!userProfile) {
        toast({ title: "Authentication Error", description: "You must be logged in to create an event.", variant: "destructive"});
        return;
    }

    setIsSubmitting(true);
    try {
      const slug = data.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
      const lowerCaseTitle = data.title.toLowerCase();
      
      let mainImage = eventImageMap['default'];

      for (const key in eventImageMap) {
          if (key !== 'default' && lowerCaseTitle.includes(key)) {
              mainImage = eventImageMap[key];
              break;
          }
      }

      // 1. Create the Event
      const newEventData = {
        title: data.title,
        slug: slug,
        superpowerCategory: data.superpowerCategory,
        shortDescription: data.shortDescription || `A new event in the ${data.superpowerCategory} category.`,
        detailedDescription: '<p>Welcome to the event! Use the edit page to add a full description, rules, and schedule.</p>',
        mainImage: mainImage,
        galleryImages: [],
        deadline: null,
        eventDate: null,
        isTeamBased: false,
        minTeamMembers: 1,
        maxTeamMembers: 1,
        eventReps: [],
        organizerUids: [],
        status: 'Planning' as const,
        venue: 'TBD',
        registeredParticipantCount: 0,
        registrationFee: data.registrationFee || 0,
        isFeatured: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      const eventDocRef = await addDoc(collection(db, 'subEvents'), newEventData);

      // 2. Automatically Create the Corresponding Board
      const newBoardData = {
          name: data.title,
          description: `Task board for the event: ${data.title}`,
          type: 'event' as const,
          eventId: eventDocRef.id,
          memberUids: [userProfile.uid], // Creator is the first member
          managerUids: [userProfile.uid], // Creator is the first manager
          createdAt: serverTimestamp(),
          createdBy: userProfile.uid
      };
      await addDoc(collection(db, 'boards'), newBoardData);

      toast({
        title: "Event Created Successfully!",
        description: `The event and its task board have been created.`,
      });

      form.reset();
      onSuccess?.();

    } catch (error: any) {
      console.error("Error creating event and board:", error);
      toast({
        title: "Creation Failed",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="p-1">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="title">Event Title</Label>
          <Input id="title" {...register('title')} disabled={isSubmitting} placeholder="e.g., Code Crusaders Hackathon" />
          {errors.title && <p className="text-destructive text-sm mt-1">{errors.title.message}</p>}
        </div>

        <div>
            <Label htmlFor="superpowerCategory">Superpower Category</Label>
            <Select onValueChange={(value) => setValue('superpowerCategory', value as any)} disabled={isSubmitting}>
                <SelectTrigger id="superpowerCategory">
                    <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="The Thinker">The Thinker</SelectItem>
                    <SelectItem value="The Brainiac">The Brainiac</SelectItem>
                    <SelectItem value="The Strategist">The Strategist</SelectItem>
                    <SelectItem value="The Innovator">The Innovator</SelectItem>
                </SelectContent>
            </Select>
            {errors.superpowerCategory && <p className="text-destructive text-sm mt-1">{errors.superpowerCategory.message}</p>}
        </div>

        <div>
          <Label htmlFor="shortDescription">Short Description (Optional)</Label>
          <Textarea
            id="shortDescription"
            {...register('shortDescription')}
            disabled={isSubmitting}
            placeholder="A brief, one-sentence summary of the event."
          />
          {errors.shortDescription && <p className="text-destructive text-sm mt-1">{errors.shortDescription.message}</p>}
        </div>

        <div>
          <Label htmlFor="registrationFee">Registration Fee (₹)</Label>
          <Input id="registrationFee" type="number" {...register('registrationFee')} disabled={isSubmitting} placeholder="e.g., 100" />
          {errors.registrationFee && <p className="text-destructive text-sm mt-1">{errors.registrationFee.message}</p>}
        </div>
        
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isSubmitting ? 'Creating Event...' : 'Create Event'}
        </Button>
      </form>
    </div>
  );
}
