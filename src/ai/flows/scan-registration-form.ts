'use server';

/**
 * @fileOverview AI agent that scans registration forms and extracts student data.
 *
 * - scanRegistrationForm - A function that handles the scanning and data extraction process.
 * - ScanRegistrationFormInput - The input type for the scanRegistrationForm function.
 * - ScanRegistrationFormOutput - The return type for the scanRegistrationForm function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ScanRegistrationFormInputSchema = z.object({
  formDataUri: z
    .string()
    .describe(
      "A registration form (image or PDF), as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ScanRegistrationFormInput = z.infer<typeof ScanRegistrationFormInputSchema>;

const ScanRegistrationFormOutputSchema = z.object({
  studentData: z
    .array(
      z.object({
        name: z.string().describe('The full name of the student.'),
        school: z.string().describe('The school of the student.'),
        grade: z.string().describe('The grade of the student.'),
        contactNumber: z.string().describe('The contact number of the student.'),
        email: z.string().describe('The email address of the student.'),
      })
    )
    .describe('An array of student data extracted from the registration form.'),
});
export type ScanRegistrationFormOutput = z.infer<typeof ScanRegistrationFormOutputSchema>;

export async function scanRegistrationForm(input: ScanRegistrationFormInput): Promise<ScanRegistrationFormOutput> {
  return scanRegistrationFormFlow(input);
}

const prompt = ai.definePrompt({
  name: 'scanRegistrationFormPrompt',
  input: {schema: ScanRegistrationFormInputSchema},
  output: {schema: ScanRegistrationFormOutputSchema},
  prompt: `You are an expert data extraction specialist. You will receive a registration form, and you will extract the student data from it. The registration form is provided as a data URI. Extract all student names, schools, grades, contact numbers and email addresses. Respond with a JSON array of student objects.

Form: {{media url=formDataUri}}`,
});

const scanRegistrationFormFlow = ai.defineFlow(
  {
    name: 'scanRegistrationFormFlow',
    inputSchema: ScanRegistrationFormInputSchema,
    outputSchema: ScanRegistrationFormOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
