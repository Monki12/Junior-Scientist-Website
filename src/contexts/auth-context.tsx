
'use client';

import { createUserWithEmailAndPassword, signInWithEmailAndPassword, type User as FirebaseUser, type AuthError, onAuthStateChanged } from 'firebase/auth';
import { createContext, useState, useEffect, ReactNode } from 'react';
import type { SignUpFormData, LoginFormData, UserProfileData, UserRole, Task, RegisteredEventInfo, EventParticipant, EventRegistration } from '@/types';
import { auth, db } from '@/lib/firebase'; 
import { doc, getDoc, serverTimestamp } from 'firebase/firestore'; 
import { mockSchoolsData } from '@/data/mockSchools';

// Mock data remains for profile information after authentication or for direct mock role setting
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
    createdAt: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    customTaskData: baseTask.title.includes("Quiz") ? { notes: 'Focus on STEM', difficulty: 5 } : {}
});

const mockStudentRegisteredEvents: RegisteredEventInfo[] = [
  { eventSlug: 'model-united-nations', eventDate: '2024-12-01', admitCardStatus: 'pending' },
  { eventSlug: 'ex-quiz-it', teamName: 'Quiz Wizards', eventDate: '2024-12-05', admitCardStatus: 'published', teamMembers: [{id: 'mem1', name: 'Jane Doe'}, {id: 'mem2', name: 'John Smith'}] },
  { eventSlug: 'robo-challenge', eventDate: '2024-11-28', admitCardStatus: 'unavailable', teamName: 'RoboKnights', teamMembers: [{id: 'mem3', name: 'Alice Wonder'}] }
];

const mockGlobalParticipants: EventParticipant[] = [
  { id: 'stud-global-1', name: 'Global Alice Smith', email: 'alice.smith.global@example.com', contactNumber: '555-1234', schoolName: 'Springfield High', registrationDate: new Date('2024-07-01T10:00:00Z').toISOString(), paymentStatus: 'paid', registeredEventSlugs: ['model-united-nations', 'ex-quiz-it'], customData: { notes: 'Interested in volunteering too.'} },
  { id: 'stud-global-2', name: 'Global Bob Johnson', email: 'bob.johnson.global@example.com', contactNumber: '555-5678', schoolName: 'Northwood Academy', registrationDate: new Date('2024-07-02T11:30:00Z').toISOString(), paymentStatus: 'pending', registeredEventSlugs: ['robo-challenge'], customData: {} },
];


