import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { birthdayMessagesTable } from '../db/schema';
import { getBirthdayMessages } from '../handlers/get_birthday_messages';
import { eq } from 'drizzle-orm';

describe('getBirthdayMessages', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no messages exist', async () => {
    const result = await getBirthdayMessages();
    expect(result).toEqual([]);
  });

  it('should return all birthday messages', async () => {
    // Insert test data
    const testMessages = [
      {
        recipient_name: 'Alice',
        message: 'Happy Birthday Alice!'
      },
      {
        recipient_name: 'Bob',
        message: 'Happy Birthday Bob!'
      }
    ];

    // Insert messages into database
    await db.insert(birthdayMessagesTable)
      .values(testMessages)
      .execute();

    // Fetch messages
    const result = await getBirthdayMessages();

    // Verify results
    expect(result).toHaveLength(2);
    expect(result[0].recipient_name).toEqual('Alice');
    expect(result[0].message).toEqual('Happy Birthday Alice!');
    expect(result[1].recipient_name).toEqual('Bob');
    expect(result[1].message).toEqual('Happy Birthday Bob!');
    
    // Verify all fields are present
    result.forEach(message => {
      expect(message.id).toBeDefined();
      expect(message.recipient_name).toBeDefined();
      expect(message.message).toBeDefined();
      expect(message.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return messages in the correct format', async () => {
    // Insert a test message
    await db.insert(birthdayMessagesTable)
      .values({
        recipient_name: 'Test User',
        message: 'Test message'
      })
      .execute();

    // Fetch messages
    const result = await getBirthdayMessages();
    
    // Verify format
    expect(result).toBeInstanceOf(Array);
    const message = result[0];
    expect(typeof message.id).toBe('number');
    expect(typeof message.recipient_name).toBe('string');
    expect(typeof message.message).toBe('string');
    expect(message.created_at).toBeInstanceOf(Date);
  });
});
