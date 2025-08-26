import { db } from '../db';
import { birthdayCardsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteBirthdayCard = async (id: number): Promise<boolean> => {
  try {
    // Delete the birthday card by ID
    const result = await db.delete(birthdayCardsTable)
      .where(eq(birthdayCardsTable.id, id))
      .returning()
      .execute();

    // Return true if a card was deleted, false if no card existed
    return result.length > 0;
  } catch (error) {
    console.error('Birthday card deletion failed:', error);
    throw error;
  }
};
