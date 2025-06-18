
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
  teamMembers?: { id: string, name: string, role?: string }[]; 
  admitCardStatus?: 'published' | 'pending' | 'unavailable';
  eventDate?: string; 
  registrationDate?: string; 
  paymentStatus?: 'paid' | 'pending' | 'waived' | 'failed'; 
}

export interface UserProfileData {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  photoURL?: string | null; 
  school?: string; 
  grade?: string; 
  phoneNumbers?: string[]; 
  registeredEvents?: RegisteredEventInfo[]; 
  department?: string; 
  assignedEventSlug?: string; 
  assignedEventSlugs?: string[]; 
  tasks?: Task[]; 
  points?: number; 
  credibilityScore?: number; 
}

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
  eventDate?: string; 
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

// Represents the custom data stored for a participant, keyed by columnId
export type ParticipantCustomData = Record<string, any>;

export interface EventParticipant {
  id: string; 
  name: string;
  email: string;
  contactNumber?: string;
  schoolName?: string;
  registrationDate: string; 
  paymentStatus: 'paid' | 'pending' | 'waived' | 'failed';
  customData?: ParticipantCustomData; 
}

// Represents the definition of a custom column
export interface CustomColumnDefinition {
  id: string; // Unique ID for the column
  name: string; // Display name of the column header
  dataType: 'text' | 'number' | 'checkbox' | 'dropdown' | 'date';
  options?: string[]; // For dropdown type, comma-separated string initially, then parsed to array
  defaultValue?: any;
  description?: string;
}

