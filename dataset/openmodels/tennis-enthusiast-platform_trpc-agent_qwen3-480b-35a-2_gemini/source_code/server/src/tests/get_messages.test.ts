import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { messagesTable, userProfilesTable } from '../db/schema';
import { getMessages } from '../handlers/get_messages';

describe('getMessages', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create test users first (required for foreign key constraints)
    await db.insert(userProfilesTable).values([
      {
        name: 'Alice',
        email: 'alice@example.com',
        skill_level: 'intermediate',
        location: 'New York',
        bio: 'Looking for tennis partners'
      },
      {
        name: 'Bob',
        email: 'bob@example.com',
        skill_level: 'advanced',
        location: 'New York',
        bio: 'Professional player'
      },
      {
        name: 'Charlie',
        email: 'charlie@example.com',
        skill_level: 'beginner',
        location: 'Boston',
        bio: 'New to tennis'
      }
    ]).execute();
    
    // Create test messages
    await db.insert(messagesTable).values([
      {
        sender_id: 1, // Alice
        recipient_id: 2, // Bob
        content: 'Hi Bob, would you like to play a match this weekend?'
      },
      {
        sender_id: 2, // Bob
        recipient_id: 1, // Alice
        content: 'Sure Alice, Saturday works for me!'
      },
      {
        sender_id: 1, // Alice
        recipient_id: 3, // Charlie
        content: 'Hello Charlie, welcome to tennis!'
      }
    ]).execute();
  });
  
  afterEach(resetDB);

  it('should fetch messages where user is the recipient', async () => {
    const messages = await getMessages(2); // Bob's messages
    
    // Should get 2 messages (one from Alice, one to Alice)
    expect(messages).toHaveLength(2);
    
    // First message should be from Alice to Bob
    expect(messages[0].sender_id).toBe(1);
    expect(messages[0].recipient_id).toBe(2);
    expect(messages[0].content).toBe('Hi Bob, would you like to play a match this weekend?');
    
    // Second message should be from Bob to Alice
    expect(messages[1].sender_id).toBe(2);
    expect(messages[1].recipient_id).toBe(1);
    expect(messages[1].content).toBe('Sure Alice, Saturday works for me!');
    
    // All messages should have proper date fields
    messages.forEach(message => {
      expect(message.created_at).toBeInstanceOf(Date);
    });
  });

  it('should fetch all messages where user is either sender or recipient', async () => {
    const messages = await getMessages(1); // Alice's messages
    
    // Should get 3 messages (one to Bob, one from Bob, one to Charlie)
    expect(messages).toHaveLength(3);
    
    // Messages should be ordered by creation date
    expect(messages[0].content).toBe('Hi Bob, would you like to play a match this weekend?');
    expect(messages[1].content).toBe('Sure Alice, Saturday works for me!');
    expect(messages[2].content).toBe('Hello Charlie, welcome to tennis!');
  });

  it('should return an empty array for users with no messages', async () => {
    const messages = await getMessages(999); // Non-existent user
    expect(messages).toEqual([]);
  });

  it('should not return messages where user is neither sender nor recipient', async () => {
    const messages = await getMessages(3); // Charlie's messages
    
    // Should only get 1 message (from Alice)
    expect(messages).toHaveLength(1);
    expect(messages[0].sender_id).toBe(1);
    expect(messages[0].recipient_id).toBe(3);
    expect(messages[0].content).toBe('Hello Charlie, welcome to tennis!');
  });
});
