import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, messagesTable } from '../db/schema';
import { type SendMessageInput, type CreateUserInput } from '../schema';
import { sendMessage } from '../handlers/send_message';
import { eq } from 'drizzle-orm';

// Test users data
const testSender: CreateUserInput = {
  name: 'John Sender',
  email: 'sender@example.com',
  skill_level: 'intermediate',
  location: 'New York',
  bio: 'Tennis enthusiast'
};

const testRecipient: CreateUserInput = {
  name: 'Jane Recipient',
  email: 'recipient@example.com',
  skill_level: 'advanced',
  location: 'New York',
  bio: 'Professional player'
};

// Test message input
const testMessageInput: SendMessageInput = {
  recipient_id: 2, // Will be set after creating users
  content: 'Hey! Want to play tennis this weekend?'
};

describe('sendMessage', () => {
  let senderId: number;
  let recipientId: number;

  beforeEach(async () => {
    await createDB();

    // Create sender user
    const senderResult = await db.insert(usersTable)
      .values(testSender)
      .returning()
      .execute();
    senderId = senderResult[0].id;

    // Create recipient user
    const recipientResult = await db.insert(usersTable)
      .values(testRecipient)
      .returning()
      .execute();
    recipientId = recipientResult[0].id;

    // Update test input with correct recipient ID
    testMessageInput.recipient_id = recipientId;
  });

  afterEach(resetDB);

  it('should send a message successfully', async () => {
    const result = await sendMessage(senderId, testMessageInput);

    // Validate message fields
    expect(result.sender_id).toEqual(senderId);
    expect(result.recipient_id).toEqual(recipientId);
    expect(result.content).toEqual('Hey! Want to play tennis this weekend?');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.read_at).toBeNull(); // New message should be unread
  });

  it('should save message to database', async () => {
    const result = await sendMessage(senderId, testMessageInput);

    // Query the database to verify message was saved
    const messages = await db.select()
      .from(messagesTable)
      .where(eq(messagesTable.id, result.id))
      .execute();

    expect(messages).toHaveLength(1);
    const savedMessage = messages[0];
    expect(savedMessage.sender_id).toEqual(senderId);
    expect(savedMessage.recipient_id).toEqual(recipientId);
    expect(savedMessage.content).toEqual(testMessageInput.content);
    expect(savedMessage.created_at).toBeInstanceOf(Date);
    expect(savedMessage.read_at).toBeNull();
  });

  it('should reject message when sender does not exist', async () => {
    const nonExistentSenderId = 999;

    await expect(sendMessage(nonExistentSenderId, testMessageInput))
      .rejects.toThrow(/sender not found/i);
  });

  it('should reject message when recipient does not exist', async () => {
    const messageToNonExistentUser: SendMessageInput = {
      recipient_id: 999,
      content: 'This should fail'
    };

    await expect(sendMessage(senderId, messageToNonExistentUser))
      .rejects.toThrow(/recipient not found/i);
  });

  it('should reject message to self', async () => {
    const messageToSelf: SendMessageInput = {
      recipient_id: senderId, // Same as sender
      content: 'Talking to myself'
    };

    await expect(sendMessage(senderId, messageToSelf))
      .rejects.toThrow(/cannot send message to yourself/i);
  });

  it('should handle long messages correctly', async () => {
    const longMessage: SendMessageInput = {
      recipient_id: recipientId,
      content: 'This is a longer message about tennis. '.repeat(20) // About 800 characters
    };

    const result = await sendMessage(senderId, longMessage);

    expect(result.content).toEqual(longMessage.content);
    expect(result.content.length).toBeLessThanOrEqual(1000); // Zod validation ensures max 1000 chars
  });

  it('should create multiple messages between same users', async () => {
    // Send first message
    const message1 = await sendMessage(senderId, {
      recipient_id: recipientId,
      content: 'First message'
    });

    // Send second message
    const message2 = await sendMessage(senderId, {
      recipient_id: recipientId,
      content: 'Second message'
    });

    // Both messages should be saved with different IDs
    expect(message1.id).not.toEqual(message2.id);
    expect(message1.content).toEqual('First message');
    expect(message2.content).toEqual('Second message');

    // Verify both are in database
    const allMessages = await db.select()
      .from(messagesTable)
      .where(eq(messagesTable.sender_id, senderId))
      .execute();

    expect(allMessages).toHaveLength(2);
  });

  it('should allow bidirectional messaging', async () => {
    // Sender sends to recipient
    const message1 = await sendMessage(senderId, {
      recipient_id: recipientId,
      content: 'Hello from sender'
    });

    // Recipient replies back
    const message2 = await sendMessage(recipientId, {
      recipient_id: senderId,
      content: 'Hello back from recipient'
    });

    expect(message1.sender_id).toEqual(senderId);
    expect(message1.recipient_id).toEqual(recipientId);
    expect(message2.sender_id).toEqual(recipientId);
    expect(message2.recipient_id).toEqual(senderId);
  });
});
