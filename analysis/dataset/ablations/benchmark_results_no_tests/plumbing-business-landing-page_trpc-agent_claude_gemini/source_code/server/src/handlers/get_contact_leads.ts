import { db } from '../db';
import { contactLeadsTable } from '../db/schema';
import { type ContactLead } from '../schema';
import { desc } from 'drizzle-orm';

export const getContactLeads = async (): Promise<ContactLead[]> => {
  try {
    // Query all contact leads ordered by creation date (most recent first)
    const results = await db.select()
      .from(contactLeadsTable)
      .orderBy(desc(contactLeadsTable.created_at))
      .execute();

    // Return the results - no numeric conversion needed for this table
    return results;
  } catch (error) {
    console.error('Failed to fetch contact leads:', error);
    throw error;
  }
};
