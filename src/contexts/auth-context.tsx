
'use client';

import type { User as FirebaseUser, AuthError } from 'firebase/auth';
import { createContext, useState, useEffect, ReactNode } from 'react';
import type { SignUpFormData, LoginFormData, UserProfileData, UserRole, Task } from '@/types';
import { subEventsData } from '@/data/subEvents'; // For event titles

// --- MOCK DATA ---
const mockTasksBase: Omit<Task, 'id' | 'assignedToUid' | 'assignedToName'>[] = [
  { title: 'Prepare presentation slides', description: 'Draft slides for the opening ceremony.', status: 'pending', deadline: '2024-08-15', points: 20, createdAt: '2024-07-20', updatedAt: '2024-07-20', assignedByName: 'Admin User' },
  { title: 'Coordinate with vendors', description: 'Finalize contracts with catering and AV.', status: 'in-progress', deadline: '2024-08-10', points: 30, createdAt: '2024-07-15', updatedAt: '2024-07-18', assignedByName: 'Overall Head' },
  { title: 'Update social media', description: 'Post daily updates about event registrations.', status: 'completed', deadline: '2024-07-25', points: 10, createdAt: '2024-07-01', updatedAt: '2024-07-25', assignedByName: 'Event Rep' },
];


const mockUserProfiles: Record<UserRole, UserProfileData> = {
  student: {
    uid: 'mock-student-uid',
    email: 'student.test@example.com',
    displayName: 'Test Student',
    role: 'student',
    photoURL: 'https://placehold.co/100x100.png?text=TS',
    school: 'Springfield High',
    grade: '10th Grade',
    registeredEvents: [
      { eventSlug: 'model-united-nations' }, 
      { eventSlug: 'ex-quiz-it', teamName: 'Quiz Wizards' }
    ], 
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
    assignedEventSlug: 'ex-quiz-it', // Manages "Ex-Quiz-It"
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
    uid: 'mock-test-uid',
    email: 'generic.test@example.com',
    displayName: 'Generic Test User Eve',
    role: 'test', 
    photoURL: 'https://placehold.co/100x100.png?text=TUE',
    school: 'Testington Academy',
    grade: '12th Grade',
    registeredEvents: [{ eventSlug: 'robo-challenge', teamName: 'RoboKnights' }],
    // Test users can also have tasks/points for testing those UI parts
    department: 'QA',
    tasks: [
        { id: 'task6', title: 'Test student dashboard', description: 'Verify all student dashboard features.', status: 'pending', deadline: '2024-08-01', points: 10, createdAt: '2024-07-25', updatedAt: '2024-07-25', assignedToUid: 'mock-test-uid', assignedToName: 'Generic Test User Eve', assignedByName: 'Overall Head' }
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
    setAuthUser(null);
    setUserProfile(null);
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
    } else {
      setAuthUser(null);
      setUserProfile(null);
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
    if (typeof data === 'string' && mockUserProfiles[data as UserRole]) { 
      setMockUserRole(data as UserRole);
      const profile = mockUserProfiles[data as UserRole];
      loggedInUser = { uid: profile.uid, email: profile.email, displayName: profile.displayName, photoURL: profile.photoURL } as FirebaseUser;
    } else if (typeof data === 'object' && data.email) { 
        const roleToLogin = Object.values(mockUserProfiles).find(p => p.email === data.email)?.role;
        if (roleToLogin) {
            setMockUserRole(roleToLogin);
            const profile = mockUserProfiles[roleToLogin];
            loggedInUser = { uid: profile.uid, email: profile.email, displayName: profile.displayName, photoURL: profile.photoURL } as FirebaseUser;
        }
    } else {
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
