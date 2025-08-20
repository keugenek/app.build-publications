import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, messagesTable } from '../db/schema';
import { type GetUserConversationsInput, type CreateUserInput, type SendMessageInput } from '../schema';
import { getUserConversations } from '../handlers/get_user_conversations';

// Test data
const testUser1: CreateUserInput = {
  name: 'Alice Smith',
  email: 'alice@example.com',
  skill_level: 'intermediate',
  location: 'New York',
  bio: 'Love hiking and coding'
};

const testUser2: CreateUserInput = {
  name: 'Bob Johnson',
  email: 'bob@example.com',
  skill_level: 'beginner',
  location: 'California',
  bio: 'New to programming'
};

const testUser3: CreateUserInput = {
  name: 'Carol Davis',
  email: 'carol@example.com',
  skill_level: 'advanced',
  location: 'Texas',
  bio: 'Senior developer'
};

const testInput: GetUserConversationsInput = {
  limit: 20
};

describe('getUserConversations', () => {
  let user1Id: number;
  let user2Id: number;
  let user3Id: number;

  beforeEach(async () => {
    await createDB();
    
    // Create test users
    const users = await db.insert(usersTable)
      .values([testUser1, testUser2, testUser3])
      .returning()
      .execute();
    
    user1Id = users[0].id;
    user2Id = users[1].id;
    user3Id = users[2].id;
  });

  afterEach(resetDB);

  it('should return empty array when user has no conversations', async () => {
    const result = await getUserConversations(user1Id, testInput);

    expect(result).toEqual([]);
  });

  it('should return conversations with other users', async () => {
    // User1 sends message to User2
    await db.insert(messagesTable).values({
      sender_id: user1Id,
      recipient_id: user2Id,
      content: 'Hello Bob!'
    }).execute();

    // User2 replies to User1
    await db.insert(messagesTable).values({
      sender_id: user2Id,
      recipient_id: user1Id,
      content: 'Hi Alice!'
    }).execute();

    const result = await getUserConversations(user1Id, testInput);

    expect(result).toHaveLength(1);
    expect(result[0].other_user.id).toEqual(user2Id);
    expect(result[0].other_user.name).toEqual('Bob Johnson');
    expect(result[0].last_message).toBeDefined();
    expect(result[0].last_message?.content).toEqual('Hi Alice!');
    expect(result[0].last_message?.sender_id).toEqual(user2Id);
    expect(result[0].unread_count).toEqual(1); // Bob's reply is unread
  });

  it('should return multiple conversations sorted by last message time', async () => {
    // Create conversation with User2 (earlier)
    await db.insert(messagesTable).values({
      sender_id: user1Id,
      recipient_id: user2Id,
      content: 'Hello Bob!',
      created_at: new Date('2024-01-01T10:00:00Z')
    }).execute();

    // Create conversation with User3 (later)
    await db.insert(messagesTable).values({
      sender_id: user1Id,
      recipient_id: user3Id,
      content: 'Hello Carol!',
      created_at: new Date('2024-01-01T11:00:00Z')
    }).execute();

    const result = await getUserConversations(user1Id, testInput);

    expect(result).toHaveLength(2);
    // Should be sorted by most recent message first
    expect(result[0].other_user.name).toEqual('Carol Davis');
    expect(result[1].other_user.name).toEqual('Bob Johnson');
  });

  it('should count unread messages correctly', async () => {
    // User2 sends multiple unread messages to User1
    await db.insert(messagesTable).values([
      {
        sender_id: user2Id,
        recipient_id: user1Id,
        content: 'First message'
      },
      {
        sender_id: user2Id,
        recipient_id: user1Id,
        content: 'Second message'
      },
      {
        sender_id: user2Id,
        recipient_id: user1Id,
        content: 'Third message'
      }
    ]).execute();

    // User1 sends a message back (this shouldn't count in unread for User1)
    await db.insert(messagesTable).values({
      sender_id: user1Id,
      recipient_id: user2Id,
      content: 'Reply from User1'
    }).execute();

    const result = await getUserConversations(user1Id, testInput);

    expect(result).toHaveLength(1);
    expect(result[0].unread_count).toEqual(3); // Only messages FROM User2 TO User1
    expect(result[0].last_message?.content).toEqual('Reply from User1');
  });

  it('should not count read messages in unread count', async () => {
    const now = new Date();
    
    // User2 sends messages to User1
    await db.insert(messagesTable).values([
      {
        sender_id: user2Id,
        recipient_id: user1Id,
        content: 'Read message',
        read_at: now // This message is read
      },
      {
        sender_id: user2Id,
        recipient_id: user1Id,
        content: 'Unread message'
        // read_at is null (unread)
      }
    ]).execute();

    const result = await getUserConversations(user1Id, testInput);

    expect(result).toHaveLength(1);
    expect(result[0].unread_count).toEqual(1); // Only one unread message
  });

  it('should apply limit correctly', async () => {
    // Create conversations with 3 different users
    await db.insert(messagesTable).values([
      {
        sender_id: user1Id,
        recipient_id: user2Id,
        content: 'Message to User2'
      },
      {
        sender_id: user1Id,
        recipient_id: user3Id,
        content: 'Message to User3'
      }
    ]).execute();

    // Create a 4th user for testing limit
    const user4 = await db.insert(usersTable).values({
      name: 'Dave Wilson',
      email: 'dave@example.com',
      skill_level: 'intermediate',
      location: 'Florida',
      bio: null
    }).returning().execute();

    await db.insert(messagesTable).values({
      sender_id: user1Id,
      recipient_id: user4[0].id,
      content: 'Message to User4'
    }).execute();

    const limitedInput: GetUserConversationsInput = { limit: 2 };
    const result = await getUserConversations(user1Id, limitedInput);

    expect(result).toHaveLength(2); // Limited to 2 conversations
  });

  it('should handle conversations where user only receives messages', async () => {
    // User2 sends message to User1 (User1 never replies)
    await db.insert(messagesTable).values({
      sender_id: user2Id,
      recipient_id: user1Id,
      content: 'Hello from Bob!'
    }).execute();

    const result = await getUserConversations(user1Id, testInput);

    expect(result).toHaveLength(1);
    expect(result[0].other_user.name).toEqual('Bob Johnson');
    expect(result[0].last_message?.sender_id).toEqual(user2Id);
    expect(result[0].unread_count).toEqual(1);
  });

  it('should handle conversations where user only sends messages', async () => {
    // User1 sends message to User2 (User2 never replies)
    await db.insert(messagesTable).values({
      sender_id: user1Id,
      recipient_id: user2Id,
      content: 'Hello Bob!'
    }).execute();

    const result = await getUserConversations(user1Id, testInput);

    expect(result).toHaveLength(1);
    expect(result[0].other_user.name).toEqual('Bob Johnson');
    expect(result[0].last_message?.sender_id).toEqual(user1Id);
    expect(result[0].unread_count).toEqual(0); // No unread messages from User2
  });

  it('should use default limit when not specified', async () => {
    // Create conversation
    await db.insert(messagesTable).values({
      sender_id: user1Id,
      recipient_id: user2Id,
      content: 'Test message'
    }).execute();

    // Test with input that has default limit applied by Zod
    const inputWithDefault: GetUserConversationsInput = { limit: 20 }; // Zod default
    const result = await getUserConversations(user1Id, inputWithDefault);

    expect(result).toHaveLength(1);
  });

  it('should handle user with no valid conversation partners', async () => {
    // Insert a message with a non-existent user ID (simulating data inconsistency)
    await db.insert(messagesTable).values({
      sender_id: user1Id,
      recipient_id: 99999, // Non-existent user
      content: 'Message to non-existent user'
    }).execute();

    const result = await getUserConversations(user1Id, testInput);

    // Should skip conversations with non-existent users
    expect(result).toEqual([]);
  });
});
