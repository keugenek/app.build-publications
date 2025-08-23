import { db } from '../db';
import { messagesTable, userProfilesTable } from '../db/schema';
import { type Message } from '../schema';
import { eq, or } from 'drizzle-orm';

export const getMessages = async (userId: number): Promise<Message[]> => {
  try {
    // Fetch messages where the user is either the sender or recipient
    const results = await db.select()
      .from(messagesTable)
      .where(or(
        eq(messagesTable.sender_id, userId),
        eq(messagesTable.recipient_id, userId)
      ))
      .orderBy(messagesTable.created_at)
      .execute();

    // Convert the results to the expected Message type
    return results.map(message => ({
      ...message,
      created_at: message.created_at
    }));
  } catch (error) {
    console.error('Failed to fetch messages:', error);
    throw error;
  }
};
