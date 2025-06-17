
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
// import { getAnalytics, type Analytics } from 'firebase/analytics'; // Analytics not used currently

// ** USING HARDCODED CONFIG FOR DIAGNOSTICS **
// These values were provided by you.
const firebaseConfig = {
  apiKey: "AIzaSyAEcbyarXzVnjzhPpIOljAaIrwgw2n14_8",
  authDomain: "jsdb-b9d9a.firebaseapp.com",
  projectId: "jsdb-b9d9a",
  storageBucket: "jsdb-b9d9a.firebasestorage.app",
  messagingSenderId: "821409856573",
  appId: "1:821409856573:web:247618949f8e0b979bfe54",
  measurementId: "G-VCNZ8PZ1CH"
};

// --- CRITICAL DIAGNOSTIC LOGS ---
console.log("--- [firebase.ts] Start of Firebase Initialization ---");
console.log("[firebase.ts] Attempting to load Firebase config. Using HARDCODED values for this test.");
console.log("[firebase.ts] Config Value - apiKey:", firebaseConfig.apiKey ? `"${firebaseConfig.apiKey}" (Length: ${firebaseConfig.apiKey.length})` : "MISSING or UNDEFINED");
console.log("[firebase.ts] Config Value - authDomain:", firebaseConfig.authDomain ? `"${firebaseConfig.authDomain}" (Length: ${firebaseConfig.authDomain.length})` : "MISSING or UNDEFINED");
console.log("[firebase.ts] Config Value - projectId:", firebaseConfig.projectId ? `"${firebaseConfig.projectId}" (Length: ${firebaseConfig.projectId.length})` : "MISSING or UNDEFINED");
console.log("[firebase.ts] Config Value - storageBucket:", firebaseConfig.storageBucket ? `"${firebaseConfig.storageBucket}" (Length: ${firebaseConfig.storageBucket.length})` : "MISSING or UNDEFINED");
console.log("[firebase.ts] Config Value - messagingSenderId:", firebaseConfig.messagingSenderId ? `"${firebaseConfig.messagingSenderId}" (Length: ${firebaseConfig.messagingSenderId.length})` : "MISSING or UNDEFINED");
console.log("[firebase.ts] Config Value - appId:", firebaseConfig.appId ? `"${firebaseConfig.appId}" (Length: ${firebaseConfig.appId.length})` : "MISSING or UNDEFINED");
console.log("[firebase.ts] Config Value - measurementId:", firebaseConfig.measurementId ? `"${firebaseConfig.measurementId}" (Length: ${firebaseConfig.measurementId.length})` : "NOT SET or UNDEFINED");

let app: FirebaseApp;

// Initialize Firebase app only once
if (!getApps().length) {
  console.log("[firebase.ts] No Firebase apps initialized. Initializing new app with HARDCODED config...");
  try {
    app = initializeApp(firebaseConfig);
    console.log("[firebase.ts] Firebase app INITIALIZED successfully.");
  } catch (e: any) {
    console.error("[firebase.ts] CRITICAL ERROR during initializeApp:", e.message, e);
    // If initializeApp itself fails, `auth` and `db` will fail.
    // Assign a dummy app to prevent immediate crashes downstream, though auth will certainly fail.
    app = {} as FirebaseApp; // This will cause `getAuth` to fail.
  }
} else {
  console.log("[firebase.ts] Firebase app already initialized. Getting existing app...");
  app = getApp();
  console.log("[firebase.ts] Existing Firebase app RETRIEVED.");
}

let auth: Auth;
let db: Firestore;

try {
  auth = getAuth(app);
  console.log("[firebase.ts] Firebase Auth service INSTANCE CREATED.");
} catch (e: any) {
  console.error("[firebase.ts] CRITICAL ERROR during getAuth(app):", e.message, e);
  // @ts-ignore Assign dummy to avoid undefined errors, though auth will fail.
  auth = {} as Auth;
}

try {
  db = getFirestore(app);
  console.log("[firebase.ts] Firestore service INSTANCE CREATED.");
} catch (e: any) {
  console.error("[firebase.ts] CRITICAL ERROR during getFirestore(app):", e.message, e);
  // @ts-ignore Assign dummy to avoid undefined errors.
  db = {} as Firestore;
}
console.log("--- [firebase.ts] End of Firebase Initialization ---");

export { app, auth, db };
