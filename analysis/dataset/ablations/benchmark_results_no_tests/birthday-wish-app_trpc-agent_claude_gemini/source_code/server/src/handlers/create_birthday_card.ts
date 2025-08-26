import { db } from '../db';
import { birthdayCardsTable } from '../db/schema';
import { type CreateBirthdayCardInput, type BirthdayCard } from '../schema';

export const createBirthdayCard = async (input: CreateBirthdayCardInput): Promise<BirthdayCard> => {
  try {
    // Insert birthday card record
    const result = await db.insert(birthdayCardsTable)
      .values({
        title: input.title,
        message: input.message,
        recipient_name: input.recipient_name,
        sender_name: input.sender_name
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Birthday card creation failed:', error);
    throw error;
  }
};
