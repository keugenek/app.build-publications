import { db } from '../db';
import { birthdayCardsTable } from '../db/schema';
import { type BirthdayCard } from '../schema';
import { eq } from 'drizzle-orm';

export const getActiveCards = async (): Promise<BirthdayCard[]> => {
  try {
    // Query only active birthday cards
    const results = await db.select()
      .from(birthdayCardsTable)
      .where(eq(birthdayCardsTable.is_active, true))
      .execute();

    // Return results - no numeric conversions needed for this schema
    return results;
  } catch (error) {
    console.error('Failed to fetch active cards:', error);
    throw error;
  }
};
