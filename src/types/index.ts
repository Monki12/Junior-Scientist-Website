
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
export type EventStatus = 'Planning' | 'Active' | 'Completed' | 'Cancelled';


export interface Task {
  id: string;
  title: string;
  description?: string;
  assignedTo?: string[];
  assignedByName?: string;
  assignedByUid?: string;
  eventSlug?: string;
  dueDate?: string;
  priority: TaskPriority;
  status: TaskStatus;
  points?: number;
  attachments?: { name: string, url: string }[];
  subtasks?: { text: string, completed: boolean }[];
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  customTaskData?: Record<string, any>;
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
  displayName: string | null; // This will typically be the fullName for students
  role: UserRole;
  photoURL?: string | null;
  // Student specific fields
  fullName?: string;
  schoolName?: string;
  schoolId?: string; // If matched from verified list
  schoolVerifiedByOrganizer?: boolean; // Status of school verification
  standard?: string; // e.g., "Grade 10"
  division?: string; // Optional
  // Organizational fields
  department?: string;
  assignedEventSlug?: string;
  assignedEventSlugs?: string[];
  // Common fields
  phoneNumbers?: string[];
  registeredEvents?: RegisteredEventInfo[];
  tasks?: Task[];
  points?: number;
  credibilityScore?: number;
  allPlatformParticipants?: EventParticipant[];
  createdAt?: string;
  updatedAt?: string;
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
  status?: EventStatus;
  venue?: string;
  organizers?: string[];
  event_representatives?: string[];
  registeredParticipantCount?: number;
  isFeatured?: boolean;
}

export interface SignUpFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword?: string;
  schoolName: string;
  standard: string;
  division?: string;
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

export interface CustomTaskColumnDefinition {
  id: string;
  name: string;
  dataType: 'text' | 'number' | 'checkbox' | 'dropdown' | 'date';
  options?: string[];
  defaultValue?: any;
  description?: string;
}


export type ParticipantCustomData = Record<string, any> & {
  levels?: Record<string, {
    present: boolean;
    venue?: string;
    qualified: 'yes' | 'no' | 'auto';
  }>;
};


export interface EventParticipant {
  id: string;
  name: string;
  email: string;
  contactNumber?: string;
  schoolName?: string;
  registrationDate: string;
  paymentStatus: 'paid' | 'pending' | 'waived' | 'failed';
  customData?: ParticipantCustomData;
  registeredEventSlugs?: string[];
}

export interface ActiveDynamicFilter {
  id: string;
  columnId: string;
  columnName: string;
  value: string;
  isCustom: boolean;
}

export interface ActiveTaskFilter {
  id: string;
  columnId: string; // keyof Task or custom column id
  columnName: string;
  value: string;
  isCustom?: boolean;
}

// New interface for School Data
export interface SchoolData {
  id: string;
  name: string;
  city?: string;
  state?: string;
  country?: string;
  isVerified: boolean; // Should be true for all entries in the master list
  addedBy?: string; // UID of admin/organizer who added it
  createdAt?: string;
}
