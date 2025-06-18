
'use client';

import type { User as FirebaseUser, AuthError } from 'firebase/auth';
import { createContext, useState, useEffect, ReactNode } from 'react';
import type { SignUpFormData, LoginFormData, UserProfileData, UserRole, Task, RegisteredEventInfo } from '@/types';
// subEventsData can be imported if needed for event titles etc., but dashboard will fetch from its own data source for now.

// More diversified mock tasks
const mockTasksData: Omit<Task, 'id' | 'assignedTo' | 'createdBy' | 'createdAt' | 'updatedAt' | 'customTaskData' >[] = [
  { title: 'Prepare MUN Delegate Handbook', description: 'Draft handbook including rules of procedure and country profiles.', status: 'Not Started', dueDate: '2024-10-15T00:00:00Z', points: 25, priority: 'High', eventSlug: 'model-united-nations', assignedByName: 'Overall Head Carol' },
  { title: 'Finalize Quiz Questions - Round 1', description: 'Create 50 MCQs for science round.', status: 'In Progress', dueDate: '2024-11-01T00:00:00Z', points: 30, priority: 'High', eventSlug: 'ex-quiz-it', assignedByName: 'Event Rep Bob' },
  { title: 'Book Auditorium for MUN', description: 'Confirm booking for main hall for Dec 1st.', status: 'Pending Review', dueDate: '2024-09-30T00:00:00Z', points: 15, priority: 'Medium', eventSlug: 'model-united-nations', assignedByName: 'Organizer Alice' },
  { title: 'Design RoboChallenge Arena Layout', description: 'Draft the arena specifications and obstacle placements.', status: 'Not Started', dueDate: '2024-10-20T00:00:00Z', points: 20, priority: 'High', eventSlug: 'robo-challenge', assignedByName: 'Organizer Alice' },
  { title: 'Procure Robotics Kits', description: 'Order 20 standard robotics kits for participants.', status: 'Completed', dueDate: '2024-09-15T00:00:00Z', points: 10, priority: 'Medium', eventSlug: 'robo-challenge', assignedByName: 'Organizer Alice' },
  { title: 'Update EventFlow Website Content', description: 'Add details for newly approved sub-events.', status: 'In Progress', dueDate: '2024-08-25T00:00:00Z', points: 15, priority: 'Low', eventSlug: 'global', assignedByName: 'Admin Dave' },
  { title: 'Coordinate Volunteer Training Session', description: 'Schedule and organize a training session for all event volunteers.', status: 'Not Started', dueDate: '2024-11-10T00:00:00Z', points: 20, priority: 'Medium', eventSlug: 'global', assignedByName: 'Overall Head Carol' },
  { title: 'Test Registration Payment Gateway', description: 'Perform end-to-end test of the payment flow.', status: 'Pending Review', dueDate: '2024-08-30T00:00:00Z', points: 10, priority: 'High', eventSlug: 'global', assignedByName: 'Admin Dave' },
  { title: 'Prepare Olympiad Question Paper Set A', description: 'Create 30 physics problems for Junior Scientist Olympiad.', status: 'In Progress', dueDate: '2024-11-05T00:00:00Z', points: 25, priority: 'High', eventSlug: 'junior-scientist-olympiad', assignedByName: 'Organizer Alice'},
  { title: 'Setup Math-A-Maze Puzzles Online', description: 'Deploy digital version of puzzles for practice.', status: 'Not Started', dueDate: '2024-11-10T00:00:00Z', points: 15, priority: 'Medium', eventSlug: 'math-a-maze', assignedByName: 'Organizer Alice'},
];

// Helper to create full Task objects
const createTaskObject = (
    baseTask: Omit<Task, 'id' | 'assignedTo' | 'createdBy' | 'createdAt' | 'updatedAt' | 'customTaskData'>,
    id: string,
    assignedTo: string[],
    createdBy: string
): Task => ({
    ...baseTask,
    id,
    assignedTo,
    createdBy,
    createdAt: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString(), // Random creation time in last 10 days
    updatedAt: new Date().toISOString(),
    customTaskData: baseTask.title.includes("Quiz") ? { notes: 'Focus on STEM', difficulty: 5 } : {}
});


const mockStudentRegisteredEvents: RegisteredEventInfo[] = [
  {
    eventSlug: 'model-united-nations',
    eventDate: '2024-12-01',
    admitCardStatus: 'pending'
  },
  {
    eventSlug: 'ex-quiz-it',
    teamName: 'Quiz Wizards',
    eventDate: '2024-12-05',
    admitCardStatus: 'published',
    teamMembers: [{id: 'mem1', name: 'Jane Doe'}, {id: 'mem2', name: 'John Smith'}]
  },
  {
    eventSlug: 'robo-challenge',
    eventDate: '2024-11-28',
    admitCardStatus: 'unavailable',
    teamName: 'RoboKnights',
    teamMembers: [{id: 'mem3', name: 'Alice Wonder'}]
  }
];

