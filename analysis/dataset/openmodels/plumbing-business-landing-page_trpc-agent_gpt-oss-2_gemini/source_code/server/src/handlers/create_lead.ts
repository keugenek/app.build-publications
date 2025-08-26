import { type CreateLeadInput, type Lead } from '../schema';
import { db } from '../db';
import { leadsTable } from '../db/schema';

/**
 * Placeholder handler for creating a new lead (contact form submission).
 * In a real implementation this would insert the lead into the database.
 */
export async function createLead(input: CreateLeadInput): Promise<Lead> {
  // Insert lead record into the database
  try {
    const result = await db
      .insert(leadsTable)
      .values({
        name: input.name,
        email: input.email,
        phone: input.phone,
        message: input.message ?? null
      })
      .returning()
      .execute();

    // The inserted row is the first element of the result array
    return result[0];
  } catch (error) {
    console.error('Lead creation failed:', error);
    throw error;
  }
  return {
    id: 0, // placeholder ID
    name: input.name,
    email: input.email,
    phone: input.phone,
    message: input.message ?? null,
    created_at: new Date()
  } as Lead;
}
