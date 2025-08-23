import { db } from '../db';
import { messagesTable } from '../db/schema';
import { type CreateMessageInput, type Message } from '../schema';

/**
 * Handler to create a new birthday message.
 * Inserts the message into the database and returns the created record.
 */
export const createMessage = async (input: CreateMessageInput): Promise<Message> => {
  try {
    // Insert the new message record and return the inserted row
    const result = await db
      .insert(messagesTable)
      .values({
        message: input.message,
      })
      .returning()
      .execute();

    const record = result[0];
    // The `created_at` column is a timestamp and is returned as a Date object by drizzle
    return {
      id: record.id,
      message: record.message,
      created_at: record.created_at,
    } as Message;
  } catch (error) {
    console.error('Failed to create message:', error);
    throw error;
  }
};