const mockUserProfiles: Record<UserRole, UserProfileData> = {
  student: {
    uid: 'mock-student-uid-12345',
    email: 'student.test@example.com',
    displayName: 'Alex Johnson',
    role: 'student',
    photoURL: 'https://placehold.co/120x120.png?text=AJ',
    school: 'Springfield High International',
    grade: '10th Grade - Section A',
    phoneNumbers: ['+1-555-0101', '+1-555-0102'],
    registeredEvents: mockStudentRegisteredEvents,
  },
  organizer: {
    uid: 'mock-organizer-uid',
    email: 'organizer.test@example.com',
    displayName: 'Test Organizer Alice',
    role: 'organizer',
    photoURL: 'https://placehold.co/100x100.png?text=TOA',
    department: 'Logistics',
    assignedEventSlugs: ['model-united-nations', 'robo-challenge', 'junior-scientist-olympiad', 'math-a-maze'],
    tasks: [
        createTaskObject(mockTasksData[0], 'task-org-1', ['Test Organizer Alice'], 'Overall Head Carol'), // MUN Handbook
        createTaskObject(mockTasksData[3], 'task-org-2', ['Test Organizer Alice'], 'Event Rep Bob'), // RoboChallenge Arena
        createTaskObject(mockTasksData[4], 'task-org-3', ['Test Organizer Alice', 'David (Organizer)'], 'Test Organizer Alice'), // Procure Kits
        createTaskObject(mockTasksData[8], 'task-org-4', ['Test Organizer Alice'], 'Overall Head Carol'), // Olympiad questions
        createTaskObject(mockTasksData[9], 'task-org-5', ['Test Organizer Alice'], 'Event Rep Bob'), // Math-A-Maze puzzles
    ],
    points: 150,
    credibilityScore: 75,
  },
  event_representative: {
    uid: 'mock-representative-uid',
    email: 'representative.test@example.com',
    displayName: 'Test Event Rep Bob',
    role: 'event_representative',
    photoURL: 'https://placehold.co/100x100.png?text=ERB',
    department: 'Event Management',
    assignedEventSlug: 'ex-quiz-it',
    tasks: [
        createTaskObject(mockTasksData[1], 'task-er-1', ['Test Event Rep Bob', 'Self (Current User)'], 'Overall Head Carol'), // Finalize Quiz Questions
        { ...createTaskObject(mockTasksData[2], 'task-er-2', ['Test Organizer Alice'], 'Test Event Rep Bob'), title: 'Follow up on Auditorium Booking for Ex-Quiz-It', eventSlug: 'ex-quiz-it', priority: 'Medium' }
    ],
    points: 200,
    credibilityScore: 80,
  },
  overall_head: {
    uid: 'mock-overall-head-uid',
    email: 'overall.test@example.com',
    displayName: 'Test Overall Head Carol',
    role: 'overall_head',
    photoURL: 'https://placehold.co/100x100.png?text=OHC',
    department: 'Coordination',
    tasks: [
         createTaskObject(mockTasksData[6], 'task-oh-1', ['Test Overall Head Carol', 'Self (Current User)'], 'Admin Dave'), // Volunteer Training
         { ...createTaskObject(mockTasksData[0], 'task-oh-2', ['Test Organizer Alice'], 'Test Overall Head Carol'), id: 'task-oh-mun-oversee', title: 'Oversee MUN Handbook Creation' }
    ],
    points: 300,
    credibilityScore: 85,
  },
  admin: {
    uid: 'mock-admin-uid',
    email: 'admin.test@example.com',
    displayName: 'Test Admin Dave',
    role: 'admin',
    photoURL: 'https://placehold.co/100x100.png?text=TAD',
    department: 'Administration',
    tasks: [
        createTaskObject(mockTasksData[5], 'task-adm-1', ['Test Admin Dave'], 'System'), // Website Content
        createTaskObject(mockTasksData[7], 'task-adm-2', ['Test Admin Dave', 'Self (Current User)'], 'System') // Payment Gateway Test
    ],
    points: 500,
    credibilityScore: 95,
  },
  test: {
    uid: 'mock-test-uid-67890',
    email: 'generic.test@example.com',
    displayName: 'Sam Williams (Test)',
    role: 'test',
    photoURL: 'https://placehold.co/120x120.png?text=SW',
    school: 'Testington Academy Global',
    grade: '12th Grade - Section B',
    phoneNumbers: ['+1-555-0201'],
    registeredEvents: [
        { eventSlug: 'robo-challenge', teamName: 'RoboKnights', eventDate: '2024-11-28', admitCardStatus: 'pending' },
        { eventSlug: 'math-a-maze', eventDate: '2024-11-22', admitCardStatus: 'unavailable'}
    ],
    department: 'QA',
    tasks: [
        { ...createTaskObject(mockTasksData[1], 'task-test-1', ['Sam Williams (Test)'], 'Overall Head Carol'), title: 'Verify Quiz Task Functionality', eventSlug: 'ex-quiz-it', priority: 'Low' }
    ],
    points: 50,
    credibilityScore: 60,
  }
};

