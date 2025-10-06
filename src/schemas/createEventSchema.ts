
import { z } from 'zod';

export const createEventSchema = z.object({
  title: z.string().min(5, { message: "Event title must be at least 5 characters long." }),
  superpowerCategory: z.enum(['The Thinker', 'The Brainiac', 'The Strategist', 'The Innovator'], { 
    errorMap: () => ({ message: "Please select a valid category." })
  }),
  shortDescription: z.string().max(250, "Keep the short description under 250 characters.").optional(),
  registrationFee: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number({ invalid_type_error: "Fee must be a number." }).min(0).optional()
  ),
});

export type CreateEventFormData = z.infer<typeof createEventSchema>;
