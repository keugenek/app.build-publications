import { db } from '../db';
import { messagesTable } from '../db/schema';
import { type Message } from '../schema';
import { and, eq, or } from 'drizzle-orm';

export const getMessages = async (userId1: number, userId2: number): Promise<Message[]> => {
  try {
    // Fetch messages between the two users in both directions
    const results = await db.select()
      .from(messagesTable)
      .where(
        and(
          or(
            and(eq(messagesTable.sender_id, userId1), eq(messagesTable.receiver_id, userId2)),
            and(eq(messagesTable.sender_id, userId2), eq(messagesTable.receiver_id, userId1))
          )
        )
      )
      .orderBy(messagesTable.created_at)
      .execute();

    // Map results to the expected Message type
    return results.map(message => ({
      id: message.id,
      sender_id: message.sender_id,
      receiver_id: message.receiver_id,
      content: message.content,
      created_at: message.created_at
    }));
  } catch (error) {
    console.error('Failed to fetch messages:', error);
    throw error;
  }
};
