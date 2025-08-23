import { db } from '../db';
import { messagesTable } from '../db/schema';
import { type SendMessageInput, type Message } from '../schema';

export const sendMessage = async (input: SendMessageInput): Promise<Message> => {
  try {
    // Insert message record
    const result = await db.insert(messagesTable)
      .values({
        sender_id: input.sender_id,
        receiver_id: input.receiver_id,
        content: input.content
      })
      .returning()
      .execute();

    // Return the created message
    return result[0];
  } catch (error) {
    console.error('Message sending failed:', error);
    throw error;
  }
};
