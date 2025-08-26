import { db } from '../db';
import { usersTable, messagesTable } from '../db/schema';
import { type SendMessageInput, type Message } from '../schema';
import { eq } from 'drizzle-orm';

export async function sendMessage(senderId: number, input: SendMessageInput): Promise<Message> {
  try {
    // Validate that sender exists
    const sender = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, senderId))
      .execute();

    if (sender.length === 0) {
      throw new Error('Sender not found');
    }

    // Validate that recipient exists
    const recipient = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.recipient_id))
      .execute();

    if (recipient.length === 0) {
      throw new Error('Recipient not found');
    }

    // Prevent sending message to self
    if (senderId === input.recipient_id) {
      throw new Error('Cannot send message to yourself');
    }

    // Insert message record
    const result = await db.insert(messagesTable)
      .values({
        sender_id: senderId,
        recipient_id: input.recipient_id,
        content: input.content
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Message sending failed:', error);
    throw error;
  }
}
