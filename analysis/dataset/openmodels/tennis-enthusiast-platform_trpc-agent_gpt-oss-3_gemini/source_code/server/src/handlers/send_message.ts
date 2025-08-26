import { type CreateMessageInput, type Message } from '../schema';

/**
 * Placeholder handler for sending a direct message.
 * In a real implementation this would insert the message into the database
 * and return the created record.
 */
export const sendMessage = async (input: CreateMessageInput): Promise<Message> => {
  return Promise.resolve({
    id: 0, // placeholder ID
    sender_id: input.sender_id,
    receiver_id: input.receiver_id,
    content: input.content,
    created_at: new Date(),
  } as Message);
};
