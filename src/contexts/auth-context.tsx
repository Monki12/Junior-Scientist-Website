
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
    registeredEvents: [
      { eventSlug: 'model-united-nations' }, 
      { eventSlug: 'ex-quiz-it', teamName: 'Quiz Wizards' }
    ], 
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
    role: 'test', 
    photoURL: 'https://placehold.co/100x100.png?text=TU',
    school: 'Testington Academy',
    grade: '12th Grade',
    registeredEvents: [{ eventSlug: 'robo-challenge', teamName: 'RoboKnights' }],
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
      // Re-fetch from mock to ensure we return the "correct" (latest set) authUser
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

