
'use client';

import { createUserWithEmailAndPassword, signInWithEmailAndPassword, type User as FirebaseUser, type AuthError } from 'firebase/auth';
import { createContext, useState, useEffect, ReactNode } from 'react';
import type { SignUpFormData, LoginFormData, UserProfileData, UserRole, Task, RegisteredEventInfo, EventParticipant } from '@/types';
import { auth } from '@/lib/firebase';
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
  { id: 'stud-global-3', name: 'Global Charlie Brown', email: 'charlie.brown.global@example.com', contactNumber: '555-9012', schoolName: 'Springfield High', registrationDate: new Date('2024-07-03T09:15:00Z').toISOString(), paymentStatus: 'paid', registeredEventSlugs: ['math-a-maze'], customData: {} },
  { id: 'stud-global-4', name: 'Global Diana Prince', email: 'diana.prince.global@example.com', contactNumber: '555-3456', schoolName: 'Riverside Prep', registrationDate: new Date('2024-07-04T14:00:00Z').toISOString(), paymentStatus: 'waived', registeredEventSlugs: ['model-united-nations', 'junior-scientist-olympiad'], customData: { notes: 'VIP Guest.'} },
  { id: 'stud-global-5', name: 'Global Edward Nigma', email: 'edward.nigma.global@example.com', contactNumber: '555-7890', schoolName: 'Northwood Academy', registrationDate: new Date('2024-07-05T16:45:00Z').toISOString(), paymentStatus: 'failed', registeredEventSlugs: ['ex-quiz-it', 'maze-to-mastery'], customData: {} },
  { id: 'stud-global-6', name: 'Global Fiona Gallagher', email: 'fiona.gallagher.global@example.com', contactNumber: '555-2345', schoolName: 'Springfield High', registrationDate: new Date('2024-07-06T08:00:00Z').toISOString(), paymentStatus: 'paid', registeredEventSlugs: ['robo-challenge', 'math-a-maze', 'junior-scientist-olympiad'], customData: {} },
  { id: 'stud-global-7', name: 'Student Test User', email: 'student.test@example.com', contactNumber: '555-0101', schoolName: 'Springfield High International', registrationDate: new Date('2024-07-07T08:00:00Z').toISOString(), paymentStatus: 'paid', registeredEventSlugs: ['model-united-nations', 'ex-quiz-it', 'robo-challenge'], customData: {} },
];

