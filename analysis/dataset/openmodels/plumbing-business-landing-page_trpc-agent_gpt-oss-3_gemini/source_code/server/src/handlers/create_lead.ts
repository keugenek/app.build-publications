import { db } from '../db';
import { leadsTable } from '../db/schema';
import { type Lead, type CreateLeadInput } from '../schema';

/**
 * Handler for creating a lead (contact form submission).
 * Inserts a new lead record into the database and returns the created lead.
 */
export const createLead = async (input: CreateLeadInput): Promise<Lead> => {
  try {
    const result = await db
      .insert(leadsTable)
      .values({
        name: input.name,
        email: input.email,
        phone: input.phone,
        message: input.message,
      })
      .returning()
      .execute();

    // Drizzle returns an array; take first element
    const lead = result[0];
    // Ensure created_at is a Date object (drizzle already returns Date for timestamp columns)
    return {
      ...lead,
    } as Lead;
  } catch (error) {
    console.error('Lead creation failed:', error);
    throw error;
  }
};
