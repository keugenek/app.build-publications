import { db } from '../db';
import { srsEntriesTable } from '../db/schema';
import { type UpdateSrsEntryInput, type SrsEntry } from '../schema';
import { eq } from 'drizzle-orm';

export const updateSrsEntry = async (input: UpdateSrsEntryInput): Promise<SrsEntry> => {
  try {
    // Prepare update data - only include fields that are provided
    const updateData: any = {};
    
    if (input.familiarity_level !== undefined) {
      updateData.familiarity_level = input.familiarity_level;
    }
    
    if (input.next_review_date !== undefined) {
      updateData.next_review_date = input.next_review_date;
    }
    
    if (input.last_reviewed_at !== undefined) {
      updateData.last_reviewed_at = input.last_reviewed_at;
    }

    // Update the SRS entry
    const result = await db.update(srsEntriesTable)
      .set(updateData)
      .where(eq(srsEntriesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`SRS entry with id ${input.id} not found`);
    }

    const updatedEntry = result[0];
    
    // Convert date fields to ensure correct types
    return {
      ...updatedEntry,
      next_review_date: new Date(updatedEntry.next_review_date),
      last_reviewed_at: updatedEntry.last_reviewed_at 
        ? new Date(updatedEntry.last_reviewed_at) 
        : null,
      created_at: new Date(updatedEntry.created_at)
    } as SrsEntry;
  } catch (error) {
    console.error('SRS entry update failed:', error);
    throw error;
  }
};
