import { db } from '../db';
import { contactFormsTable, type ContactForm as DBContactForm } from '../db/schema';
import { type CreateContactFormInput, type ContactForm } from '../schema';

export const submitContactForm = async (input: CreateContactFormInput): Promise<ContactForm> => {
  try {
    // Insert contact form record
    const result = await db.insert(contactFormsTable)
      .values({
        name: input.name,
        email: input.email,
        phone: input.phone,
        message: input.message
      })
      .returning()
      .execute();

    // Convert database result (which includes id and created_at) to Zod schema type
    // (which doesn't include these fields)
    const dbContactForm: DBContactForm = result[0];
    return {
      name: dbContactForm.name,
      email: dbContactForm.email,
      phone: dbContactForm.phone,
      message: dbContactForm.message
    } as ContactForm;
  } catch (error) {
    console.error('Contact form submission failed:', error);
    throw error;
  }
};