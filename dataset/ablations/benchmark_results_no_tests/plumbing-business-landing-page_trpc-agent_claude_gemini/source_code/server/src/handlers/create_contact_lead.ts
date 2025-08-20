import { db } from '../db';
import { contactLeadsTable } from '../db/schema';
import { type CreateContactLeadInput, type ContactLeadResponse } from '../schema';

export const createContactLead = async (input: CreateContactLeadInput): Promise<ContactLeadResponse> => {
  try {
    // Insert contact lead record
    const result = await db.insert(contactLeadsTable)
      .values({
        customer_name: input.customer_name,
        email: input.email,
        phone: input.phone,
        message: input.message
      })
      .returning()
      .execute();

    const contactLead = result[0];
    
    return {
      success: true,
      message: 'Thank you for your inquiry! We will contact you soon.',
      leadId: contactLead.id
    };
  } catch (error) {
    console.error('Contact lead creation failed:', error);
    throw error;
  }
};
