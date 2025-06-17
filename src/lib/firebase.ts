
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
// import { getAnalytics, type Analytics } from 'firebase/analytics'; // Uncomment if you plan to use Firebase Analytics

// **Diagnostic Step: Temporarily hardcoding Firebase config**
// This is NOT for production. Replace with process.env variables once the issue is resolved.
const firebaseConfig = {
  apiKey: "AIzaSyAEcbyarXzVnjzhPpIOljAaIrwgw2n14_8",
  authDomain: "jsdb-b9d9a.firebaseapp.com",
  projectId: "jsdb-b9d9a",
  storageBucket: "jsdb-b9d9a.firebasestorage.app",
  messagingSenderId: "821409856573",
  appId: "1:821409856573:web:247618949f8e0b979bfe54",
  measurementId: "G-VCNZ8PZ1CH" // Make sure this is included if you use Analytics
};

// console.log("Firebase Config Being Used in firebase.ts:", firebaseConfig);

// Fallback to environment variables if you comment out the hardcoded section above
// const firebaseConfig = {
//   apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
//   authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
//   projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
//   storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
//   appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
//   measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
// };

let app: FirebaseApp;
// let analytics: Analytics; // Uncomment if you plan to use Firebase Analytics

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  // if (typeof window !== 'undefined') { // Initialize analytics only on client side
  //   if (firebaseConfig.measurementId) {
  //     analytics = getAnalytics(app);
  //   }
  // }
} else {
  app = getApp();
  // if (typeof window !== 'undefined') { // Re-initialize or get existing analytics instance if needed
  //   if (firebaseConfig.measurementId && !getAnalytics(app)) { // Check if analytics not already initialized
  //     analytics = getAnalytics(app);
  //   }
  // }
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export { app, auth, db };
