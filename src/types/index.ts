import type { User as FirebaseUser } from 'firebase/auth';

export interface UserProfile extends FirebaseUser {
  // Add custom user properties here if needed, e.g. role
  role?: string; 
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string; // Consider using Date object or ISO string
  time?: string;
  location: string;
  organizerId: string;
  imageUrl?: string;
  capacity?: number;
  category?: string;
}

export interface SignUpFormData {
  name?: string; // Optional for now, can be added to profile later
  email: string;
  password: string;
  confirmPassword?: string; // For client-side validation
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface StudentData {
  name: string;
  school: string;
  grade: string;
  contactNumber: string;
  email: string;
}
