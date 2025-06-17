
import type { User as FirebaseUser } from 'firebase/auth';

// Defines the possible roles a user can have in the application
export type UserRole = 
  | 'student' 
  | 'organizer' 
  | 'event_representative' 
  | 'overall_head' 
  | 'admin' 
  | 'test';

// Interface for custom user profile data stored in Firestore
export interface UserProfileData {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  photoURL?: string | null; // Store photoURL for consistency if needed
  academicStandard?: string; // Example: For students
  assignedEvents?: string[]; // Example: For organizers/representatives
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