interface AuthContextType {
  authUser: FirebaseUser | null;
  userProfile: UserProfileData | null;
  loading: boolean;
  signUp: (data: SignUpFormData) => Promise<FirebaseUser | AuthError | { message: string }>;
  logIn: (data: LoginFormData | UserRole) => Promise<FirebaseUser | AuthError | { message: string }>;
  logOut: () => Promise<void>;
  setMockUserRole: (role: UserRole | null) => void;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfileData | null>>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedRole = typeof window !== "undefined" ? localStorage.getItem('mockUserRole') as UserRole | null : null;
    if (storedRole && mockUserProfiles[storedRole]) { // Ensure stored role is valid
      setMockUserRole(storedRole);
    } else {
      // If no valid stored role, or on initial load without a role, clear auth state.
      // This prevents defaulting to a student or any other role if localStorage is empty or invalid.
      setAuthUser(null);
      setUserProfile(null);
       if (typeof window !== "undefined") {
          localStorage.removeItem('mockUserRole'); // Clean up invalid stored role
       }
    }
    setLoading(false);
  }, []);

  const setMockUserRole = (role: UserRole | null) => {
    setLoading(true);
    if (role && mockUserProfiles[role]) {
      const profile = mockUserProfiles[role];
      const mockFbUser: FirebaseUser = {
        uid: profile.uid,
        email: profile.email,
        displayName: profile.displayName,
        photoURL: profile.photoURL,
        emailVerified: true,
        isAnonymous: false,
        metadata: {},
        providerData: [],
        providerId: 'mock',
        refreshToken: 'mock-refresh-token',
        tenantId: null,
        delete: async () => {},
        getIdToken: async () => 'mock-id-token',
        getIdTokenResult: async () => ({ token: 'mock-id-token', claims: {}, expirationTime: '', issuedAtTime: '', signInProvider: null, signInSecondFactor: null}),
        reload: async () => {},
        toJSON: () => ({}),
      } as FirebaseUser;

      setAuthUser(mockFbUser);
      setUserProfile(profile);
      if (typeof window !== "undefined") {
        localStorage.setItem('mockUserRole', role);
      }
    } else {
      setAuthUser(null);
      setUserProfile(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem('mockUserRole');
      }
    }
    setLoading(false);
  };

  const signUp = async (data: SignUpFormData): Promise<{ message: string }> => {
    console.warn("Mock Auth: signUp called. In mock mode, new users are not actually created. Please use mock login.");
    return { message: "Sign up is in mock mode. Please use mock login." };
  };

  const logIn = async (data: LoginFormData | UserRole): Promise<{ message: string } | FirebaseUser> => {
    console.warn("Mock Auth: logIn called.");
    let loggedInUser: FirebaseUser | null = null;
    let roleToSet: UserRole | null = null;

    if (typeof data === 'string' && mockUserProfiles[data as UserRole]) {
      roleToSet = data as UserRole;
    } else if (typeof data === 'object' && data.email) {
        const foundRole = Object.values(mockUserProfiles).find(p => p.email === data.email)?.role;
        if (foundRole) {
            roleToSet = foundRole;
        }
    }

    if (roleToSet) {
      setMockUserRole(roleToSet);
      const profile = mockUserProfiles[roleToSet];
      loggedInUser = { uid: profile.uid, email: profile.email, displayName: profile.displayName, photoURL: profile.photoURL } as FirebaseUser; // Simplified mock FirebaseUser
    } else {
      // If no specific role found or invalid input, perhaps clear auth or default carefully
      // For now, let's clear it to avoid assuming a default role on failed "login by email"
      setMockUserRole(null);
      return { message: "Mock login: Unknown credentials or role. Please select a role directly." };
    }

    if(loggedInUser) return loggedInUser;
    // This path should ideally not be reached if roleToSet leads to a valid profile.
    return { message: "Mock login: Failed to establish user session." };
  };

  const logOut = async () => {
    console.warn("Mock Auth: logOut called.");
    setMockUserRole(null);
  };


  const value = {
    authUser,
    userProfile,
    loading,
    signUp,
    logIn,
    logOut,
    setMockUserRole,
    setUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
