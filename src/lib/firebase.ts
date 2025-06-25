
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

if (
  !firebaseConfig.apiKey ||
  !firebaseConfig.authDomain ||
  !firebaseConfig.projectId
) {
  console.error("[firebase.ts] CRITICAL ERROR: Firebase configuration is missing. Ensure environment variables are set and NEXT_PUBLIC_ prefixed.");
  // Provide default empty objects to prevent runtime errors if config is missing,
  // though the app will not function correctly.
  app = {} as FirebaseApp;
  auth = {} as Auth;
  db = {} as Firestore;
  storage = {} as FirebaseStorage;
} else {
  if (!getApps().length) {
    try {
      app = initializeApp(firebaseConfig);
    } catch (e: any) {
      console.error("[firebase.ts] CRITICAL ERROR during initializeApp:", e.message, e);
      app = {} as FirebaseApp; 
    }
  } else {
    app = getApp();
  }

  try {
    auth = getAuth(app);
  } catch (e: any) {
    console.error("[firebase.ts] CRITICAL ERROR during getAuth(app):", e.message, e);
    auth = {} as Auth;
  }

  try {
    db = getFirestore(app);
  } catch (e: any) {
    console.error("[firebase.ts] CRITICAL ERROR during getFirestore(app):", e.message, e);
    db = {} as Firestore;
  }

  try {
    storage = getStorage(app);
  } catch (e: any) {
    console.error("[firebase.ts] CRITICAL ERROR during getStorage(app):", e.message, e);
    storage = {} as FirebaseStorage;
  }
}

export { app, auth, db, storage };
