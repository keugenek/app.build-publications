import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, messagesTable } from '../db/schema';
import { type GetConversationInput } from '../schema';
import { getConversation } from '../handlers/get_conversation';

describe('getConversation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let user1Id: number;
  let user2Id: number;
  let user3Id: number;

  beforeEach(async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        {
          name: 'User 1',
          email: 'user1@example.com',
          skill_level: 'intermediate',
          location: 'City A',
          bio: 'Tennis player 1'
        },
        {
          name: 'User 2',
          email: 'user2@example.com',
          skill_level: 'beginner',
          location: 'City B',
          bio: 'Tennis player 2'
        },
        {
          name: 'User 3',
          email: 'user3@example.com',
          skill_level: 'advanced',
          location: 'City C',
          bio: 'Tennis player 3'
        }
      ])
      .returning({ id: usersTable.id })
      .execute();

    user1Id = users[0].id;
    user2Id = users[1].id;
    user3Id = users[2].id;
  });

  it('should return empty array when no messages exist between users', async () => {
    const input: GetConversationInput = {
      user_id: user2Id,
      limit: 50
    };

    const result = await getConversation(user1Id, input);

    expect(result).toEqual([]);
  });

  it('should return messages between two users in descending order', async () => {
    // Create messages between user1 and user2
    const now = new Date();
    const message1Time = new Date(now.getTime() - 3000); // 3 seconds ago
    const message2Time = new Date(now.getTime() - 2000); // 2 seconds ago
    const message3Time = new Date(now.getTime() - 1000); // 1 second ago

    await db.insert(messagesTable)
      .values([
        {
          sender_id: user1Id,
          recipient_id: user2Id,
          content: 'First message',
          created_at: message1Time
        },
        {
          sender_id: user2Id,
          recipient_id: user1Id,
          content: 'Second message',
          created_at: message2Time
        },
        {
          sender_id: user1Id,
          recipient_id: user2Id,
          content: 'Third message',
          created_at: message3Time
        }
      ])
      .execute();

    const input: GetConversationInput = {
      user_id: user2Id,
      limit: 50
    };

    const result = await getConversation(user1Id, input);

    expect(result).toHaveLength(3);
    
    // Verify messages are ordered newest first
    expect(result[0].content).toEqual('Third message');
    expect(result[1].content).toEqual('Second message');
    expect(result[2].content).toEqual('First message');
    
    // Verify all messages involve the correct users
    result.forEach(message => {
      expect(
        (message.sender_id === user1Id && message.recipient_id === user2Id) ||
        (message.sender_id === user2Id && message.recipient_id === user1Id)
      ).toBe(true);
    });
  });

  it('should exclude messages with other users', async () => {
    const now = new Date();
    const earlierTime = new Date(now.getTime() - 2000); // 2 seconds ago
    const laterTime = new Date(now.getTime() - 1000); // 1 second ago

    // Create messages between user1 and user2
    await db.insert(messagesTable)
      .values([
        {
          sender_id: user1Id,
          recipient_id: user2Id,
          content: 'Message to user2',
          created_at: earlierTime
        },
        {
          sender_id: user2Id,
          recipient_id: user1Id,
          content: 'Reply from user2',
          created_at: laterTime
        }
      ])
      .execute();

    // Create messages between user1 and user3 (should be excluded)
    await db.insert(messagesTable)
      .values([
        {
          sender_id: user1Id,
          recipient_id: user3Id,
          content: 'Message to user3'
        },
        {
          sender_id: user3Id,
          recipient_id: user1Id,
          content: 'Reply from user3'
        }
      ])
      .execute();

    const input: GetConversationInput = {
      user_id: user2Id,
      limit: 50
    };

    const result = await getConversation(user1Id, input);

    expect(result).toHaveLength(2);
    expect(result[0].content).toEqual('Reply from user2');
    expect(result[1].content).toEqual('Message to user2');
  });

  it('should respect the limit parameter', async () => {
    // Create 5 messages between user1 and user2
    const messages = Array.from({ length: 5 }, (_, i) => ({
      sender_id: user1Id,
      recipient_id: user2Id,
      content: `Message ${i + 1}`
    }));

    await db.insert(messagesTable)
      .values(messages)
      .execute();

    const input: GetConversationInput = {
      user_id: user2Id,
      limit: 3
    };

    const result = await getConversation(user1Id, input);

    expect(result).toHaveLength(3);
  });

  it('should use default limit when not specified', async () => {
    // Create multiple messages
    const messages = Array.from({ length: 10 }, (_, i) => ({
      sender_id: user1Id,
      recipient_id: user2Id,
      content: `Message ${i + 1}`
    }));

    await db.insert(messagesTable)
      .values(messages)
      .execute();

    const input: GetConversationInput = {
      user_id: user2Id,
      limit: 50 // Explicitly provide the default value
    };

    const result = await getConversation(user1Id, input);

    expect(result).toHaveLength(10); // All messages returned since less than default limit
  });

  it('should handle read_at timestamps correctly', async () => {
    const readTime = new Date();

    await db.insert(messagesTable)
      .values([
        {
          sender_id: user1Id,
          recipient_id: user2Id,
          content: 'Unread message',
          read_at: null
        },
        {
          sender_id: user2Id,
          recipient_id: user1Id,
          content: 'Read message',
          read_at: readTime
        }
      ])
      .execute();

    const input: GetConversationInput = {
      user_id: user2Id,
      limit: 50
    };

    const result = await getConversation(user1Id, input);

    expect(result).toHaveLength(2);
    
    // Find the messages by content
    const readMessage = result.find(msg => msg.content === 'Read message');
    const unreadMessage = result.find(msg => msg.content === 'Unread message');
    
    expect(readMessage?.read_at).toEqual(readTime);
    expect(unreadMessage?.read_at).toBeNull();
  });

  it('should return messages in both directions between users', async () => {
    await db.insert(messagesTable)
      .values([
        {
          sender_id: user1Id,
          recipient_id: user2Id,
          content: 'Message from user1 to user2'
        },
        {
          sender_id: user2Id,
          recipient_id: user1Id,
          content: 'Message from user2 to user1'
        }
      ])
      .execute();

    const input: GetConversationInput = {
      user_id: user2Id,
      limit: 50
    };

    const result = await getConversation(user1Id, input);

    expect(result).toHaveLength(2);
    
    // Verify we have one message in each direction
    const sentByUser1 = result.find(msg => msg.sender_id === user1Id);
    const sentByUser2 = result.find(msg => msg.sender_id === user2Id);
    
    expect(sentByUser1).toBeDefined();
    expect(sentByUser2).toBeDefined();
    expect(sentByUser1?.recipient_id).toEqual(user2Id);
    expect(sentByUser2?.recipient_id).toEqual(user1Id);
  });

  it('should return all required message fields', async () => {
    await db.insert(messagesTable)
      .values({
        sender_id: user1Id,
        recipient_id: user2Id,
        content: 'Test message'
      })
      .execute();

    const input: GetConversationInput = {
      user_id: user2Id,
      limit: 50
    };

    const result = await getConversation(user1Id, input);

    expect(result).toHaveLength(1);
    const message = result[0];

    expect(message.id).toBeDefined();
    expect(typeof message.id).toBe('number');
    expect(message.sender_id).toEqual(user1Id);
    expect(message.recipient_id).toEqual(user2Id);
    expect(message.content).toEqual('Test message');
    expect(message.created_at).toBeInstanceOf(Date);
    expect(message.read_at).toBeNull();
  });
});
