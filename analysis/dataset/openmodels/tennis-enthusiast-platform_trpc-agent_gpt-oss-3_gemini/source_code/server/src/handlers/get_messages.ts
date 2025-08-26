import { db } from '../db';
import { messages } from '../db/schema';
import { eq, and, or, desc } from 'drizzle-orm';
import { type Message, type BrowseMessagesInput } from '../schema';

/**
 * Retrieves messages exchanged between two users, ordered by newest first.
 * Returns messages where the sender is either user_id or other_user_id and the receiver is the opposite.
 */
export const getMessages = async (input: BrowseMessagesInput): Promise<Message[]> => {
  try {
    // Build condition: (sender = user_id AND receiver = other_user_id) OR
    // (sender = other_user_id AND receiver = user_id)
    const condition = or(
      and(eq(messages.sender_id, input.user_id), eq(messages.receiver_id, input.other_user_id)),
      and(eq(messages.sender_id, input.other_user_id), eq(messages.receiver_id, input.user_id))
    );

    const results = await db
      .select()
      .from(messages)
      .where(condition)
      .orderBy(desc(messages.created_at))
      .execute();

    // Map results to Message type, ensuring non‑null IDs (they are guaranteed by FK constraints)
    const sanitized: Message[] = results.map(r => ({
      id: r.id,
      sender_id: r.sender_id as number,
      receiver_id: r.receiver_id as number,
      content: r.content,
      created_at: r.created_at,
    }));
    return sanitized;
  } catch (error) {
    console.error('Failed to get messages:', error);
    throw error;
  }
};
