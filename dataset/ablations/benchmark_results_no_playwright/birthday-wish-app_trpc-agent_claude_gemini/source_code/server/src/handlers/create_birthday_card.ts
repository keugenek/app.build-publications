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
        sender_name: input.sender_name,
        theme_color: input.theme_color, // Zod default will be applied if not provided
        is_active: input.is_active // Zod default will be applied if not provided
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Birthday card creation failed:', error);
    throw error;
  }
};
