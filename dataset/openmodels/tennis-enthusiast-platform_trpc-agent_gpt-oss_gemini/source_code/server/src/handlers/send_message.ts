import { db } from '../db';
import { messagesTable } from '../db/schema';
import { type SendMessageInput, type Message } from '../schema';
import { eq } from 'drizzle-orm';

export const sendMessage = async (input: SendMessageInput): Promise<Message> => {
  try {
    // Insert the message. `sent_at` will default to now via DB default.
    const result = await db
      .insert(messagesTable)
      .values({
        match_id: input.match_id,
        sender_id: input.sender_id,
        content: input.content,
        // sent_at omitted to use defaultNow()
      })
      .returning()
      .execute();

    const message = result[0];
    // The returned `sent_at` is a Date instance from drizzle's timestamp handling.
    return {
      id: message.id,
      match_id: message.match_id,
      sender_id: message.sender_id,
      content: message.content,
      sent_at: message.sent_at,
    } as Message;
  } catch (error) {
    console.error('Failed to send message:', error);
    throw error;
  }
};
