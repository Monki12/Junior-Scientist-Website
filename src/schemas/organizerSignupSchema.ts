
import { z } from 'zod';

const collegeRollNumberRegex = /^[A-Z]{2}\d{2}[A-Z]{3}\d{3}$/; // LLDDLLLNNN format (e.g., BT23CSE012)

export const organizerSignupSchema = z.object({
  fullName: z.string().min(3, { message: "Full name must be at least 3 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." })
                     .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter." })
                     .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter." })
                     .regex(/\d/, { message: "Password must contain at least one digit." })
                     .regex(/[!@#$%^&*(),.?":{}|<>]/, { message: "Password must contain at least one special character." }),
  department: z.string().min(2, { message: "Department is required." }),
  phoneNumber: z.string().min(10, { message: "Phone number must be at least 10 digits." }).max(15, { message: "Phone number cannot exceed 15 digits." }),
  collegeRollNumber: z.string()
                       .min(10, { message: "College Roll Number must be 10 characters." })
                       .max(10, { message: "College Roll Number must be 10 characters." })
                       .regex(collegeRollNumberRegex, { message: "Invalid College Roll Number format (e.g., BT23CSE012)." }),
  role: z.enum(['organizer', 'event_representative', 'overall_head', 'admin'], { message: "Please select a role." }),
  photoURL: z.string().url({ message: "Invalid URL format." }).optional().or(z.literal('')),
  additionalNumber: z.string().optional().or(z.literal('')),
});

export type OrganizerSignupFormData = z.infer<typeof organizerSignupSchema>;
