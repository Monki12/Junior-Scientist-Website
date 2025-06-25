
'use client';

import { type User as FirebaseUser, onAuthStateChanged, signInWithEmailAndPassword, type AuthError } from 'firebase/auth';
import { createContext, useState, useEffect, ReactNode } from 'react';
import type { LoginFormData, UserProfileData, UserRole } from '@/types';
import { auth, db } from '@/lib/firebase'; 
import { doc, getDoc } from 'firebase/firestore'; 

interface AuthContextType {
  authUser: FirebaseUser | null;
  userProfile: UserProfileData | null;
  loading: boolean;
  logIn: (formData: LoginFormData) => Promise<FirebaseUser | AuthError>;
  setMockUserRole: (role: UserRole) => void;
  logOut: () => Promise<void>;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfileData | null>>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("Setting up auth state listener...");
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setAuthUser(firebaseUser);
        console.log("[AuthContext] onAuthStateChanged: Firebase user detected:", firebaseUser.uid);
        
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          console.log("[AuthContext] Attempting to fetch profile from Firestore for UID:", firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const fetchedProfileFromStore = userDocSnap.data();

            const convertTimestamp = (timestampField: any) => 
              timestampField && typeof timestampField.toDate === 'function' 
              ? timestampField.toDate().toISOString() 
              : timestampField;

            const profileWithConvertedDates: UserProfileData = {
              ...fetchedProfileFromStore,
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              createdAt: convertTimestamp(fetchedProfileFromStore.createdAt),
              updatedAt: convertTimestamp(fetchedProfileFromStore.updatedAt),
            } as UserProfileData;

            console.log("[AuthContext] Firestore profile FOUND for UID:", firebaseUser.uid);
            setUserProfile(profileWithConvertedDates);
          } else {
            console.warn("[AuthContext] Firestore profile NOT FOUND for UID:", firebaseUser.uid);
            setUserProfile(null);
          }
        } catch (error) {
            console.error("[AuthContext] Error fetching user profile from Firestore:", error);
            setUserProfile(null);
        }
      } else {
        console.log("[AuthContext] onAuthStateChanged: No Firebase user.");
        setAuthUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
    
    console.log("Auth state listener setup complete.");
    return () => {
      console.log("Auth state listener unsubscribed.");
      unsubscribe();
    };
  }, []);

  const logIn = async (formData: LoginFormData): Promise<FirebaseUser | AuthError> => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      // onAuthStateChanged will handle setting state
      return userCredential.user;
    } catch (error) {
      console.error("[AuthContext] Login Error:", error);
      setLoading(false); // Only set loading false on error, success is handled by onAuthStateChanged
      return error as AuthError;
    }
  };

  const setMockUserRole = (role: UserRole) => {
    const mockEmail = `${role.replace(/_/g, '.')}.test@example.com`;
    const mockUser = {
      uid: `mock-uid-${role}`,
      email: mockEmail,
      displayName: `Mock ${role}`,
    } as FirebaseUser;

    const mockProfile: UserProfileData = {
      uid: mockUser.uid,
      email: mockUser.email,
      role: role,
      displayName: `Mock ${role.replace('_', ' ')}`,
      fullName: `Mock ${role.replace('_', ' ')}`,
      shortId: role === 'student' ? 'S12345' : null,
      collegeRollNumber: role !== 'student' ? 'BTXXTESTXXX' : null,
      department: role !== 'student' ? 'Testing Dept.' : undefined,
    };
    
    setAuthUser(mockUser);
    setUserProfile(mockProfile);
    setLoading(false);
  };

  const logOut = async () => {
    setLoading(true);
    // For mock users, authUser is set but isn't a real Firebase user.
    // The uid check distinguishes them.
    if(authUser?.uid.startsWith('mock-')) {
        setAuthUser(null);
        setUserProfile(null);
        setLoading(false);
    } else {
      await auth.signOut();
      // The onAuthStateChanged listener will handle clearing user state for real users.
    }
  };

  const value = {
    authUser,
    userProfile,
    loading,
    logIn,
    setMockUserRole,
    logOut,
    setUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
