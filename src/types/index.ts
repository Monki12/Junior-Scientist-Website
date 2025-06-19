
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
export type EventStatus = 'Planning' | 'Active' | 'Completed' | 'Cancelled' | 'open' | 'closed'; // Added open/closed for event.status
export type RegistrationStatus = 'pending' | 'approved' | 'declined' | 'cancelled';
export type TeamStatus = 'pending' | 'approved' | 'disqualified';


export interface Task {
  id: string;
  title: string;
  description?: string;
  assignedTo?: string[];
  assignedByName?: string;
  assignedByUid?: string;
  eventSlug?: string; // Links to SubEvent slug
  eventId?: string; // Could also link to SubEvent id if preferred
  dueDate?: string; // ISO Date string
  priority: TaskPriority;
  status: TaskStatus;
  points?: number;
  attachments?: { name: string, url: string }[];
  subtasks?: { text: string, completed: boolean }[];
  createdBy?: string; // UID of creator
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
  customTaskData?: Record<string, any>;
}

export interface RegisteredEventInfo { // Primarily for UserProfileData if still used for simple list
  eventSlug: string;
  teamName?: string;
  teamMembers?: { id: string, name: string, role?: string }[];
  admitCardStatus?: 'published' | 'pending' | 'unavailable'; // This could be derived from EventRegistration
  eventDate?: string;
  registrationDate?: string;
  paymentStatus?: 'paid' | 'pending' | 'waived' | 'failed';
}

export interface UserProfileData {
  uid: string;
  email: string | null;
  fullName?: string; // Made optional as per rules for create (must be string if present)
  schoolName?: string; // Made optional
  schoolId?: string | null;
  schoolVerifiedByOrganizer?: boolean;
  standard?: string; // Made optional
  division?: string | null;
  role: UserRole;
  photoURL?: string | null;
  department?: string;
  assignedEventSlug?: string; // For single event rep
  assignedEventSlugs?: string[]; // For organizer of multiple events
  phoneNumbers?: string[];
  registeredEvents?: RegisteredEventInfo[]; // This might be deprecated in favor of querying event_registrations
  tasks?: Task[];
  points?: number;
  credibilityScore?: number;
  allPlatformParticipants?: EventParticipant[]; // For overall_head
  createdAt?: string | Date; // Allow Date for initial client-side, convert to string/Timestamp for Firestore
  updatedAt?: string | Date;
}

export interface SubEvent { // This is the primary Event type used
  id: string;
  slug: string;
  title: string;
  superpowerCategory: string;
  shortDescription: string;
  detailedDescription: string;
  mainImage: { src: string; alt: string; dataAiHint: string };
  galleryImages?: Array<{ src: string; alt: string; dataAiHint: string }>;
  registrationLink: string; // May become obsolete if internal registration is built
  deadline?: string; // ISO Date string
  eventDate?: string; // ISO Date string
  
  // New fields based on normalization requirements
  isTeamBased?: boolean;
  minTeamMembers?: number;
  maxTeamMembers?: number;
  organizerUids?: string[]; // Array of UIDs of organizers
  status?: EventStatus; // e.g., 'open', 'closed', 'cancelled', 'Planning', 'Active', 'Completed'

  venue?: string;
  // organizers?: string[]; // old field, replaced by organizerUids
  // event_representatives?: string[]; // old field, could be part of organizerUids with specific role elsewhere or a separate link
  registeredParticipantCount?: number; // This would be a derived count
  isFeatured?: boolean;
}

export interface SignUpFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword?: string;
  schoolName: string;
  standard: string;
  division?: string | null;
  // schoolId and schoolVerifiedByOrganizer are derived, not directly from form
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

export interface CustomColumnDefinition {
  id: string;
  name: string;
  dataType: 'text' | 'number' | 'checkbox' | 'dropdown' | 'date';
  options?: string[];
  defaultValue?: any;
  description?: string;
}

export interface CustomTaskColumnDefinition extends CustomColumnDefinition {}


export type ParticipantCustomData = Record<string, any> & {
  levels?: Record<string, {
    present: boolean;
    venue?: string;
    qualified: 'yes' | 'no' | 'auto';
  }>;
};


export interface EventParticipant { // Generic participant data, often for overall views
  id: string; // user UID
  name: string;
  email: string;
  contactNumber?: string;
  schoolName?: string;
  registrationDate: string; // ISO Date string
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

export interface ActiveTaskFilter extends ActiveDynamicFilter {}

export interface SchoolData {
  id: string;
  name: string;
  city?: string;
  state?: string;
  country?: string;
  isVerified: boolean;
  addedBy?: string; // UID of admin/organizer
  createdAt?: string; // ISO Date string
}

// New normalized collection interfaces
export interface EventRegistration {
  id?: string; // Firestore document ID (auto-generated or [userId]_[eventId])
  userId: string; // UID of the student
  eventId: string; // ID of the event (maps to SubEvent.id or a dedicated events collection ID)
  registeredAt: any; // Firestore Timestamp or string/Date for client
  registrationStatus: RegistrationStatus; // e.g., 'pending', 'approved', 'declined', 'cancelled'
  isTeamRegistration: boolean;
  teamId?: string | null; // Reference to event_teams document ID
  admitCardUrl?: string | null;
  presentee?: boolean; // Default false, marked by organizer
  submittedDocuments?: string[] | null; // URLs to documents in Storage
  lastUpdatedAt: any; // Firestore Timestamp or string/Date for client
}

export interface EventTeam {
  id?: string; // Firestore document ID (auto-generated)
  eventId: string;
  teamName: string;
  teamLeaderId: string; // UID of the team leader
  memberUids: string[]; // Array of UIDs of all team members
  teamSize: number;
  status: TeamStatus; // e.g., 'pending', 'approved', 'disqualified'
  createdAt: any; // Firestore Timestamp or string/Date for client
  updatedAt: any; // Firestore Timestamp or string/Date for client
}

    