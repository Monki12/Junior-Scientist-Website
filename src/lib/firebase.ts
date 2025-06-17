
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
// import { getAnalytics, type Analytics } from 'firebase/analytics'; // Analytics not used currently

// ** USING HARDCODED CONFIG FOR DIAGNOSTICS **
// These values were provided by you.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// --- CRITICAL DIAGNOSTIC LOGS ---
// console.log("--- [firebase.ts] Start of Firebase Initialization ---");
// console.log("[firebase.ts] Attempting to load Firebase config from process.env.");
// console.log("[firebase.ts] Config Value - NEXT_PUBLIC_FIREBASE_API_KEY:", process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? `"${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}"` : "MISSING or UNDEFINED");
// console.log("[firebase.ts] Config Value - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:", process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? `"${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}"` : "MISSING or UNDEFINED");
// console.log("[firebase.ts] Config Value - NEXT_PUBLIC_FIREBASE_PROJECT_ID:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? `"${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}"` : "MISSING or UNDEFINED");
// console.log("[firebase.ts] Config Value - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:", process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? `"${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}"` : "MISSING or UNDEFINED");
// console.log("[firebase.ts] Config Value - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:", process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? `"${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}"` : "MISSING or UNDEFINED");
// console.log("[firebase.ts] Config Value - NEXT_PUBLIC_FIREBASE_APP_ID:", process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? `"${process.env.NEXT_PUBLIC_FIREBASE_APP_ID}"` : "MISSING or UNDEFINED");
// console.log("[firebase.ts] Config Value - NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID:", process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ? `"${process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID}"` : "NOT SET or UNDEFINED");


let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (
  !firebaseConfig.apiKey ||
  !firebaseConfig.authDomain ||
  !firebaseConfig.projectId
) {
  console.error("[firebase.ts] CRITICAL ERROR: Firebase configuration is missing. Ensure environment variables are set and NEXT_PUBLIC_ prefixed.");
  // Provide dummy objects to prevent app from crashing immediately,
  // though Firebase functionality will not work.
  app = {} as FirebaseApp;
  auth = {} as Auth;
  db = {} as Firestore;
} else {
  if (!getApps().length) {
    // console.log("[firebase.ts] No Firebase apps initialized. Initializing new app...");
    try {
      app = initializeApp(firebaseConfig);
      // console.log("[firebase.ts] Firebase app INITIALIZED successfully.");
    } catch (e: any) {
      console.error("[firebase.ts] CRITICAL ERROR during initializeApp:", e.message, e);
      app = {} as FirebaseApp; 
    }
  } else {
    // console.log("[firebase.ts] Firebase app already initialized. Getting existing app...");
    app = getApp();
    // console.log("[firebase.ts] Existing Firebase app RETRIEVED.");
  }

  try {
    auth = getAuth(app);
    // console.log("[firebase.ts] Firebase Auth service INSTANCE CREATED.");
  } catch (e: any) {
    console.error("[firebase.ts] CRITICAL ERROR during getAuth(app):", e.message, e);
    auth = {} as Auth;
  }

  try {
    db = getFirestore(app);
    // console.log("[firebase.ts] Firestore service INSTANCE CREATED.");
  } catch (e: any) {
    console.error("[firebase.ts] CRITICAL ERROR during getFirestore(app):", e.message, e);
    db = {} as Firestore;
  }
}
// console.log("--- [firebase.ts] End of Firebase Initialization ---");

export { app, auth, db };
