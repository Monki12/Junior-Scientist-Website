
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
  assignedToUserIds: string[]; // UIDs of assigned users
  assignedByUserId?: string; // UID of the user who assigned the task
  subEventId?: string; // Explicit link to event
  dueDate?: string; // ISO Date string
  priority: TaskPriority;
  status: TaskStatus;
  pointsOnCompletion?: number; // Points awarded for completion
  completedByUserId?: string | null; // UID of user who marked it complete
  completedAt?: any; // serverTimestamp or ISO string
  attachments?: { name: string, url: string }[];
  subtasks?: { text: string, completed: boolean }[];
  createdAt: any; // serverTimestamp or ISO string
  updatedAt: any; // serverTimestamp or ISO string
}

export interface UserProfileData {
  uid: string;
  email: string | null;
  fullName?: string;
  displayName?: string;
  shortId?: string | null; 
  collegeRollNumber?: string | null; 
  schoolName?: string;
  schoolId?: string | null;
  schoolVerifiedByOrganizer?: boolean;
  standard?: string;
  division?: string | null;
  role: UserRole;
  photoURL?: string | null;
  department?: string | null; 
  assignedEventUids?: string[]; // For Event Reps/Overall Heads
  studentDataEventAccess?: Record<string, boolean>; // For Organizers
  credibilityScore: number;
  points?: number; 
  phoneNumbers?: string[];
  additionalNumber?: string | null;
  createdAt?: any; 
  updatedAt?: any; 
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
  registrationLink?: string;
  deadline?: string | null; // ISO Date string
  eventDate?: string | null; // ISO Date string
  isTeamBased: boolean;
  minTeamMembers?: number;
  maxTeamMembers?: number;
  eventReps: string[]; // UIDs of Event Representatives
  organizerUids: string[]; // UIDs of Organizers
  status?: EventStatus;
  venue?: string;
  registeredParticipantCount?: number;
  isFeatured?: boolean;
  customData?: Record<string, any>;
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
};

// Form data for joining an existing team
export type JoinTeamFormData = {
  teamCodeOrName: string; 
};


export interface CustomColumnDefinition {
  id: string; // e.g., 'custom_field_1'
  name: string; // e.g., 'T-Shirt Size'
  dataType: 'text' | 'number' | 'checkbox' | 'date' | 'dropdown' | 'file' | 'reference';
  options?: string[]; // For 'dropdown' type
  defaultValue?: any;
  description?: string;
}

export interface UserColumnPreference {
    id?: string; // Document ID in Firestore
    userId: string | null; // UID of user or null if shared
    subEventId: string | null; // Event ID or null if global
    dashboardArea: 'studentList' | 'taskList' | 'eventDetails' | 'userList';
    columnsVisible: string[]; // Array of column IDs/keys
    columnOrder: string[];
    columnWidths: Record<string, number>;
    filtersApplied: ActiveDynamicFilter[]; // Using the new type for filters
    isSharedAcrossEvent: boolean;
}

export interface ActiveDynamicFilter {
  id: string; // Unique ID for the filter instance
  columnId: string; // ID of the column to filter on
  columnName: string; // Display name of the column
  operator: 'contains' | 'equals' | 'gt' | 'lt' | 'in' | 'is'; // Filter operator
  value: any; // The value to filter by
  isCustom: boolean; // Whether it's a filter on a custom column
}
