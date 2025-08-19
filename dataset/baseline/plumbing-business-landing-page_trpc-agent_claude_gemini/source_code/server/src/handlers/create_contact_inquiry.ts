import { db } from '../db';
import { contactInquiriesTable } from '../db/schema';
import { type CreateContactInquiryInput, type ContactInquiry } from '../schema';

export const createContactInquiry = async (input: CreateContactInquiryInput): Promise<ContactInquiry> => {
  try {
    // Insert contact inquiry record
    const result = await db.insert(contactInquiriesTable)
      .values({
        first_name: input.first_name,
        last_name: input.last_name,
        email: input.email,
        phone: input.phone,
        service_needed: input.service_needed,
        message: input.message,
        is_urgent: input.is_urgent,
        status: 'new' as const // Default status for new inquiries
      })
      .returning()
      .execute();

    const inquiry = result[0];
    return {
      ...inquiry,
      status: inquiry.status as 'new' | 'contacted' | 'scheduled' | 'completed' | 'cancelled'
    };
  } catch (error) {
    console.error('Contact inquiry creation failed:', error);
    throw error;
  }
};
