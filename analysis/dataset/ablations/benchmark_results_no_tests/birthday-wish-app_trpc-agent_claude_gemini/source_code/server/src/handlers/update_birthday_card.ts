import { db } from '../db';
import { birthdayCardsTable } from '../db/schema';
import { type UpdateBirthdayCardInput, type BirthdayCard } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateBirthdayCard(input: UpdateBirthdayCardInput): Promise<BirthdayCard | null> {
  try {
    // Extract id from input and prepare update data
    const { id, ...updateData } = input;
    
    // Only proceed if there are fields to update
    if (Object.keys(updateData).length === 0) {
      // If no fields to update, just return the existing record
      const existing = await db.select()
        .from(birthdayCardsTable)
        .where(eq(birthdayCardsTable.id, id))
        .execute();
      
      return existing.length > 0 ? existing[0] : null;
    }

    // Update the birthday card record
    const result = await db.update(birthdayCardsTable)
      .set(updateData)
      .where(eq(birthdayCardsTable.id, id))
      .returning()
      .execute();

    // Return the updated record or null if not found
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Birthday card update failed:', error);
    throw error;
  }
}
