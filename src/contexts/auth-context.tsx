
'use client';

import type { User as FirebaseUser, AuthError } from 'firebase/auth';
import { createContext, useState, useEffect, ReactNode } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import type { SignUpFormData, LoginFormData, UserProfileData, UserRole } from '@/types';

interface AuthContextType {
  authUser: FirebaseUser | null; // Firebase Auth user object
  userProfile: UserProfileData | null; // Custom user profile data from Firestore (includes role)
  loading: boolean;
  signUp: (data: SignUpFormData) => Promise<FirebaseUser | AuthError>;
  logIn: (data: LoginFormData) => Promise<FirebaseUser | AuthError>;
  logOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentAuthUser) => {
      setLoading(true);
      if (currentAuthUser) {
        setAuthUser(currentAuthUser);
        const userDocRef = doc(db, 'users', currentAuthUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          setUserProfile({ uid: currentAuthUser.uid, ...userDocSnap.data() } as UserProfileData);
        } else {
          // Profile doesn't exist, create a default one (e.g., for users created before this system or first login)
          const newProfileData: UserProfileData = {
            uid: currentAuthUser.uid,
            email: currentAuthUser.email,
            displayName: currentAuthUser.displayName,
            role: 'student', // Default role
            photoURL: currentAuthUser.photoURL,
            // createdAt: serverTimestamp(), // Consider adding a creation timestamp
          };
          try {
            await setDoc(userDocRef, newProfileData);
            setUserProfile(newProfileData);
          } catch (error) {
            console.error("Error creating user profile in Firestore:", error);
            // Handle error case, maybe sign out user or set a default local profile
          }
        }
      } else {
        setAuthUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signUp = async (data: SignUpFormData) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const firebaseUser = userCredential.user;

      // Update Firebase Auth profile if name is provided
      if (data.name) {
        await updateProfile(firebaseUser, { displayName: data.name });
      }
      
      // Create user profile in Firestore
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const newUserProfile: UserProfileData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: data.name || firebaseUser.displayName,
        role: 'student', // Default role for new sign-ups
        photoURL: firebaseUser.photoURL,
        // createdAt: serverTimestamp(), 
      };
      await setDoc(userDocRef, newUserProfile);
      
      setAuthUser(firebaseUser); // Update authUser state
      setUserProfile(newUserProfile); // Update userProfile state

      return firebaseUser;
    } catch (error) {
      console.error("Error during sign up:", error);
      return error as AuthError;
    }
  };

  const logIn = async (data: LoginFormData) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      // onAuthStateChanged will handle fetching/setting authUser and userProfile
      return userCredential.user;
    } catch (error) {
      console.error("Error during log in:", error);
      return error as AuthError;
    }
  };

  const logOut = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setAuthUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error("Error signing out: ", error);
      // toast({ title: 'Logout Failed', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };
  

  const value = {
    authUser,
    userProfile,
    loading,
    signUp,
    logIn,
    logOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
