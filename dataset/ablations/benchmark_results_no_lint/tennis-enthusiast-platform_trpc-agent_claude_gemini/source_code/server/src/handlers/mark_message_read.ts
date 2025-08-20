import { db } from '../db';
import { messagesTable } from '../db/schema';
import { type MarkMessageReadInput, type Message } from '../schema';
import { eq, and, isNull } from 'drizzle-orm';

export async function markMessageRead(userId: number, input: MarkMessageReadInput): Promise<Message> {
  try {
    // First, verify the message exists and user is the recipient
    const existingMessages = await db.select()
      .from(messagesTable)
      .where(
        and(
          eq(messagesTable.id, input.message_id),
          eq(messagesTable.recipient_id, userId)
        )
      )
      .execute();

    if (existingMessages.length === 0) {
      throw new Error('Message not found or user is not the recipient');
    }

    const existingMessage = existingMessages[0];
    
    // If already read, return the message as is
    if (existingMessage.read_at !== null) {
      return existingMessage;
    }

    // Update the message to mark as read
    const result = await db.update(messagesTable)
      .set({
        read_at: new Date()
      })
      .where(
        and(
          eq(messagesTable.id, input.message_id),
          eq(messagesTable.recipient_id, userId),
          isNull(messagesTable.read_at) // Only update if not already read
        )
      )
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('Failed to mark message as read');
    }

    return result[0];
  } catch (error) {
    console.error('Mark message read failed:', error);
    throw error;
  }
}
