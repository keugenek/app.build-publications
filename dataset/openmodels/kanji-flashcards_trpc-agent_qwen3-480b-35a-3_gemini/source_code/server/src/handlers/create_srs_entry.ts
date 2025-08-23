import { db } from '../db';
import { srsEntriesTable } from '../db/schema';
import { type CreateSrsEntryInput, type SrsEntry } from '../schema';

export const createSrsEntry = async (input: CreateSrsEntryInput): Promise<SrsEntry> => {
  try {
    const result = await db.insert(srsEntriesTable)
      .values({
        user_id: input.user_id,
        kanji_id: input.kanji_id,
        familiarity_level: input.familiarity_level,
        next_review_date: input.next_review_date.toISOString().split('T')[0] // Convert Date to YYYY-MM-DD string
      })
      .returning()
      .execute();
    
    // Convert the date string back to Date object for the return value
    return {
      ...result[0],
      next_review_date: new Date(result[0].next_review_date)
    };
  } catch (error) {
    console.error('SRS entry creation failed:', error);
    throw error;
  }
};
