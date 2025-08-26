import { db } from '../db';
import { birthdayCardsTable } from '../db/schema';
import { type CreateBirthdayCardInput, type BirthdayCard } from '../schema';

export const createBirthdayCard = async (input: CreateBirthdayCardInput): Promise<BirthdayCard> => {
  try {
    // Insert birthday card record
    const result = await db.insert(birthdayCardsTable)
      .values({
        recipient_name: input.recipient_name,
        message: input.message,
        sender_name: input.sender_name,
        theme: input.theme
      })
      .returning()
      .execute();

    // Return the created birthday card
    const birthdayCard = result[0];
    return birthdayCard;
  } catch (error) {
    console.error('Birthday card creation failed:', error);
    throw error;
  }
};