const mockUserProfiles: Record<UserRole, UserProfileData> = {
  student: {
    uid: 'mock-student-uid-12345', email: 'student.test@example.com', displayName: 'Alex Johnson', role: 'student', photoURL: 'https://placehold.co/120x120.png?text=AJ',
    fullName: 'Alex Johnson', schoolName: 'Springfield High International', schoolId: 'school_001', schoolVerifiedByOrganizer: true, standard: '10', division: 'A',
    phoneNumbers: ['+1-555-0101', '+1-555-0102'], registeredEvents: mockStudentRegisteredEvents, tasks: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  organizer: {
    uid: 'mock-organizer-uid', email: 'organizer.test@example.com', displayName: 'Test Organizer Alice', role: 'organizer', photoURL: 'https://placehold.co/100x100.png?text=TOA', department: 'Logistics', assignedEventSlugs: ['model-united-nations', 'robo-challenge', 'junior-scientist-olympiad', 'math-a-maze'],
    tasks: [
        createTaskObject(mockTasksData[0], 'task-org-1', ['Test Organizer Alice'], 'Overall Head Carol'),
        createTaskObject(mockTasksData[3], 'task-org-2', ['Test Organizer Alice'], 'Event Rep Bob'),
        createTaskObject(mockTasksData[4], 'task-org-3', ['Test Organizer Alice', 'David (Organizer)'], 'Test Organizer Alice'),
        createTaskObject(mockTasksData[8], 'task-org-4', ['Test Organizer Alice'], 'Overall Head Carol'),
        createTaskObject(mockTasksData[9], 'task-org-5', ['Test Organizer Alice'], 'Event Rep Bob'),
    ].filter(task => task.assignedTo?.includes('Test Organizer Alice')), points: 150, credibilityScore: 75, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  event_representative: {
    uid: 'mock-representative-uid', email: 'representative.test@example.com', displayName: 'Test Event Rep Bob', role: 'event_representative', photoURL: 'https://placehold.co/100x100.png?text=ERB', department: 'Event Management', assignedEventSlug: 'ex-quiz-it',
    tasks: [
        createTaskObject(mockTasksData[1], 'task-er-1', ['Test Event Rep Bob'], 'Overall Head Carol'),
        { ...createTaskObject(mockTasksData[2], 'task-er-2', ['Test Organizer Alice'], 'Test Event Rep Bob'), title: 'Follow up on Auditorium Booking for Ex-Quiz-It', eventSlug: 'ex-quiz-it', priority: 'Medium', assignedTo:['Test Event Rep Bob'] }
    ].filter(task => task.assignedTo?.includes('Test Event Rep Bob')), points: 200, credibilityScore: 80, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  overall_head: {
    uid: 'mock-overall-head-uid', email: 'overall.test@example.com', displayName: 'Test Overall Head Carol', role: 'overall_head', photoURL: 'https://placehold.co/100x100.png?text=OHC', department: 'Coordination',
    tasks: [
         createTaskObject(mockTasksData[6], 'task-oh-1', ['Test Overall Head Carol'], 'Admin Dave'),
         { ...createTaskObject(mockTasksData[0], 'task-oh-2', ['Test Organizer Alice'], 'Test Overall Head Carol'), id: 'task-oh-mun-oversee', title: 'Oversee MUN Handbook Creation', assignedTo: ['Test Overall Head Carol'] }
    ].filter(task => task.assignedTo?.includes('Test Overall Head Carol')), points: 300, credibilityScore: 85, allPlatformParticipants: mockGlobalParticipants, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  admin: {
    uid: 'mock-admin-uid', email: 'admin.test@example.com', displayName: 'Test Admin Dave', role: 'admin', photoURL: 'https://placehold.co/100x100.png?text=TAD', department: 'Administration',
    tasks: [
        createTaskObject(mockTasksData[5], 'task-adm-1', ['Test Admin Dave'], 'System'),
        createTaskObject(mockTasksData[7], 'task-adm-2', ['Test Admin Dave'], 'System')
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
  signUp: (data: SignUpFormData) => Promise<FirebaseUser | AuthError | { code: string; message: string }>;
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
    if (storedRole && mockUserProfiles[storedRole]) {
      setMockUserRole(storedRole, false); // false to avoid double loading
    } else {
      setAuthUser(null);
      setUserProfile(null);
      if (typeof window !== "undefined") {
          localStorage.removeItem('mockUserRole');
      }
    }
    setLoading(false);
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

  const signUp = async (data: SignUpFormData): Promise<FirebaseUser | AuthError | { code: string; message: string }> => {
    setLoading(true);
    try {
      // Grade Validation (numeric standard between 4 and 12)
      const numericStandard = parseInt(data.standard, 10);
      if (isNaN(numericStandard) || numericStandard < 4 || numericStandard > 12) {
        setLoading(false);
        return { code: 'validation/invalid-grade', message: 'Standard must be between Grade 4 and Grade 12.' };
      }

      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const firebaseUser = userCredential.user;
      setAuthUser(firebaseUser);

      // Simulate school verification
      const schoolNameLower = data.schoolName.toLowerCase();
      const matchedSchool = mockSchoolsData.find(school => school.name.toLowerCase() === schoolNameLower);

      const currentTimestamp = new Date().toISOString();
      const newProfile: UserProfileData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: data.fullName, // Use fullName from form
        role: 'student', // Enforce student role
        photoURL: firebaseUser.photoURL,
        fullName: data.fullName,
        schoolName: data.schoolName,
        schoolId: matchedSchool?.id,
        schoolVerifiedByOrganizer: !!matchedSchool,
        standard: data.standard, // Store the numeric string e.g. "10"
        division: data.division || undefined, // Store as undefined if empty
        registeredEvents: [],
        tasks: [],
        createdAt: currentTimestamp,
        updatedAt: currentTimestamp,
      };
      setUserProfile(newProfile);
      if (typeof window !== "undefined") localStorage.setItem('mockUserRole', 'student');
      
      // In a real app, here you would call a Cloud Function to save newProfile to Firestore.
      // For simulation, we are directly setting it in context.
      
      setLoading(false);
      return firebaseUser;
    } catch (error) {
      console.error("Firebase SignUp Error:", error);
      setLoading(false);
      return error as AuthError;
    }
  };

  const logIn = async (data: LoginFormData | UserRole): Promise<FirebaseUser | AuthError | { message: string }> => {
    setLoading(true);
    if (typeof data === 'object' && 'email' in data && 'password' in data) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
        const firebaseUser = userCredential.user;
        setAuthUser(firebaseUser);

        // Try to find a matching mock profile
        const matchingMockProfile = Object.values(mockUserProfiles).find(p => p.email === firebaseUser.email);
        if (matchingMockProfile) {
          setUserProfile(matchingMockProfile);
          if (typeof window !== "undefined") localStorage.setItem('mockUserRole', matchingMockProfile.role);
        } else {
          // If no detailed mock profile, and this user was not created via our new signUp flow
          // (which would have set a 'student' profile), then create a default student profile.
          // This simulates fetching from Firestore or creating a default if not found.
          // For now, we assume any Firebase user not in mocks is a new student or a student
          // whose detailed profile wasn't pre-loaded in mockUserProfiles.
           const currentTimestamp = new Date().toISOString();
           const basicProfile: UserProfileData = {
            uid: firebaseUser.uid, email: firebaseUser.email,
            displayName: firebaseUser.displayName || firebaseUser.email,
            role: 'student',
            photoURL: firebaseUser.photoURL,
            fullName: firebaseUser.displayName || firebaseUser.email,
            schoolName: 'Unknown School (Please update profile)',
            schoolVerifiedByOrganizer: false,
            standard: 'N/A',
            registeredEvents: [], tasks: [],
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
          };
          setUserProfile(basicProfile);
          if (typeof window !== "undefined") localStorage.setItem('mockUserRole', 'student');
        }
        setLoading(false);
        return firebaseUser;
      } catch (error) {
        console.error("Firebase SignIn Error:", error);
        setAuthUser(null);
        setUserProfile(null);
        if (typeof window !== "undefined") localStorage.removeItem('mockUserRole');
        setLoading(false);
        return error as AuthError;
      }
    } else if (typeof data === 'string' && mockUserProfiles[data as UserRole]) {
      setMockUserRole(data as UserRole);
      const profile = mockUserProfiles[data as UserRole];
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
    // await auth.signOut(); // For real Firebase sessions
    setAuthUser(null);
    setUserProfile(null);
    if (typeof window !== "undefined") localStorage.removeItem('mockUserRole');
    setLoading(false);
  };

  const value = {
    authUser, userProfile, loading,
    signUp, logIn, logOut,
    setMockUserRole, setUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
