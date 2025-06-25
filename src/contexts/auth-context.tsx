
'use client';

import { type User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { createContext, useState, useEffect, ReactNode } from 'react';
import type { UserProfileData } from '@/types';
import { auth, db } from '@/lib/firebase'; 
import { doc, getDoc } from 'firebase/firestore'; 

interface AuthContextType {
  authUser: FirebaseUser | null;
  userProfile: UserProfileData | null;
  loading: boolean;
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

  const logOut = async () => {
    setLoading(true);
    await auth.signOut(); 
    // The onAuthStateChanged listener will handle clearing user state.
    console.log("[AuthContext] User logged out.");
  };

  const value = {
    authUser, userProfile, loading,
    logOut,
    setUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
