
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
  registrationDate?: string; // Added for student's own registration view
  paymentStatus?: 'paid' | 'pending' | 'waived' | 'failed'; // Added for student's own registration view
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

// New interface for participant data viewable by Event Reps
export interface EventParticipant {
  id: string; // Student's UID
  name: string;
  email: string;
  contactNumber?: string;
  schoolName?: string;
  registrationDate: string; // ISO Date string
  paymentStatus: 'paid' | 'pending' | 'waived' | 'failed';
  // Later: customColumns, notes etc.
}