const mockUserProfiles: Record<UserRole, UserProfileData> = {
  student: {
    uid: 'mock-student-uid-12345', email: 'student.test@example.com', fullName: 'Alex Johnson', displayName: 'Alex Johnson', role: 'student', photoURL: 'https://placehold.co/120x120.png?text=AJ',
    schoolName: 'Springfield High International', schoolId: 'school_001', schoolVerifiedByOrganizer: true, standard: '10', division: 'A',
    phoneNumbers: ['+1-555-0101', '+1-555-0102'], registeredEvents: mockStudentRegisteredEvents, tasks: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  organizer: {
    uid: 'mock-organizer-uid', email: 'organizer.test@example.com', displayName: 'Test Organizer Alice', role: 'organizer', photoURL: 'https://placehold.co/100x100.png?text=TOA', department: 'Logistics', assignedEventSlugs: ['model-united-nations', 'robo-challenge', 'junior-scientist-olympiad', 'math-a-maze'],
    tasks: [
        createTaskObject(mockTasksData[0], 'task-org-1', ['Test Organizer Alice'], 'Overall Head Carol'),
        createTaskObject(mockTasksData[3], 'task-org-2', ['Test Organizer Alice'], 'Event Rep Bob'),
    ].filter(task => task.assignedTo?.includes('Test Organizer Alice')), points: 150, credibilityScore: 75, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  event_representative: {
    uid: 'mock-representative-uid', email: 'representative.test@example.com', displayName: 'Test Event Rep Bob', role: 'event_representative', photoURL: 'https://placehold.co/100x100.png?text=ERB', department: 'Event Management', assignedEventSlug: 'ex-quiz-it',
    tasks: [
        createTaskObject(mockTasksData[1], 'task-er-1', ['Test Event Rep Bob'], 'Overall Head Carol'),
    ].filter(task => task.assignedTo?.includes('Test Event Rep Bob')), points: 200, credibilityScore: 80, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  overall_head: {
    uid: 'mock-overall-head-uid', email: 'overall.test@example.com', displayName: 'Test Overall Head Carol', role: 'overall_head', photoURL: 'https://placehold.co/100x100.png?text=OHC', department: 'Coordination',
    tasks: [
         createTaskObject(mockTasksData[6], 'task-oh-1', ['Test Overall Head Carol'], 'Admin Dave'),
    ].filter(task => task.assignedTo?.includes('Test Overall Head Carol')), points: 300, credibilityScore: 85, allPlatformParticipants: mockGlobalParticipants, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  admin: {
    uid: 'mock-admin-uid', email: 'admin.test@example.com', displayName: 'Test Admin Dave', role: 'admin', photoURL: 'https://placehold.co/100x100.png?text=TAD', department: 'Administration',
    tasks: [
        createTaskObject(mockTasksData[5], 'task-adm-1', ['Test Admin Dave'], 'System'),
    ].filter(task => task.assignedTo?.includes('Test Admin Dave')), points: 500, credibilityScore: 95, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  test: {
    uid: 'mock-test-uid-67890', email: 'generic.test@example.com', displayName: 'Sam Williams (Test)', role: 'test', photoURL: 'https://placehold.co/120x120.png?text=SW',
    fullName: 'Sam Williams', schoolName: 'Testington Academy Global', schoolId: 'school_003', schoolVerifiedByOrganizer: true, standard: '12', division: 'B',
    phoneNumbers: ['+1-555-0201'],
    registeredEvents: [ { eventSlug: 'robo-challenge', teamName: 'RoboKnights', eventDate: '2024-11-28', admitCardStatus: 'pending' }, { eventSlug: 'math-a-maze', eventDate: '2024-11-22', admitCardStatus: 'unavailable'} ], department: 'QA',
    tasks: [ { ...createTaskObject(mockTasksData[1], 'task-test-1', ['Sam Williams (Test)'], 'Overall Head Carol'), title: 'Verify Quiz Task Functionality', eventSlug: 'ex-quiz-it', priority: 'Low' }
    ].filter(task => task.assignedTo?.includes('Sam Williams (Test)')), points: 50, credibilityScore: 60, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  }
};

interface AuthContextType {
  authUser: FirebaseUser | null;
  userProfile: UserProfileData | null;
  loading: boolean;
  logIn: (data: LoginFormData | UserRole) => Promise<FirebaseUser | AuthError | { message: string }>;
  logOut: () => Promise<void>;
  setMockUserRole: (role: UserRole | null) => void;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfileData | null>>; // Keep for direct updates if needed
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setAuthUser(firebaseUser);
        console.log("[AuthContext] onAuthStateChanged: Firebase user detected:", firebaseUser.uid, firebaseUser.email);
        
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          console.log("[AuthContext] Attempting to fetch profile from Firestore for UID:", firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const fetchedProfileFromStore = userDocSnap.data();

            // Convert Firestore Timestamps to ISO strings if they exist
            const convertTimestamp = (timestampField: any) => 
              timestampField && typeof timestampField.toDate === 'function' 
              ? timestampField.toDate().toISOString() 
              : timestampField;

            const profileWithConvertedDates: UserProfileData = {
              ...fetchedProfileFromStore,
              uid: firebaseUser.uid, // Ensure UID is from authUser
              email: firebaseUser.email, // Ensure email is from authUser
              createdAt: convertTimestamp(fetchedProfileFromStore.createdAt),
              updatedAt: convertTimestamp(fetchedProfileFromStore.updatedAt),
            } as UserProfileData;

            console.log("[AuthContext] Firestore profile FOUND for UID:", firebaseUser.uid, profileWithConvertedDates);
            setUserProfile(profileWithConvertedDates);
          } else {
            console.warn("[AuthContext] Firestore profile NOT FOUND for UID:", firebaseUser.uid);
            // This case can happen if a user was created in Auth but Firestore doc creation failed
            // Or if it's an old user before profile creation was robust.
            // For now, set a minimal profile or clear existing one.
            // If this user just signed up, the signup page itself handles profile creation before redirecting to login.
            // So, if they land here after login and no profile, it's an issue.
             setUserProfile(null); // Or a minimal default, but null forces login/signup flow if needed
          }
        } catch (error) {
            console.error("[AuthContext] Error fetching user profile from Firestore:", error);
            setUserProfile(null); // Fallback if Firestore read fails
        }
      } else {
        console.log("[AuthContext] onAuthStateChanged: No Firebase user.");
        setAuthUser(null);
        setUserProfile(null);
        if (typeof window !== "undefined") localStorage.removeItem('mockUserRole');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);


  const setMockUserRole = (role: UserRole | null, triggerLoading: boolean = true) => {
    if (triggerLoading) setLoading(true);
    if (role && mockUserProfiles[role]) {
      const profile = mockUserProfiles[role];
      const mockFbUser: FirebaseUser = {
        uid: profile.uid, email: profile.email, displayName: profile.displayName, photoURL: profile.photoURL,
        emailVerified: true, isAnonymous: false, metadata: {}, providerData: [], providerId: 'mock',
        refreshToken: 'mock-refresh-token', tenantId: null, delete: async () => {}, getIdToken: async () => 'mock-id-token',
        getIdTokenResult: async () => ({ token: 'mock-id-token', claims: {}, expirationTime: '', issuedAtTime: '', signInProvider: null, signInSecondFactor: null}),
        reload: async () => {}, toJSON: () => ({}),
      } as FirebaseUser; 

      setAuthUser(mockFbUser);
      setUserProfile(profile);
      if (typeof window !== "undefined") localStorage.setItem('mockUserRole', role);
    } else {
      setAuthUser(null);
      setUserProfile(null);
      if (typeof window !== "undefined") localStorage.removeItem('mockUserRole');
    }
    if (triggerLoading) setLoading(false);
  };

  const logIn = async (data: LoginFormData | UserRole): Promise<FirebaseUser | AuthError | { message: string }> => {
    setLoading(true);
    if (typeof data === 'object' && 'email' in data && 'password' in data) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
        // onAuthStateChanged will handle fetching profile from Firestore.
        const matchingMockProfile = Object.values(mockUserProfiles).find(p => p.email === data.email);
        if (matchingMockProfile) {
            if (typeof window !== "undefined") localStorage.setItem('mockUserRole', matchingMockProfile.role);
        } else {
             if (typeof window !== "undefined") localStorage.removeItem('mockUserRole');
        }
        setLoading(false);
        return userCredential.user;
      } catch (error) {
        console.error("Firebase SignIn Error:", error);
        setAuthUser(null);
        setUserProfile(null);
        if (typeof window !== "undefined") localStorage.removeItem('mockUserRole');
        setLoading(false);
        return error as AuthError;
      }
    } else if (typeof data === 'string' && mockUserProfiles[data as UserRole]) {
      setMockUserRole(data as UserRole, false); 
      const profile = mockUserProfiles[data as UserRole];
       setLoading(false);
      return {
          uid: profile.uid, email: profile.email, displayName: profile.displayName, photoURL: profile.photoURL,
          emailVerified: true, isAnonymous: false, metadata: {}, providerData: [], providerId: 'mock',
          refreshToken: 'mock-refresh-token', tenantId: null, delete: async () => {}, getIdToken: async () => 'mock-id-token',
          getIdTokenResult: async () => ({ token: 'mock-id-token', claims: {}, expirationTime: '', issuedAtTime: '', signInProvider: null, signInSecondFactor: null}),
          reload: async () => {}, toJSON: () => ({}),
      } as FirebaseUser;
    } else {
      setLoading(false);
      return { message: "Invalid login data provided." };
    }
  };

  const logOut = async () => {
    setLoading(true);
    await auth.signOut(); 
    setLoading(false);
  };

  const value = {
    authUser, userProfile, loading,
    logIn, logOut,
    setMockUserRole, setUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

    