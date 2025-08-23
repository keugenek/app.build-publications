import { db } from '../db';
import { birthdayMessagesTable } from '../db/schema';
import { type CreateBirthdayMessageInput, type BirthdayMessage } from '../schema';

export const createBirthdayMessage = async (input: CreateBirthdayMessageInput): Promise<BirthdayMessage> => {
  try {
    // Insert birthday message record
    const result = await db.insert(birthdayMessagesTable)
      .values({
        recipient_name: input.recipient_name,
        message: input.message
      })
      .returning()
      .execute();

    // Return the created birthday message
    return result[0];
  } catch (error) {
    console.error('Birthday message creation failed:', error);
    throw error;
  }
};
