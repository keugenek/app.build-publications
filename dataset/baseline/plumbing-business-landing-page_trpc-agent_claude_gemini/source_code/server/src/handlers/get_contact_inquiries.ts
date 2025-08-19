import { db } from '../db';
import { contactInquiriesTable } from '../db/schema';
import { type ContactInquiry } from '../schema';
import { desc, eq, and } from 'drizzle-orm';

export async function getContactInquiries(): Promise<ContactInquiry[]> {
  try {
    const results = await db.select()
      .from(contactInquiriesTable)
      .orderBy(desc(contactInquiriesTable.created_at))
      .execute();

    return results.map(result => ({
      ...result,
      status: result.status as ContactInquiry['status']
    }));
  } catch (error) {
    console.error('Failed to fetch contact inquiries:', error);
    throw error;
  }
}

export async function getNewContactInquiries(): Promise<ContactInquiry[]> {
  try {
    const results = await db.select()
      .from(contactInquiriesTable)
      .where(eq(contactInquiriesTable.status, 'new'))
      .orderBy(
        desc(contactInquiriesTable.is_urgent),
        desc(contactInquiriesTable.created_at)
      )
      .execute();

    return results.map(result => ({
      ...result,
      status: result.status as ContactInquiry['status']
    }));
  } catch (error) {
    console.error('Failed to fetch new contact inquiries:', error);
    throw error;
  }
}
