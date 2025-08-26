import { db } from '../db';
import { birthdayCardsTable } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { type UpdateBirthdayCardInput, type BirthdayCard } from '../schema';

export const updateBirthdayCard = async (input: UpdateBirthdayCardInput): Promise<BirthdayCard | null> => {
  try {
    // Build the update object only with fields that are provided
    const updateData: any = {
      updated_at: sql`NOW()` // Use SQL NOW() to ensure database timestamp
    };
    
    if (input.recipient_name !== undefined) {
      updateData.recipient_name = input.recipient_name;
    }
    
    if (input.message !== undefined) {
      updateData.message = input.message;
    }

    // Update the birthday card record
    const result = await db.update(birthdayCardsTable)
      .set(updateData)
      .where(eq(birthdayCardsTable.id, input.id))
      .returning()
      .execute();

    // Return null if no record was found/updated
    if (result.length === 0) {
      return null;
    }

    // Return the updated birthday card
    return result[0];
  } catch (error) {
    console.error('Birthday card update failed:', error);
    throw error;
  }
};
