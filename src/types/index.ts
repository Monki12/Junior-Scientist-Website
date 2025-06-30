
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
  assignedTo?: string[]; // Kept for display names if needed, but logic should use UIDs
  assignedByUserId?: string; // UID of the user who assigned the task
  eventSlug?: string;
  subEventId?: string; // Explicit link to event
  dueDate?: string; // ISO Date string
  priority: TaskPriority;
  status: TaskStatus;
  pointsOnCompletion?: number; // Points awarded for completion
  completedByUserId?: string | null; // UID of user who marked it complete
  completedAt?: string | null; // ISO Date string
  attachments?: { name: string, url: string }[];
  subtasks?: { text: string, completed: boolean }[];
  createdBy?: string; // UID of creator
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
  customTaskData?: Record<string, any>;
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
  points: number; // Legacy, may be merged with credibilityScore or used for gamification
  subEventsManaged?: string[];
  phoneNumbers?: string[];
  additionalNumber?: string | null;
  tasks?: Task[];
  createdAt?: any; 
  updatedAt?: any; 
  registeredEventIds?: string[]; 
  teamIds?: string[];
  registeredEvents?: any[];
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

export interface CustomColumnDefinition {
  id: string;
  name: string;
  dataType: 'text' | 'number' | 'checkbox' | 'dropdown' | 'date';
  options?: string[];
  defaultValue?: any;
  description?: string;
}

export interface ActiveDynamicFilter {
  id: string;
  columnId: string;
  columnName: string;
  value: string;
  isCustom: boolean;
}

export interface UserColumnPreference {
    id?: string;
    userId: string | null;
    subEventId: string | null;
    dashboardArea: 'studentList' | 'taskList' | 'eventDetails' | 'userList';
    columnsVisible: string[];
    filtersApplied: Record<string, any>; // or stringified JSON
    isSharedAcrossEvent: boolean;
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

export type StudentRegisteredEventDisplay = SubEvent & {
  registrationId: string;
  teamId?: string;
  teamName?: string;
  teamLeaderId?: string;
  teamMembers?: string[];
  teamMembersNames?: Record<string, string>;
  admitCardUrl?: string | null;
  registrationStatus?: RegistrationStatus;
};


// Form data for creating a new team
export type CreateTeamFormData = {
  teamName: string;
};

// Form data for joining an existing team
export type JoinTeamFormData = {
  teamCodeOrName: string; 
};
