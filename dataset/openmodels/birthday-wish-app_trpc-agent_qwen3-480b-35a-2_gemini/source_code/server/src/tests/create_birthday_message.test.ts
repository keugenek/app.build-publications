import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { birthdayMessagesTable } from '../db/schema';
import { type CreateBirthdayMessageInput } from '../schema';
import { createBirthdayMessage } from '../handlers/create_birthday_message';
import { eq } from 'drizzle-orm';

// Test input
const testInput: CreateBirthdayMessageInput = {
  recipient_name: 'John Doe',
  message: 'Happy Birthday! Hope you have a wonderful day!'
};

describe('createBirthdayMessage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a birthday message', async () => {
    const result = await createBirthdayMessage(testInput);

    // Basic field validation
    expect(result.recipient_name).toEqual('John Doe');
    expect(result.message).toEqual(testInput.message);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save birthday message to database', async () => {
    const result = await createBirthdayMessage(testInput);

    // Query using proper drizzle syntax
    const messages = await db.select()
      .from(birthdayMessagesTable)
      .where(eq(birthdayMessagesTable.id, result.id))
      .execute();

    expect(messages).toHaveLength(1);
    expect(messages[0].recipient_name).toEqual('John Doe');
    expect(messages[0].message).toEqual(testInput.message);
    expect(messages[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle empty message', async () => {
    const input: CreateBirthdayMessageInput = {
      recipient_name: 'Jane',
      message: ' '
    };

    const result = await createBirthdayMessage(input);
    expect(result.recipient_name).toEqual('Jane');
    expect(result.message).toEqual(' ');
  });
});
