import { db } from '../db';
import { birthdayCardsTable } from '../db/schema';
import { type BirthdayCard } from '../schema';
import { desc } from 'drizzle-orm';

export const getAllBirthdayCards = async (): Promise<BirthdayCard[]> => {
  try {
    // Fetch all birthday cards ordered by creation date (newest first)
    const results = await db.select()
      .from(birthdayCardsTable)
      .orderBy(desc(birthdayCardsTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch birthday cards:', error);
    throw error;
  }
};
