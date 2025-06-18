
'use client';

import type { User as FirebaseUser, AuthError } from 'firebase/auth';
import { createContext, useState, useEffect, ReactNode } from 'react';
import type { SignUpFormData, LoginFormData, UserProfileData, UserRole, Task, RegisteredEventInfo } from '@/types';
// subEventsData can be imported if needed for event titles etc., but dashboard will fetch from its own data source for now.

const mockTasksBase: Omit<Task, 'id' | 'assignedToUid' | 'assignedToName'>[] = [
  { title: 'Prepare presentation slides', description: 'Draft slides for the opening ceremony.', status: 'pending', deadline: '2024-08-15', points: 20, createdAt: '2024-07-20', updatedAt: '2024-07-20', assignedByName: 'Admin User' },
  { title: 'Coordinate with vendors', description: 'Finalize contracts with catering and AV.', status: 'in-progress', deadline: '2024-08-10', points: 30, createdAt: '2024-07-15', updatedAt: '2024-07-18', assignedByName: 'Overall Head' },
  { title: 'Update social media', description: 'Post daily updates about event registrations.', status: 'completed', deadline: '2024-07-25', points: 10, createdAt: '2024-07-01', updatedAt: '2024-07-25', assignedByName: 'Event Rep' },
];

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
    uid: 'mock-student-uid-12345', // More unique looking ID
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
    assignedEventSlugs: ['model-united-nations', 'robo-challenge'],
    tasks: [
        { id: 'task1', ...mockTasksBase[0], assignedToUid: 'mock-organizer-uid', assignedToName: 'Test Organizer Alice', eventSlug: 'model-united-nations' },
        { id: 'task2', ...mockTasksBase[1], assignedToUid: 'mock-organizer-uid', assignedToName: 'Test Organizer Alice', eventSlug: 'robo-challenge', status: 'pending' },
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
        { id: 'task3', ...mockTasksBase[2], assignedToUid: 'mock-representative-uid', assignedToName: 'Test Event Rep Bob', status: 'in-progress', eventSlug: 'ex-quiz-it', title: 'Finalize Quiz Questions' },
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
         { id: 'task4', title: 'Oversee budget allocation', description: 'Review and approve budget requests from all event reps.', status: 'pending', deadline: '2024-08-05', points: 50, createdAt: '2024-07-20', updatedAt: '2024-07-20', assignedToUid: 'mock-overall-head-uid', assignedToName: 'Test Overall Head Carol', assignedByName: 'Admin User' }
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
        { id: 'task5', title: 'System Maintenance Check', description: 'Ensure all platform services are operational.', status: 'completed', deadline: '2024-07-30', points: 25, createdAt: '2024-07-20', updatedAt: '2024-07-28', assignedToUid: 'mock-admin-uid', assignedToName: 'Test Admin Dave', assignedByName: 'System' }
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
        { id: 'task6', title: 'Test student dashboard', description: 'Verify all student dashboard features.', status: 'pending', deadline: '2024-08-01', points: 10, createdAt: '2024-07-25', updatedAt: '2024-07-25', assignedToUid: 'mock-test-uid-67890', assignedToName: 'Sam Williams (Test)', assignedByName: 'Overall Head' }
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
    // Attempt to retrieve stored role, or default to null
    const storedRole = typeof window !== "undefined" ? localStorage.getItem('mockUserRole') as UserRole | null : null;
    if (storedRole) {
      setMockUserRole(storedRole);
    } else {
      setAuthUser(null);
      setUserProfile(null);
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
      loggedInUser = { uid: profile.uid, email: profile.email, displayName: profile.displayName, photoURL: profile.photoURL } as FirebaseUser;
    } else {
      // Default to student if no match or invalid input, or handle error
      setMockUserRole('student'); 
      const profile = mockUserProfiles['student'];
      loggedInUser = { uid: profile.uid, email: profile.email, displayName: profile.displayName, photoURL: profile.photoURL } as FirebaseUser;
    }
    
    if(loggedInUser) return loggedInUser;
    return { message: "Mock login: Defaulted to student or unknown credentials." };
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
