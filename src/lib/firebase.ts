
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
// import { getAnalytics, type Analytics } from 'firebase/analytics'; // Uncomment if you plan to use Firebase Analytics

// **Diagnostic Step: Temporarily hardcoding Firebase config**
// This is NOT for production. Replace with process.env variables once the issue is resolved.
const firebaseConfigHardcoded = {
  apiKey: "AIzaSyAEcbyarXzVnjzhPpIOljAaIrwgw2n14_8",
  authDomain: "jsdb-b9d9a.firebaseapp.com",
  projectId: "jsdb-b9d9a",
  storageBucket: "jsdb-b9d9a.firebasestorage.app",
  messagingSenderId: "821409856573",
  appId: "1:821409856573:web:247618949f8e0b979bfe54",
  measurementId: "G-VCNZ8PZ1CH"
};

const firebaseConfigEnv = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Use hardcoded config for now to isolate the problem
const firebaseConfig = firebaseConfigHardcoded;


// --- ADD THESE CONSOLE.LOGS ---
console.log("Firebase Config being used in firebase.ts:", firebaseConfig);
console.log("API Key present in firebase.ts?", !!firebaseConfig.apiKey);
console.log("Auth Domain present in firebase.ts?", !!firebaseConfig.authDomain);
console.log("Project ID present in firebase.ts?", !!firebaseConfig.projectId);
// --------------------------------

let app: FirebaseApp;
// let analytics: Analytics; // Uncomment if you plan to use Firebase Analytics

if (typeof window !== 'undefined') { // Check if running in the browser
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    // if (firebaseConfig.measurementId) { 
    //   analytics = getAnalytics(app);
    // }
  } else {
    app = getApp();
    // if (firebaseConfig.measurementId && !getAnalytics(app)) { // Check if analytics already initialized for this app instance
    //   try {
    //      analytics = getAnalytics(app);
    //   } catch (e) {
    //     // console.warn("Could not initialize analytics for existing app", e)
    //   }
    // }
  }
} else {
  // This block is for server-side rendering or server components.
  // For client-side auth, this part is less critical but good for completeness.
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
}


const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export { app, auth, db };
