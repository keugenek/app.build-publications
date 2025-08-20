import { type ContactFormInput } from '../schema';

/**
 * Placeholder handler to process contact form submissions.
 * Real implementation should insert a record into `contact_submissions` table via Drizzle.
 */
export const submitContact = async (input: ContactFormInput) => {
  // TODO: Replace with actual DB insertion
  return { success: true, message: 'Contact submission received' } as const;
};
