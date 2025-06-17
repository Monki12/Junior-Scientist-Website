
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
  test: {
    uid: 'mock-test-uid',
    email: 'generic.test@example.com',
    displayName: 'Generic Test User',
    role: 'test',
    photoURL: 'https://placehold.co/100x100.png?text=TU',
  }
};

interface AuthContextType {
  authUser: FirebaseUser | null;
  userProfile: UserProfileData | null;
  loading: boolean;
  signUp: (data: SignUpFormData) => Promise<FirebaseUser | AuthError | { message: string }>; // Adjusted return type for mock
  logIn: (data: LoginFormData | UserRole) => Promise<FirebaseUser | AuthError | { message: string }>; // Adjusted for mock role login
  logOut: () => Promise<void>;
  setMockUserRole: (role: UserRole | null) => void; // Exposed to allow changing mock user
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true); // Start true, then quickly set to false

  // Initialize with a default mock user or no user
  useEffect(() => {
    // For this mock setup, we don't listen to onAuthStateChanged
    // We can set a default mock user or start logged out
    // To start logged out:
    setAuthUser(null);
    setUserProfile(null);
    // Or to start as a default 'student':
    // setMockUserRole('student'); 
    setLoading(false);
  }, []);

  const setMockUserRole = (role: UserRole | null) => {
    setLoading(true);
    if (role && mockUserProfiles[role]) {
      const profile = mockUserProfiles[role];
      // Create a simplified FirebaseUser-like object
      const mockFbUser: FirebaseUser = {
        uid: profile.uid,
        email: profile.email,
        displayName: profile.displayName,
        photoURL: profile.photoURL,
        // Add other required FirebaseUser properties as needed, with dummy values
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
      } as FirebaseUser; // Type assertion

      setAuthUser(mockFbUser);
      setUserProfile(profile);
    } else {
      setAuthUser(null);
      setUserProfile(null);
    }
    setLoading(false);
  };

  const signUp = async (data: SignUpFormData): Promise<{ message: string }> => {
    console.warn("Mock Auth: signUp called. In mock mode, new users are not actually created. Defaulting to student or use login page to select role.");
    // Simulate setting a default user, e.g., student, or do nothing
    // setMockUserRole('student'); // Optionally auto-login as student on mock signup
    return { message: "Sign up is in mock mode. Please use mock login." };
  };

  const logIn = async (data: LoginFormData | UserRole): Promise<{ message: string } | FirebaseUser> => {
    console.warn("Mock Auth: logIn called.");
    if (typeof data === 'string' && mockUserProfiles[data as UserRole]) { // Login by role
      setMockUserRole(data as UserRole);
      // Return the mock FirebaseUser object
      return authUser || { message: "Mock login successful but authUser not set." } as any;
    } else if (typeof data === 'object' && data.email) { // Login by email (attempt to match)
        const roleToLogin = Object.values(mockUserProfiles).find(p => p.email === data.email)?.role;
        if (roleToLogin) {
            setMockUserRole(roleToLogin);
            return authUser || { message: "Mock login successful but authUser not set." } as any;
        }
    }
    setMockUserRole('student'); // Default to student if no specific role is matched
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
    setMockUserRole, // Expose this for the login page
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
