
import type { User as FirebaseUser } from 'firebase/auth';

export type UserRole = 
  | 'student' 
  | 'organizer' 
  | 'event_representative' 
  | 'overall_head' 
  | 'admin' 
  | 'test';

export type TaskPriority = 'High' | 'Medium' | 'Low';
export type TaskStatus = 'Not Started' | 'In Progress' | 'Pending Review' | 'Completed';

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo?: string[]; // Array of user names or IDs
  assignedByName?: string;
  assignedByUid?: string;  
  eventSlug?: string;      
  dueDate?: string; // ISO string date
  priority: TaskPriority;
  status: TaskStatus;
  points?: number;
  attachments?: { name: string, url: string }[]; // Array of attachment objects
  subtasks?: { text: string, completed: boolean }[];
  createdBy?: string; // User ID or name
  createdAt: string; // ISO string date       
  updatedAt: string; // ISO string date
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

export interface CustomColumnDefinition {
  id: string; 
  name: string; 
  dataType: 'text' | 'number' | 'checkbox' | 'dropdown' | 'date';
  options?: string[]; 
  defaultValue?: any;
  description?: string;
}

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
