
'use client';

import type { User as FirebaseUser, AuthError } from 'firebase/auth';
import { createContext, useState, useEffect, ReactNode } from 'react';
// Firebase imports are kept for type consistency, but auth calls will be mocked.
// import { auth, db } from '@/lib/firebase'; 
// import { onAuthStateChanged, signOut as firebaseSignOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
// import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import type { SignUpFormData, LoginFormData, UserProfileData, UserRole } from '@/types';

// --- MOCK DATA ---
const mockUserProfiles: Record<UserRole, UserProfileData> = {
  student: {
    uid: 'mock-student-uid',
    email: 'student.test@example.com',
    displayName: 'Test Student',
    role: 'student',
    photoURL: 'https://placehold.co/100x100.png?text=TS',
    school: 'Springfield High',
    grade: '10th Grade',
    registeredEventSlugs: ['model-united-nations', 'ex-quiz-it'], 
  },
  organizer: {
    uid: 'mock-organizer-uid',
    email: 'organizer.test@example.com',
    displayName: 'Test Organizer',
    role: 'organizer',
    photoURL: 'https://placehold.co/100x100.png?text=TO',
  },
  event_representative: {
    uid: 'mock-representative-uid',
    email: 'representative.test@example.com',
    displayName: 'Test Representative',
    role: 'event_representative',
    photoURL: 'https://placehold.co/100x100.png?text=TR',
  },
  overall_head: {
    uid: 'mock-overall-head-uid',
    email: 'overall.test@example.com',
    displayName: 'Test Overall Head',
    role: 'overall_head',
    photoURL: 'https://placehold.co/100x100.png?text=OH',
  },
  admin: {
    uid: 'mock-admin-uid',
    email: 'admin.test@example.com',
    displayName: 'Test Admin',
    role: 'admin',
    photoURL: 'https://placehold.co/100x100.png?text=TA',
  },
  test: { // Generic test user, can act as student for UI
    uid: 'mock-test-uid',
    email: 'generic.test@example.com',
    displayName: 'Generic Test User',
    role: 'test', // This role will often be treated like 'student' in UI logic
    photoURL: 'https://placehold.co/100x100.png?text=TU',
    school: 'Testington Academy',
    grade: '12th Grade',
    registeredEventSlugs: ['robo-challenge'],
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
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfileData | null>>; // Added for profile updates
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
      loggedInUser = authUser; // authUser state might not update immediately
    } else if (typeof data === 'object' && data.email) { 
        const roleToLogin = Object.values(mockUserProfiles).find(p => p.email === data.email)?.role;
        if (roleToLogin) {
            setMockUserRole(roleToLogin);
            loggedInUser = authUser; // authUser state might not update immediately
        }
    } else {
      setMockUserRole('student'); 
      loggedInUser = authUser; // authUser state might not update immediately
    }
    
    // To ensure we return the "correct" (latest set) authUser, we can re-fetch from mockUserProfiles
    if (userProfile) { // If userProfile was set by setMockUserRole
      const profile = mockUserProfiles[userProfile.role];
       const mockFbUser: FirebaseUser = {
        uid: profile.uid, email: profile.email, displayName: profile.displayName, photoURL: profile.photoURL,
        emailVerified: true, isAnonymous: false, metadata: {}, providerData: [], providerId: 'mock', refreshToken: 'mock-refresh-token', tenantId: null,
        delete: async () => {}, getIdToken: async () => 'mock-id-token', getIdTokenResult: async () => ({ token: 'mock-id-token', claims: {}, expirationTime: '', issuedAtTime: '', signInProvider: null, signInSecondFactor: null}),
        reload: async () => {}, toJSON: () => ({}),
      } as FirebaseUser;
      return mockFbUser;
    }

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
    setUserProfile, // Expose setUserProfile for profile page updates
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
