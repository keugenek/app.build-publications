import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { messagesTable } from '../db/schema';
import { type Message } from '../schema';
import { getMessages } from '../handlers/get_messages';
import { desc } from 'drizzle-orm';

/**
 * Helper to insert a message directly into the database.
 */
const insertMessage = async (msg: string): Promise<Message> => {
  const [result] = await db
    .insert(messagesTable)
    .values({ message: msg })
    .returning()
    .execute();
  // The returned row already has created_at as Date
  return result as Message;
};

describe('getMessages handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no messages exist', async () => {
    const messages = await getMessages();
    expect(messages).toBeArray();
    expect(messages).toHaveLength(0);
  });

  it('should fetch all messages ordered by newest first', async () => {
    // Insert three messages with slight delays to ensure different timestamps
    const msg1 = await insertMessage('First message');
    // Small delay
    await new Promise((r) => setTimeout(r, 10));
    const msg2 = await insertMessage('Second message');
    await new Promise((r) => setTimeout(r, 10));
    const msg3 = await insertMessage('Third message');

    const results = await getMessages();

    // Expect three messages returned
    expect(results).toHaveLength(3);

    // Verify ordering: newest (msg3) first
    expect(results[0].id).toBe(msg3.id);
    expect(results[0].message).toBe('Third message');
    expect(results[1].id).toBe(msg2.id);
    expect(results[2].id).toBe(msg1.id);

    // Ensure created_at fields are Date instances and in descending order
    expect(results[0].created_at).toBeInstanceOf(Date);
    expect(results[0].created_at.getTime()).toBeGreaterThanOrEqual(results[1].created_at.getTime());
    expect(results[1].created_at.getTime()).toBeGreaterThanOrEqual(results[2].created_at.getTime());
  });
});
