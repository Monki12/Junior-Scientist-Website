
import type { User as FirebaseUser } from 'firebase/auth';

export interface UserProfile extends FirebaseUser {
  role?: string; 
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string; 
  time?: string;
  location: string;
  organizerId: string;
  imageUrl?: string;
  capacity?: number;
  category?: string;
  dataAiHint?: string;
}

export interface SubEvent {
  id: string;
  slug: string;
  title: string;
  superpowerCategory: string; 
  shortDescription: string; 
  detailedDescription: string; 
  mainImage: { src: string; alt: string; dataAiHint: string };
  galleryImages?: Array<{ src: string; alt: string; dataAiHint: string }>;
  registrationLink: string;
  deadline?: string; 
}


export interface SignUpFormData {
  name?: string; 
  email: string;
  password: string;
  confirmPassword?: string; 
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
