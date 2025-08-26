// Tests for the createMessage handler
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { messagesTable } from '../db/schema';
import { type CreateMessageInput } from '../schema';
import { createMessage } from '../handlers/create_message';
import { eq } from 'drizzle-orm';

// Simple test input matching the schema
const testInput: CreateMessageInput = {
  message: 'Happy Birthday, Alice!'
};

describe('createMessage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a message and return correct fields', async () => {
    const result = await createMessage(testInput);

    // Verify returned object shape
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.message).toBe(testInput.message);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist the message in the database', async () => {
    const created = await createMessage(testInput);

    const rows = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.id, created.id))
      .execute();

    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.id).toBe(created.id);
    expect(row.message).toBe(testInput.message);
    expect(row.created_at).toBeInstanceOf(Date);
  });
});
