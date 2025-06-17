
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
// import { getAnalytics, type Analytics } from 'firebase/analytics'; // Uncomment if you plan to use Firebase Analytics

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

export { app, auth, db }; // Fixed export statement
