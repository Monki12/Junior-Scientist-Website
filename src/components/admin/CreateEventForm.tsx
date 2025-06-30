
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

interface CreateEventFormProps {
  onSuccess?: () => void;
}

export default function CreateEventForm({ onSuccess }: CreateEventFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateEventFormData>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: '',
      shortDescription: '',
    },
  });

  const { handleSubmit, register, formState: { errors }, control, watch, setValue } = form;

  const onSubmit = async (data: CreateEventFormData) => {
    setIsSubmitting(true);
    try {
      const slug = data.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

      const newEventData = {
        title: data.title,
        slug: slug,
        superpowerCategory: data.superpowerCategory,
        shortDescription: data.shortDescription || `A new event in the ${data.superpowerCategory} category.`,
        detailedDescription: '<p>Welcome to the event! Use the edit page to add a full description, rules, and schedule.</p>',
        mainImage: {
          src: 'https://placehold.co/600x400.png',
          alt: 'Default event banner',
          dataAiHint: 'event banner',
        },
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
        isFeatured: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'subEvents'), newEventData);

      toast({
        title: "Event Created Successfully!",
        description: `The event "${data.title}" has been added. You can now manage it from the edit page.`,
      });

      form.reset();
      onSuccess?.();

    } catch (error: any) {
      console.error("Error creating event:", error);
      toast({
        title: "Event Creation Failed",
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
        
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isSubmitting ? 'Creating Event...' : 'Create Event'}
        </Button>
      </form>
    </div>
  );
}
