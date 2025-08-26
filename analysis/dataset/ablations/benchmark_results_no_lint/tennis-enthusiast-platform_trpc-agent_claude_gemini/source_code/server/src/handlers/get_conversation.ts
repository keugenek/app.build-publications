import { db } from '../db';
import { messagesTable } from '../db/schema';
import { type GetConversationInput, type Message } from '../schema';
import { or, and, eq, desc } from 'drizzle-orm';

export async function getConversation(currentUserId: number, input: GetConversationInput): Promise<Message[]> {
  try {
    // Build the query to get messages between current user and the other user
    const query = db.select()
      .from(messagesTable)
      .where(
        or(
          // Messages sent by current user to the other user
          and(
            eq(messagesTable.sender_id, currentUserId),
            eq(messagesTable.recipient_id, input.user_id)
          ),
          // Messages sent by other user to current user
          and(
            eq(messagesTable.sender_id, input.user_id),
            eq(messagesTable.recipient_id, currentUserId)
          )
        )
      )
      .orderBy(desc(messagesTable.created_at)) // Newest messages first
      .limit(input.limit); // Apply the limit from input (default: 50)

    const results = await query.execute();

    // Convert the results to match the Message schema
    return results.map(message => ({
      id: message.id,
      sender_id: message.sender_id,
      recipient_id: message.recipient_id,
      content: message.content,
      created_at: message.created_at,
      read_at: message.read_at
    }));
  } catch (error) {
    console.error('Get conversation failed:', error);
    throw error;
  }
}
