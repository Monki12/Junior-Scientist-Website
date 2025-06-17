
import type { User as FirebaseUser } from 'firebase/auth';

// Defines the possible roles a user can have in the application
export type UserRole = 
  | 'student' 
  | 'organizer' 
  | 'event_representative' 
  | 'overall_head' 
  | 'admin' 
  | 'test';

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedToName?: string; // Name of the user it's assigned to (for display)
  assignedToUid?: string;   // UID of the user it's assigned to
  assignedByName?: string; // Name of the user who assigned it (for display)
  assignedByUid?: string;   // UID of the user who assigned it
  eventSlug?: string;       // Optional, if task is event-specific
  deadline?: string;        // ISO date string
  points?: number;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  createdAt: string;         // ISO date string
  updatedAt: string;         // ISO date string
}

// Interface for custom user profile data stored in Firestore
export interface UserProfileData {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  photoURL?: string | null; 
  school?: string; 
  grade?: string; 
  registeredEvents?: Array<{
    eventSlug: string;
    teamName?: string; 
  }>;
  department?: string; // e.g., "Marketing", "Logistics"
  assignedEventSlug?: string; // For event_representative: the slug of the event they manage
  assignedEventSlugs?: string[]; // For organizers: slugs of events they are part of
  tasks?: Task[]; // Tasks assigned to this user
  points?: number; // Gamification points
  credibilityScore?: number; // Calculated score
}

// This Event interface seems to be for a generic event, not the sub-events.
// It's kept for now if used elsewhere.
export interface Event {
  id: string;
  title: string;
  description: string;
  date: string; 
  time?: string;
  location: string;
  organizerId: string;
  imageUrl?: string;
  capacity?: number;
  category?: string;
  dataAiHint?: string;
}

// Interface for the Junior Scientist Sub-Events
export interface SubEvent {
  id: string;
  slug: string;
  title: string;
  superpowerCategory: string; 
  shortDescription: string; 
  detailedDescription: string; 
  mainImage: { src: string; alt: string; dataAiHint: string };
  galleryImages?: Array<{ src: string; alt: string; dataAiHint: string }>;
  registrationLink: string;
  deadline?: string; 
  isTeamEvent?: boolean; 
}

export interface SignUpFormData {
  name?: string; 
  email: string;
  password: string;
  confirmPassword?: string; 
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface StudentData {
  name: string;
  school: string;
  grade: string;
  contactNumber: string;
  email: string;
}
