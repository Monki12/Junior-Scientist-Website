
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

export interface Board {
  id: string;
  name: string;
  description?: string;
  type: 'general' | 'event';
  eventId?: string;
  memberUids: string[];
  managerUids?: string[];
  createdAt: any;
  createdBy: string;
  updatedAt?: any;
}

export interface Subtask {
  id: string;
  text: string;
  completed: boolean;
  assignedTo?: string; // UID of a user from the parent task's assignedToUserIds
}

export interface Task {
  id: string;
  boardId: string; // ID of the board it belongs to
  title: string;
  description?: string;
  assignedToUserIds: string[]; // UIDs of assigned users
  creatorId?: string; // UID of the user who created the task
  dueDate?: string | null; // ISO Date string
  priority: TaskPriority;
  status: TaskStatus;
  pointsOnCompletion?: number;
  completedByUserId?: string | null;
  completedAt?: any; // serverTimestamp or ISO string
  attachments?: { name: string, url: string }[];
  subtasks: Subtask[];
  createdAt: any;
  updatedAt: any;
  bucket?: 'a' | 'b' | 'c' | 'other';
  caption?: string;
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
  assignedEventUids?: string[];
  studentDataEventAccess?: Record<string, boolean>;
  credibilityScore: number;
  points?: number; 
  phoneNumbers?: string[];
  additionalNumber?: string | null;
  createdAt?: any; 
  updatedAt?: any; 
  customData?: Record<string, any>;
  boardIds?: string[]; // IDs of boards the user is a member of
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
  registrationLink?: string;
  deadline?: string | null;
  eventDate?: string | null;
  isTeamBased: boolean;
  minTeamMembers?: number;
  maxTeamMembers?: number;
  eventReps: string[];
  organizerUids: string[];
  status?: EventStatus;
  venue?: string;
  registeredParticipantCount?: number;
  isFeatured?: boolean;
  customData?: Record<string, any>;
  createdAt?: any;
  updatedAt?: any;
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

export type EventRegistration = {
  id?: string;
  userId: string;
  subEventId: string;
  registeredAt: any;
  registrationStatus: RegistrationStatus;
  isTeamRegistration: boolean;
  teamId: string | null;
  admitCardUrl: string | null;
  presentee: boolean;
  submittedDocuments: string[] | null;
  lastUpdatedAt: any;
  participantInfoSnapshot?: {
    fullName: string;
    email: string;
    schoolName: string;
  },
  customData?: Record<string, any>;
};

export type EventTeam = {
  id?: string;
  eventId: string;
  teamName: string;
  teamLeaderId: string;
  memberUids: string[];
  teamSize: number;
  status: TeamStatus;
  createdAt: any;
  updatedAt: any;
};

export type CreateTeamFormData = {
  teamName: string;
};

export type JoinTeamFormData = {
  teamCodeOrName: string; 
};

export interface CustomColumnDefinition {
  id: string;
  name: string;
  dataType: 'text' | 'number' | 'checkbox' | 'date' | 'dropdown';
  options?: string[];
  defaultValue?: any;
  description?: string;
  isSharedGlobally?: boolean;
  editableByOthers?: boolean;
  createdBy?: string;
  createdAt?: any;
}

export interface UserColumnPreference {
    id?: string;
    userId: string | null;
    subEventId: string | null;
    dashboardArea: 'studentList' | 'taskList' | 'eventDetails' | 'userList';
    columnsVisible: string[];
    columnOrder: string[];
    columnWidths: Record<string, number>;
    filtersApplied: ActiveDynamicFilter[];
    isSharedAcrossEvent: boolean;
}

export interface ActiveDynamicFilter {
  id: string;
  columnId: string;
  columnName: string;
  operator: 'contains' | 'equals' | 'gt' | 'lt' | 'in' | 'is';
  value: any;
  isCustom: boolean;
}
