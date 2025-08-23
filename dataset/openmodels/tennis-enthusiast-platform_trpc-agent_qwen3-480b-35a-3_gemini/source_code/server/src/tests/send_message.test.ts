import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, messagesTable } from '../db/schema';
import { type SendMessageInput } from '../schema';
import { sendMessage } from '../handlers/send_message';
import { eq } from 'drizzle-orm';

describe('sendMessage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper to create a test user
  const createTestUser = async (name: string, skill_level: string = 'Beginner', location: string = 'Test Location') => {
    const result = await db.insert(usersTable)
      .values({ name, skill_level: skill_level as 'Beginner' | 'Intermediate' | 'Advanced', location })
      .returning()
      .execute();
    return result[0];
  };

  it('should send a message between users', async () => {
    // Create test users first
    const sender = await createTestUser('Sender User');
    const receiver = await createTestUser('Receiver User');

    const input: SendMessageInput = {
      sender_id: sender.id,
      receiver_id: receiver.id,
      content: 'Hello, this is a test message!'
    };

    const result = await sendMessage(input);

    // Validate the returned message
    expect(result.sender_id).toEqual(sender.id);
    expect(result.receiver_id).toEqual(receiver.id);
    expect(result.content).toEqual('Hello, this is a test message!');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save message to database', async () => {
    // Create test users first
    const sender = await createTestUser('Sender User');
    const receiver = await createTestUser('Receiver User');

    const input: SendMessageInput = {
      sender_id: sender.id,
      receiver_id: receiver.id,
      content: 'Hello, this is a test message!'
    };

    const result = await sendMessage(input);

    // Query the database to confirm message was saved
    const messages = await db.select()
      .from(messagesTable)
      .where(eq(messagesTable.id, result.id))
      .execute();

    expect(messages).toHaveLength(1);
    expect(messages[0].sender_id).toEqual(sender.id);
    expect(messages[0].receiver_id).toEqual(receiver.id);
    expect(messages[0].content).toEqual('Hello, this is a test message!');
    expect(messages[0].created_at).toBeInstanceOf(Date);
  });

  it('should fail when sending to non-existent user', async () => {
    // Create one valid user
    const sender = await createTestUser('Sender User');
    
    // Try to send message to non-existent user
    const input: SendMessageInput = {
      sender_id: sender.id,
      receiver_id: 99999, // Non-existent user ID
      content: 'This should fail!'
    };

    // Should throw a foreign key constraint error
    await expect(sendMessage(input)).rejects.toThrow(/foreign key constraint/i);
  });
});
