import { db } from '../db';
import { contactFormsTable } from '../db/schema';
import { type CreateContactFormInput, type ContactForm } from '../schema';

export const createContactForm = async (input: CreateContactFormInput): Promise<ContactForm> => {
  try {
    // Insert contact form submission record
    const result = await db.insert(contactFormsTable)
      .values({
        customer_name: input.customer_name,
        email: input.email,
        phone_number: input.phone_number,
        message: input.message
      })
      .returning()
      .execute();

    // Return the created contact form submission
    const contactForm = result[0];
    return {
      ...contactForm
    };
  } catch (error) {
    console.error('Contact form submission failed:', error);
    throw error;
  }
};
