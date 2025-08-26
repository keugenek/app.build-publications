import { db } from '../db';
import { birthdayMessagesTable } from '../db/schema';
import { type BirthdayMessage } from '../schema';

export const getBirthdayMessages = async (): Promise<BirthdayMessage[]> => {
  try {
    // Fetch all birthday messages from the database
    const results = await db.select()
      .from(birthdayMessagesTable)
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(message => ({
      ...message,
      id: message.id,
      recipient_name: message.recipient_name,
      message: message.message,
      created_at: message.created_at
    }));
  } catch (error) {
    console.error('Failed to fetch birthday messages:', error);
    throw error;
  }
};
