

'use client';

import { type User as FirebaseUser, onAuthStateChanged, signInWithEmailAndPassword, type AuthError } from 'firebase/auth';
import { createContext, useState, useEffect, ReactNode } from 'react';
import type { LoginFormData, UserProfileData, UserRole } from '@/types';
import { auth, db } from '@/lib/firebase'; 
import { doc, getDoc, DocumentData } from 'firebase/firestore'; 

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

const convertTimestamps = (data: DocumentData): any => {
    if (!data) return data;
    const newData: { [key: string]: any } = {};
    for (const key in data) {
        const value = data[key];
        if (value && typeof value.toDate === 'function') {
            newData[key] = value.toDate().toISOString();
        } else if (Array.isArray(value)) {
            newData[key] = value.map(item => (item && typeof item.toDate === 'function' ? item.toDate().toISOString() : item));
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            newData[key] = convertTimestamps(value);
        } else {
            newData[key] = value;
        }
    }
    return newData;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setAuthUser(firebaseUser);
        
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const fetchedProfileFromStore = userDocSnap.data();
            const profileWithConvertedDates = convertTimestamps(fetchedProfileFromStore) as UserProfileData;
            
            setUserProfile({
              ...profileWithConvertedDates,
              uid: firebaseUser.uid,
              email: firebaseUser.email,
            });

          } else {
            console.warn("[AuthContext] Firestore profile NOT FOUND for UID:", firebaseUser.uid);
            setUserProfile(null);
          }
        } catch (error) {
            console.error("[AuthContext] Error fetching user profile from Firestore:", error);
            setUserProfile(null);
        }
      } else {
        setAuthUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const logIn = async (formData: LoginFormData): Promise<FirebaseUser | AuthError> => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      return userCredential.user;
    } catch (error) {
      console.error("[AuthContext] Login Error:", error);
      setLoading(false);
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
      credibilityScore: 120,
    };
    
    setAuthUser(mockUser);
    setUserProfile(mockProfile);
    setLoading(false);
  };

  const logOut = async () => {
    setLoading(true);
    if(authUser?.uid.startsWith('mock-')) {
        setAuthUser(null);
        setUserProfile(null);
        setLoading(false);
    } else {
      await auth.signOut();
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
