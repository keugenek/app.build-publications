import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, messagesTable } from '../db/schema';
import { getMessages } from '../handlers/get_messages';

describe('getMessages', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        { name: 'Alice', skill_level: 'Beginner', location: 'New York' },
        { name: 'Bob', skill_level: 'Intermediate', location: 'Los Angeles' },
        { name: 'Charlie', skill_level: 'Advanced', location: 'Chicago' }
      ])
      .returning()
      .execute();
    
    // Create test messages between Alice and Bob
    await db.insert(messagesTable)
      .values([
        { 
          sender_id: users[0].id, 
          receiver_id: users[1].id, 
          content: 'Hello Bob!' 
        },
        { 
          sender_id: users[1].id, 
          receiver_id: users[0].id, 
          content: 'Hi Alice!' 
        },
        { 
          sender_id: users[0].id, 
          receiver_id: users[1].id, 
          content: 'How are you?' 
        }
      ])
      .execute();
      
    // Create a message between Alice and Charlie (should not appear in Alice-Bob conversation)
    await db.insert(messagesTable)
      .values({
        sender_id: users[0].id,
        receiver_id: users[2].id,
        content: 'Hey Charlie!'
      })
      .execute();
  });

  afterEach(resetDB);

  it('should fetch messages between two users', async () => {
    // Get Alice and Bob IDs
    const users = await db.select().from(usersTable).execute();
    const alice = users.find(u => u.name === 'Alice');
    const bob = users.find(u => u.name === 'Bob');
    
    if (!alice || !bob) {
      throw new Error('Test users not found');
    }

    const messages = await getMessages(alice.id, bob.id);

    // Should have 3 messages between Alice and Bob
    expect(messages).toHaveLength(3);
    
    // Check that all messages are between Alice and Bob
    for (const message of messages) {
      expect(
        (message.sender_id === alice.id && message.receiver_id === bob.id) ||
        (message.sender_id === bob.id && message.receiver_id === alice.id)
      ).toBe(true);
      
      expect(message.created_at).toBeInstanceOf(Date);
    }
    
    // Check the content and order (should be ordered by created_at)
    expect(messages[0].content).toBe('Hello Bob!');
    expect(messages[1].content).toBe('Hi Alice!');
    expect(messages[2].content).toBe('How are you?');
  });

  it('should return empty array when no messages exist between users', async () => {
    // Get Alice and Charlie IDs
    const users = await db.select().from(usersTable).execute();
    const alice = users.find(u => u.name === 'Alice');
    const charlie = users.find(u => u.name === 'Charlie');
    
    if (!alice || !charlie) {
      throw new Error('Test users not found');
    }

    // Get messages between Bob and Charlie (none exist)
    const messages = await getMessages(alice.id, charlie.id);
    
    // Should only have the one message we created
    expect(messages).toHaveLength(1);
    expect(messages[0].content).toBe('Hey Charlie!');
  });

  it('should return messages in chronological order', async () => {
    // Get Alice and Bob IDs
    const users = await db.select().from(usersTable).execute();
    const alice = users.find(u => u.name === 'Alice');
    const bob = users.find(u => u.name === 'Bob');
    
    if (!alice || !bob) {
      throw new Error('Test users not found');
    }

    const messages = await getMessages(alice.id, bob.id);
    
    // Verify chronological order
    for (let i = 1; i < messages.length; i++) {
      expect(messages[i].created_at.getTime()).toBeGreaterThanOrEqual(
        messages[i - 1].created_at.getTime()
      );
    }
  });
});
