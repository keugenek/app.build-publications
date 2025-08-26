import { db } from '../db';
import { contactSubmissionsTable } from '../db/schema';
import { type ContactFormInput, type ContactSubmission } from '../schema';

export const submitContactForm = async (input: ContactFormInput): Promise<ContactSubmission> => {
  try {
    // Insert contact submission record
    const result = await db.insert(contactSubmissionsTable)
      .values({
        name: input.name,
        email: input.email,
        phone: input.phone,
        message: input.message
      })
      .returning()
      .execute();

    const submission = result[0];
    return {
      id: submission.id,
      name: submission.name,
      email: submission.email,
      phone: submission.phone || '', // Handle potential null from database
      message: submission.message,
      submitted_at: submission.created_at
    };
  } catch (error) {
    console.error('Contact form submission failed:', error);
    throw error;
  }
};
