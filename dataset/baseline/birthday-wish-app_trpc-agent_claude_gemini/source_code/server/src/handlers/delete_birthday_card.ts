import { db } from '../db';
import { birthdayCardsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteBirthdayCard(cardId: number): Promise<boolean> {
  try {
    // Delete the birthday card - cascade will automatically remove associated photos
    const result = await db.delete(birthdayCardsTable)
      .where(eq(birthdayCardsTable.id, cardId))
      .returning()
      .execute();

    // Return true if a card was deleted, false if no card was found
    return result.length > 0;
  } catch (error) {
    console.error('Birthday card deletion failed:', error);
    throw error;
  }
}
