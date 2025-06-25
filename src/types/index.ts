
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
export type EventStatus = 'Planning' | 'Active' | 'Completed' | 'Cancelled' | 'open' | 'closed';
export type RegistrationStatus = 'pending' | 'approved' | 'declined' | 'cancelled';
export type TeamStatus = 'pending' | 'approved' | 'disqualified';


export interface Task {
  id: string;
  title: string;
  description?: string;
  assignedTo?: string[];
  assignedByName?: string;
  assignedByUid?: string;
  eventSlug?: string;
  eventId?: string;
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
  fullName?: string;
  displayName?: string;
  shortId?: string;
  schoolName?: string;
  schoolId?: string | null;
  schoolVerifiedByOrganizer?: boolean;
  standard?: string;
  division?: string | null;
  role: UserRole;
  photoURL?: string | null;
  department?: string;
  assignedEventSlug?: string;
  assignedEventSlugs?: string[];
  phoneNumbers?: string[];
  additionalNumber?: string | null;
  tasks?: Task[];
  points?: number;
  credibilityScore?: number;
  allPlatformParticipants?: EventParticipant[];
  createdAt?: any; 
  updatedAt?: any; 
  registeredEventIds?: string[]; 
  teamIds?: string[];
  registeredEvents?: any[];
  subEventsManaged?: any[];
}

export interface SubEvent {
  id: string; // Document ID
  slug: string;
  title: string;
  superpowerCategory: string;
  shortDescription: string;
  detailedDescription: string;
  mainImage: { src: string; alt: string; dataAiHint: string };
  galleryImages?: Array<{ src: string; alt: string; dataAiHint: string }>;
  registrationLink: string;
  deadline?: string; // ISO Date string
  eventDate?: string; // ISO Date string
  isTeamBased: boolean; // CRITICAL for new logic
  minTeamMembers?: number;
  maxTeamMembers?: number;
  organizerUids?: string[];
  status?: EventStatus;
  venue?: string;
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
  division?: string | null;
  phoneNumber: string;
  additionalNumber?: string;
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

export interface CustomTaskColumnDefinition extends CustomColumnDefinition {}

export type ParticipantCustomData = Record<string, any> & {
  levels?: Record<string, {
    present: boolean;
    venue?: string;
    qualified: 'yes' | 'no' | 'auto';
  }>;
};

export interface EventParticipant {
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
  addedBy?: string;
  createdAt?: string;
}

// For Firestore event_registrations collection
export type EventRegistration = {
  id?: string; // Document ID, optional as Firestore auto-generates
  userId: string;
  subEventId: string;
  registeredAt: any; // Firestore Timestamp
  registrationStatus: RegistrationStatus;
  isTeamRegistration: boolean;
  teamId: string | null;
  admitCardUrl: string | null;
  presentee: boolean;
  submittedDocuments: string[] | null;
  lastUpdatedAt: any; // Firestore Timestamp
  participantInfoSnapshot?: {
    fullName: string;
    email: string;
    schoolName: string;
  }
};

// For Firestore event_teams collection
export type EventTeam = {
  id?: string; // Document ID, optional
  eventId: string;
  teamName: string;
  teamLeaderId: string;
  memberUids: string[];
  teamSize: number;
  status: TeamStatus;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
};

// Form data for creating a new team
export type CreateTeamFormData = {
  teamName: string;
  // memberEmails?: string; // Future: for inviting members by email
};

// Form data for joining an existing team
export type JoinTeamFormData = {
  teamCodeOrName: string; // User input to search for a team
};
