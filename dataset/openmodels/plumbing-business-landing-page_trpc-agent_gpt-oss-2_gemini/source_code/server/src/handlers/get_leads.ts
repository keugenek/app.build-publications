import { type Lead } from '../schema';
import { db } from '../db';
import { leadsTable } from '../db/schema';

/**
 * Placeholder handler for fetching all leads (contact form submissions).
 * In a real implementation this would query the database.
 */
export async function getLeads(): Promise<Lead[]> {
  // Stub implementation returning empty array
  return await db.select().from(leadsTable).execute();
}
