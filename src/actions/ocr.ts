'use server';

import { scanRegistrationForm, type ScanRegistrationFormInput, type ScanRegistrationFormOutput } from '@/ai/flows/scan-registration-form';
import type { StudentData } from '@/types';

interface OcrResult {
  success: boolean;
  data?: StudentData[];
  error?: string;
}

export async function processRegistrationForm(formDataUri: string): Promise<OcrResult> {
  if (!formDataUri || typeof formDataUri !== 'string' || !formDataUri.startsWith('data:')) {
    return { success: false, error: 'Invalid form data URI provided.' };
  }

  try {
    const input: ScanRegistrationFormInput = { formDataUri };
    const output: ScanRegistrationFormOutput = await scanRegistrationForm(input);
    
    if (output && output.studentData) {
      return { success: true, data: output.studentData };
    } else {
      return { success: false, error: 'AI could not extract data or returned an unexpected format.' };
    }
  } catch (error) {
    console.error('Error processing registration form with AI:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during OCR processing.';
    return { success: false, error: `AI processing failed: ${errorMessage}` };
  }
}
