import { db } from '../db';
import { messagesTable, userProfilesTable } from '../db/schema';
import { type SendMessageInput, type Message } from '../schema';
import { eq } from 'drizzle-orm';

export const sendMessage = async (input: SendMessageInput): Promise<Message> => {
  try {
    // Verify that both sender and recipient exist
    const sender = await db.select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.id, input.sender_id))
      .limit(1)
      .execute();

    if (sender.length === 0) {
      throw new Error(`Sender with ID ${input.sender_id} not found`);
    }

    const recipient = await db.select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.id, input.recipient_id))
      .limit(1)
      .execute();

    if (recipient.length === 0) {
      throw new Error(`Recipient with ID ${input.recipient_id} not found`);
    }

    // Insert message record
    const result = await db.insert(messagesTable)
      .values({
        sender_id: input.sender_id,
        recipient_id: input.recipient_id,
        content: input.content
      })
      .returning()
      .execute();

    const message = result[0];
    return {
      ...message,
      created_at: message.created_at
    };
  } catch (error) {
    console.error('Message sending failed:', error);
    throw error;
  }
};
