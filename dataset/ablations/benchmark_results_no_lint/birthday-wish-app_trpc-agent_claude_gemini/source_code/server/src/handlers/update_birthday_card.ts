import { db } from '../db';
import { birthdayCardsTable } from '../db/schema';
import { type UpdateBirthdayCardInput, type BirthdayCard } from '../schema';
import { eq } from 'drizzle-orm';

export const updateBirthdayCard = async (input: UpdateBirthdayCardInput): Promise<BirthdayCard | null> => {
  try {
    // First check if the birthday card exists
    const existingCards = await db.select()
      .from(birthdayCardsTable)
      .where(eq(birthdayCardsTable.id, input.id))
      .execute();

    if (existingCards.length === 0) {
      return null;
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()  // Always update the timestamp
    };

    if (input.recipient_name !== undefined) {
      updateData.recipient_name = input.recipient_name;
    }

    if (input.message !== undefined) {
      updateData.message = input.message;
    }

    if (input.sender_name !== undefined) {
      updateData.sender_name = input.sender_name;
    }

    if (input.theme !== undefined) {
      updateData.theme = input.theme;
    }

    // Update the birthday card
    const result = await db.update(birthdayCardsTable)
      .set(updateData)
      .where(eq(birthdayCardsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Birthday card update failed:', error);
    throw error;
  }
};
