
import type { User as FirebaseUser } from 'firebase/auth';

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
  assignedToName?: string;
  assignedToUid?: string;  
  assignedByName?: string;
  assignedByUid?: string;  
  eventSlug?: string;      
  deadline?: string;       
  points?: number;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  createdAt: string;        
  updatedAt: string;        
}

export interface RegisteredEventInfo {
  eventSlug: string;
  teamName?: string;
  teamMembers?: { id: string, name: string, role?: string }[]; // Simplified team members
  admitCardStatus?: 'published' | 'pending' | 'unavailable';
  eventDate?: string; // Added eventDate here
}

export interface UserProfileData {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  photoURL?: string | null; 
  school?: string; 
  grade?: string; 
  phoneNumbers?: string[]; // Added phoneNumbers
  registeredEvents?: RegisteredEventInfo[]; // Updated to new type
  department?: string; 
  assignedEventSlug?: string; 
  assignedEventSlugs?: string[]; 
  tasks?: Task[]; 
  points?: number; 
  credibilityScore?: number; 
}

export interface Event { // General event type, potentially for future use
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

export interface SubEvent {
  id: string;
  slug: string;
  title: string;
  superpowerCategory: string; 
  shortDescription: string; 
  detailedDescription: string; 
  mainImage: { src: string; alt: string; dataAiHint: string };
  galleryImages?: Array<{ src: string; alt: string; dataAiHint: string }>;
  registrationLink: string; // Kept for now, though registration flow changes for logged-in users
  deadline?: string; 
  isTeamEvent?: boolean; 
  eventDate?: string; // Added eventDate
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

export interface StudentData { // For OCR
  name: string;
  school: string;
  grade: string;
  contactNumber: string;
  email: string;
}
