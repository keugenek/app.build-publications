import { db } from '../db';
import { contactInquiriesTable } from '../db/schema';
import { type UpdateContactInquiryStatusInput, type ContactInquiry } from '../schema';
import { eq } from 'drizzle-orm';

export const updateContactInquiryStatus = async (input: UpdateContactInquiryStatusInput): Promise<ContactInquiry> => {
  try {
    // First verify the inquiry exists
    const existingInquiry = await db.select()
      .from(contactInquiriesTable)
      .where(eq(contactInquiriesTable.id, input.id))
      .execute();

    if (existingInquiry.length === 0) {
      throw new Error(`Contact inquiry with ID ${input.id} not found`);
    }

    // Update the status and updated_at timestamp
    const result = await db.update(contactInquiriesTable)
      .set({
        status: input.status,
        updated_at: new Date()
      })
      .where(eq(contactInquiriesTable.id, input.id))
      .returning()
      .execute();

    const updatedInquiry = result[0];
    
    // Return properly typed result
    return {
      ...updatedInquiry,
      status: updatedInquiry.status as 'new' | 'contacted' | 'scheduled' | 'completed' | 'cancelled'
    };
  } catch (error) {
    console.error('Contact inquiry status update failed:', error);
    throw error;
  }
};
